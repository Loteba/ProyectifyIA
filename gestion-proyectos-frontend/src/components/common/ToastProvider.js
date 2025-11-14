import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

let idSeq = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => setToasts((t) => t.filter(x => x.id !== id)), []);

  const push = useCallback((type, message, timeout = 3000) => {
    const id = ++idSeq;
    setToasts((t) => [...t, { id, type, message }]);
    if (timeout > 0) setTimeout(() => remove(id), timeout);
  }, [remove]);

  const api = useMemo(() => ({
    success: (m, timeout) => push('success', m, timeout),
    error: (m, timeout) => push('error', m, timeout),
    info: (m, timeout) => push('info', m, timeout),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 3000, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id}
               style={{
                 minWidth: 260,
                 maxWidth: 360,
                 background: t.type === 'success' ? '#ecfdf5' : t.type === 'error' ? '#fef2f2' : '#eff6ff',
                 color: t.type === 'success' ? '#065f46' : t.type === 'error' ? '#991b1b' : '#1e3a8a',
                 border: '1px solid ' + (t.type === 'success' ? '#a7f3d0' : t.type === 'error' ? '#fecaca' : '#bfdbfe'),
                 padding: '10px 14px',
                 borderRadius: 8,
                 boxShadow: '0 6px 20px rgba(0,0,0,0.12)'
               }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

