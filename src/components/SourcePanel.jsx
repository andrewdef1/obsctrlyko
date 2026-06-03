import { useState, useEffect, useCallback } from 'react';
import { useOBS } from '../hooks/useOBS';
import SourceItem from './SourceItem';
import SourceEditModal from './SourceEditModal';

/**
 * Shows sources for the selected scene.
 * @param {{ sceneName: string|null, onToast: Function }} props
 */
export default function SourcePanel({ sceneName, onToast }) {
  const { status, getSceneSources } = useOBS();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editSource, setEditSource] = useState(null);

  const fetchSources = useCallback(async () => {
    if (!sceneName || status !== 'connected') return;
    setLoading(true);
    try {
      const items = await getSceneSources(sceneName);
      // Sort by sceneItemIndex descending (OBS renders top items last)
      const sorted = [...items].sort((a, b) => b.sceneItemIndex - a.sceneItemIndex);
      setSources(sorted.map((s, i) => ({ ...s, _idx: i })));
    } catch (err) {
      onToast(`Failed to load sources: ${err.message}`, 'error');
      setSources([]);
    } finally {
      setLoading(false);
    }
  }, [sceneName, status, getSceneSources, onToast]);

  useEffect(() => {
    setSources([]);
    fetchSources();
  }, [sceneName, fetchSources]);

  if (status !== 'connected') {
    return (
      <div className="card source-panel">
        <div className="source-panel-header">
          <div className="source-panel-title">
            <h3>Sources</h3>
          </div>
        </div>
        <div className="source-disconnected">
          <div className="source-empty-icon">🔌</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Connect to OBS to manage sources</p>
        </div>
      </div>
    );
  }

  if (!sceneName) {
    return (
      <div className="card source-panel">
        <div className="source-panel-header">
          <div className="source-panel-title">
            <h3>Sources</h3>
          </div>
        </div>
        <div className="source-disconnected">
          <div className="source-empty-icon">👈</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Select a scene to view its sources</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card source-panel">
        <div className="source-panel-header">
          <div className="source-panel-title">
            <h3>Sources</h3>
            <span className="source-scene-name">📂 {sceneName}</span>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={fetchSources}
            disabled={loading}
            title="Refresh sources"
            aria-label="Refresh sources"
          >
            {loading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : '↻'} Refresh
          </button>
        </div>

        <div className="source-list" role="list">
          {loading ? (
            [0, 1, 2].map(i => (
              <div key={i} className="skeleton source-item" style={{ height: 52, animationDelay: `${i * 80}ms` }} />
            ))
          ) : sources.length === 0 ? (
            <div className="source-empty">
              <div className="source-empty-icon">📭</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No sources in this scene</p>
            </div>
          ) : (
            sources.map((source) => (
              <SourceItem
                key={source.sceneItemId}
                source={source}
                sceneName={sceneName}
                onEdit={setEditSource}
                onToast={onToast}
                onRefresh={fetchSources}
              />
            ))
          )}
        </div>

        {!loading && sources.length > 0 && (
          <div style={{ padding: '10px 0 0', borderTop: '1px solid var(--border)', marginTop: 12, textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {sources.length} source{sources.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editSource && (
        <SourceEditModal
          source={editSource}
          sceneName={sceneName}
          onClose={() => setEditSource(null)}
          onToast={onToast}
          onRefresh={fetchSources}
        />
      )}
    </>
  );
}
