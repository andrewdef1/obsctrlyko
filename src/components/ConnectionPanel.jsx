import { useState, useEffect } from 'react';
import { useOBS } from '../hooks/useOBS';

const DEFAULT_HOST = 'ws://127.0.0.1';
const DEFAULT_PORT = '4455';
const LS_HOST = 'obs_host';
const LS_PORT = 'obs_port';

export default function ConnectionPanel({ onToast }) {
  const { status, connect, disconnect } = useOBS();
  const [host, setHost] = useState(() => localStorage.getItem(LS_HOST) || DEFAULT_HOST);
  const [port, setPort] = useState(() => localStorage.getItem(LS_PORT) || DEFAULT_PORT);
  const [password, setPassword] = useState('');
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  const handleConnect = async (e) => {
    e.preventDefault();
    localStorage.setItem(LS_HOST, host);
    localStorage.setItem(LS_PORT, port);
    try {
      await connect({ host, port, password });
      onToast('Connected to OBS successfully!', 'success');
    } catch (err) {
      onToast(err.message, 'error');
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    onToast('Disconnected from OBS.', 'info');
  };

  return (
    <div className="card connection-panel">
      <div className="connection-panel-header">
        <h3>Connection</h3>
      </div>

      {isHttps && !isConnected && (
        <div className="warning-banner" style={{ marginBottom: 14 }}>
          <span className="warning-banner-icon">⚠️</span>
          <span>
            You&apos;re on <strong>HTTPS</strong>. Browsers block <code>ws://</code> connections.
            Use <code>wss://</code> via a tunnel (e.g., Cloudflare), or open this app from <code>http://</code> locally.
            See README for tunnel setup.
          </span>
        </div>
      )}

      {!isConnected ? (
        <form className="connection-form" onSubmit={handleConnect}>
          <div className="connection-row">
            <div className="form-group">
              <label className="form-label" htmlFor="obs-host">Host / URL</label>
              <input
                id="obs-host"
                className="form-input"
                type="text"
                value={host}
                onChange={e => setHost(e.target.value)}
                placeholder="ws://127.0.0.1"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="obs-port">Port</label>
              <input
                id="obs-port"
                className="form-input"
                type="text"
                value={port}
                onChange={e => setPort(e.target.value)}
                placeholder="4455"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="obs-password">Password <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
            <input
              id="obs-password"
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Leave empty if not set"
              autoComplete="current-password"
            />
          </div>
          <button id="connect-btn" className="btn btn-primary" type="submit" disabled={isConnecting}>
            {isConnecting ? <><span className="spinner" /> Connecting…</> : <><span>⚡</span> Connect</>}
          </button>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ padding: '10px 12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 2 }}>Connected to</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--accent)' }}>
              {host}:{port}
            </div>
          </div>
          <button id="disconnect-btn" className="btn btn-danger" onClick={handleDisconnect}>
            <span>⏏</span> Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
