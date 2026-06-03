import { useOBS } from '../hooks/useOBS';

export default function StatusBar() {
  const { status, obsVersion } = useOBS();

  const labels = {
    disconnected: 'Not connected',
    connecting:   'Connecting…',
    connected:    'Connected',
    error:        'Connection error',
  };

  return (
    <div className="status-bar">
      <div className={`status-dot ${status}`} />
      <span className="status-text">{labels[status] ?? status}</span>
      {obsVersion && (
        <span className="status-obs-version">OBS {obsVersion}</span>
      )}
    </div>
  );
}
