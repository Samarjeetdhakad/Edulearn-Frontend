// src/pages/auth/OAuth2RedirectHandler.js
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader } from '../../components/common/index';

const OAuth2RedirectHandler = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');
        const userId = params.get('userId');
        const fullName = params.get('fullName');
        const email = params.get('email');
        const role = params.get('role');

        if (accessToken && refreshToken) {
            const user = { userId, fullName, email, role };
            login(user, accessToken, refreshToken);
            
            const redirectMap = { 
                STUDENT: '/student/dashboard', 
                INSTRUCTOR: '/instructor/dashboard', 
                ADMIN: '/admin/dashboard' 
            };
            navigate(redirectMap[role] || '/');
        } else {
            navigate('/login', { state: { error: 'OAuth2 login failed. Please try again.' } });
        }
    }, [location, login, navigate]);

    return <Loader text="Logging you in with Google..." />;
};

export default OAuth2RedirectHandler;
