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
        <div className="h-[72px] lg:h-[88px] min-[2300px]:h-[155px] shrink-0 flex justify-center lg:justify-between items-center w-full px-4 lg:px-6 bg-[#181817]">
            <div className="flex items-center min-w-0 h-full">
                <img src={logo} alt="logo" className="h-12 lg:h-14 w-auto max-w-[200px] min-[2300px]:w-[350px] hidden lg:block object-contain" />
            </div>
            <div className="flex items-center justify-center gap-4 h-full min-w-0">
                {!loading && orgLogo && (
                    <img
                        src={orgLogo}
                        alt="College Logo"
                        className="max-h-12 max-w-24 md:max-w-28 lg:max-h-14 lg:max-w-32 min-[2300px]:max-h-[120px] min-[2300px]:max-w-64 w-auto h-auto object-contain object-center"
                    />
                )}
            </div>
        </div>
    )
}

export default TopBar
