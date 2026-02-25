import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [currentScreen, setCurrentScreen] = useState('onboarding');
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [relationship, setRelationship] = useState('');
    const [state, setState] = useState('');
    const [employment, setEmployment] = useState('');
    const [accounts, setAccounts] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [history, setHistory] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [userId, setUserId] = useState(null);
    const [token, setToken] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [busy, setBusy] = useState(false);
    const [docFields, setDocFields] = useState(() => {
        try {
            const raw = localStorage.getItem('docFields');
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    });

    // Persist docFields to localStorage so users don't re-enter values each session
    useEffect(() => {
        try {
            localStorage.setItem('docFields', JSON.stringify(docFields));
        } catch (e) {
            // ignore storage errors
        }
    }, [docFields]);

    // Initial load: check localStorage for session
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUserId = localStorage.getItem('userId');
        const storedName = localStorage.getItem('userName');
        if (storedToken && storedUserId) {
            setToken(storedToken);
            setUserId(storedUserId);
            if (storedName) setUserName(storedName);
            setIsAuthenticated(true);
        }
    }, []);

    const navigate = (screen) => setCurrentScreen(screen);

    const login = (token, user) => {
        localStorage.setItem('token', token);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('userName', user.name);
        setToken(token);
        setUserId(user.id);
        setUserName(user.name);
        setUserEmail(user.email);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.clear();
        setToken(null);
        setUserId(null);
        setUserName('');
        setUserEmail('');
        setIsAuthenticated(false);
        navigate('onboarding');
    };

    return (
        <AppContext.Provider
            value={{
                currentScreen,
                userName, setUserName,
                userEmail, setUserEmail,
                relationship, setRelationship,
                state, setState,
                employment, setEmployment,
                accounts, setAccounts,
                selectedTask, setSelectedTask,
                history, setHistory,
                tasks, setTasks,
                userId, setUserId,
                token, isAuthenticated,
                docFields, setDocFields,
                login, logout,
                busy, setBusy,
                navigate,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};
