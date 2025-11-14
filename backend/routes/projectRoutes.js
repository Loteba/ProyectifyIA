const express = require('express');
const router = express.Router();
const { 
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
    listProjectInvitations,
    cancelProjectInvitation,
    getProjectWorkLink,
    setProjectWorkLink,
    listProjectLinks,
    addProjectLink,
    deleteProjectLink,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getProjects)
    .post(protect, createProject);

router.get('/:id', protect, getProjectById);
router.route('/:id')
    .put(protect, updateProject)
    .delete(protect, deleteProject);

// Rutas para las tareas, ahora usando el parámetro :id consistentemente
router.route('/:id/tasks')
    .get(protect, getTasksForProject)
    .post(protect, createTaskForProject);
router.put('/:id/tasks/:taskId/status', protect, updateTaskStatus);
router.delete('/:id/tasks/:taskId', protect, deleteTask);

// Colaboración
router.post('/:id/invite', protect, inviteToProject);
router.get('/invitations/me', protect, listMyInvitations);
router.post('/invitations/:id/accept', protect, acceptInvitation);
router.post('/invitations/:id/decline', protect, declineInvitation);

router.get('/:id/members', protect, listProjectMembers);
router.delete('/:id/members/:userId', protect, removeProjectMember);
router.get('/:id/stats', protect, getProjectStats);
router.get('/:id/invitations', protect, listProjectInvitations);
router.delete('/invitations/:id', protect, cancelProjectInvitation);
router.get('/:id/work-link', protect, getProjectWorkLink);
router.put('/:id/work-link', protect, setProjectWorkLink);
router.get('/:id/links', protect, listProjectLinks);
router.post('/:id/links', protect, addProjectLink);
router.delete('/:id/links/:linkId', protect, deleteProjectLink);

module.exports = router;
