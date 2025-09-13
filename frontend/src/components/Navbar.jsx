import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext';

const Navbar = () => {

  const navigate = useNavigate();

  const {token,setToken,userData} = useContext(AppContext)

  const [showMenu, setShowMenu] = useState(false)

  const logout = () => {
    setToken(false)
    localStorage.removeItem('token')
  }

  return (
    <div className='flex items-center justify-between text-sm mb-5 border-b border-b-gray-400'>
      <img onClick={() => navigate('/')} className='w-40 h-20 cursor-pointer' src={assets.logo} alt="logo" />
      <ul className='hidden md:flex items-start gap-5 font-midium'>
        <NavLink to='/'>
          <li className='py-1'>HOME</li>
          <hr className='border-none outline-none h-0.5 bg-black w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/doctors'>
          <li className='py-1'>ALL DOCTORS</li>
          <hr className='border-none outline-none h-0.5 bg-black w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/about'>
          <li className='py-1'>ABOUT</li>
          <hr className='border-none outline-none h-0.5 bg-black w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/contect'>
          <li className='py-1'>CONTECT</li>
          <hr className='border-none outline-none h-0.5 bg-black w-3/5 m-auto hidden' />
        </NavLink>
      </ul>

      <div className='flex items-center gap-4'>
        {
          token && userData
            ? <div className='flex items-center gap-2 cursor-pointer group relative'>
              <img className='w-9 rounded-full' src={userData.image} alt="profile_pic" />
              <img className='w-3' src={assets.dropdown_icon} alt="" />
              <div className='absolute top-0 right-0 pt-16 text-base font-medium text-gray-600 z-20 hidden group-hover:block'>
                <div className='min-w-48 bg-stone-100 rounded flex flex-col gap-4 p-4'>
                  <p onClick={() => navigate('my-profile')} className='hover:text-black cursor-pointer'>My Profile</p>
                  <p onClick={() => navigate('my-appointment')} className='hover:text-black cursor-pointer'>My Appointments</p>
                  <p onClick={logout} className='hover:text-black cursor-pointer'>Logout</p>
                </div>
              </div>
            </div>
            : <button onClick={() => navigate('/login')} className='bg-black text-white px-9 py-3 rounded-full font-light hidden md:block'>Create Account</button>
        }
        <img onClick={() => setShowMenu(true)} className='w-6 md:hidden' src={assets.menu_icon} alt="menu_icon" />
        {/* mobile menu */}
        <div className={`${showMenu ? 'fixed w-full' : 'h-0 w-0'} md:hidden right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all `}>
          <div className='flex items-center justify-between px-5 py-6'>
            <img className='w-36' src={assets.logo} alt="logo" />
            <img className='w-7' onClick={() => setShowMenu(false)} src={assets.cross_icon} alt="cross_icon" />
          </div>
          <ul className='flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium'>
            <NavLink  onClick={()=>setShowMenu(false)} to='/' > <p className='px-4 py-2 rounded inline-block'>Home</p></NavLink>
            <NavLink onClick={()=>setShowMenu(false)} to='/doctors' > <p className='px-4 py-2 rounded inline-block'>All Doctors</p> </NavLink>
            <NavLink onClick={()=>setShowMenu(false)} to='/about' > <p className='px-4 py-2 rounded inline-block'>About</p> </NavLink>
            <NavLink onClick={()=>setShowMenu(false)} to='/contect' > <p className='px-4 py-2 rounded inline-block'>Contect</p> </NavLink>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Navbar