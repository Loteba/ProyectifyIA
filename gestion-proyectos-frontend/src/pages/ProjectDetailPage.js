import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import projectService from '../services/projectService';
import Card from '../components/common/Card';
import { FaPlus, FaTasks, FaArrowLeft, FaUserMinus, FaUsers } from 'react-icons/fa';
import { useToast } from '../components/common/ToastProvider';
import ConfirmModal from '../components/common/ConfirmModal';
import './DashboardPage.css';

const ProjectDetailPage = () => {
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  // fecha límite: 1, 3, 7 días o más días (ingresar número)
  const [dueMode, setDueMode] = useState('7'); // '1' | '3' | '7' | 'customDays'
  const [customDays, setCustomDays] = useState('');
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({ members: 0, pending: 0 });
  const [pendingInvites, setPendingInvites] = useState([]);
  const [err, setErr] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviteErr, setInviteErr] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');

  const { projectId } = useParams();
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const [openTaskId, setOpenTaskId] = useState(null);

  const load = useCallback(async () => {
    setErr('');
    try {
      const [p, t, m, s, invs] = await Promise.all([
        projectService.getProjectById(projectId),
        projectService.getTasksForProject(projectId),
        projectService.listProjectMembers(projectId),
        projectService.getProjectStats(projectId),
        projectService.listProjectInvitationsByProject(projectId).catch(() => []),
      ]);
      setProject(p); setTasks(t); setMembers(m); setStats(s); setPendingInvites(Array.isArray(invs) ? invs : []);
    } catch (e) { setErr('No se pudo cargar el proyecto'); }
  }, [projectId]);

  useEffect(() => { if (user) load(); }, [load, user]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    try {
      const payload = { title: newTaskTitle };
      if (dueMode === 'customDays' && customDays) payload.dueInDays = Number(customDays);
      else payload.dueInDays = Number(dueMode);
      const newTask = await projectService.createTaskForProject(projectId, payload);
      setTasks([newTask, ...tasks]);
      setNewTaskTitle('');
      setDueMode('7'); setCustomDays('');
      toast?.success('Tarea creada');
    } catch (error) { toast?.error('No se pudo crear la tarea'); }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
      await projectService.inviteToProject(projectId, inviteEmail);
      setInviteEmail('');
      setInviteErr('');
      setInviteMsg('Invitación enviada. El usuario recibirá una notificación.');
      toast?.success('Invitación enviada');
      setTimeout(() => setInviteMsg(''), 3000);
      // refrescar stats (pendientes)
      try {
        const [s, invs] = await Promise.all([
          projectService.getProjectStats(projectId),
          projectService.listProjectInvitationsByProject(projectId)
        ]);
        setStats(s); setPendingInvites(Array.isArray(invs) ? invs : []);
      } catch {}
    } catch (err2) {
      const msg = err2?.response?.data?.message || 'No se pudo enviar la invitación';
      setInviteMsg('');
      setInviteErr(msg);
      toast?.error(msg);
      setTimeout(() => setInviteErr(''), 3500);
    }
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmCfg, setConfirmCfg] = useState({ title: '', message: '', tone: 'default', onConfirm: null });

  const openConfirm = (cfg) => { setConfirmCfg(cfg); setConfirmOpen(true); };
  const closeConfirm = () => { setConfirmOpen(false); };
  const runConfirm = async () => { try { await confirmCfg.onConfirm?.(); } finally { closeConfirm(); } };

  const handleRemoveMember = (uid, email) => {
    openConfirm({
      title: 'Quitar miembro',
      message: `¿Quitar a ${email || 'este usuario'} del proyecto?`,
      tone: 'danger',
      onConfirm: async () => {
        try {
          await projectService.removeProjectMember(projectId, uid);
          toast?.success('Miembro quitado del proyecto');
          setActionMsg('Se quitó al miembro del proyecto.');
          setTimeout(() => setActionMsg(''), 3000);
          await load();
        } catch (e) {
          const m = e?.response?.data?.message || 'No se pudo quitar al miembro';
          toast?.error(m);
          setActionErr(m);
          setTimeout(() => setActionErr(''), 3500);
        }
      }
    });
  };

  const cancelInvite = (invId, email) => {
    openConfirm({
      title: 'Cancelar invitación',
      message: `¿Cancelar la invitación para ${email || 'este usuario'}?`,
      tone: 'danger',
      onConfirm: async () => {
        try {
          await projectService.cancelProjectInvitation(invId);
          toast?.success('Invitación cancelada');
          setActionMsg('Invitación cancelada correctamente.');
          setTimeout(() => setActionMsg(''), 3000);
          await load();
        } catch (e) {
          const m = e?.response?.data?.message || 'No se pudo cancelar la invitación';
          toast?.error(m);
          setActionErr(m);
          setTimeout(() => setActionErr(''), 3500);
        }
      }
    });
  };

  const cancelTask = (task) => {
    openConfirm({
      title: 'Cancelar tarea',
      message: `¿Cancelar la tarea "${task.title}"?`,
      tone: 'danger',
      onConfirm: async () => {
        try {
          const t = await projectService.updateTaskStatus(projectId, task._id, 'Cancelada');
          setTasks(prev => prev.map(x => x._id === t._id ? t : x));
          toast?.success('Tarea cancelada');
        } catch { toast?.error('No se pudo cancelar la tarea'); }
      },
    });
  };

  const deleteTask = (task) => {
    openConfirm({
      title: 'Eliminar tarea',
      message: `¿Eliminar la tarea "${task.title}"? Esta acción no se puede deshacer.`,
      tone: 'danger',
      onConfirm: async () => {
        try {
          await projectService.deleteTask(projectId, task._id);
          setTasks(prev => prev.filter(x => x._id !== task._id));
          toast?.success('Tarea eliminada');
        } catch { toast?.error('No se pudo eliminar la tarea'); }
      },
    });
  };

  const isOwner = project && String(project.user) === String(user?._id);

  return (
    <div>
      <Link to="/dashboard/projects" className="back-link"><FaArrowLeft /> Volver a Proyectos</Link>
      <div className="dashboard-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ marginBottom: 8 }}>{project?.name || 'Proyecto'}</h1>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ background:'#eef2ff', color:'#1e3a8a', border:'1px solid #c7d2fe', padding:'3px 8px', borderRadius:999, fontSize:12 }}>
              Miembros: {stats.members || members.length || 0}
            </span>
            {isOwner && (
              <span style={{ background:'#fff7ed', color:'#9a3412', border:'1px solid #fed7aa', padding:'3px 8px', borderRadius:999, fontSize:12 }}>
                Pendientes: {stats.pending || 0}
              </span>
            )}
          </div>
        </div>
      </div>
      {err && <div style={{ color: 'red', marginBottom: 12 }}>{err}</div>}

      <Card title="Añadir Nueva Tarea" icon={<FaPlus />}>
        <form onSubmit={handleCreateTask} className="new-task-form" style={{ alignItems:'center', gap: '0.75rem', flexWrap:'wrap' }}>
          <input
            type="text"
            placeholder="¿Cuál es la siguiente tarea?"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
          />
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <label style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
              <input type="radio" name="due" value="1" checked={dueMode==='1'} onChange={() => setDueMode('1')} /> 1 día
            </label>
            <label style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
              <input type="radio" name="due" value="3" checked={dueMode==='3'} onChange={() => setDueMode('3')} /> 3 días
            </label>
            <label style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
              <input type="radio" name="due" value="7" checked={dueMode==='7'} onChange={() => setDueMode('7')} /> 7 días
            </label>
            <label style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
              <input type="radio" name="due" value="customDays" checked={dueMode==='customDays'} onChange={() => setDueMode('customDays')} /> Más días
            </label>
            {dueMode==='customDays' && (
              <input type="number" min="1" max="365" step="1" placeholder="días" value={customDays} onChange={(e)=>setCustomDays(e.target.value)} style={{ width: 90 }} />
            )}
          </div>
          <button type="submit">Añadir Tarea</button>
        </form>
      </Card>

      <div style={{ marginTop: '2rem' }}>
        <Card title="Recursos del proyecto (links)">
          <ResourceLinksSection projectId={projectId} />
        </Card>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <Card title="Invitar colaboradores">
          <form onSubmit={handleInvite} className="new-task-form">
            <input type="email" placeholder="correo@ejemplo.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            <button type="submit" disabled={!isOwner}>Enviar invitación</button>
          </form>
          {inviteMsg && <div style={{ marginTop: 8, background:'#ecfdf5', color:'#065f46', border:'1px solid #a7f3d0', padding:'8px 12px', borderRadius:6 }}>{inviteMsg}</div>}
          {inviteErr && <div style={{ marginTop: 8, background:'#fef2f2', color:'#991b1b', border:'1px solid #fecaca', padding:'8px 12px', borderRadius:6 }}>{inviteErr}</div>}
          {!isOwner && <p style={{ color: '#666', fontSize: 12, marginTop: 8 }}>Solo el propietario del proyecto puede invitar.</p>}
        </Card>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <Card title="Miembros" icon={<FaUsers />}>
          {actionMsg && <div style={{ marginBottom: 10, background:'#ecfdf5', color:'#065f46', border:'1px solid #a7f3d0', padding:'8px 12px', borderRadius:6 }}>{actionMsg}</div>}
          {actionErr && <div style={{ marginBottom: 10, background:'#fef2f2', color:'#991b1b', border:'1px solid #fecaca', padding:'8px 12px', borderRadius:6 }}>{actionErr}</div>}
          <table className="table-clean">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Nombre</th>
                <th style={{ textAlign: 'left' }}>Email</th>
                <th style={{ textAlign: 'left' }}>Rol</th>
                <th className="table-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m._id}>
                  <td>{m.user?.name}</td>
                  <td>{m.user?.email}</td>
                  <td>{m.role === 'owner' ? 'Creador' : 'Miembro'}</td>
                  <td className="table-actions">
                    {isOwner && m.role !== 'owner' && (
                      <button onClick={() => handleRemoveMember(m.user?._id, m.user?.email)} className="action-btn delete-btn btn-compact btn-inline">
                        <FaUserMinus /> Quitar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {isOwner && (
        <div style={{ marginTop: '2rem' }}>
          <Card title="Invitaciones pendientes">
            {actionMsg && <div style={{ marginBottom: 10, background:'#ecfdf5', color:'#065f46', border:'1px solid #a7f3d0', padding:'8px 12px', borderRadius:6 }}>{actionMsg}</div>}
            {actionErr && <div style={{ marginBottom: 10, background:'#fef2f2', color:'#991b1b', border:'1px solid #fecaca', padding:'8px 12px', borderRadius:6 }}>{actionErr}</div>}
            {pendingInvites.length === 0 ? (
              <p>No hay invitaciones pendientes.</p>
            ) : (
              <table className="table-clean">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Invitado</th>
                    <th style={{ textAlign: 'left' }}>Email</th>
                    <th className="table-actions">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInvites.map(inv => (
                    <tr key={inv._id}>
                      <td>{inv.inviteeUser?.name || '-'}</td>
                      <td>{inv.inviteeEmail}</td>
                      <td className="table-actions">
                        <button onClick={() => cancelInvite(inv._id, inv.inviteeEmail)} className="action-btn delete-btn btn-compact">Cancelar invitación</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <Card title="Lista de Tareas" icon={<FaTasks />}>
          {tasks.length > 0 ? (
            <ul className="task-list">
              {tasks.map(task => (
                <li key={task._id} className="task-item" onClick={() => setOpenTaskId(openTaskId === task._id ? null : task._id)}>
                  <div className={`task-row ${openTaskId === task._id ? 'open' : ''}`}>
                    <div className="task-left">
                      <strong>{task.title}</strong>
                      <div className="task-meta">por {task.user?.name || 'alguien'} · {new Date(task.createdAt).toLocaleString()}{task.dueDate ? ` � vence ${new Date(task.dueDate).toLocaleDateString()}` : ``}</div>
                    </div>
                    <div className="task-right" onClick={(e) => e.stopPropagation()}>
                      <span className={`status ${task.status.toLowerCase()}`}>{task.status}</span>
                      {task.status !== 'Completada' && task.status !== 'Cancelada' && (
                        <div className="task-actions">
                          <button
                            onClick={async () => { try { const t = await projectService.updateTaskStatus(projectId, task._id, 'Completada'); setTasks(prev => prev.map(x => x._id===t._id? t : x)); toast?.success('Tarea finalizada'); } catch { toast?.error('No se pudo finalizar'); } }}
                            className="action-btn btn-compact btn-success"
                          >Finalizar</button>
                          <button
                            onClick={() => cancelTask(task)}
                            className="action-btn btn-compact btn-danger"
                          >Cancelar</button>
                        </div>
                      )}
                    </div>
                    <button title="Eliminar tarea" className="task-delete" onClick={(e) => { e.stopPropagation(); deleteTask(task); }}>×</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-projects-msg">No hay tareas para este proyecto. ¡Añade la primera!</p>
          )}
        </Card>
      </div>
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={closeConfirm}
        title={confirmCfg.title}
        message={confirmCfg.message}
        onConfirm={runConfirm}
        confirmText={confirmCfg.tone === 'danger' ? 'Sí, confirmar' : 'Confirmar'}
        cancelText="Cancelar"
        tone={confirmCfg.tone}
      />
    </div>
  );
};

export default ProjectDetailPage;

// Sección autocontenida para múltiples links (nombre + URL)
const ResourceLinksSection = ({ projectId }) => {
  const toast = useToast();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const list = await projectService.listResourceLinks(projectId); setLinks(list); }
    finally { setLoading(false); }
  }, [projectId]);
  useEffect(() => { load(); }, [load]);

  const add = async (e) => {
    e.preventDefault();
    try {
      const created = await projectService.addResourceLink(projectId, { name, url });
      setLinks(prev => [created, ...prev]);
      setName(''); setUrl(''); toast?.success('Recurso agregado');
    } catch (err) { toast?.error(err?.response?.data?.message || 'No se pudo agregar'); }
  };
  const remove = (item) => {
    showConfirm({
      title: 'Eliminar recurso',
      message: `¿Eliminar "${item.name}"?`,
      onConfirm: async () => { await projectService.deleteResourceLink(projectId, item._id); setLinks(prev => prev.filter(x => x._id!==item._id)); toast?.success('Recurso eliminado'); },
    });
  };

  // Reusar ConfirmModal a través de estado local
  const [cOpen, setCOpen] = useState(false);
  const [cfg, setCfg] = useState({ title:'', message:'', onConfirm:null });
  const showConfirm = (c) => { setCfg(c); setCOpen(true); };

  return (
    <div>
      <form onSubmit={add} style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', marginBottom:12 }}>
        <input type="text" placeholder="Nombre (p. ej., PPT, Documento, Pruebas)" value={name} onChange={(e)=>setName(e.target.value)} required
               style={{ flex:'1 1 240px', padding:'8px 10px', border:'1px solid var(--border-color)', borderRadius:6 }} />
        <input type="url" placeholder="https://..." value={url} onChange={(e)=>setUrl(e.target.value)} required
               style={{ flex:'2 1 360px', padding:'8px 10px', border:'1px solid var(--border-color)', borderRadius:6 }} />
        <button className="action-btn view-btn btn-compact" disabled={loading}>Agregar</button>
      </form>
      {links.length === 0 ? (
        <p className="task-meta">Aún no hay recursos agregados.</p>
      ) : (
        <table className="table-clean">
          <thead><tr><th>Nombre</th><th>URL</th><th className="table-actions">Acciones</th></tr></thead>
          <tbody>
            {links.map(r => (
              <tr key={r._id}>
                <td>{r.name}</td>
                <td><a href={r.url} target="_blank" rel="noopener noreferrer">{r.url}</a></td>
                <td className="table-actions">
                  <a className="action-btn btn-compact" href={r.url} target="_blank" rel="noopener noreferrer">Abrir</a>
                  <button className="action-btn delete-btn btn-compact" onClick={() => remove(r)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <ConfirmModal isOpen={cOpen} onClose={()=>setCOpen(false)} title={cfg.title} message={cfg.message} onConfirm={async()=>{ await cfg.onConfirm?.(); setCOpen(false); }} confirmText="Sí, eliminar" cancelText="Cancelar" tone="danger" />
    </div>
  );
};


