import React, { useState, useEffect, useContext } from 'react';
import { FaPen, FaTrash } from 'react-icons/fa';
import { FiUserPlus } from 'react-icons/fi';
import projectService from '../../services/projectService';
import { useNavigate } from 'react-router-dom';
import './ProjectItem.css';
import InviteCollaboratorModal from './InviteCollaboratorModal';
import { LocaleContext } from '../../i18n/LocaleContext';

const ProjectItem = ({ project, onDelete, onEdit }) => {
  const navigate = useNavigate();
  const { t } = useContext(LocaleContext);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [memberCount, setMemberCount] = useState(null);

  const handleCardClick = () => {
    navigate(`/dashboard/project/${project._id}`);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(project);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(project._id);
  };

  const openInvite = (e) => { e.stopPropagation(); setInviteOpen(true); };
  const doInvite = async (email) => {
    await projectService.inviteToProject(project._id, email);
  };

  useEffect(() => {
    let mounted = true;
    projectService.listProjectMembers(project._id)
      .then((m) => { if (mounted) setMemberCount(Array.isArray(m) ? m.length : null); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [project._id]);

  return (
    <div className="project-card" onClick={handleCardClick}>
      <div className="project-card-header">
        <h3 style={{ marginRight: 12 }}>{project.name}</h3>
        <div className="project-badges">
          {memberCount != null && (
            <span className="chip chip-info" title={t('projects:members')}>{memberCount} {t('projects:members')}</span>
          )}
          <span className="chip chip-muted" title="Área temática">{project.areaTematica}</span>
        </div>
      </div>

      <p className="project-card-description">{project.description}</p>

      <div className="project-card-footer">
        <small>{t('projects:createdOn')}: {new Date(project.createdAt).toLocaleDateString()}</small>
        <div className="project-card-actions">
          <button onClick={openInvite} className="action-btn view-btn">
            <FiUserPlus /> {t('common:invite')}
          </button>
          <button onClick={handleEdit} className="action-btn view-btn">
            <FaPen /> {t('common:edit')}
          </button>
          <button onClick={handleDelete} className="action-btn delete-btn">
            <FaTrash /> {t('common:delete')}
          </button>
        </div>
      </div>
      <InviteCollaboratorModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={doInvite}
      />
    </div>
  );
};

export default ProjectItem;
