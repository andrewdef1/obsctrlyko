import { useState, useEffect, useCallback } from 'react';
import { useOBS } from '../hooks/useOBS';

/**
 * Modal to edit a source's input settings + rename.
 */
export default function SourceEditModal({ source, sceneName, onClose, onToast, onRefresh }) {
  const { getInputSettings, setInputSettings, renameSource } = useOBS();
  const [settings, setSettings] = useState(null);
  const [inputKind, setInputKind] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('settings'); // 'settings' | 'rename' | 'raw'
  const [newName, setNewName] = useState(source.sourceName);
  const [localSettings, setLocalSettings] = useState({});
  const [rawEdit, setRawEdit] = useState('');

  const isScene = source.sourceType === 'OBS_SOURCE_TYPE_SCENE';

  useEffect(() => {
    if (isScene) { setLoading(false); return; }
    getInputSettings(source.sourceName)
      .then(({ inputSettings, inputKind: kind }) => {
        setSettings(inputSettings);
        setLocalSettings(inputSettings);
        setInputKind(kind);
        setRawEdit(JSON.stringify(inputSettings, null, 2));
      })
      .catch((err) => {
        onToast(`Could not load settings: ${err.message}`, 'error');
        setSettings({});
        setLocalSettings({});
      })
      .finally(() => setLoading(false));
  }, [source.sourceName, getInputSettings, isScene, onToast]);

  const handleFieldChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      let parsed = localSettings;
      if (tab === 'raw') {
        parsed = JSON.parse(rawEdit);
      }
      await setInputSettings(source.sourceName, parsed);
      onToast(`Settings saved for "${source.sourceName}"`, 'success');
      onClose();
    } catch (err) {
      onToast(`Save failed: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRename = async () => {
    if (!newName.trim() || newName === source.sourceName) return;
    setSaving(true);
    try {
      await renameSource(source.sourceName, newName.trim());
      onToast(`Renamed to "${newName.trim()}"`, 'success');
      onRefresh();
      onClose();
    } catch (err) {
      onToast(`Rename failed: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

  // Render individual setting field by type
  const renderField = (key, value) => {
    const type = typeof value;
    if (type === 'boolean') {
      return (
        <div key={key} className="settings-bool-row">
          <span className="settings-label">{key}</span>
          <label className="switch" aria-label={key}>
            <input
              type="checkbox"
              checked={localSettings[key] ?? false}
              onChange={e => handleFieldChange(key, e.target.checked)}
            />
            <span className="switch-slider" />
          </label>
        </div>
      );
    }
    if (type === 'number') {
      return (
        <div key={key} className="settings-field">
          <label className="settings-label" htmlFor={`sf-${key}`}>{key}</label>
          <input
            id={`sf-${key}`}
            className="form-input"
            type="number"
            value={localSettings[key] ?? value}
            onChange={e => handleFieldChange(key, Number(e.target.value))}
          />
        </div>
      );
    }
    if (type === 'string') {
      return (
        <div key={key} className="settings-field">
          <label className="settings-label" htmlFor={`sf-${key}`}>{key}</label>
          <input
            id={`sf-${key}`}
            className="form-input"
            type="text"
            value={localSettings[key] ?? value}
            onChange={e => handleFieldChange(key, e.target.value)}
          />
        </div>
      );
    }
    // Objects/arrays → skip in simple view (shown in Raw tab)
    return null;
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-box">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-block">
            <h2 className="modal-title" id="modal-title">Edit Source</h2>
            <span className="modal-subtitle">{source.sourceName} · {inputKind || source.sourceType}</span>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        {/* Tab Bar */}
        {!isScene && (
          <div style={{ padding: '12px 24px 0' }}>
            <div className="tab-bar">
              <button className={`tab-btn ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>Settings</button>
              <button className={`tab-btn ${tab === 'rename' ? 'active' : ''}`} onClick={() => setTab('rename')}>Rename</button>
              <button className={`tab-btn ${tab === 'raw' ? 'active' : ''}`} onClick={() => setTab('raw')}>Raw JSON</button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="modal-body">
          {loading ? (
            <>
              <div className="skeleton" style={{ height: 40 }} />
              <div className="skeleton" style={{ height: 40 }} />
              <div className="skeleton" style={{ height: 40 }} />
            </>
          ) : isScene ? (
            <div className="source-disconnected">
              <div style={{ fontSize: '2rem' }}>🎬</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                This source is a Scene. Edit its contents from the Scenes panel.
              </p>
            </div>
          ) : tab === 'settings' ? (
            settings && Object.keys(settings).length > 0 ? (
              Object.entries(settings).map(([key, value]) => renderField(key, value))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No editable settings found for this source type.</p>
            )
          ) : tab === 'rename' ? (
            <div className="settings-field">
              <label className="settings-label" htmlFor="rename-input">New Name</label>
              <input
                id="rename-input"
                className="form-input"
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Enter new source name"
              />
            </div>
          ) : (
            <div className="settings-field">
              <label className="settings-label">Raw JSON Settings</label>
              <textarea
                className="form-input settings-raw"
                value={rawEdit}
                onChange={e => setRawEdit(e.target.value)}
                rows={10}
                style={{ resize: 'vertical', minHeight: 160 }}
                spellCheck={false}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {!isScene && (
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
            {tab === 'rename' ? (
              <button
                id="save-rename-btn"
                className="btn btn-primary"
                onClick={handleRename}
                disabled={saving || !newName.trim() || newName === source.sourceName}
              >
                {saving ? <><span className="spinner" /> Renaming…</> : 'Rename Source'}
              </button>
            ) : (
              <button
                id="save-settings-btn"
                className="btn btn-primary"
                onClick={handleSaveSettings}
                disabled={saving || loading}
              >
                {saving ? <><span className="spinner" /> Saving…</> : 'Save Settings'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
