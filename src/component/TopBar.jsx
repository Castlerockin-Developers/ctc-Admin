import React, { useState, useEffect } from 'react'
import '../pages/home.css'
import logo from '../assets/ctc-logo.png';
import { authFetch, FixImageRoute } from '../scripts/AuthProvider.js';

const TopBar = () => {
    const [orgLogo, setOrgLogo] = useState(null); // No default logo
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrgLogo = async () => {
            try {
                console.log('Fetching organization details...');
                const response = await authFetch('/getDetails/', {
                    method: 'GET',
                    headers: {}
                });
                
                console.log('Response status:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Organization data:', data);
                    
                    if (data.logo) {
                        const logoUrl = FixImageRoute(data.logo);
                        console.log('Setting logo URL:', logoUrl);
                        setOrgLogo(logoUrl);
                    } else {
                        console.log('No logo found in response');
                        setOrgLogo(null);
                    }
                } else if (response.status === 404) {
                    console.log('User not associated with organization');
                    setOrgLogo(null);
                } else {
                    console.error('API response not ok:', response.status);
                    setOrgLogo(null);
                }
            } catch (error) {
                console.error('Error fetching organization logo:', error);
                setOrgLogo(null);
            } finally {
                setLoading(false);
            }
        };

        fetchOrgLogo();
    }, []);

    return (
        <div className='h-18 lg:h-25 md:h-20 flex justify-between items-center topbar lg:justify-between md:justify-center'>
            <div className='relative xl:left-15 lg:left-4 md:left-10'><img src={logo} alt="logo" className='w-25 md:w-30 lg:w-52 lg:block md:hidden sm:hidden ctc-logo' /></div>
            <div className='relative xl:right-15 lg:right-9 md:right-10 flex items-center gap-4'>
                {!loading && orgLogo && <img src={orgLogo} alt="College Logo" className='w-24 md:w-28 lg:w-35 h-auto' />}
            </div>
        </div>
    )
}

export default TopBar
