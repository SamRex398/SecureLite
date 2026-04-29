import { useState, useEffect, useCallback, useRef } from 'react';
import { request } from '../../lib/api';

const TERMINAL = new Set(['done', 'failed']);

// ── Health ────────────────────────────────────────────────────────────────────
export function useHealth() {
  const [status, setStatus] = useState('checking');
  const [service, setService] = useState('');

  useEffect(() => {
    request('/health')
      .then(r => { setStatus('ok'); setService(r.service || ''); })
      .catch(() => setStatus('offline'));
  }, []);

  return { status, service };
}

// ── History ───────────────────────────────────────────────────────────────────
export function useScanHistory(limit = 10) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await request(`/scan/history?limit=${limit}`);
      setData(res.data || []);
    } catch (e) {
      setError(e.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  return { data, loading, error, refetch: fetchHistory };
}

// ── Scan detail with polling ───────────────────────────────────────────────────
export function useScan(scanId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  const fetchScan = useCallback(async (id) => {
    try {
      const res = await request(`/scan/${id}`);
      const scan = res.data;
      if (scan) setData(scan);
      return scan;
    } catch (e) {
      setError(e.message || 'Failed to load scan');
      return null;
    }
  }, []);

  useEffect(() => {
    if (!scanId) { setData(null); return; }

    setLoading(true);
    setError(null);

    const run = async () => {
      const scan = await fetchScan(scanId);
      setLoading(false);
      if (!scan || TERMINAL.has(scan.status)) return;
      timerRef.current = setTimeout(run, 4000);
    };

    run();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scanId, fetchScan]);

  return { data, loading, error };
}

// ── Create scan ───────────────────────────────────────────────────────────────
export function useCreateScan() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createScan = useCallback(async (target) => {
    setLoading(true);
    setError(null);
    try {
      const res = await request('/scan', {
        method: 'POST',
        body: JSON.stringify({ target }),
      });
      return res.data;
    } catch (e) {
      setError(e.message || 'Scan failed to queue');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createScan, loading, error, clearError: () => setError(null) };
}
