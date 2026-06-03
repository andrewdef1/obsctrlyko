import { useState, useEffect, useRef, useCallback } from 'react';
import { useOBS } from '../hooks/useOBS';

export default function PreviewPanel({ sceneName }) {
  const { status, currentScene, getSourceScreenshot } = useOBS();
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fps, setFps] = useState(1);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);
  const activeTarget = useRef(null);

  const previewTarget = sceneName || currentScene;
  const isActive = previewTarget === currentScene;

  const doCapture = useCallback(async (target) => {
    if (!target || !mountedRef.current) return;
    try {
      const data = await getSourceScreenshot(target, 1280, 720);
      if (mountedRef.current) {
        setImgSrc(data);
        setError(null);
        setLoading(false);
      }
    } catch {
      if (mountedRef.current) {
        setError('Preview unavailable for this source');
        setLoading(false);
      }
    }
  }, [getSourceScreenshot]);

  // Start/stop polling
  useEffect(() => {
    mountedRef.current = true;
    clearInterval(intervalRef.current);

    if (status !== 'connected' || paused || !previewTarget) return;

    activeTarget.current = previewTarget;
    const ms = Math.round(1000 / fps);

    // Kick off first frame immediately inside the effect
    const run = () => { if (activeTarget.current) doCapture(activeTarget.current); };
    run();
    intervalRef.current = setInterval(run, ms);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [status, fps, paused, previewTarget, doCapture]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      clearInterval(intervalRef.current);
    };
  }, []);

  // Reset when scene changes (use transition to avoid setState-in-effect warning)
  const prevTarget = useRef(previewTarget);
  if (prevTarget.current !== previewTarget) {
    prevTarget.current = previewTarget;
    // These setState calls happen during render — safe here since they're
    // triggered by prop change (equivalent to getDerivedStateFromProps)
    setImgSrc(null);
    setError(null);
    setLoading(true);
  }

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    if (previewTarget) doCapture(previewTarget);
  };

  return (
    <div className="card preview-panel">
      <div className="preview-header">
        <div className="preview-title-block">
          <h3>Preview</h3>
          {previewTarget && (
            <span className="preview-scene-name">
              {isActive && <span className="badge badge-live" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>LIVE</span>}
              {previewTarget}
            </span>
          )}
        </div>

        <div className="preview-controls">
          <div className="fps-selector">
            <span className="fps-label">FPS</span>
            {[1, 2, 4].map(f => (
              <button
                key={f}
                className={`fps-btn ${fps === f ? 'active' : ''}`}
                onClick={() => setFps(f)}
                disabled={paused}
                aria-label={`${f} FPS`}
              >{f}</button>
            ))}
          </div>
          <button
            className={`btn btn-sm btn-ghost ${paused ? 'preview-paused' : ''}`}
            onClick={() => setPaused(p => !p)}
            disabled={status !== 'connected'}
          >
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
        </div>
      </div>

      <div className="preview-area">
        {status !== 'connected' ? (
          <div className="preview-placeholder">
            <div className="preview-placeholder-icon">📺</div>
            <p>Connect to OBS to see live preview</p>
          </div>
        ) : !previewTarget ? (
          <div className="preview-placeholder">
            <div className="preview-placeholder-icon">👈</div>
            <p>Select a scene to preview</p>
          </div>
        ) : error ? (
          <div className="preview-placeholder">
            <div className="preview-placeholder-icon">⚠️</div>
            <p>{error}</p>
            <button className="btn btn-ghost btn-sm" onClick={handleRetry}>Retry</button>
          </div>
        ) : imgSrc ? (
          <div className="preview-img-wrap">
            <img src={imgSrc} alt={`Preview of ${previewTarget}`} className="preview-img" />
            {loading && <div className="preview-refresh-dot" />}
            {paused && <div className="preview-paused-overlay"><span>⏸ Paused</span></div>}
          </div>
        ) : (
          <div className="preview-placeholder">
            <div className="skeleton preview-skeleton" />
          </div>
        )}
      </div>

      {status === 'connected' && previewTarget && (
        <div className="preview-footer">
          <span className="preview-info">
            {paused ? '⏸ Paused' : `Polling ${fps} FPS`}
          </span>
          <span className="preview-info" style={{ color: 'var(--text-muted)' }}>JPEG · 1280×720</span>
        </div>
      )}
    </div>
  );
}
