import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import libraryService from '../services/libraryService';
import { FaFileUpload, FaBookOpen } from 'react-icons/fa';
import { useToast } from '../components/common/ToastProvider';
import ConfirmModal from '../components/common/ConfirmModal';
import './LibraryPage.css';

const UploadForm = ({ onUploadSuccess }) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useContext(AuthContext);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pdfFile) { setError('Por favor, selecciona un archivo PDF.'); return; }
    setIsSubmitting(true);
    setError('');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('summary', summary);
    formData.append('tags', tags);
    formData.append('itemType', 'pdf');
    formData.append('pdfFile', pdfFile);

    try {
      const newItem = await libraryService.uploadItem(formData, user?.token);
      onUploadSuccess(newItem);
      toast?.success('PDF guardado en tu biblioteca');
      setTitle('');
      setSummary('');
      setTags('');
      setPdfFile(null);
      e.target.reset();
    } catch (err) {
      const message = 'Error al subir el archivo: ' + (err?.response?.data?.message || err.message);
      setError(message);
      toast?.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card-body">
      {error && <p className="form-error">{error}</p>}
      <div className="form-group">
        <label>Título (opcional)</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Resumen</label>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)}></textarea>
      </div>
      <div className="form-group">
        <label>Etiquetas (separadas por coma)</label>
        <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="react, mongodb, ia" />
      </div>
      <div className="form-group">
        <label>Archivo PDF *</label>
        <input type="file" onChange={(e) => setPdfFile(e.target.files[0])} required accept=".pdf" />
      </div>
      <button type="submit" className="upload-button" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando…' : 'Guardar en Biblioteca'}
      </button>
    </form>
  );
};

const LibraryPage = () => {
  const [libraryItems, setLibraryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmCfg, setConfirmCfg] = useState({ title: '', message: '', confirmText: 'Confirmar', cancelText: 'Cancelar', tone: 'default', onConfirm: null });
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const debounceRef = useRef(null);
  const userToken = user?.token;

  const fetchItems = useCallback(async (term = '') => {
    if (!userToken) return;
    setIsLoading(true);
    setError('');
    try {
      const items = await libraryService.getItems(term.trim());
      setLibraryItems(Array.isArray(items) ? items : []);
    } catch (e) {
      console.error('Library fetch error:', e);
      setError('No se pudo cargar tu biblioteca.');
      setLibraryItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [userToken]);

  useEffect(() => {
    fetchItems('');
  }, [fetchItems]);

  useEffect(() => {
    if (!userToken) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchItems(searchTerm);
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, userToken, fetchItems]);

  const handleUploadSuccess = async (newItem) => {
    const matchesFilter =
      !searchTerm ||
      newItem?.title?.toLowerCase?.().includes?.(searchTerm.toLowerCase());

    if (matchesFilter) {
      setLibraryItems(prev => [newItem, ...prev]);
    }

    await fetchItems('');
    setSearchTerm('');
  };

  const performDelete = async (itemId) => {
    setDeletingId(itemId);
    try {
      await libraryService.deleteItem(itemId);
      setLibraryItems(prev => prev.filter((item) => item._id !== itemId));
      toast?.success('Recurso eliminado');
    } catch (err) {
      console.error('Library delete error:', err);
      toast?.error('No se pudo eliminar el recurso');
    } finally {
      setDeletingId(null);
    }
  };

  const requestDelete = (item) => {
    setConfirmCfg({
      title: 'Eliminar recurso',
      message: `¿Eliminar "${item.title || 'este recurso'}" de forma permanente?`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      tone: 'danger',
      onConfirm: async () => {
        await performDelete(item._id);
        setConfirmOpen(false);
      }
    });
    setConfirmOpen(true);
  };

  return (
    <div className="library-page">
      <h2>Mi Biblioteca Personal</h2>

      <div className="library-container">
        <div className="library-form-column">
          <div className="content-card">
            <div className="card-header">
              <FaFileUpload />
              <h3>Añadir Nuevo PDF</h3>
            </div>
            <UploadForm onUploadSuccess={handleUploadSuccess} />
          </div>
        </div>

        <div className="library-list-column">
          <div className="content-card">
            <div className="card-header">
              <FaBookOpen />
              <h3>Recursos Guardados</h3>
            </div>

            <div className="card-body">
              <input
                type="text"
                placeholder="Buscar en la biblioteca…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="library-search-input"
              />

              {isLoading && <p>Buscando…</p>}
              {!isLoading && error && <p className="form-error">{error}</p>}

              {!isLoading && !error && (
                <>
                  {libraryItems.length === 0 ? (
                    <p>No se encontraron resultados para "{searchTerm}" o tu biblioteca está vacía.</p>
                  ) : (
                    <ul className="resource-list">
                      {libraryItems.map((item) => (
                        <li key={item._id} className="resource-list-item">
                          <div>
                            <h4>{item.title}</h4>
                            <p>{item.summary || 'Sin resumen.'}</p>

                            {item.tags && item.tags.length > 0 && (
                              <div className="tags-container">
                                {item.tags.map((tag, index) => (
                                  <span key={index} className="tag-item">{tag}</span>
                                ))}
                              </div>
                            )}

                            <div className="resource-actions">
                              {item.link && (
                                <a
                                  href={item.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="resource-action-button"
                                >
                                  Abrir recurso
                                </a>
                              )}
                              <button
                                type="button"
                                className="resource-delete-button"
                                onClick={() => requestDelete(item)}
                                disabled={deletingId === item._id}
                              >
                                {deletingId === item._id ? 'Eliminando…' : 'Eliminar'}
                              </button>
                            </div>
                          </div>

                          <div className="resource-type-chip">
                            {item.itemType}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={confirmCfg.title}
        message={confirmCfg.message}
        confirmText={confirmCfg.confirmText}
        cancelText={confirmCfg.cancelText}
        tone={confirmCfg.tone}
        onConfirm={confirmCfg.onConfirm}
      />
    </div>
  );
};

export default LibraryPage;