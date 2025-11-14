import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import aiService from '../../services/aiService';
import libraryService from '../../services/libraryService';
import Card from '../common/Card';
import { FaSearch, FaPlus, FaCheck, FaExternalLinkAlt } from 'react-icons/fa';
import './ArticleSuggester.css';

const ArticleSuggester = () => {
  const [query, setQuery] = useState('');
  const [year, setYear] = useState('5');
  const [articles, setArticles] = useState([]);
  const [savedArticles, setSavedArticles] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const { user } = useContext(AuthContext);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    setIsLoading(true);
    setHasSearched(true);
    setArticles([]);
    try {
      const results = await aiService.suggestArticles(query, year, user.token);
      setArticles(results);
    } catch (error) {
      console.error(error);
      alert('Hubo un error al buscar artículos. Revisa la consola.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (article) => {
    try {
      await libraryService.saveSuggestion(article, user.token);
      setSavedArticles((prev) => new Set(prev).add(article.resultId));
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'No se pudo guardar el artículo.');
    }
  };

  const renderResults = () => {
    if (isLoading) {
      return <p className="info-message">Buscando artículos relevantes...</p>;
    }
    if (hasSearched && articles.length === 0) {
      return <p className="info-message">No se encontraron resultados. Intenta con otros términos.</p>;
    }
    return articles.map((article) => (
      <div key={article.resultId} className="article-item">
        <h4>{article.title}</h4>
        <p className="authors">{article.authors}</p>
        <p className="summary">{article.summary}</p>
        <div className="article-actions">
          <a href={article.link} target="_blank" rel="noopener noreferrer" className="action-link">
            <FaExternalLinkAlt /> Leer
          </a>
          <button
            className="action-button"
            onClick={() => handleSave(article)}
            disabled={savedArticles.has(article.resultId)}
          >
            {savedArticles.has(article.resultId) ? (
              <>
                <FaCheck /> Guardado
              </>
            ) : (
              <>
                <FaPlus /> Guardar
              </>
            )}
          </button>
        </div>
      </div>
    ));
  };

  return (
    <Card title="Sugerencia de Artículos" icon={<FaSearch />}>
      <form onSubmit={handleSearch} className="suggester-form">
        <input
          className="search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Introduce tu tema de investigación..."
        />
        <select
          className="year-select"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        >
          <option value="1">Último año</option>
          <option value="3">Últimos 3 años</option>
          <option value="5">Últimos 5 años</option>
          <option value="10">Últimos 10 años</option>
          <option value="">Cualquier fecha</option>
        </select>
        <button type="submit" disabled={isLoading}>{isLoading ? '...' : <FaSearch />}</button>
      </form>
      <div className="article-results">{renderResults()}</div>
    </Card>
  );
};

export default ArticleSuggester;

