import React, { useContext, useState } from 'react'
import { AdminContext } from '../context/adminContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false) // 👁️ state for toggle

  const { setAToken, backendUrl } = useContext(AdminContext)

  const onSubmitHandler = async (event) => {
    event.preventDefault()

    try {
      const { data } = await axios.post(backendUrl + '/api/admin/login', { email, password })

      if (data.success) {
        localStorage.setItem('aToken', data.token)
        setAToken(data.token)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Something went wrong')
      console.error(error)
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
        <p className='text-2xl font-semibold m-auto'>
          <span className='text-primary'>Admin</span> Login
        </p>

        {/* Email */}
        <div className='w-full'>
          <p>Email</p>
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            className='border border-[#DADADA] rounded w-full p-2 mt-1'
            type='email'
            required
          />
        </div>

        {/* Password with Eye Toggle */}
        <div className='w-full relative'>
          <p>Password</p>
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            className='border border-[#DADADA] rounded w-full p-2 mt-1 pr-10'
            type={showPassword ? 'text' : 'password'}
            required
          />
          <span
            className='absolute right-3 top-9 cursor-pointer text-gray-500'
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? '👁️' : '🙈'}
          </span>
        </div>

        <button className='bg-primary text-white w-full py-2 rounded-md text-base'>
          Login
        </button>
      </div>
    </form>
  )
}

export default Login
