import React from 'react';
import SummarizerFixed from '../components/ai/SummarizerFixed.jsx';
import './DashboardPage.css';
import './Form.css';

const AISummarizerPageNew = () => (
  <div className="dashboard-content">
    <div style={{ display:'flex', justifyContent:'center', width:'100%' }}>
      <div className="form-container center-eq-sidebar" style={{ width: '100%', maxWidth: 1100, margin: '3rem auto' }}>
        <h2 style={{ marginTop: 8, marginBottom: 8 }}>Generar resumen</h2>
        <p style={{ marginTop: 0, marginBottom: 20, color: '#6b7280', textAlign: 'center' }}>
          Pega o escribe el texto y obtén un resumen claro y conciso.
        </p>
        <div className="summarizer-widget">
          <SummarizerFixed />
        </div>
      </div>
    </div>
  </div>
);

export default AISummarizerPageNew;
