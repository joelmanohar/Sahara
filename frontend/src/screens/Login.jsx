import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { loginUser, googleLoginUser } from '../services/api';
import { ArrowLeft } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const { navigate, login } = useContext(AppContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

        setLoading(true);
        try {
            const res = await loginUser({ email, password });
            login(res.data.token, res.data.user);
            navigate('setup');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        setError('');
        try {
            const res = await googleLoginUser({ credential: credentialResponse.credential });
            login(res.data.token, res.data.user);
            navigate('setup');
        } catch (err) {
            setError(err.response?.data?.error || 'Google login failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            flex: 1, backgroundColor: 'var(--warm-white)',
            display: 'flex', flexDirection: 'column',
            paddingTop: 'var(--sat)', overflow: 'hidden',
            animation: 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
        }}>
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center' }}>
                <button
                    onClick={() => navigate('onboarding')}
                    style={{
                        width: '40px', height: '40px',
                        backgroundColor: 'var(--cream)', borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid var(--border)'
                    }}
                >
                    <ArrowLeft size={20} color="var(--deep-teal)" />
                </button>
            </div>

            <div className="scroll-container" style={{ flex: 1, padding: '0 20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '400px', margin: '0 auto', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>🕊️</div>
                    <h1 style={{ fontSize: '32px', color: 'var(--deep-teal)', marginBottom: '8px', fontFamily: "'Cormorant Garamond', serif" }}>
                        Welcome Back
                    </h1>
                    <p style={{ color: 'var(--text-light)', fontSize: '15px' }}>
                        Sign in to continue your journey
                    </p>
                </div>

                {error && (
                    <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    <div>
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%', padding: '16px', borderRadius: '12px',
                                border: '1px solid var(--border)', backgroundColor: '#fff',
                                fontSize: '16px', outline: 'none'
                            }}
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%', padding: '16px', borderRadius: '12px',
                                border: '1px solid var(--border)', backgroundColor: '#fff',
                                fontSize: '16px', outline: 'none'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            backgroundColor: 'var(--deep-teal)', color: '#fff',
                            fontWeight: 600, padding: '16px', borderRadius: '12px',
                            width: '100%', fontSize: '16px',
                            opacity: loading ? 0.7 : 1, marginTop: '8px'
                        }}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0', color: 'var(--text-light)', fontSize: '14px' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
                    <span>OR</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Sign-In was unsuccessful. Try again later.')}
                        useOneTap
                        theme="outline"
                        size="large"
                        shape="pill"
                        text="continue_with"
                    />
                </div>

                <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '15px', color: 'var(--text-mid)' }}>
                    Don't have an account?{' '}
                    <span
                        onClick={() => navigate('register')}
                        style={{ color: 'var(--gold)', fontWeight: 600, cursor: 'pointer' }}
                    >
                        Sign Up
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Login;
