import React, { createContext, useState, useEffect, useCallback } from 'react';
import {
    createTask as apiCreateTask,
    updateTask as apiUpdateTask,
    deleteTask as apiDeleteTask
} from '../services/api';

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
    const [toast, setToast] = useState(null);
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
        setHistory([]);
        setTasks([]);
        navigate('onboarding');
    };

    // Show a toast notification
    const showToast = useCallback((message, type = 'success', duration = 3000) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), duration);
    }, []);

    // Create a task
    const addTask = useCallback(async (taskData) => {
        if (!userId) return;
        try {
            const res = await apiCreateTask(userId, taskData);
            if (res.data && res.data.tasks) {
                setTasks(res.data.tasks);
            }
            showToast(`✅ "${taskData.name}" added`);
            return res.data;
        } catch (err) {
            console.error('Failed to add task:', err);
            showToast('❌ Failed to add task', 'error');
            return null;
        }
    }, [userId, showToast]);

    // Update a task
    const updateTask = useCallback(async (taskIndex, taskData) => {
        if (!userId) return;
        try {
            const res = await apiUpdateTask(userId, taskIndex, taskData);
            setTasks(res.data);
            showToast('✅ Task updated');
            return res.data;
        } catch (err) {
            console.error('Failed to update task:', err);
            showToast('❌ Failed to update task', 'error');
            return null;
        }
    }, [userId, showToast]);

    // Delete a task
    const deleteTask = useCallback(async (taskIndex) => {
        if (!userId) return;
        try {
            const res = await apiDeleteTask(userId, taskIndex);
            if (res.data && res.data.tasks) {
                setTasks(res.data.tasks);
            }
            showToast('🗑️ Task removed');
            return res.data;
        } catch (err) {
            console.error('Failed to delete task:', err);
            showToast('❌ Failed to delete task', 'error');
            return null;
        }
    }, [userId, showToast]);

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
                toast, showToast,
                addTask,
                updateTask,
                deleteTask,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

