import React, { useEffect, useState } from 'react';
import API from '../services/apiClient';
import './DashboardPage.css';

const AdminMetricsPage = () => {
  const [data, setData] = useState({ projects: 0, papers: 0, summaries: 0 });
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const res = await API.get('/admin/metrics/overview');
      setData(res.data);
    } catch (e) {
      setError('No se pudieron cargar las métricas');
    }
  };

  useEffect(() => { load(); }, []);

  const onExport = async () => {
    try {
      const res = await API.get('/admin/metrics/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'metrics.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('No se pudo exportar');
    }
  };

  return (
    <div className="dashboard-content">
      <h2>Métricas de productividad</h2>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
        <div className="card-metric"><div className="metric-number">{data.projects}</div><div className="metric-label">Proyectos</div></div>
        <div className="card-metric"><div className="metric-number">{data.papers}</div><div className="metric-label">Papers guardados</div></div>
        <div className="card-metric"><div className="metric-number">{data.summaries}</div><div className="metric-label">Resúmenes generados</div></div>
      </div>
      <button className="form-button" style={{ width: 'auto' }} onClick={onExport}>Exportar métricas (CSV)</button>
    </div>
  );
};

export default AdminMetricsPage;

