import React, { useEffect, useState, useContext, useCallback } from 'react';
import userAdminService from '../services/userAdminService';
import './DashboardPage.css';
import ConfirmModal from '../components/common/ConfirmModal';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../components/common/ToastProvider';

const emptyForm = { name: '', email: '', password: '', role: 'estudiante' };

const AdminUsersPage = () => {
  const { user: currentUser } = useContext(AuthContext);

  // data
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // filters & paging
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('name'); // name | email | role
  const [sortDir, setSortDir] = useState('asc'); // asc | desc

  // form
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  // confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmCfg, setConfirmCfg] = useState({ title: '', message: '', tone: 'default', onConfirm: null });

  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await userAdminService.list();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('No se pudo cargar usuarios');
      toast?.error('No se pudo cargar usuarios');
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (editingId) {
        const payload = { name: form.name, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        await userAdminService.update(editingId, payload);
        toast?.success('Usuario actualizado');
      } else {
        await userAdminService.create(form);
        toast?.success('Usuario creado');
      }
      setForm(emptyForm); setEditingId(null); await load();
    } catch (e2) {
      const msg = e2?.response?.data?.message || 'Error guardando usuario';
      setError(msg);
      toast?.error(msg);
    } finally { setLoading(false); }
  };

  const onEdit = (u) => {
    setEditingId(u._id);
    const normalizedRole = u.role && u.role !== 'user' ? u.role : 'estudiante';
    setForm({ name: u.name, email: u.email, password: '', role: normalizedRole });
  };

  const onDelete = async (id) => {
    setConfirmCfg({
      title: 'Eliminar usuario',
      message: 'Eliminar este usuario y sus datos. Esta accion no se puede deshacer.',
      tone: 'danger',
      onConfirm: async () => {
        setLoading(true); setError('');
        try { await userAdminService.remove(id); toast?.success('Usuario eliminado'); await load(); }
        catch { setError('No se pudo eliminar'); toast?.error('No se pudo eliminar'); }
        finally { setLoading(false); }
      }
    });
    setConfirmOpen(true);
  };

  // filter + sort + paginate
  const norm = (s) => String(s || '').toLowerCase();
  const filtered = users.filter(u => {
    const okText = !query || norm(u.name).includes(norm(query)) || norm(u.email).includes(norm(query));
    const okRole = !roleFilter || (u.role || 'user') === roleFilter;
    return okText && okRole;
  });
  const sorted = [...filtered].sort((a, b) => {
    const av = sortBy === 'name' ? norm(a.name) : sortBy === 'email' ? norm(a.email) : norm(a.role || 'user');
    const bv = sortBy === 'name' ? norm(b.name) : sortBy === 'email' ? norm(b.email) : norm(b.role || 'user');
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);
  const pageItems = sorted.slice(start, end);
  useEffect(() => { setPage(1); }, [query, roleFilter]);

  const toggleSort = (field) => {
    setSortBy(prev => {
      if (prev === field) { setSortDir(d => (d === 'asc' ? 'desc' : 'asc')); return prev; }
      setSortDir('asc');
      return field;
    });
  };
  const sortArrow = (field) => (sortBy === field ? (sortDir === 'asc' ? ' ^' : ' v') : '');

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
          <h2 style={{ marginTop: 8, marginBottom: 16 }}>Gestion de usuarios</h2>
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
            <div style={{ marginLeft:'auto', color:'#6b7280', fontSize:13 }}>Mostrando {total ? start+1 : 0}–{end} de {total}</div>
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
                <label>Contrasena {editingId ? '(dejar vacio para no cambiar)' : ''}</label>
                <input type="password" name="password" value={form.password} onChange={onChange} minLength={editingId ? 0 : 6} />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select name="role" value={form.role} onChange={onChange}>
                  {currentUser?.role === 'superadmin' && (<option value="superadmin">Super Admin</option>)}
                  <option value="admin">Administrador</option>
                  <option value="investigador">Investigador</option>
                  <option value="estudiante">Estudiante</option>
                </select>
              </div>
            </div>
            <div className={editingId ? 'button-row' : ''} style={{ marginTop: 8 }}>
              <button className="form-button" style={editingId ? { width: 'auto' } : undefined} disabled={loading}>
                {editingId ? 'Actualizar' : 'Crear'}
              </button>
              {editingId && (
                <button type="button" className="form-button secondary-button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <table className="table-clean" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', cursor:'pointer' }} onClick={()=>toggleSort('name')}>Nombre{sortArrow('name')}</th>
                <th style={{ textAlign: 'left', cursor:'pointer' }} onClick={()=>toggleSort('email')}>Email{sortArrow('email')}</th>
                <th style={{ textAlign: 'left', cursor:'pointer' }} onClick={()=>toggleSort('role')}>Rol{sortArrow('role')}</th>
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

          <div className="table-pagination" style={{ display:'flex', gap:8, justifyContent:'flex-end', alignItems:'center', marginTop: 10 }}>
            <button className="action-btn btn-compact" onClick={()=> setPage(p => Math.max(1, p-1))} disabled={safePage<=1}>Anterior</button>
            <span style={{ color:'#6b7280', fontSize:13 }}>Pagina {safePage} de {totalPages}</span>
            <button className="action-btn btn-compact" onClick={()=> setPage(p => Math.min(totalPages, p+1))} disabled={safePage>=totalPages}>Siguiente</button>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={()=>setConfirmOpen(false)}
        title={confirmCfg.title}
        message={confirmCfg.message}
        onConfirm={async ()=>{ try { await confirmCfg.onConfirm?.(); } finally { setConfirmOpen(false); } }}
        confirmText={confirmCfg.tone==='danger' ? 'Si, eliminar' : 'Confirmar'}
        cancelText="Cancelar"
        tone={confirmCfg.tone}
      />
    </div>
  );
};

export default AdminUsersPage;
