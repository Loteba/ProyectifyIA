import React, { useCallback, useEffect, useMemo, useState } from 'react';
import API from '../services/apiClient';
import './DashboardPage.css';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, BarChart, Bar, AreaChart, Area } from 'recharts';

const PAGE_SIZE = 10;

const SuperAdminPage = () => {
  const [overview, setOverview] = useState({ projects: 0, papers: 0, summaries: 0 });
  const [series, setSeries] = useState([]);
  const [logs, setLogs] = useState([]);
  const [err, setErr] = useState('');

  // controls
  const [days, setDays] = useState(30);
  const [auditQuery, setAuditQuery] = useState('');
  const [auditPage, setAuditPage] = useState(1);

  const load = useCallback(async () => {
    setErr('');
    try {
      const ov = await API.get('/admin/metrics/overview');
      setOverview(ov.data || { projects: 0, papers: 0, summaries: 0 });
      const ts = await API.get(`/admin/metrics/timeseries?days=${days}`);
      setSeries(ts.data?.data || []);
      const al = await API.get('/superadmin/audit-logs');
      setLogs(Array.isArray(al.data) ? al.data : []);
    } catch {
      setErr('No se pudo cargar la informacion');
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  // filter + paginate audit logs
  const norm = (s) => String(s || '').toLowerCase();
  const filteredLogs = useMemo(() => {
    if (!auditQuery) return logs;
    const q = norm(auditQuery);
    return logs.filter(l =>
      norm(l.actor?.name).includes(q) ||
      norm(l.actor?.email).includes(q) ||
      norm(l.targetUser?.name).includes(q) ||
      norm(l.targetUser?.email).includes(q) ||
      norm(l.oldRole).includes(q) ||
      norm(l.newRole).includes(q)
    );
  }, [logs, auditQuery]);

  const total = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(auditPage, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);
  const pageItems = filteredLogs.slice(start, end);
  useEffect(() => { setAuditPage(1); }, [auditQuery]);

  // series derivadas para mas graficos
  const totalSeries = useMemo(() => (series || []).map(d => ({
    date: d.date,
    total: (d.projects || 0) + (d.papers || 0) + (d.summaries || 0),
    projects: d.projects || 0,
    papers: d.papers || 0,
    summaries: d.summaries || 0,
  })), [series]);

  return (
    <div className="dashboard-content">
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div className="form-container center-eq-sidebar" style={{ width: '100%', maxWidth: 1100, margin: '2rem auto' }}>
          <h2 style={{ marginTop: 8, marginBottom: 16 }}>Super Admin</h2>

          {err && (
            <div style={{ background:'#fef2f2', color:'#991b1b', border:'1px solid #fecaca', padding:'8px 12px', borderRadius:6, marginBottom: 12 }}>{err}</div>
          )}

          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 16, marginBottom: 16 }}>
            <div className="card-metric"><div className="metric-number">{overview.projects}</div><div className="metric-label">Proyectos</div></div>
            <div className="card-metric"><div className="metric-number">{overview.papers}</div><div className="metric-label">Papers</div></div>
            <div className="card-metric"><div className="metric-number">{overview.summaries}</div><div className="metric-label">Resumenes</div></div>
          </div>

          {/* Grafico principal */}
          <div className="card-metric" style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Actividad (ultimos dias)</h3>
              <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                <label style={{ fontSize: 13, color:'#6b7280' }}>Rango</label>
                <select value={days} onChange={(e)=>setDays(Number(e.target.value))} style={{ padding:'6px 10px', border:'1px solid var(--border-color)', borderRadius:6 }}>
                  <option value={7}>7</option>
                  <option value={30}>30</option>
                  <option value={90}>90</option>
                </select>
              </div>
            </div>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={series} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip /><Legend />
                  <Line type="monotone" dataKey="projects" name="Proyectos" stroke="#2980b9" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="papers" name="Papers" stroke="#27ae60" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="summaries" name="Resumenes" stroke="#8e44ad" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Graficos adicionales */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0,1fr))', gap: 16, marginBottom: 16 }}>
            <div className="card-metric" style={{ padding: 16 }}>
              <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 18 }}>Distribucion por tipo</h3>
              <div style={{ width:'100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={totalSeries} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip /><Legend />
                    <Bar dataKey="projects" name="Proyectos" stackId="a" fill="#2980b9" />
                    <Bar dataKey="papers" name="Papers" stackId="a" fill="#27ae60" />
                    <Bar dataKey="summaries" name="Resumenes" stackId="a" fill="#8e44ad" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card-metric" style={{ padding: 16 }}>
              <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 18 }}>Actividad total</h3>
              <div style={{ width:'100%', height: 260 }}>
                <ResponsiveContainer>
                  <AreaChart data={totalSeries} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="total" name="Total" stroke="#2563eb" fillOpacity={1} fill="url(#gradTotal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Auditoria */}
          <div className="card-metric" style={{ padding: 16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom: 10, flexWrap:'wrap' }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Auditoria de cambios de rol</h3>
              <div style={{ marginLeft: 'auto', display:'flex', gap: 8, alignItems:'center' }}>
                <input placeholder="Buscar (actor, objetivo, rol)" value={auditQuery} onChange={(e)=>setAuditQuery(e.target.value)}
                       style={{ padding:'6px 10px', border:'1px solid var(--border-color)', borderRadius: 6, minWidth: 280 }} />
              </div>
            </div>

            <div style={{ overflowX:'auto' }}>
              <table className="table-clean audit-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th className="col-date">Fecha</th>
                    <th>Actor</th>
                    <th>Objetivo</th>
                    <th className="col-change">Cambio</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map(l => (
                    <tr key={l._id}>
                      <td className="col-date">{new Date(l.createdAt).toLocaleString()}</td>
                      <td>{l.actor?.name} ({l.actor?.email})</td>
                      <td>{l.targetUser?.name} ({l.targetUser?.email})</td>
                      <td className="col-change">{l.oldRole} → {l.newRole}</td>
                    </tr>
                  ))}
                  {!pageItems.length && (
                    <tr><td colSpan={4} style={{ textAlign:'center', color:'#6b7280', padding:'12px 0' }}>Sin resultados</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-pagination" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop: 10 }}>
              <div style={{ color:'#6b7280', fontSize: 13 }}>Mostrando {total ? start + 1 : 0}–{end} de {total}</div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="form-button" type="button" onClick={()=>setAuditPage(p=>Math.max(1, p-1))} disabled={safePage<=1} style={{ width:'auto' }}>Anterior</button>
                <button className="form-button" type="button" onClick={()=>setAuditPage(p=>Math.min(totalPages, p+1))} disabled={safePage>=totalPages} style={{ width:'auto' }}>Siguiente</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPage;

