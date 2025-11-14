import React, { useState } from 'react';
import SummaryCard from './SummaryCard';
import { aiSummarizeText } from '../../services/aiService';

export default function Summarizer() {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [model, setModel] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const resp = await aiSummarizeText({ text: inputText });
      setSummary(resp.summary || '');
      setModel(resp.model || '');
    } catch (err) {
      console.error('Error al resumir:', err);
      setSummary('⚠️ Ocurrió un error al generar el resumen.');
    } finally {
      setLoading(false);
    }
  };

  const showCard = loading || (summary && summary.trim().length > 0);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <textarea
        rows={8}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Pega aqu� el texto que deseas resumir..."
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid #d1d5db',
          marginBottom: '10px',
          fontSize: '0.95rem',
        }}
      />

      <button
        onClick={handleSummarize}
        disabled={loading || !inputText.trim()}
        style={{
          padding: '10px 20px',
          borderRadius: '6px',
          border: '1px solid #1d4ed8',
          background: '#2563eb',
          color: 'white',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
      >
        {loading ? 'Generando...' : 'Resumir'}
      </button>

      {showCard && (
        <SummaryCard
          title="Resumen Generado"
          summary={summary}
          model={model}
          isLoading={loading}
          onRegenerate={handleSummarize}
        />
      )}
    </div>
  );
}

