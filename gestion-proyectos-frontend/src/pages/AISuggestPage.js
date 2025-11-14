import React from 'react';
import ArticleSuggester from '../components/ai/ArticleSuggester';
import './DashboardPage.css';
import './Form.css';

const AISuggestPage = () => (
  <div className="dashboard-content">
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div className="form-container center-eq-sidebar" style={{ width: '100%', maxWidth: 1100, margin: '3rem auto' }}>
        <h2 style={{ marginTop: 8, marginBottom: 8 }}>Sugerir artículos</h2>
        <p style={{ marginTop: 0, marginBottom: 20, color: '#6b7280', textAlign: 'center' }}>
          Encuentra artículos recientes según tu tema de investigación.
        </p>
        <div className="suggester-widget">
          <ArticleSuggester />
        </div>
      </div>
    </div>
  </div>
);

export default AISuggestPage;

