import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import RelatedDoctors from '../components/RelatedDoctors';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

const Appointment = () => {
  const { docId } = useParams();
  const { doctors, currencySymbol, backendUrl, token, getDoctorsData, userData } = useContext(AppContext);
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const navigate = useNavigate();

  const [docInfo, setDocInfo] = useState(null);
  const [docSlots, setDocSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState('');

  const fetchDocInfo = () => {
    const foundDoc = doctors.find(doc => doc._id === docId);
    setDocInfo(foundDoc || null);
  };

  const getAvailableSlots = () => {
    if (!docInfo) return;

    const allSlots = [];
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date();
      currentDate.setDate(now.getDate() + i);

      const endTime = new Date(currentDate);
      endTime.setHours(21, 0, 0, 0); // 9 PM cutoff

      // Start time
      if (i === 0) {
        // today: next 30-min block, but not before 10:00
        const start = new Date(currentDate);
        const hour = Math.max(10, now.getHours() + (now.getMinutes() > 0 ? 1 : 0));
        start.setHours(hour, now.getMinutes() > 30 ? 30 : 0, 0, 0);
        currentDate.setTime(start.getTime());
      } else {
        currentDate.setHours(10, 0, 0, 0); // other days start 10:00
      }

      const timeSlots = [];
      while (currentDate < endTime) {
        const formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const day = currentDate.getDate();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        const slotDateKey = `${day}_${month}_${year}`;

        const isBooked = docInfo.slots_booked?.[slotDateKey]?.includes(formattedTime);
        if (!isBooked) {
          timeSlots.push({
            datetime: new Date(currentDate),
            time: formattedTime
          });
        }

        currentDate.setMinutes(currentDate.getMinutes() + 30);
      }

      allSlots.push(timeSlots);
    }

    setDocSlots(allSlots);
  };

  const bookAppointment = async () => {
    if (!token) {
      toast.warn('Login to book appointment');
      return navigate('/login');
    }
    if (!userData) {
      toast.error('User data not loaded');
      return;
    }

    const selectedSlot = docSlots[slotIndex]?.find(s => s.time === slotTime);
    if (!selectedSlot) {
      toast.error('Please select a date and time');
      return;
    }

    try {
      const d = selectedSlot.datetime;
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const slotDate = `${day}_${month}_${year}`;

      const { data } = await axios.post(
        `${backendUrl}/api/user/book-appointment`,
        {
          userId: userData._id,   // backend also reads req.userId from token (safe)
          docId: docInfo._id,
          slotDate,
          slotTime
        },
        { headers: { token } }
      );

      if (data.success) {
        toast.success(data.message);
        getDoctorsData();
        navigate('/my-appointment');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  useEffect(() => { fetchDocInfo(); }, [doctors, docId]);
  useEffect(() => { getAvailableSlots(); }, [docInfo]);

  return (
    docInfo && (
      <div>
        {/* Doctor Details */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <img className="bg-indigo-300 w-full sm:max-w-72 rounded-lg" src={docInfo.image} alt="" />
          </div>
          <div className="flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0">
            <p className="flex items-center gap-2 text-2xl font-medium text-gray-900">
              {docInfo.name}
              <img className="w-5" src={assets.verified_icon} alt="verified_icon" />
            </p>
            <div className="flex items-center gap-2 text-sm mt-1 text-gray-600">
              <p>{docInfo.degree} - {docInfo.speciality}</p>
              <button className="py-0.5 px-2 border text-xs rounded-dull">{docInfo.experience}</button>
            </div>
            <div>
              <p className="flex items-center gap-1 text-sm font-medium text-gray-900 mt-3">
                About <img src={assets.info_icon} alt="info_icon" />
              </p>
              <p className="text-sm text-gray-500 max-w-[700px] mt-1">{docInfo.about}</p>
            </div>
            <p className="text-gray-500 font-medium mt-4">
              Appointment Fee: <span className="text-gray-600">{currencySymbol}{docInfo.fees}</span>
            </p>
          </div>
        </div>

        {/* Booking Slots */}
        <div className="sm:mi-72 sm:pl-4 mt-4 font-medium text-gray-700">
          <p>Booking Slots</p>

          <div className="flex gap-3 items-center w-full overflow-x-scroll mt-4">
            {docSlots.map((item, index) => (
              <div
                key={index}
                onClick={() => { setSlotIndex(index); setSlotTime(''); }}
                className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex === index ? 'bg-indigo-500 text-white' : 'border border-gray-200'}`}
              >
                <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                <p>{item[0] && item[0].datetime.getDate()}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full overflow-x-scroll mt-4">
            {docSlots[slotIndex]?.map((item, idx) => (
              <p
                key={idx}
                onClick={() => setSlotTime(item.time)}
                className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${item.time === slotTime ? 'bg-indigo-500 text-white' : 'text-gray-400 border border-gray-300'}`}
              >
                {item.time}
              </p>
            ))}
            {docSlots[slotIndex]?.length === 0 && (
              <span className="text-sm text-gray-500">No slots available for this day.</span>
            )}
          </div>

          <button onClick={bookAppointment} className="bg-indigo-500 text-white text-sm font-light px-14 py-3 rounded-full my-6">
            Book an Appointment
          </button>
        </div>

        {/* Related Doctors */}
        <RelatedDoctors docId={docId} speciality={docInfo.speciality} />
      </div>
    )
  );
};

export default Appointment;
