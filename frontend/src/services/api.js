import axios from 'axios';

const isLocal = window.location.hostname === 'localhost';
const API_DOMAIN = process.env.REACT_APP_API_URL || (isLocal ? 'http://localhost:5001' : 'https://sahara-backend-288i.onrender.com');
const BASE = `${API_DOMAIN}/api`;

// Auth
export const registerUser = (data) => axios.post(`${BASE}/auth/register`, data);
export const loginUser = (data) => axios.post(`${BASE}/auth/login`, data);
export const googleLoginUser = (data) => axios.post(`${BASE}/auth/google`, data);

// User Profile Update
export const updateUser = (userId, data) => axios.put(`${BASE}/users/${userId}`, data);

export const sendChat = (data) => axios.post(`${BASE}/chat`, data);

export const getTasks = (userId) => axios.get(`${BASE}/tasks/${userId}`);

export const createTask = (userId, taskData) =>
    axios.post(`${BASE}/tasks/${userId}`, taskData);

export const updateTask = (userId, taskIndex, data) =>
    axios.put(`${BASE}/tasks/${userId}`, { taskIndex, ...data });

export const deleteTask = (userId, taskIndex) =>
    axios.delete(`${BASE}/tasks/${userId}/${taskIndex}`);

export const getGuidanceTopic = (topicId) =>
    axios.get(`${BASE}/guidance/topic/${topicId}`);



export const generateDocument = (type, userData) =>
    axios.post(`${BASE}/documents/generate`, { type, ...userData }, { responseType: 'blob' });

export const getChatHistory = (userId) => axios.get(`${BASE}/chat/${userId}`);

// Account Identification
export const detectAccountsFromDocument = (formData) =>
    axios.post(`${BASE}/accounts/detect-document`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });

export const detectAccountsFromText = (data) =>
    axios.post(`${BASE}/accounts/detect-text`, data);

export const getDecisionSupport = (accounts, userProfile) =>
    axios.post(`${BASE}/accounts/decision-support`, { accounts, userProfile });

export const mergeAccounts = (userId, accounts) =>
    axios.put(`${BASE}/accounts/${userId}/merge`, { accounts });

export const getUserAccounts = (userId) =>
    axios.get(`${BASE}/accounts/${userId}`);
