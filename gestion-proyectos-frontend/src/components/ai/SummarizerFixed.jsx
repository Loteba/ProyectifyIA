import React, { useState } from 'react';
import SummaryCard from './SummaryCard';
import { aiSummarizeText } from '../../services/aiService';
import { useToast } from '../common/ToastProvider';
import '../../pages/Form.css';

export default function SummarizerFixed() {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [model, setModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [lengthOpt, setLengthOpt] = useState('medio'); // breve|medio|detallado
  const [toneOpt, setToneOpt] = useState('neutral');   // neutral|academico|divulgativo
  const [useChunk, setUseChunk] = useState(false);     // dividir por párrafos
  const [chars, setChars] = useState(0);
  const toast = useToast();

  const maxChars = 8000;
  const nearLimit = chars > maxChars * 0.9;
  const overLimit = chars > maxChars;

  const handleSummarize = async () => {
    if (!inputText.trim() || overLimit) return;
    setLoading(true);
    try {
      const promptPieces = [];
      if (lengthOpt === 'breve') promptPieces.push('en 4 a 6 viñetas');
      if (lengthOpt === 'medio') promptPieces.push('en 6 a 9 viñetas');
      if (lengthOpt === 'detallado') promptPieces.push('con viñetas y un párrafo final de conclusiones');
      if (toneOpt === 'academico') promptPieces.push('tono académico, preciso');
      if (toneOpt === 'divulgativo') promptPieces.push('tono divulgativo y claro para público general');
      const userPrompt = `Resume el texto ${promptPieces.join(', ')}. Incluye: objetivo, método, hallazgos, limitaciones y 2-3 citas textuales.`;
      const callOnce = async (text) => {
        const resp = await aiSummarizeText({ text, prompt: userPrompt });
        return resp;
      };

      let finalSummary = '';
      let lastModel = '';

      if (useChunk || inputText.length > 3000) {
        // dividir por dobles saltos de línea o cada ~1800-2200 caracteres
        const parts = inputText.split(/\n\s*\n/).filter(Boolean);
        const chunks = [];
        let current = '';
        for (const p of parts) {
          if ((current + '\n\n' + p).length > 2000) {
            if (current) chunks.push(current);
            current = p;
          } else {
            current = current ? current + '\n\n' + p : p;
          }
        }
        if (current) chunks.push(current);

        const results = [];
        for (const [idx, ch] of chunks.entries()) {
          try {
            const r = await callOnce(ch);
            results.push(`Sección ${idx + 1}:
${r.summary || ''}`);
            lastModel = r.model || lastModel;
          } catch (e) {
            // intento breve de reintento
            try {
              const r2 = await callOnce(ch.slice(0, Math.min(1500, ch.length)));
              results.push(`Sección ${idx + 1} (parcial):
${r2.summary || ''}`);
              lastModel = r2.model || lastModel;
            } catch {
              results.push(`Sección ${idx + 1}: (error al resumir)`);
            }
          }
        }
        finalSummary = results.join('\n\n');
      } else {
        const resp = await callOnce(inputText);
        finalSummary = resp.summary || '';
        lastModel = resp.model || '';
      }

      setSummary(finalSummary);
      setModel(lastModel);
    } catch (err) {
      console.error('Error al resumir:', err);
      setSummary('⚠️ Ocurrió un error al generar el resumen.');
    } finally {
      setLoading(false);
    }
  };

  const showCard = loading || (summary && summary.trim().length > 0);

  const onChangeText = (v) => { setInputText(v); setChars(v.length); };

  const onCopy = async () => {
    try { await navigator.clipboard.writeText(summary || ''); toast?.success('Resumen copiado'); }
    catch { toast?.error('No se pudo copiar'); }
  };

  const onDownload = () => {
    try {
      const blob = new Blob([summary || ''], { type: 'text/markdown;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'resumen.md';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {}
  };


  return (
    <div style={{ width: '100%' }}>
      {/* Opciones arriba */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', marginBottom: 12 }}>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          <div>
            <label style={{ fontSize:12, color:'#6b7280' }}>Longitud</label>
            <select value={lengthOpt} onChange={(e)=>setLengthOpt(e.target.value)} style={{ padding:'6px 10px', border:'1px solid var(--border-color)', borderRadius:6 }}>
              <option value="breve">Breve</option>
              <option value="medio">Medio</option>
              <option value="detallado">Detallado</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize:12, color:'#6b7280' }}>Tono</label>
            <select value={toneOpt} onChange={(e)=>setToneOpt(e.target.value)} style={{ padding:'6px 10px', border:'1px solid var(--border-color)', borderRadius:6 }}>
              <option value="neutral">Neutral</option>
              <option value="academico">Académico</option>
              <option value="divulgativo">Divulgativo</option>
            </select>
          </div>
        </div>
        <label style={{ display:'inline-flex', alignItems:'center', gap:8, fontSize:12, color:'#6b7280' }}>
          <input type="checkbox" checked={useChunk} onChange={(e)=>setUseChunk(e.target.checked)} />
          Dividir por párrafos
        </label>
        <div style={{ fontSize: 12, color: overLimit? '#b91c1c' : nearLimit? '#b45309' : '#6b7280' }}>
          {chars.toLocaleString()} / {maxChars.toLocaleString()} caracteres
        </div>
      </div>

      {/* Grid: entrada | resultado */}
      <div style={{ display:'grid', gridTemplateColumns: showCard ? '1fr 1fr' : '1fr', gap: 16 }}>
        <div>
          <div className="form-group">
            <label>Texto a resumir</label>
            <textarea
              rows={12}
              value={inputText}
              onChange={(e) => onChangeText(e.target.value)}
              placeholder="Pega aquí el texto que deseas resumir..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
            />
            {overLimit && (
              <div style={{ marginTop:6, fontSize:12, color:'#b91c1c' }}>El texto es muy largo. Considera dividirlo por secciones.</div>
            )}
          </div>
        </div>

        {showCard && (
          <div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginBottom: 8, position:'sticky', top: 0 }}>
              <button className="action-btn" onClick={onCopy}>Copiar</button>
              <button className="action-btn" onClick={onDownload}>Descargar .md</button>
              
            </div>
            <SummaryCard
              title="Resumen generado"
              summary={summary}
              model={model}
              isLoading={loading}
              onRegenerate={handleSummarize}
            />
          </div>
        )}
      </div>

      {/* Barra inferior */}
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button
          onClick={handleSummarize}
          disabled={loading || !inputText.trim() || overLimit}
          className="form-button"
          style={{ width: 'auto', padding: '10px 20px' }}
        >
          {loading ? 'Generando...' : 'Resumir'}
        </button>
        <button onClick={()=>{ setSummary(''); }} className="action-btn" style={{ marginLeft: 8 }}>Limpiar resultado</button>
      </div>
    </div>
  );
}
