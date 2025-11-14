// backend/controllers/aiController.js
// Controlador con @google/genai (propiedad response.text en lugar de función)

const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');
const MetricEvent = require('../models/metricEventModel');

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const pickModel = (purpose = 'text') => {
  if (purpose === 'chat') return process.env.GEMINI_MODEL_CHAT || 'gemini-2.5-flash';
  return process.env.GEMINI_MODEL_TEXT || 'gemini-2.5-flash';
};

const safeErrorPayload = (err) => ({
  status: err?.status,
  code: err?.code,
  message: err?.message,
  data: err?.response?.data,
});

const withRetry = async (fn, { retries = 2, baseDelayMs = 400 } = {}) => {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); }
    catch (err) {
      lastErr = err;
      const status = err?.status || err?.code;
      if (status === 429 || status === 'RESOURCE_EXHAUSTED') {
        await new Promise(r => setTimeout(r, baseDelayMs * (i + 1)));
        continue;
      }
      break;
    }
  }
  throw lastErr;
};

// --- Extractor robusto por si no viene response.text directamente ---
const extractText = (resp) => {
  if (!resp) return '';
  if (typeof resp.text === 'string' && resp.text.trim()) return resp.text; // <- propiedad, no función
  // Fallback: intenta armar texto desde candidates/parts
  const cands = Array.isArray(resp.candidates) ? resp.candidates : [];
  const parts = cands.flatMap(c => (c?.content?.parts || []));
  const texts = parts.map(p => p?.text).filter(Boolean);
  return texts.join('\n').trim();
};

// ----------------------
// 1) Resumen de TEXTO
// ----------------------
// POST /api/ai/summarize  { text, prompt? }
const summarizeText = async (req, res) => {
  try {
    const { text, prompt } = req.body || {};
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ message: 'text requerido' });
    }

    const model = pickModel('text');
    const userPrompt =
      (prompt && String(prompt).trim()) ||
      'Resume el texto en 7 viñetas claras con: objetivo, método, hallazgos, limitaciones y 3 citas textuales breves.';

    const exec = () => ai.models.generateContent({
      model,
      contents: [
        { role: 'user', parts: [{ text: `Texto a resumir:\n${text}` }] },
        { role: 'user', parts: [{ text: userPrompt }] },
      ],
      generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
    });
    // Enfoque rápido: límite duro de ~2.8s para el 80%
    const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 12000);
    const resp = await Promise.race([
      withRetry(exec),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ]);
    const summary = extractText(resp);
    // Registrar evento de resumen generado
    try {
      await MetricEvent.create({ user: req.user?._id, type: 'summary_generated', meta: { model } });
    } catch (e) { /* no bloquear por métricas */ }
    return res.json({ summary, model });
  } catch (err) {
    console.error('Gemini summarizeText error:', safeErrorPayload(err));
    const code = err?.message === 'timeout' ? 504 : 500;
    res.status(code);
    return res.json({
      message: err?.message === 'timeout' ? 'La generación tomó demasiado tiempo. Intenta con menos texto o vuelve a intentarlo.' : 'Error al contactar la API de Google AI (Summarize)',
      ...safeErrorPayload(err),
    });
  }
};

// ----------------------
// 2) Chatbot
// ----------------------
// POST /api/ai/chat  { message, history? }
const handleChat = async (req, res) => {
  try {
    const { message, history = [] } = req.body || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'message requerido' });
    }

    const model = pickModel('chat');
    const mappedHistory = Array.isArray(history)
      ? history.map(m => ({
          role: m.role === 'model' ? 'model' : 'user',
          parts: [{ text: String(m.content || '') }],
        }))
      : [];

    const exec = () => ai.models.generateContent({
      model,
      contents: [
        ...mappedHistory,
        { role: 'user', parts: [{ text: message }] },
      ],
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
    });
    const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 12000);
    const resp = await Promise.race([
      withRetry(exec),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ]);
    const text = extractText(resp);
    return res.json({ text, model });
  } catch (err) {
    console.error('Gemini chat error:', safeErrorPayload(err));
    const code = err?.message === 'timeout' ? 504 : 500;
    res.status(code);
    return res.json({
      message: err?.message === 'timeout' ? 'La respuesta del chat tomó demasiado tiempo, intenta de nuevo.' : 'Error al contactar la API de Google AI (Chat)',
      ...safeErrorPayload(err),
    });
  }
};

// ----------------------
// 3) Sugerir artículos (SerpAPI)
// ----------------------
// Acepta ambos formatos de body:
//   { query, yearFrom?, num? }  <-- nuevo
//   { query, year? }            <-- legacy: "5" significa últimos 5 años
const suggestArticles = async (req, res) => {
  try {
    let { query, yearFrom, year, num = 5 } = req.body || {};
    if (!query || !query.trim()) {
      return res.status(400).json({ message: 'query requerido' });
    }
    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Falta SERPAPI_API_KEY en el backend' });
    }

    // Compatibilidad: si llega "year" (cantidad de años), lo convertimos a as_ylo
    if (!yearFrom && year) {
      const n = Number(year);
      if (Number.isFinite(n) && n > 0) {
        const now = new Date().getFullYear();
        yearFrom = now - n + 1; // últimos n años (incluye el actual)
      }
    }

    const params = { engine: 'google_scholar', q: query, api_key: apiKey };
    if (yearFrom && Number(yearFrom)) params.as_ylo = Number(yearFrom);

    const { data } = await axios.get('https://serpapi.com/search.json', { params, timeout: 2000 });

    if (data?.error) {
      console.error('SerpAPI error:', data.error);
      return res.status(502).json({ message: `SerpAPI: ${data.error}` });
    }

    const items = Array.isArray(data?.organic_results) ? data.organic_results : [];
    if (items.length === 0) {
      return res.json({ results: [] });
    }

    const mapped = items.slice(0, Number(num) || 5).map((it, idx) => {
      const title = it.title || '';
      const link = it.link || '';
      const snippet = it.snippet || it.publication_info?.summary || '';
      const authorsArr = it.publication_info?.authors?.map(a => a?.name).filter(Boolean) || [];
      const authors = authorsArr.join(', ');

      let yearGuess = null;
      const summary = it.publication_info?.summary || '';
      const m = /\((\d{4})\)/.exec(summary);
      if (m) yearGuess = m[1];

      // PDF si viene en resources
      let pdfUrl = null;
      const resources = Array.isArray(it.resources) ? it.resources : [];
      const pdfRes = resources.find(r => (r.file_format || '').toLowerCase() === 'pdf' && r.link);
      if (pdfRes?.link) pdfUrl = pdfRes.link;

      // resultId para que el frontend pueda marcar "Guardado"
      const resultId = it.result_id || it.position || `res_${idx}_${Date.now()}`;

      // Estructura compatible con tu UI actual
      return {
        resultId,
        title,
        link: link || pdfUrl || '',
        authors,
        summary: snippet,
        year: yearGuess,
        pdfUrl: pdfUrl || null,
      };
    });

    return res.json({ results: mapped });
  } catch (err) {
    console.error('SerpAPI suggestArticles error:', safeErrorPayload(err));
    const status = err?.response?.status;
    const code = (status && status >= 400 && status < 600) ? 502 : 500;
    return res.status(code).json({
      message: 'Error al consultar SerpAPI (Google Scholar)',
    });
  }
};

module.exports = {
  summarizeText,
  handleChat,
  suggestArticles,
};
