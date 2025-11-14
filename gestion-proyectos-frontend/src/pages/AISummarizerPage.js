import React from 'react';
import Summarizer from '../components/ai/Summarizer';
import './DashboardPage.css';

const AISummarizerPage = () => (
  <div className="dashboard-content">
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>Generar resumen</h2>
          <p style={{ margin: '6px 0 0 0', color: '#6b7280' }}>Pega o escribe el texto y obtén un resumen claro y conciso.</p>
        </div>
      </div>
      <div className="summarizer-widget" style={{ background:'#fff', border:'1px solid var(--border-color)', borderRadius:8, padding:24, boxShadow:'var(--shadow)' }}>
        <Summarizer />
      </div>
    </div>
  </div>
);

export default AISummarizerPage;
