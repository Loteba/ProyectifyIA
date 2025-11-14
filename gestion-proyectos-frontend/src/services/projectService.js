// src/services/projectService.js
import API from './apiClient';

const BASE = '/projects';

// --- Listar proyectos del usuario autenticado ---
export const getProjects = async (/* token opcional, ignorado */) => {
  const { data } = await API.get(BASE);
  return data; // []
};

// --- Crear proyecto ---
export const createProject = async (projectData /*, token opcional */) => {
  const { data } = await API.post(BASE, projectData);
  return data; // { _id, name, ... }
};

// --- Actualizar proyecto ---
export const updateProject = async (projectId, projectData /*, token opcional */) => {
  const { data } = await API.put(`${BASE}/${projectId}`, projectData);
  return data;
};

// --- Eliminar proyecto ---
export const deleteProject = async (projectId /*, token opcional */) => {
  const { data } = await API.delete(`${BASE}/${projectId}`);
  return data; // { id }
};

// --- Tareas por proyecto (si las usas en detalle) ---
export const getTasksForProject = async (projectId /*, token opcional */) => {
  const { data } = await API.get(`${BASE}/${projectId}/tasks`);
  return data;
};

export const createTaskForProject = async (projectId, taskData /*, token opcional */) => {
  const { data } = await API.post(`${BASE}/${projectId}/tasks`, taskData);
  return data;
};

export const updateTaskStatus = async (projectId, taskId, status) => {
  const { data } = await API.put(`${BASE}/${projectId}/tasks/${taskId}/status`, { status });
  return data;
};

export const deleteTask = async (projectId, taskId) => {
  await API.delete(`${BASE}/${projectId}/tasks/${taskId}`);
};

// --- Invitaciones y colaboración ---
export const inviteToProject = async (projectId, email) => {
  const { data } = await API.post(`${BASE}/${projectId}/invite`, { email });
  return data;
};

export const listMyInvitations = async () => {
  const { data } = await API.get(`${BASE}/invitations/me`);
  return data;
};

export const acceptInvitation = async (invId) => {
  const { data } = await API.post(`${BASE}/invitations/${invId}/accept`);
  return data;
};

export const declineInvitation = async (invId) => {
  const { data } = await API.post(`${BASE}/invitations/${invId}/decline`);
  return data;
};

// --- Detalle de proyecto y miembros ---
export const getProjectById = async (projectId) => {
  const { data } = await API.get(`${BASE}/${projectId}`);
  return data;
};

export const listProjectMembers = async (projectId) => {
  const { data } = await API.get(`${BASE}/${projectId}/members`);
  return data; // [{role:'owner', user:{...}}, {user:{...}, role:'member'}]
};

export const removeProjectMember = async (projectId, userId) => {
  await API.delete(`${BASE}/${projectId}/members/${userId}`);
};

export const getProjectStats = async (projectId) => {
  const { data } = await API.get(`${BASE}/${projectId}/stats`);
  return data; // { members, pending }
};

export const listProjectInvitationsByProject = async (projectId) => {
  const { data } = await API.get(`${BASE}/${projectId}/invitations`);
  return data;
};

export const cancelProjectInvitation = async (invId) => {
  await API.delete(`${BASE}/invitations/${invId}`);
};

// --- Documento de trabajo (link) ---
export const getWorkLink = async (projectId) => {
  const { data } = await API.get(`${BASE}/${projectId}/work-link`);
  return data?.url || '';
};
export const setWorkLink = async (projectId, url) => {
  const { data } = await API.put(`${BASE}/${projectId}/work-link`, { url });
  return data?.url || '';
};

// Varios recursos (nombre + url)
export const listResourceLinks = async (projectId) => {
  const { data } = await API.get(`${BASE}/${projectId}/links`);
  return Array.isArray(data) ? data : [];
};
export const addResourceLink = async (projectId, payload) => {
  const { data } = await API.post(`${BASE}/${projectId}/links`, payload);
  return data;
};
export const deleteResourceLink = async (projectId, linkId) => {
  await API.delete(`${BASE}/${projectId}/links/${linkId}`);
};

const projectService = {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getTasksForProject,
  createTaskForProject,
  updateTaskStatus,
  deleteTask,
  inviteToProject,
  listMyInvitations,
  acceptInvitation,
  declineInvitation,
  getProjectById,
  listProjectMembers,
  removeProjectMember,
  getProjectStats,
  listProjectInvitationsByProject,
  cancelProjectInvitation,
  getWorkLink,
  setWorkLink,
  listResourceLinks,
  addResourceLink,
  deleteResourceLink,
};

export default projectService;
