import React from 'react'
import '../pages/home.css'
import logo from '../assets/ctc-logo.png';
import clogo from '../assets/nitte-logo.png';

const TopBar = () => {
    return (
        <div className='h-18 lg:h-25 md:h-20 flex justify-between items-center topbar lg:justify-between md:justify-center'>
            <div className='relative xl:left-15 lg:left-9 md:left-10'><img src={logo} alt="logo" className='w-25 md:w-30 lg:w-60 lg:block md:hidden sm:hidden ctc-logo' /></div>
            <div className='relative xl:right-15 lg:right-9 md:right-10'><img src={clogo} alt="College Logo" className='w-24 md:w-28 lg:w-35 h-auto' /></div>
        </div>
    )
}

export default TopBar