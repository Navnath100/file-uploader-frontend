import { GoogleLogin } from '@react-oauth/google';
import React, { useEffect } from 'react'
import jwt_decode from "jwt-decode";
import { useNavigate } from 'react-router-dom'
import './login.css'

export default function Login() {
    const navigate = useNavigate();

    function handleLogin(credentialResponse: any) {
        if (credentialResponse?.credential) {
            var decoded = jwt_decode(credentialResponse?.credential);
            // console.log(decoded);
            localStorage.setItem('token', credentialResponse?.credential)
            navigate('/files')
        }
    }

    return (
        <div className='container'>
            <div className="login-form">
                <h2>Login</h2>
                <GoogleLogin
                    onSuccess={handleLogin}
                    onError={() => {
                        console.log('Login Failed');
                    }}
                    useOneTap
                />
            </div>
        </div>
    )
}
