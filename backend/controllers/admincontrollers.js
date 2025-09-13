import validator from "validator";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctormodel.js";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/usermodel.js";
import nodemailer from "nodemailer";

// ---------------- EMAIL HELPER ----------------
const sendEmail = async (to, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: `"Medique" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
        });

        console.log("📩 Email sent to:", to);
    } catch (error) {
        console.error("❌ Email failed:", error.message);
    }
};

// ---------------- ADD DOCTOR ----------------
const addDoctor = async (req, res) => {
    try {
        const { name, email, password, speciality, degree, experience, about, fees, address } = req.body;
        const imageFile = req.file;

        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address) {
            return res.json({ success: false, message: "Missing Details" });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        if (password.length < 8) {
            return res.json({ success: false, message: "Enter a strong password" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
        const imageUrl = imageUpload.secure_url;

        const doctorData = {
            name,
            email,
            image: imageUrl,
            password: hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fees,
            address: JSON.parse(address),
            date: new Date(),
        };

        const newDoctor = new doctorModel(doctorData);
        await newDoctor.save();

        res.json({ success: true, message: "Doctor Added" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// ---------------- ADMIN LOGIN ----------------
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email + password, process.env.JWT_SECRET);
            res.json({ success: true, token });
        } else {
            res.json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// ---------------- ALL DOCTORS ----------------
const allDoctors = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select("-password");
        res.json({ success: true, doctors });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// ---------------- ALL APPOINTMENTS ----------------
const appointmentsAdmin = async (req, res) => {
    try {
        const appointments = await appointmentModel.find({})
            .populate("userId", "name email image dob")
            .populate("docId", "name image speciality fees");

        res.json({ success: true, appointments });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// ---------------- CANCEL APPOINTMENT ----------------
const appointmentCancel = async (req, res) => {
    try {
        const { appointmentId } = req.body;

        const appointmentData = await appointmentModel.findById(appointmentId)
            .populate("docId", "name speciality")
            .populate("userId", "name email");

        if (!appointmentData) {
            return res.json({ success: false, message: "Appointment not found" });
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

        // release doctor slot
        const { docId, slotDate, slotTime } = appointmentData;
        const doctorData = await doctorModel.findById(docId);

        let slots_booked = doctorData.slots_booked;
        slots_booked[slotDate] = slots_booked[slotDate].filter((e) => e !== slotTime);

        await doctorModel.findByIdAndUpdate(docId, { slots_booked });

        // ---- send email to user ----
        await sendEmail(
            appointmentData.userId.email,
            "Appointment Cancelled",
            `Hello ${appointmentData.userId.name},\n\n
            Your appointment with ${appointmentData.docId.name} (${appointmentData.docId.speciality}) on ${slotDate} at ${slotTime} has been cancelled by the admin.\n\n
            If you have any questions, please contact us.\n\n
            Thank you,\nTeam Medique`
        );

        res.json({ success: true, message: "Appointment Cancelled & Email Sent" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// ---------------- DASHBOARD DATA ----------------
const adminDashboard = async (req, res) => {
    try {
        const doctors = await doctorModel.find({});
        const users = await userModel.find({});
        const appointments = await appointmentModel.find({})
            .populate("userId", "name image dob")
            .populate("docId", "name image speciality fees");

        const dashData = {
            doctors: doctors.length,
            appointments: appointments.length,
            patients: users.length,
            latestAppointments: appointments.reverse().slice(0, 5),
        };

        res.json({ success: true, dashData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { addDoctor, loginAdmin, allDoctors, appointmentsAdmin, appointmentCancel, adminDashboard };
