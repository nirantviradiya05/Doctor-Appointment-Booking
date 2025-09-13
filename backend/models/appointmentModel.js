import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  docId:  { type: mongoose.Schema.Types.ObjectId, ref: "doctors", required: true },
  slotDate: { type: String, required: true }, // e.g. "24_8_2025"
  slotTime: { type: String, required: true }, // e.g. "10:00 AM"
  amount: { type: Number, required: true },
  payment: { type: Boolean, default: false },
  cancelled: { type: Boolean, default: false },
  date: { type: Date, default: Date.now }
});

const appointmentModel = mongoose.models.appointments || mongoose.model("appointments", appointmentSchema);
export default appointmentModel;
