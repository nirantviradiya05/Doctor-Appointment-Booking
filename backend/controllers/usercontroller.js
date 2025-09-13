import validator from 'validator';
import bcrypt from 'bcrypt';
import userModel from '../models/usermodel.js';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import doctorModel from '../models/doctormodel.js';
import appointmentModel from '../models/appointmentModel.js';
import razorpay from 'razorpay';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// ---------------- EMAIL FUNCTION ----------------
const sendEmail = async (to, subject, text, html = null) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Medique App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html, // optional HTML
    });

    console.log("📩 Email sent to:", to);
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
  }
};

// ---------------- REGISTER USER ----------------
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !password || !email) {
      return res.json({ success: false, message: "Missing Details" });
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Enter a Valid Email" });
    }

    if (password.length < 8) {
      return res.json({ success: false, message: "Enter a Strong Password" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({ name, email, password: hashedPassword });
    const user = await newUser.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ success: true, token });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// ---------------- LOGIN ----------------
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) return res.json({ success: false, message: 'User does not exist' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ success: true, token });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// ---------------- GET PROFILE ----------------
const getProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const userData = await userModel.findById(userId).select('-password');
    res.json({ success: true, userData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// ---------------- UPDATE PROFILE ----------------
const updateProfile = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const { name, phone, address, dob, gender } = req.body;
    const imageFile = req.file?.path;

    if (!userId || !name || !phone || !dob || !gender) {
      return res.json({ success: false, message: "Data Missing" });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.json({ success: false, message: "Phone number must be exactly 10 digits" });
    }

    let parsedAddress = address;
    try {
      if (typeof address === "string") parsedAddress = JSON.parse(address);
    } catch (e) { }

    const updateData = { name, phone, address: parsedAddress, dob, gender };

    if (imageFile) {
      const uploadResult = await cloudinary.uploader.upload(imageFile, {
        resource_type: "image",
      });
      updateData.image = uploadResult.secure_url;
    }

    const updatedUser = await userModel.findByIdAndUpdate(userId, updateData, { new: true });
    if (!updatedUser)
      return res.json({ success: false, message: "User not found" });

    res.json({ success: true, message: "Profile Updated", user: updatedUser });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// ---------------- BOOK APPOINTMENT + SEND EMAIL ----------------
const bookAppointment = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const { docId, slotDate, slotTime } = req.body;

    if (!userId || !docId || !slotDate || !slotTime) {
      return res.json({ success: false, message: 'All fields are required' });
    }

    const docData = await doctorModel.findById(docId).select('-password');
    if (!docData || !docData.available) {
      return res.json({ success: false, message: 'Doctor not available' });
    }

    const slots_booked = docData.slots_booked || {};
    if (slots_booked[slotDate]?.includes(slotTime)) {
      return res.json({ success: false, message: 'Slot not available' });
    }
    slots_booked[slotDate] = [...(slots_booked[slotDate] || []), slotTime];

    const appointmentData = {
      userId,
      docId,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now(),
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    // ✅ Send booking email
    const user = await userModel.findById(userId);
    await sendEmail(
      user.email,
      "Appointment Booked",
      `Hello ${user.name}, your appointment with ${docData.name} is booked on ${slotDate} at ${slotTime}.`,
      `
        <h2>✅ Appointment Booked</h2>
        <p>Hello <b>${user.name}</b>,</p>
        <p>Your appointment with <b>${docData.name}</b> (${docData.speciality}) is confirmed.</p>
        <p><b>Date:</b> ${slotDate}<br><b>Time:</b> ${slotTime}</p>
        <p>Thank you for choosing <b>Medique</b>.</p>
      `
    );

    res.json({ success: true, message: "Appointment Booked & Email Sent" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// ---------------- LIST APPOINTMENTS ----------------
const listAppointment = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId || req.query.userId;
    if (!userId) return res.json({ success: false, message: "User ID missing" });

    const appointments = await appointmentModel
      .find({ userId })
      .populate('docId', 'name speciality image address')
      .sort({ date: -1 });

    const formattedAppointments = appointments.map(app => ({
      _id: app._id,
      slotDate: app.slotDate,
      slotTime: app.slotTime,
      amount: app.amount,
      payment: app.payment,
      cancelled: app.cancelled,
      docData: app.docId
    }));

    res.json({ success: true, appointments: formattedAppointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// ---------------- CANCEL APPOINTMENT + EMAIL ----------------
const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const token = req.headers.token;
    if (!token) {
      return res.json({ success: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const appointmentData = await appointmentModel
      .findById(appointmentId)
      .populate("docId", "name speciality");
    if (!appointmentData) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    if (appointmentData.userId.toString() !== userId) {
      return res.json({ success: false, message: "Unauthorized action" });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

    const { docId, slotDate, slotTime } = appointmentData;
    const doctorData = await doctorModel.findById(docId);

    let slots_booked = doctorData.slots_booked;
    slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    // ✅ Send cancellation email
    const user = await userModel.findById(userId);
    await sendEmail(
      user.email,
      "Appointment Cancelled",
      `Hello ${user.name}, your appointment with ${appointmentData.docId.name} was cancelled.`,
      `
        <h2>❌ Appointment Cancelled</h2>
        <p>Hello <b>${user.name}</b>,</p>
        <p>Your appointment with <b>${appointmentData.docId.name}</b> (${appointmentData.docId.speciality}) on <b>${slotDate}</b> at <b>${slotTime}</b> has been cancelled.</p>
        <p>If you have any questions, please contact us.</p>
        <p>Regards,<br><b>Medique Team</b></p>
      `
    );

    res.json({ success: true, message: "Appointment Cancelled & Email Sent" });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// ---------------- RAZORPAY INSTANCE ----------------
const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ---------------- PAYMENT RAZORPAY ----------------
const paymentRazorpay = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData || appointmentData.cancelled) {
      return res.json({ sucess: false, message: "Appointment Cancelled or not found" });
    }

    const options = {
      amount: appointmentData.amount * 100,
      currency: process.env.CURRENCY,
      receipt: appointmentId,
    };

    const order = await razorpayInstance.orders.create(options);
    res.json({ success: true, order });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// ---------------- VERIFY RAZORPAY + EMAIL ----------------
const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id } = req.body;
    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

    if (orderInfo.status === "paid") {
      const appointment = await appointmentModel
        .findByIdAndUpdate(
          orderInfo.receipt,
          { payment: true },
          { new: true }
        )
        .populate("docId", "name speciality address");

      if (!appointment) {
        return res.json({ success: false, message: "Appointment not found" });
      }

      const user = await userModel.findById(appointment.userId);

      // ✅ Send confirmation email
      await sendEmail(
        user.email,
        "Appointment Confirmed",
        `Hello ${user.name}, your payment was successful and your appointment is confirmed.`,
        `
          <h2>✅ Appointment Confirmed</h2>
          <p>Hello <b>${user.name}</b>,</p>
          <p>Your payment was successful and your appointment has been confirmed.</p>
          <p><b>Doctor:</b> ${appointment.docId.name} (${appointment.docId.speciality})<br>
          <b>Date:</b> ${appointment.slotDate}<br>
          <b>Time:</b> ${appointment.slotTime}</p>
          <p>Thank you for booking with <b>Medique</b>.</p>
        `
      );

      res.json({
        success: true,
        message: "Payment Successful & Email Sent",
        appointment,
      });
    } else {
      res.json({ success: false, message: "Payment Failed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  paymentRazorpay,
  verifyRazorpay
};
