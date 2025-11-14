import axios from 'axios';

const API_URL = '/api/users/';

const register = async (userData) => {
  const response = await axios.post(API_URL + 'register', userData);
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

const login = async (userData) => {
  const response = await axios.post(API_URL + 'login', userData);
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

const forgotPassword = async (email) => {
  const response = await axios.post(API_URL + 'forgot-password', { email });
  return response.data;
};

const resetPassword = async ({ email, token, password }) => {
  const response = await axios.post(API_URL + 'reset-password', { email, token, password });
  return response.data;
};

const authService = {
  register,
  login,
  forgotPassword,
  resetPassword,
};

export default authService;
