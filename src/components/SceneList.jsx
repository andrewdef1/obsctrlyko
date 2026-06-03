import { useOBS } from '../hooks/useOBS';

const SCENE_ICONS = ['🎬', '🎥', '🖥️', '🎮', '📡', '🎙️', '📺', '🌐'];

function getSceneIcon(index) {
  return SCENE_ICONS[index % SCENE_ICONS.length];
}

/**
 * @param {{ selectedScene: string|null, onSelectScene: (name: string) => void, onToast: Function }} props
 */
export default function SceneList({ selectedScene, onSelectScene, onToast }) {
  const { status, scenes, currentScene, switchScene } = useOBS();

  const handleSceneClick = async (sceneName) => {
    onSelectScene(sceneName);
    if (sceneName === currentScene) return;
    try {
      await switchScene(sceneName);
      onToast(`Switched to "${sceneName}"`, 'success');
    } catch (err) {
      onToast(`Failed to switch scene: ${err.message}`, 'error');
    }
  };

  if (status !== 'connected') {
    return (
      <div className="card scene-list-panel">
        <div className="scene-list-header">
          <h3>Scenes</h3>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">🎬</div>
          <p className="empty-state-text">Connect to OBS to see available scenes</p>
        </div>
      </div>
    );
  }

  if (scenes.length === 0) {
    return (
      <div className="card scene-list-panel">
        <div className="scene-list-header">
          <h3>Scenes</h3>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p className="empty-state-text">No scenes found. Create a scene in OBS Studio.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card scene-list-panel">
      <div className="scene-list-header">
        <h3>Scenes</h3>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{scenes.length} scenes</span>
      </div>

      <div className="scene-grid" role="list">
        {scenes.map((scene, idx) => {
          const isActive = scene.sceneName === currentScene;
          const isSelected = scene.sceneName === selectedScene;
          return (
            <button
              key={scene.sceneUuid ?? scene.sceneName}
              id={`scene-card-${idx}`}
              role="listitem"
              className={`scene-card ${isActive ? 'active' : ''} ${isSelected && !isActive ? 'selected-source' : ''}`}
              onClick={() => handleSceneClick(scene.sceneName)}
              aria-pressed={isActive}
              style={{ width: '100%', textAlign: 'left', animationDelay: `${idx * 40}ms` }}
            >
              <div className="scene-card-icon">{getSceneIcon(idx)}</div>
              <div className="scene-card-info">
                <div className="scene-card-name">{scene.sceneName}</div>
                <div className="scene-card-meta">
                  {isSelected ? '📂 Sources open' : 'Click to view sources'}
                </div>
              </div>
              {isActive && <span className="badge badge-live">LIVE</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
