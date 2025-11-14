import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Card from '../components/common/Card';
import API from '../services/apiClient';
import projectService from '../services/projectService';
import notificationService from '../services/notificationService';
import { FaProjectDiagram, FaArrowRight } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { LocaleContext } from '../i18n/LocaleContext';
import './DashboardPage.css';

const DashboardOverviewPage = () => {
  const [projectCount, setProjectCount] = useState(0);
  const [metrics, setMetrics] = useState({ projects: 0, papers: 0, summaries: 0 });
  const [series, setSeries] = useState([]);
  const [invitesCount, setInvitesCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const { user } = useContext(AuthContext);
  const { t } = useContext(LocaleContext);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      if (user.role === 'admin') {
        try {
          const res = await API.get('/admin/metrics/overview');
          setMetrics(res.data);
          setProjectCount(res.data?.projects ?? 0);
          const ts = await API.get('/admin/metrics/timeseries?days=30');
          setSeries(ts.data?.data || []);
        } catch {}
      } else {
        try {
          const res = await API.get('/metrics/overview');
          setMetrics(res.data);
          const ts = await API.get('/metrics/timeseries?days=30');
          setSeries(ts.data?.data || []);
          setProjectCount(res.data?.projects ?? 0);
        } catch {}
        try {
          const list = await projectService.listMyInvitations();
          setInvitesCount(Array.isArray(list) ? list.length : 0);
        } catch { setInvitesCount(0); }
        try {
          const notifs = await notificationService.list();
          setRecentNotifs(Array.isArray(notifs) ? notifs.slice(0, 3) : []);
        } catch { setRecentNotifs([]); }
        try {
          const resTasks = await API.get('/tasks/upcoming?days=7');
          const tasks = Array.isArray(resTasks?.data) ? resTasks.data.slice(0, 3) : [];
          setUpcomingTasks(tasks);
        } catch { setUpcomingTasks([]); }
      }
    };
    load();
  }, [user]);

  return (
    <div className="dashboard-wrap">
      <div className="dashboard-header">
        <h1>{t('common:dashboard')}</h1>
      </div>

      <div className="dashboard-grid overview-grid">
        <Card title={t('dashboard:fastStats')}>
          <div className="stat-card">
            <FaProjectDiagram size={40} className="stat-icon" />
            <div className="stat-info">
              <span className="stat-value">{projectCount}</span>
              <span className="stat-label">{t('dashboard:projectsActive')}</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 12 }}>
            <div className="card-metric"><div className="metric-number">{metrics.papers}</div><div className="metric-label">{t('dashboard:savedPapers')}</div></div>
            <div className="card-metric"><div className="metric-number">{metrics.summaries}</div><div className="metric-label">{t('dashboard:generatedSummaries')}</div></div>
          </div>
        </Card>

        {user?.role !== 'admin' && (
          <Card title={t('dashboard:personalSummary')}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 12 }}>
              <div className="card-metric"><div className="metric-number">{invitesCount}</div><div className="metric-label">{t('dashboard:invitationsPending')}</div></div>
            </div>
          </Card>
        )}

        {user?.role !== 'admin' && (
          <Card title={t('dashboard:recentActivity')}>
            {recentNotifs.length === 0 ? (
              <div style={{ color: '#6b7280' }}>{t('dashboard:noRecent')}</div>
            ) : (
              <ul className="notification-list compact">
                {recentNotifs.map(n => (
                  <li key={n._id} className={`notification-item ${n.read ? '' : 'unread'}`}>
                    <div className="notification-main">
                      <div className="notification-title" title={n.title}>{n.title}</div>
                      {n.body && (
                        <div className="notification-body" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                          {n.body}
                        </div>
                      )}
                      <div className="notification-meta">
                        {n.createdAt && <span>{new Date(n.createdAt).toLocaleString()}</span>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <Link to="/dashboard/notifications" className="action-btn btn-compact">{t('common:viewAll')}</Link>
            </div>
          </Card>
        )}

        {user?.role !== 'admin' && (
          <Card title={t('dashboard:tasksUpcoming7')}>
            {upcomingTasks.length === 0 ? (
              <div style={{ color: '#6b7280' }}>{t('dashboard:noUpcoming')}</div>
            ) : (
              <table className="table-clean" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>{t('dashboard:task')}</th>
                    <th style={{ textAlign: 'center' }}>{t('dashboard:dueDate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingTasks.map(tk => (
                    <tr key={tk._id || tk.id}>
                      <td>{tk.title || tk.name || t('dashboard:task')}</td>
                      <td style={{ textAlign: 'center' }}>{tk.dueDate ? new Date(tk.dueDate).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}

        {user?.role !== 'admin' && (
          <Card title={t('dashboard:progressLast30')}>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <LineChart data={series} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="papers" name="Papers" stroke="#27ae60" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="summaries" name={t('dashboard:generatedSummaries')} stroke="#8e44ad" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {user?.role === 'admin' && (
          <Card title={t('dashboard:progressLast30')}>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={series} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="projects" name="Proyectos" stroke="#2980b9" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="papers" name="Papers" stroke="#27ae60" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="summaries" name={t('dashboard:generatedSummaries')} stroke="#8e44ad" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Admin: gráficos adicionales basados en la misma serie */}
        {user?.role === 'admin' && (() => {
          const totalSeries = (series || []).map(d => ({
            date: d.date,
            total: (d.projects || 0) + (d.papers || 0) + (d.summaries || 0),
            projects: d.projects || 0,
            papers: d.papers || 0,
            summaries: d.summaries || 0,
          }));
          const totals = totalSeries.reduce((acc, d) => {
            acc.projects += d.projects; acc.papers += d.papers; acc.summaries += d.summaries; acc.total += d.total; return acc;
          }, { projects:0, papers:0, summaries:0, total:0 });
          const pieData = [
            { name: 'Proyectos', value: totals.projects, color: '#2980b9' },
            { name: 'Papers', value: totals.papers, color: '#27ae60' },
            { name: 'Resúmenes', value: totals.summaries, color: '#8e44ad' },
          ];
          const topDays = [...totalSeries].sort((a,b)=>b.total-a.total).slice(0,5);
          return (
            <>
              <Card title="Distribución por tipo (últimos 30 días)">
                <div style={{ width:'100%', height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={totalSeries} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip /><Legend />
                      <Bar dataKey="projects" name="Proyectos" stackId="a" fill="#2980b9" />
                      <Bar dataKey="papers" name="Papers" stackId="a" fill="#27ae60" />
                      <Bar dataKey="summaries" name="Resúmenes" stackId="a" fill="#8e44ad" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Actividad total">
                <div className="chart-fill">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={totalSeries} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="gradTotalDash" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="total" name="Total" stroke="#2563eb" fillOpacity={1} fill="url(#gradTotalDash)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Proporción por tipo">
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, alignItems:'center' }}>
                  <div style={{ width:'100%', maxWidth: 460, height: 320, margin:'0 auto' }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Tooltip />
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 8 }} />
                        <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={85}>
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <table className="table-clean" style={{ width:'100%' }}>
                      <thead>
                        <tr>
                          <th>Tipo</th>
                          <th style={{ textAlign:'right' }}>Total</th>
                          <th style={{ textAlign:'right' }}>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pieData.map(row => (
                          <tr key={row.name}>
                            <td>{row.name}</td>
                            <td style={{ textAlign:'right' }}>{row.value}</td>
                            <td style={{ textAlign:'right' }}>{totals.total ? Math.round((row.value/totals.total)*100) : 0}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>

              <Card title="Top días por actividad">
                {topDays.length ? (
                  <table className="table-clean" style={{ width:'100%' }}>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th style={{ textAlign:'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topDays.map(d => (
                        <tr key={d.date}>
                          <td>{d.date}</td>
                          <td style={{ textAlign:'right' }}>{d.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ color:'#6b7280' }}>Sin datos</div>
                )}
              </Card>
            </>
          );
        })()}

        <Card title={t('dashboard:quickActions')}>
          <div className="actions-card">
            <Link to="/dashboard/projects" className="action-link">
              <span>{t('dashboard:manageProjects')}</span>
              <FaArrowRight />
            </Link>
            <Link to="/dashboard/summarizer" className="action-link">
              <span>{t('dashboard:generateSummary')}</span>
              <FaArrowRight />
            </Link>
            <Link to="/dashboard/suggest" className="action-link">
              <span>{t('dashboard:suggestArticles')}</span>
              <FaArrowRight />
            </Link>
            {user?.role !== 'admin' && (
              <Link to="/dashboard/projects/invitations" className="action-link">
                <span>{t('dashboard:myInvitations')}</span>
                <FaArrowRight />
              </Link>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverviewPage;
