import API from './apiClient';

const list = async () => {
  const { data } = await API.get('/notifications');
  return data;
};

const markRead = async (id) => {
  await API.post(`/notifications/${id}/read`);
};

const markAllRead = async () => {
  await API.post('/notifications/read-all');
};

const unreadCount = async () => {
  const { data } = await API.get('/notifications/unread-count');
  return data?.count ?? 0;
};

export default { list, markRead, markAllRead, unreadCount };
