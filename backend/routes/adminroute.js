import express from 'express'
import { addDoctor, allDoctors, loginAdmin, appointmentsAdmin, appointmentCancel, adminDashboard } from '../controllers/admincontrollers.js'
import uplod from '../middlerwears/multer.js'
import authAdmin from '../middlerwears/authAdmin.js'
import { changeAvailability } from '../controllers/doctorcontroller.js'

const adminRouter = express.Router()

adminRouter.post('/add-doctor',authAdmin,uplod.single('image'),addDoctor);
adminRouter.post('/login',loginAdmin);
adminRouter.post('/all-doctors',authAdmin,allDoctors);
adminRouter.post('/change-availability',authAdmin,changeAvailability);
adminRouter.get('/appointments',authAdmin,appointmentsAdmin);
adminRouter.post('/cancel-appointment',authAdmin,appointmentCancel);
adminRouter.get('/dashboard',authAdmin,adminDashboard);

export default adminRouter