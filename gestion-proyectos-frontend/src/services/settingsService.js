import API from './apiClient';

const get = async () => {
  const { data } = await API.get('/settings');
  return data;
};

const update = async (payload) => {
  const { data } = await API.put('/settings', payload);
  return data;
};

export default { get, update };

