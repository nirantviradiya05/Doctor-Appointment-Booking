import React, { useContext, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const MyProfile = () => {
  const { userData, setUserData, token, backendUrl, loadUserProfileData } = useContext(AppContext)

  const [isEdite, setIsEdit] = useState(false)
  const [image, setImage] = useState(false)

  // ✅ Utility: Ensure date is always yyyy-MM-dd
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d)) return "";
    return d.toISOString().split("T")[0];
  };

  const updateUserProfileData = async () => {
    try {
      const formData = new FormData()

      formData.append('name', userData.name)
      formData.append('phone', userData.phone)
      formData.append('address', JSON.stringify(userData.address))
      formData.append('gender', userData.gender)
      formData.append('dob', userData.dob)

      image && formData.append('image', image)

      const { data } = await axios.post(
        backendUrl + '/api/user/update-profile',
        formData,
        { headers: { token } }
      )

      if (data.success) {
        toast.success(data.message)
        await loadUserProfileData()
        setIsEdit(false)
        setImage(false)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message)
    }
  }

  return userData && (
    <div className='max-w-lg flex flex-col gap-2 text-sm'>

      {
        isEdite ? (
          <label htmlFor="image">
            <div className='inline-block relative cursor-pointer'>
              <img
                className='w-36 rounded opacity-75'
                src={image ? URL.createObjectURL(image) : (userData.image || assets.default_avatar)}
                alt="profile"
              />
              <img
                className='w-10 absolute bottom-12 right-12'
                src={image ? "" : assets.upload_icon}
                alt="upload icon"
              />
            </div>
            <input onChange={(e) => setImage(e.target.files[0])} type="file" id="image" hidden />
          </label>
        ) : (
          <img
            className='w-36 rounded'
            src={userData.image || assets.default_avatar}
            alt="profile"
          />
        )
      }

      {
        isEdite
          ? <input
            className='bg-gray-50 text-3xl font-medium max-w-60 mt-4'
            value={userData.name}
            onChange={e => setUserData(prev => ({ ...prev, name: e.target.value }))}
            type="text"
          />
          : <p className='font-medium text-3xl text-neutral-800 mt-4'>{userData.name}</p>
      }

      <hr className='bg-zinc-400 h-[1px] border-none' />

      {/* Contact Info */}
      <div>
        <p className='text-neutral-500 underline mt-3'>CONTACT INFORMATION</p>
        <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700'>
          <p className='font-medium'>Email Id:</p>
          <p className='text-blue-500'>{userData.email}</p>

          <p className='font-medium'>Phone:</p>
          {
            isEdite ? (
              <input
                className='bg-gray-100 max-w-52'
                value={userData.phone}
                onChange={e => {
                  const value = e.target.value;
                  // ✅ allow only numbers, max 10 digits
                  if (/^\d{0,10}$/.test(value)) {
                    setUserData(prev => ({ ...prev, phone: value }));
                  }
                }}
                type="text"
                maxLength={10}
                minLength={10} // ✅ require at least 10 digits
                required
              />
            ) : (
              <p className='text-blue-400'>{userData.phone}</p>
            )
          }

          <p className='font-medium'>Address:</p>
          {
            isEdite
              ? <p>
                <input
                  className='bg-gray-50'
                  onChange={(e) => setUserData(prev => ({ ...prev, address: { ...prev.address, line1: e.target.value } }))}
                  value={userData.address?.line1 || ""}
                  type="text"
                /><br />
                <input
                  className='bg-gray-50'
                  onChange={(e) => setUserData(prev => ({ ...prev, address: { ...prev.address, line2: e.target.value } }))}
                  value={userData.address?.line2 || ""}
                  type="text"
                />
              </p>
              : <p className='text-gray-500'>
                {userData.address?.line1 || "Not Provided"} <br />
                {userData.address?.line2 || ""}
              </p>
          }
        </div>
      </div>

      {/* Basic Info */}
      <div>
        <p className='text-neutral-500 underline mt-3'>BASIC INFORMATION</p>
        <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700'>
          <p className='font-medium'>Gender:</p>
          {
            isEdite
              ? <select
                className='max-w-20 bg-gray-100'
                onChange={(e) => setUserData(prev => ({ ...prev, gender: e.target.value }))}
                value={userData.gender || ""}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              : <p className='text-gray-400'>{userData.gender || "Not Selected"}</p>
          }

          <p className='font-medium'>Birthday:</p>
          {
            isEdite
              ? <input
                className='max-w-28 bg-gray-100'
                type="date"
                value={formatDateForInput(userData.dob)}
                onChange={(e) => setUserData(prev => ({ ...prev, dob: e.target.value }))}
              />
              : <p className='text-gray-400'>
                {formatDateForInput(userData.dob) || "Not Selected"}
              </p>
          }
        </div>
      </div>

      <div className='mt-10'>
        {isEdite
          ? <button
            className='border border-indigo-500 px-8 py-2 rounded-full hover:bg-indigo-500 hover:text-white transition-all'
            onClick={updateUserProfileData}
          >
            Save information
          </button>
          : <button
            className='border border-indigo-500 px-8 py-2 rounded-full hover:bg-indigo-500 hover:text-white transition-all'
            onClick={() => setIsEdit(true)}
          >
            Edit
          </button>
        }
      </div>
    </div>
  )
}

export default MyProfile
