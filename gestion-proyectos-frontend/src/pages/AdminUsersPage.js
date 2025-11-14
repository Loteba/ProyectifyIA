import React, { useEffect, useState, useContext } from 'react';
import userAdminService from '../services/userAdminService';
import './DashboardPage.css';
import ConfirmModal from '../components/common/ConfirmModal';
import { AuthContext } from '../context/AuthContext';

const emptyForm = { name: '', email: '', password: '', role: 'user' };

const AdminUsersPage = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await userAdminService.list();
      setUsers(data);
    } catch (e) {
      setError('No se pudo cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (editingId) {
        const payload = { name: form.name, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        await userAdminService.update(editingId, payload);
      } else {
        await userAdminService.create(form);
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Error guardando usuario');
    } finally {
      setLoading(false);
    }
  };

  const onEdit = (u) => {
    setEditingId(u._id);
    setForm({ name: u.name, email: u.email, password: '', role: u.role || 'user' });
  };

  const onDelete = async (id) => {\n    setConfirmCfg({\n      title: 'Eliminar usuario',\n      message: '縀liminar este usuario y sus datos? Esta acci髇 no se puede deshacer.',\n      tone: 'danger',\n      onConfirm: async () => {\n        setLoading(true);\n        setError('');\n        try {\n          await userAdminService.remove(id);\n          await load();\n        } catch (e) {\n          setError('No se pudo eliminar');\n        } finally {\n          setLoading(false);\n        }\n      }\n    });\n    setConfirmOpen(true);\n  };

  // Filtro y paginaci贸n
  const norm = (s) => String(s || '').toLowerCase();
  const filtered = users.filter(u => {
    const matchesText = !query || norm(u.name).includes(norm(query)) || norm(u.email).includes(norm(query));
    const matchesRole = !roleFilter || (u.role || 'user') === roleFilter;
    return matchesText && matchesRole;
  });
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);
  const pageItems = filtered.slice(start, end);

  // Reset paginaci贸n si cambian filtros
  useEffect(() => { setPage(1); }, [query, roleFilter]);

  const toggleSort = (field) => {
    setSortBy((prev) => {
      if (prev === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return field;
    });
  };
  const sortArrow = (field) => sortBy === field ? (sortDir === 'asc' ? ' ?' : ' ?') : '';

  const roleBadge = (role) => {
    const r = role || 'user';
    const cls = r === 'superadmin' ? 'badge badge-danger' : r === 'admin' ? 'badge badge-info' : r === 'investigador' ? 'badge badge-purple' : r === 'estudiante' ? 'badge badge-success' : 'badge badge-muted';
    const label = r === 'superadmin' ? 'Super Admin' : r === 'admin' ? 'Administrador' : r === 'investigador' ? 'Investigador' : r === 'estudiante' ? 'Estudiante' : 'Usuario';
    return <span className={cls}>{label}</span>;
  };

  return (
    <div className="dashboard-content">
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div className="form-container center-eq-sidebar" style={{ width: '100%', maxWidth: 1100, margin: '2rem auto' }}>
          <h2 style={{ marginTop: 8, marginBottom: 16 }}>Gesti贸n de usuarios</h2>
          {error && <div style={{ background:'#fef2f2', color:'#991b1b', border:'1px solid #fecaca', padding:'8px 12px', borderRadius:6, marginBottom: 12 }}>{error}</div>}

          {/* Filtros */}
          <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom: 12, flexWrap:'wrap' }}>
            <input placeholder="Buscar por nombre o email" value={query} onChange={(e)=>setQuery(e.target.value)} style={{ padding:'0.6rem 0.9rem', border:'1px solid var(--border-color)', borderRadius: 6, minWidth: 260 }} />
            <select value={roleFilter} onChange={(e)=>setRoleFilter(e.target.value)} style={{ padding:'0.6rem 0.9rem', border:'1px solid var(--border-color)', borderRadius: 6 }}>
              <option value="">Todos los roles</option>
              <option value="superadmin">Super Admin</option>
              <option value="admin">Administrador</option>
              <option value="investigador">Investigador</option>
              <option value="estudiante">Estudiante</option>
              <option value="user">Usuario</option>
            </select>
            <div style={{ marginLeft:'auto', color:'#6b7280', fontSize:13 }}>Mostrando {total ? start+1 : 0}杮end} de {total}</div>
          </div>

          <form onSubmit={onSubmit} style={{ marginBottom: 16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0,1fr))', gap: 12 }}>
              <div className="form-group">
                <label>Nombre</label>
                <input name="name" value={form.name} onChange={onChange} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={form.email} onChange={onChange} required />
              </div>
              <div className="form-group">
                <label>Contrase帽a {editingId ? '(dejar vac铆o para no cambiar)' : ''}</label>
                <input type="password" name="password" value={form.password} onChange={onChange} minLength={editingId ? 0 : 6} />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select name="role" value={form.role} onChange={onChange}>
                  {currentUser?.role === 'superadmin' && (<option value="superadmin">Super Admin</option>)}
                  <option value="admin">Administrador</option>
                  <option value="investigador">Investigador</option>
                  <option value="estudiante">Estudiante</option>
                  <option value="user">Usuario</option>
                </select>
              </div>
            </div>
            <div className={editingId ? 'button-row' : ''} style={{ marginTop: 8 }}>
              <button className="form-button" style={editingId ? { width: 'auto' } : undefined} disabled={loading}>
                {editingId ? 'Actualizar' : 'Crear'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="form-button secondary-button"
                  onClick={() => { setEditingId(null); setForm(emptyForm); }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <table className="table-clean" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Nombre</th>
                <th style={{ textAlign: 'left' }}>Email</th>
                <th style={{ textAlign: 'left' }}>Rol</th>
                <th className="table-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{roleBadge(u.role)}</td>
                  <td className="table-actions">
                    <button onClick={() => onEdit(u)} className="action-btn btn-compact" disabled={u.role === 'superadmin' && currentUser?.role !== 'superadmin'}>Editar</button>
                    <button onClick={() => onDelete(u._id)} className="action-btn btn-compact btn-danger" disabled={u.role === 'superadmin' && currentUser?.role !== 'superadmin'}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginaci贸n */}
          <div className="table-pagination" style={{ display:'flex', gap:8, justifyContent:'flex-end', alignItems:'center', marginTop: 10 }}>
            <button className="action-btn btn-compact" onClick={()=> setPage(p => Math.max(1, p-1))} disabled={safePage<=1}>Anterior</button>
            <span style={{ color:'#6b7280', fontSize:13 }}>P谩gina {safePage} de {totalPages}</span>
            <button className="action-btn btn-compact" onClick={()=> setPage(p => Math.min(totalPages, p+1))} disabled={safePage>=totalPages}>Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;




