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

const ScreenManager = () => {
    const { currentScreen, isAuthenticated } = useContext(AppContext);

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
            default: return <Dashboard key="dashboard" />; // Default to dashboard if logged in
        }
    };

    return (
        <>
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {renderScreen()}
            </div>
            {showNav && <BottomNav />}
        </>
    );
};

const App = () => {
    // Note: User can replace this with a real Client ID in environment variables later
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
