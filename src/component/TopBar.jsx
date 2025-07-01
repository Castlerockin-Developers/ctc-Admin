import React from 'react'
import '../pages/home.css'
import logo from '../assets/ctc-logo.png';


const TopBar = () => {
    return (
        <div className='h-18 lg:h-25 md:h-20 flex justify-between items-center topbar lg:justify-between md:justify-center'>
            <div className='relative xl:left-15 lg:left-4 md:left-10'><img src={logo} alt="logo" className='w-25 md:w-30 lg:w-52 lg:block md:hidden sm:hidden ctc-logo' /></div>
        </div>
    )
}

export default TopBar
