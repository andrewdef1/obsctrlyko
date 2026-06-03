import { useState, useCallback } from 'react';
import { useOBS } from '../hooks/useOBS';

const KIND_ICONS = {
  browser_source:    '🌐',
  image_source:      '🖼️',
  color_source:      '🎨',
  text_gdiplus:      '🅣',
  text_ft2_source:   '🅣',
  ffmpeg_source:     '📹',
  vlc_source:        '📹',
  dshow_input:       '📷',
  wasapi_input_capture:  '🎤',
  wasapi_output_capture: '🔊',
  coreaudio_input_capture: '🎤',
  coreaudio_output_capture: '🔊',
  monitor_capture:   '🖥️',
  window_capture:    '🪟',
  game_capture:      '🎮',
  scene:             '🎬',
  group:             '📁',
};

function getSourceIcon(inputKind) {
  return KIND_ICONS[inputKind] ?? '📦';
}

const AUDIO_KINDS = [
  'wasapi_input_capture', 'wasapi_output_capture',
  'coreaudio_input_capture', 'coreaudio_output_capture',
  'pulse_input_capture', 'pulse_output_capture',
];
const isAudioSource = (kind) => AUDIO_KINDS.includes(kind);

/**
 * Individual source row. Supports drag-and-drop via HTML5 drag events.
 * @param {{ source, sceneName, onEdit, onToast, onRefresh, onDragStart, onDragOver, onDrop, isDragging }} props
 */
export default function SourceItem({
  source, sceneName, onEdit, onToast, onRefresh,
  onDragStart, onDragOver, onDrop, isDragging,
}) {
  const { setSourceVisible, setInputMute, getInputMute, removeSceneItem } = useOBS();
  const [visible, setVisible] = useState(source.sceneItemEnabled);
  const [muted, setMuted] = useState(null);
  const [loadingMute, setLoadingMute] = useState(false);
  const [loadingVis, setLoadingVis] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const audio = isAudioSource(source.inputKind);

  const handleToggleVisible = useCallback(async () => {
    setLoadingVis(true);
    try {
      const next = !visible;
      await setSourceVisible(sceneName, source.sceneItemId, next);
      setVisible(next);
      onToast(`"${source.sourceName}" ${next ? 'shown' : 'hidden'}`, 'info');
    } catch (err) {
      onToast(`Error: ${err.message}`, 'error');
    } finally {
      setLoadingVis(false);
    }
  }, [visible, sceneName, source, setSourceVisible, onToast]);

  const handleLoadMute = useCallback(async () => {
    if (muted !== null) return;
    setLoadingMute(true);
    try {
      const m = await getInputMute(source.sourceName);
      setMuted(m);
    } catch {
      setMuted(false);
    } finally {
      setLoadingMute(false);
    }
  }, [muted, source.sourceName, getInputMute]);

  const handleToggleMute = useCallback(async () => {
    if (muted === null) return;
    setLoadingMute(true);
    try {
      const next = !muted;
      await setInputMute(source.sourceName, next);
      setMuted(next);
      onToast(`"${source.sourceName}" ${next ? 'muted' : 'unmuted'}`, 'info');
    } catch (err) {
      onToast(`Error: ${err.message}`, 'error');
    } finally {
      setLoadingMute(false);
    }
  }, [muted, source.sourceName, setInputMute, onToast]);

  const handleRemove = async () => {
    if (!window.confirm(`Remove "${source.sourceName}" from scene?`)) return;
    try {
      await removeSceneItem(sceneName, source.sceneItemId);
      onToast(`Removed "${source.sourceName}"`, 'info');
      onRefresh();
    } catch (err) {
      onToast(`Error: ${err.message}`, 'error');
    }
  };

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(source);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
    onDragOver(source);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    onDrop(source);
  };
  const handleDragEnd = () => setDragOver(false);

  return (
    <div
      className={`source-item ${!visible ? 'hidden-source' : ''} ${isDragging ? 'dragging' : ''} ${dragOver ? 'drag-over' : ''}`}
      style={{ animationDelay: `${(source._idx ?? 0) * 30}ms` }}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      role="listitem"
    >
      {/* Drag handle */}
      <div className="drag-handle" title="Drag to reorder" aria-label="Drag handle">
        ⠿
      </div>

      {/* Icon */}
      <div className="source-item-icon">{getSourceIcon(source.inputKind)}</div>

      {/* Info */}
      <div className="source-item-info">
        <div className="source-item-name" title={source.sourceName}>{source.sourceName}</div>
        <div className="source-item-kind">{source.inputKind ?? source.sourceType ?? 'scene/group'}</div>
      </div>

      {/* Actions */}
      <div className="source-item-actions">
        {audio && (
          <button
            className="btn btn-icon btn-ghost btn-sm"
            title={muted ? 'Unmute' : 'Mute'}
            onClick={muted === null ? handleLoadMute : handleToggleMute}
            disabled={loadingMute}
            aria-label={`${muted ? 'Unmute' : 'Mute'} ${source.sourceName}`}
          >
            {loadingMute ? <span className="spinner" style={{ width: 12, height: 12 }} /> : muted === null ? '🔊' : muted ? '🔇' : '🔊'}
          </button>
        )}

        <button
          className="btn btn-icon btn-ghost btn-sm"
          title={visible ? 'Hide source' : 'Show source'}
          onClick={handleToggleVisible}
          disabled={loadingVis}
          aria-label={`${visible ? 'Hide' : 'Show'} ${source.sourceName}`}
          style={{ opacity: visible ? 1 : 0.6 }}
        >
          {loadingVis ? <span className="spinner" style={{ width: 12, height: 12 }} /> : visible ? '👁️' : '🚫'}
        </button>

        <button
          className="btn btn-icon btn-ghost btn-sm"
          title="Edit source settings"
          onClick={() => onEdit(source)}
          aria-label={`Edit ${source.sourceName}`}
          style={{ color: 'var(--accent)' }}
        >
          ✏️
        </button>

        <button
          className="btn btn-icon btn-danger btn-sm"
          title="Remove from scene"
          onClick={handleRemove}
          aria-label={`Remove ${source.sourceName}`}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
