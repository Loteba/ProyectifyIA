// src/pages/ProjectListPage.js
import React, { useState, useEffect, useContext } from 'react';
// ⬇️ No usamos Link aquí; la navegación al detalle la hace ProjectItem internamente
// import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import projectService from '../services/projectService';
import ProjectItem from '../components/projects/ProjectItem';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import EditProjectModal from '../components/projects/EditProjectModal';
import { FaPlus } from 'react-icons/fa';
import './DashboardPage.css';
import { LocaleContext } from '../i18n/LocaleContext';

const ProjectListPage = () => {
  const { user } = useContext(AuthContext);
  const { t } = useContext(LocaleContext);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // Modal crear
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [areaTematica, setAreaTematica] = useState('');

  // Modal editar
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);

  // Cargar proyectos
  const fetchProjects = async () => {
    if (!user?.token) return;
    setLoading(true); setErr('');
    try {
      const data = await projectService.getProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error al cargar proyectos:', e);
      setErr(e?.response?.data?.message || 'No se pudieron cargar los proyectos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  // Crear nuevo proyecto
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    const payload = {
      name: (name || '').trim(),
      description: (description || '').trim(),
      areaTematica: (areaTematica || '').trim(),
    };
    if (!payload.name || !payload.description || !payload.areaTematica) {
      setErr('Por favor, completa todos los campos (nombre, descripción, área temática).');
      return;
    }

    try {
      const created = await projectService.createProject(payload);
      setProjects(prev => [created, ...prev]);
      // limpiar y cerrar
      setName(''); setDescription(''); setAreaTematica('');
      setIsModalOpen(false);
    } catch (e) {
      console.error('Error al crear proyecto:', e);
      setErr(e?.response?.data?.message || 'No se pudo crear el proyecto');
    }
  };

  // Eliminar
  const handleDelete = async (projectId) => {
    const ok = window.confirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.');
    if (!ok) return;
    setErr('');
    try {
      await projectService.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p._id !== projectId));
    } catch (e) {
      console.error('Error al eliminar proyecto:', e);
      setErr(e?.response?.data?.message || 'No se pudo eliminar el proyecto');
    }
  };

  // Abrir modal editar
  const handleEdit = (project) => {
    setCurrentProject({ ...project }); // copia para edición
    setIsEditModalOpen(true);
  };

  // Guardar edición (robusto: soporta con/sin "event")
  const handleUpdate = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!currentProject) return;

    const payload = {
      name: (currentProject.name || '').trim(),
      description: (currentProject.description || '').trim(),
      areaTematica: (currentProject.areaTematica || '').trim(),
    };
    if (!payload.name || !payload.description || !payload.areaTematica) {
      setErr('Completa todos los campos para actualizar.');
      return;
    }

    try {
      const updated = await projectService.updateProject(currentProject._id, payload);
      setProjects(prev => prev.map(p => (p._id === updated._id ? updated : p)));
      setIsEditModalOpen(false);
      setCurrentProject(null);
    } catch (e) {
      console.error('Error al actualizar proyecto:', e);
      setErr(e?.response?.data?.message || 'No se pudo actualizar el proyecto');
    }
  };

  return (
    <>
      {/* Modal Crear */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        name={name}
        setName={setName}
        description={description}
        setDescription={setDescription}
        areaTematica={areaTematica}
        setAreaTematica={setAreaTematica}
        handleSubmit={handleSubmit}
      />

      {/* Modal Editar */}
      {currentProject && (
        <EditProjectModal
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setCurrentProject(null); }}
          projectData={currentProject}
          setProjectData={setCurrentProject}
          handleSubmit={handleUpdate}
        />
      )}

      <div className="dashboard-header">
        <h1>{t('projects:title')}</h1>
        <button className="new-project-btn" onClick={() => setIsModalOpen(true)}>
          <FaPlus /> {t('projects:newProject')}
        </button>
      </div>

      {err && <div style={{ color: '#b91c1c', marginBottom: 8 }}>{err}</div>}
      {loading && <div>{t('invitationsPage:loading')}</div>}

      {!loading && projects.length > 0 ? (
        <div className="project-list-container">
          {projects.map((project) => (
            <ProjectItem
              key={project._id}
              project={project}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (!loading && (
        <div className="no-projects-msg">
          <h3>{t('projects:noProjectsTitle')}</h3>
          <p>{t('projects:noProjectsCta')}</p>
        </div>
      ))}
    </>
  );
};

export default ProjectListPage;
