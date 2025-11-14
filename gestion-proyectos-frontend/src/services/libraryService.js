// src/services/libraryService.js
// Usa el apiClient con interceptor (añade Authorization automáticamente)
import API from './apiClient';

const BASE = '/library';

/* ============================================================
   Helpers
============================================================ */

// Genera un resultId estable si no vino desde el buscador
const makeResultId = (seed = '') => {
  try {
    let hash = 0;
    const s = String(seed);
    for (let i = 0; i < s.length; i++) {
      hash = (hash << 5) - hash + s.charCodeAt(i);
      hash |= 0; // to int32
    }
    return `res_${Math.abs(hash)}_${Date.now()}`;
  } catch {
    return `res_${Date.now()}`;
  }
};

// Detecta si una cadena parece un JWT (tres segmentos separados por '.')
const looksLikeJWT = (v) => {
  if (!v || typeof v !== 'string') return false;
  return v.split('.').length === 3 && v.length > 40;
};

/* ============================================================
   API
   Nota de compatibilidad:
   - Aceptamos firmas antiguas que pasaban "token" como primer argumento,
     o "token, search" (dos argumentos).
   - El interceptor ya mete Authorization, así que el token se ignora.
============================================================ */

// ---------- Upload PDF (multipart/form-data) ----------
export const uploadItem = async (formData /*, token */) => {
  const { data } = await API.post(`${BASE}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

// ---------- Get items (global del usuario) ----------
// Compat:
//   getItems(token)                <-- antiguo (solo token)
//   getItems(token, search)        <-- antiguo
//   getItems(search)               <-- nuevo
export const getItems = async (...args) => {
  let search = '';

  if (args.length === 2) {
    // (token, search)
    search = args[1] || '';
  } else if (args.length === 1) {
    // Puede ser (token) o (search)
    const a = args[0];
    if (!looksLikeJWT(a)) {
      search = a || '';
    } else {
      search = '';
    }
  } // 0 args => search ''

  const params = { search: search || undefined };
  const { data } = await API.get(`${BASE}`, { params });
  if (Array.isArray(data)) return data;           // compat antiguo
  if (data && Array.isArray(data.items)) return data.items; // nuevo formato { items, total, ... }
  return [];
};

// ---------- Delete item ----------
export const deleteItem = async (itemId /*, token */) => {
  const { data } = await API.delete(`${BASE}/${itemId}`);
  return data;
};

// ---------- Get items by project ----------
// Compat:
//   getItemsForProject(projectId, token)  <-- antiguo
//   getItemsForProject(projectId)         <-- nuevo
export const getItemsForProject = async (...args) => {
  // Siempre el primer argumento debe ser projectId; el token (si llega) se ignora
  const projectId = args[0];
  const { data } = await API.get(`${BASE}/project/${projectId}`);
  return data;
};

// ---------- Save suggestion (SerpAPI result) ----------
// Compat:
//   saveSuggestion(article)                        // sin proyecto
//   saveSuggestion(article, projectId)            // con proyecto (opcional)
//   saveSuggestion(article, projectId, token)     // token ignorado (compat)
export const saveSuggestion = async (articleData, projectId /*, token */) => {
  const title    = articleData?.title || 'Título no disponible';
  const link     = articleData?.link || articleData?.pdfUrl || '';
  const summary  = articleData?.summary || '';
  const resultId = articleData?.resultId || makeResultId(link || title);

  const tags = Array.isArray(articleData?.tags)
    ? articleData.tags
    : (articleData?.authors
        ? String(articleData.authors).split(',').map(s => s.trim()).filter(Boolean)
        : []);

  const payload = {
    title,
    summary,
    link,
    resultId,         // requerido por tu backend
    itemType: 'link',
    tags,
  };

  if (projectId) payload.projectId = projectId; // si tu modelo lo soporta

  try {
    const { data } = await API.post(`${BASE}/save-suggestion`, payload);
    return data;
  } catch (err) {
    // Fallback a endpoint legacy si no existiera
    if (err?.response?.status === 404) {
      const { data } = await API.post(`${BASE}`, payload);
      return data;
    }
    throw err;
  }
};

/* ============================================================
   Export default (compat con imports antiguos)
============================================================ */
const libraryService = {
  uploadItem,
  getItems,
  deleteItem,
  saveSuggestion,
  getItemsForProject,
};

export default libraryService;
