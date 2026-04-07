import axios from 'axios';

const backend_link = import.meta.env.VITE_BACKEND_LINK;

const API_BASE_URL = backend_link;   // Backend URL

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,                    // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a response interceptor for better error handling (optional but recommended)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    // You can customize error messages here if needed
    if (error.response?.status === 401) {
      console.warn('Unauthorized - Token may have expired');
    }
    
    return Promise.reject(error);
  }
);

// Event related APIs
export const getAllEvents = () => api.get('/events');
export const getEvent = (id) => api.get(`/events/${id}`);
export const getEventAvailability = (id) => api.get(`/events/${id}/availability`);

// Purchase / Ticketing APIs
export const initializePayment = (data) => api.post('/purchase/initialize', data);
export const verifyPayment = (reference) => api.get(`/purchase/verify/${reference}`);

// Admin APIs (we'll use these later)
export const adminLogin = (credentials) => api.post('/auth/login', credentials);
export const createEvent = (eventData) => api.post('/events', eventData);
export const updateEvent = (id, eventData) => api.put(`/events/${id}`, eventData);
export const deleteEvent = (id) => api.delete(`/events/${id}`);

// Optional: Add Authorization header helper (for admin routes later)
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Get all participants for an event
export const getEventParticipants = (eventId) => {
  return api.get(`/attendance/event/${eventId}/participants`);
};

// Check in a participant
export const checkInParticipant = (eventId, purchaseId, participantIndex) => {
  return api.post(`/attendance/checkin`, {
    eventId,
    purchaseId,
    participantIndex
  });
};

export const getAllTicketPurchases = () => api.get('/purchase/all');

export default api;