import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

const STYLES = {
  success: 'border-[#00ff88]/40 bg-[#00ff88]/10 text-[#00ff88]',
  error:   'border-[#ff3b5c]/40 bg-[#ff3b5c]/10 text-[#ff3b5c]',
  info:    'border-[#38bdf8]/40 bg-[#38bdf8]/10 text-[#38bdf8]',
};

const ICONS = { success: '✓', error: '✗', info: 'ℹ' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const toast = useCallback((type, message) => {
    const id = `t${++counter.current}`;
    setToasts(ts => [...ts, { id, type, message }]);
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-md border font-mono text-xs
                        shadow-xl max-w-xs ${STYLES[t.type]}`}
            style={{ animation: 'slideUp 0.3s ease' }}
          >
            <span className="shrink-0 font-bold">{ICONS[t.type]}</span>
            <span className="leading-relaxed opacity-90">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
