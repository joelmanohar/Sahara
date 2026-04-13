import React, { useContext } from 'react';
import { AppProvider, AppContext } from './context/AppContext';
import BottomNav from './components/BottomNav';

import Onboarding from './screens/Onboarding';
import Setup from './screens/Setup';
import Chat from './screens/Chat';
import Guidance from './screens/Guidance';
import Dashboard from './screens/Dashboard';
import Documents from './screens/Documents';
import Login from './screens/Login';
import Register from './screens/Register';
import AccountIdentifier from './screens/AccountIdentifier';
import { GoogleOAuthProvider } from '@react-oauth/google';

const Toast = ({ message, type }) => {
    if (!message) return null;
    return (
        <div style={{
            position: 'fixed',
            bottom: 'calc(var(--nav-h) + 20px)',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            borderRadius: '14px',
            backgroundColor: type === 'error' ? '#FEF2F2' : '#F0FDF4',
            color: type === 'error' ? '#DC2626' : '#065F46',
            border: `1px solid ${type === 'error' ? '#FECACA' : '#BBF7D0'}`,
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 1000,
            animation: 'slideUp 0.3s ease, fadeOut 0.3s ease 2.5s forwards',
            maxWidth: '90%',
            textAlign: 'center',
            whiteSpace: 'nowrap'
        }}>
            {message}
        </div>
    );
};

const ScreenManager = () => {
    const { currentScreen, isAuthenticated, toast } = useContext(AppContext);

    const showNav = ['chat', 'guidance', 'dashboard', 'documents'].includes(currentScreen);

    const renderScreen = () => {
        // Unauthenticated routes
        if (!isAuthenticated) {
            switch (currentScreen) {
                case 'login': return <Login key="login" />;
                case 'register': return <Register key="register" />;
                default: return <Onboarding key="onboarding" />;
            }
        }

        // Authenticated routes
        switch (currentScreen) {
            case 'setup': return <Setup key="setup" />;
            case 'chat': return <Chat key="chat" />;
            case 'guidance': return <Guidance key="guidance" />;
            case 'dashboard': return <Dashboard key="dashboard" />;
            case 'documents': return <Documents key="documents" />;
            case 'accounts': return <AccountIdentifier key="accounts" />;
            default: return <Dashboard key="dashboard" />;
        }
    };

    return (
        <>
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {renderScreen()}
            </div>
            {showNav && <BottomNav />}
            {toast && <Toast message={toast.message} type={toast.type} />}
        </>
    );
};

const App = () => {
    const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'placeholder_client_id';

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <AppProvider>
                <ScreenManager />
            </AppProvider>
        </GoogleOAuthProvider>
    );
};

export default App;
