import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
  name: String,
  speciality: String,
  degree: String,
  experience: String,
  about: String,
  image: String,
  address: {
    line1: String,
    line2: String
  },
  fees: { type: Number, required: true },
  available: { type: Boolean, default: true },
  // slots_booked: { "24_8_2025": ["10:00 AM", "10:30 AM"] }
  slots_booked: { type: Object, default: {} },
  password: { type: String, select: false }
});

const doctorModel = mongoose.models.doctors || mongoose.model("doctors", doctorSchema);
export default doctorModel;
