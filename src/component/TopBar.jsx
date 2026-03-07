import React, { useState, useEffect } from 'react'
import { log, error as logError } from '../utils/logger'
import logo from '../assets/ctc-logo.png';
import { authFetch, FixImageRoute } from '../scripts/AuthProvider.js';

const TopBar = () => {
    const [orgLogo, setOrgLogo] = useState(null); // No default logo
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrgLogo = async () => {
            try {
                log('Fetching organization details...');
                const response = await authFetch('/getDetails/', {
                    method: 'GET',
                    headers: {}
                });
                
                log('Response status:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    log('Organization data:', data);
                    
                    if (data.logo) {
                        const logoUrl = FixImageRoute(data.logo);
                        log('Setting logo URL:', logoUrl);
                        setOrgLogo(logoUrl);
                    } else {
                        log('No logo found in response');
                        setOrgLogo(null);
                    }
                } else if (response.status === 404) {
                    log('User not associated with organization');
                    setOrgLogo(null);
                } else {
                    logError('API response not ok:', response.status);
                    setOrgLogo(null);
                }
            } catch (error) {
                logError('Error fetching organization logo:', error);
                setOrgLogo(null);
            } finally {
                setLoading(false);
            }
        };

        fetchOrgLogo();
    }, []);

    return (
        <div className="min-h-[72px] lg:min-h-[88px] min-[2300px]:min-h-[155px] flex justify-center lg:justify-between items-center w-full px-4 lg:px-6 bg-[#181817]">
            <div className="flex items-center">
                <img src={logo} alt="logo" className="h-12 lg:h-14 w-auto max-w-[200px] min-[2300px]:w-[350px] hidden lg:block" />
            </div>
            <div className='flex items-center gap-4'>
                {!loading && orgLogo && <img src={orgLogo} alt="College Logo" className='w-24 md:w-28 lg:w-32 h-auto' />}
            </div>
        </div>
    )
}

export default TopBar
