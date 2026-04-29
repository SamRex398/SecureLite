import { ToastProvider } from './components/ui/Toast';
import AppHeader from './components/ui/AppHeader';
import Dashboard from './pages/Dashboard';
import { useHealth } from './features/scans/hooks';

function AppInner() {
  const { status, service } = useHealth();

  return (
    <div className="min-h-screen">
      <AppHeader health={status} service={service} />
      {status === 'offline' && (
        <div className="bg-[#ff3b5c]/10 border-b border-[#ff3b5c]/30 px-4 py-2 text-center">
          <span className="font-mono text-xs text-[#ff3b5c]">
            ⚠ API is unreachable — verify your connection or{' '}
            <code className="bg-[#ff3b5c]/10 px-1 rounded">VITE_API_BASE_URL</code>
          </span>
        </div>
      )}
      <Dashboard />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
