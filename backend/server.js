import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import adminRouter from "./routes/adminroute.js";
import doctorRouter from "./routes/doctorroute.js";
import userRouter from "./routes/userroute.js";

// app config
const app = express();
const port = process.env.PORT || 4000;

// middleware
connectDB();
connectCloudinary();
app.use(express.json());
app.use(cors());

// api endpoints
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/user", userRouter);

app.get("/", (req, res) => {
  res.send("✅ API is working fine...");
});

// server start
app.listen(port, () => console.log(`🚀 Server started on port ${port}`));
