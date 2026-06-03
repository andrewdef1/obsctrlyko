import { useState, useEffect, useCallback, useRef } from 'react';
import { useOBS } from '../hooks/useOBS';
import SourceItem from './SourceItem';
import SourceEditModal from './SourceEditModal';
import AddSourceModal from './AddSourceModal';

export default function SourcePanel({ sceneName, onToast }) {
  const { status, getSceneSources, setSceneItemIndex } = useOBS();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editSource, setEditSource] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Drag state
  const dragItemRef = useRef(null);   // source being dragged
  const dragOverRef = useRef(null);   // source being hovered over

  const fetchSources = useCallback(async () => {
    if (!sceneName || status !== 'connected') return;
    setLoading(true);
    try {
      const items = await getSceneSources(sceneName);
      // Sort descending by sceneItemIndex (top of stack = first in our list)
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

  // ── Drag & Drop handlers ──────────────────────────────────────────────────
  const handleDragStart = useCallback((source) => {
    dragItemRef.current = source;
  }, []);

  const handleDragOver = useCallback((source) => {
    dragOverRef.current = source;
  }, []);

  const handleDrop = useCallback(async (targetSource) => {
    const draggedSource = dragItemRef.current;
    if (!draggedSource || !targetSource || draggedSource.sceneItemId === targetSource.sceneItemId) return;

    // Optimistic UI update
    setSources(prev => {
      const copy = [...prev];
      const fromIdx = copy.findIndex(s => s.sceneItemId === draggedSource.sceneItemId);
      const toIdx   = copy.findIndex(s => s.sceneItemId === targetSource.sceneItemId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
      return copy.map((s, i) => ({ ...s, _idx: i }));
    });

    // OBS: sceneItemIndex 0 = bottom; our display is top-first.
    // The target's sceneItemIndex becomes the dragged item's new index.
    try {
      await setSceneItemIndex(sceneName, draggedSource.sceneItemId, targetSource.sceneItemIndex);
      onToast(`Moved "${draggedSource.sourceName}"`, 'info');
    } catch (err) {
      onToast(`Reorder failed: ${err.message}`, 'error');
      fetchSources(); // revert on error
    } finally {
      dragItemRef.current = null;
      dragOverRef.current = null;
    }
  }, [sceneName, setSceneItemIndex, onToast, fetchSources]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (status !== 'connected') {
    return (
      <div className="card source-panel">
        <div className="source-panel-header">
          <div className="source-panel-title"><h3>Sources</h3></div>
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
          <div className="source-panel-title"><h3>Sources</h3></div>
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
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              id="add-source-btn"
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddModal(true)}
              title="Add new source to scene"
            >
              + Add Source
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={fetchSources}
              disabled={loading}
              title="Refresh sources"
            >
              {loading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : '↻'} Refresh
            </button>
          </div>
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
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)} style={{ marginTop: 8 }}>
                + Add First Source
              </button>
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
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isDragging={dragItemRef.current?.sceneItemId === source.sceneItemId}
              />
            ))
          )}
        </div>

        {!loading && sources.length > 0 && (
          <div style={{ padding: '10px 0 0', borderTop: '1px solid var(--border)', marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              ⠿ Drag rows to reorder
            </span>
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

      {/* Add Source Modal */}
      {showAddModal && (
        <AddSourceModal
          sceneName={sceneName}
          onClose={() => setShowAddModal(false)}
          onToast={onToast}
          onRefresh={fetchSources}
        />
      )}
    </>
  );
}
