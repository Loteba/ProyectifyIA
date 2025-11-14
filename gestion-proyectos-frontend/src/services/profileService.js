// src/services/profileService.js
import API from './apiClient';

export const getProfile = async () => {
  const { data } = await API.get('/users/me');
  return data;
};

export const updateProfile = async (payload) => {
  const { data } = await API.put('/users/me', payload);
  return data;
};

export const checkEmail = async (email) => {
  const { data } = await API.get('/users/check-email', { params: { email } });
  return data;
};

export const uploadAvatar = async (file) => {
  const form = new FormData();
  form.append('avatar', file);
  const { data } = await API.put('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return data;
};

const profileService = { getProfile, updateProfile, checkEmail, uploadAvatar };
export default profileService;
