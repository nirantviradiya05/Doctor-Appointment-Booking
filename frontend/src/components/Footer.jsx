import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
  return (
    <div className='md:mx-10'>
        <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>
            {/* left side section */}
            <div>
                <img className='mb-5 w-40' src={assets.logo} alt="logo" />
                <p className='w-full md:w-2/3 text-gray-600 leading-6'>Your health, our priority — connecting you with trusted and experienced doctors.Book appointments instantly and get expert medical care from the comfort of your home.Verified profiles, real reviews, and 24/7 access to top healthcare professionals.</p>
            </div>
            {/* center side section */}
            <div>
                <p className='text-xl font-medium mb-5'>COMPANY</p>
                <ul className='flex flex-col gap-2 text-gray-600'>
                    <li>Home</li>
                    <li>About Us</li>
                    <li>Contect Us</li>
                    <li>Privacy Policy</li>
                </ul>
                
            </div>
            {/* right side section */}
            <div>
                <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
                <ul className='flex flex-col gap-2 text-gray-600'>
                    <li>+91 9316766885</li>
                    <li>medique0507@gmail.com</li>
                </ul>
            </div>
        </div>
        <div>
            <hr />
            <p className='py-5 text-sm text-center'>Copyright © 2025 Medique - All Right Reserved.</p>
        </div>
    </div>
  )
}

export default Footer