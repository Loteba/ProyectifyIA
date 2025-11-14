import API from './apiClient';

const BASE = '/admin/users';

const list = async () => {
  const { data } = await API.get(BASE);
  return data;
};

const get = async (id) => {
  const { data } = await API.get(`${BASE}/${id}`);
  return data;
};

const create = async (payload) => {
  const { data } = await API.post(BASE, payload);
  return data;
};

const update = async (id, payload) => {
  const { data } = await API.put(`${BASE}/${id}`, payload);
  return data;
};

const remove = async (id) => {
  await API.delete(`${BASE}/${id}`);
};

export default { list, get, create, update, remove };

