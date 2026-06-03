import { useState, useEffect } from 'react';
import { useOBS } from '../hooks/useOBS';

// Common source types with friendly names + default settings
const COMMON_KINDS = [
  { kind: 'browser_source',           label: '🌐 Browser',           settings: { url: 'https://example.com', width: 1920, height: 1080 } },
  { kind: 'image_source',             label: '🖼️ Image',              settings: { file: '' } },
  { kind: 'color_source',             label: '🎨 Color Source',       settings: { color: 4294967295, width: 1920, height: 1080 } },
  { kind: 'text_gdiplus',             label: '🅣 Text (Windows)',     settings: { text: 'New Text' } },
  { kind: 'text_ft2_source',          label: '🅣 Text (Linux/Mac)',   settings: { text: 'New Text' } },
  { kind: 'ffmpeg_source',            label: '📹 Media File',         settings: { local_file: '', is_local_file: true } },
  { kind: 'monitor_capture',          label: '🖥️ Display Capture',   settings: {} },
  { kind: 'window_capture',           label: '🪟 Window Capture',    settings: {} },
  { kind: 'game_capture',             label: '🎮 Game Capture',       settings: {} },
  { kind: 'dshow_input',              label: '📷 Video Capture Device', settings: {} },
  { kind: 'wasapi_input_capture',     label: '🎤 Audio Input',        settings: {} },
  { kind: 'wasapi_output_capture',    label: '🔊 Audio Output',       settings: {} },
  { kind: 'vlc_source',               label: '📹 VLC Source',         settings: {} },
];

export default function AddSourceModal({ sceneName, onClose, onToast, onRefresh }) {
  const { createInput, getInputKindList } = useOBS();
  const [step, setStep] = useState(1);          // 1 = pick type, 2 = configure
  const [allKinds, setAllKinds] = useState([]);
  const [selectedKind, setSelectedKind] = useState(null);
  const [inputName, setInputName] = useState('');
  const [extraSettings, setExtraSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Load full kind list from OBS (fallback to COMMON_KINDS)
  useEffect(() => {
    getInputKindList()
      .then(kinds => setAllKinds(kinds))
      .catch(() => setAllKinds(COMMON_KINDS.map(k => k.kind)));
  }, [getInputKindList]);

  const handleSelectKind = (kind) => {
    setSelectedKind(kind);
    const common = COMMON_KINDS.find(k => k.kind === kind);
    setExtraSettings(common?.settings ?? {});
    setInputName(common?.label.replace(/[^a-zA-Z0-9 ]/g, '').trim() + ' ' + Date.now().toString().slice(-4));
    setStep(2);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    setSaving(true);
    try {
      await createInput(sceneName, inputName.trim(), selectedKind, extraSettings);
      onToast(`Source "${inputName.trim()}" added!`, 'success');
      onRefresh();
      onClose();
    } catch (err) {
      onToast(`Failed to add source: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

  // Combine known kinds with OBS list
  const displayKinds = COMMON_KINDS.filter(k =>
    allKinds.length === 0 || allKinds.includes(k.kind)
  ).filter(k =>
    search === '' || k.label.toLowerCase().includes(search.toLowerCase()) || k.kind.includes(search.toLowerCase())
  );

  const unknownKinds = allKinds.filter(k =>
    !COMMON_KINDS.find(c => c.kind === k) &&
    (search === '' || k.toLowerCase().includes(search.toLowerCase()))
  );

  const commonForSelected = COMMON_KINDS.find(k => k.kind === selectedKind);

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="add-source-title">
      <div className="modal-box" style={{ maxWidth: 560 }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-block">
            <h2 className="modal-title" id="add-source-title">
              {step === 1 ? 'Add Source' : `Configure ${commonForSelected?.label ?? selectedKind}`}
            </h2>
            <span className="modal-subtitle">📂 {sceneName}</span>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Step 1 — Choose type */}
        {step === 1 && (
          <>
            <div style={{ padding: '12px 24px 0' }}>
              <input
                className="form-input"
                type="text"
                placeholder="🔍 Search source types…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-body" style={{ paddingTop: 12 }}>
              <div className="add-source-grid">
                {displayKinds.map(k => (
                  <button
                    key={k.kind}
                    className="add-source-card"
                    onClick={() => handleSelectKind(k.kind)}
                    id={`source-type-${k.kind}`}
                  >
                    <span className="add-source-card-icon">{k.label.split(' ')[0]}</span>
                    <span className="add-source-card-label">{k.label.slice(k.label.indexOf(' ') + 1)}</span>
                    <span className="add-source-card-kind">{k.kind}</span>
                  </button>
                ))}
              </div>

              {unknownKinds.length > 0 && (
                <>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '12px 0 6px' }}>
                    Other installed plugins
                  </p>
                  <div className="add-source-grid">
                    {unknownKinds.map(k => (
                      <button
                        key={k}
                        className="add-source-card"
                        onClick={() => handleSelectKind(k)}
                      >
                        <span className="add-source-card-icon">📦</span>
                        <span className="add-source-card-label">{k}</span>
                        <span className="add-source-card-kind">{k}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {displayKinds.length === 0 && unknownKinds.length === 0 && (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No source types match "{search}"</p>
              )}
            </div>
          </>
        )}

        {/* Step 2 — Configure */}
        {step === 2 && (
          <form onSubmit={handleCreate}>
            <div className="modal-body">
              <div className="settings-field">
                <label className="settings-label" htmlFor="new-source-name">Source Name</label>
                <input
                  id="new-source-name"
                  className="form-input"
                  type="text"
                  value={inputName}
                  onChange={e => setInputName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {/* Render common settings for known types */}
              {Object.entries(extraSettings).map(([key, val]) => (
                <div key={key} className="settings-field">
                  <label className="settings-label" htmlFor={`ns-${key}`}>{key}</label>
                  {typeof val === 'boolean' ? (
                    <div className="settings-bool-row">
                      <span className="settings-label">{key}</span>
                      <label className="switch">
                        <input
                          id={`ns-${key}`}
                          type="checkbox"
                          checked={extraSettings[key]}
                          onChange={e => setExtraSettings(p => ({ ...p, [key]: e.target.checked }))}
                        />
                        <span className="switch-slider" />
                      </label>
                    </div>
                  ) : (
                    <input
                      id={`ns-${key}`}
                      className="form-input"
                      type={typeof val === 'number' ? 'number' : 'text'}
                      value={extraSettings[key] ?? val}
                      onChange={e => setExtraSettings(p => ({
                        ...p,
                        [key]: typeof val === 'number' ? Number(e.target.value) : e.target.value,
                      }))}
                    />
                  )}
                </div>
              ))}

              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                ℹ️ Additional settings (device, file path, etc.) can be configured after creation via the Edit button.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)} disabled={saving}>← Back</button>
              <button type="submit" id="add-source-confirm-btn" className="btn btn-primary" disabled={saving || !inputName.trim()}>
                {saving ? <><span className="spinner" /> Creating…</> : '+ Add Source'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
