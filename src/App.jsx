import { useState, useCallback } from 'react';
import { OBSProvider } from './context/OBSContext';
import ConnectionPanel from './components/ConnectionPanel';
import StatusBar from './components/StatusBar';
import SceneList from './components/SceneList';
import SourcePanel from './components/SourcePanel';
import Toast from './components/Toast';

let toastId = 0;

function AppContent() {
  const [toasts, setToasts] = useState([]);
  const [selectedScene, setSelectedScene] = useState(null);

  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <a className="app-logo" href="#" aria-label="OBSctrlyko Home">
          <div className="app-logo-icon" aria-hidden="true">🎙</div>
          <span className="app-logo-text">OBS<span>ctrlyko</span></span>
        </a>
        <StatusBar />
      </header>

      {/* Main */}
      <main className="app-main">
        {/* Sidebar */}
        <aside className="sidebar">
          <ConnectionPanel onToast={addToast} />
          <SceneList
            selectedScene={selectedScene}
            onSelectScene={setSelectedScene}
            onToast={addToast}
          />
        </aside>

        {/* Main Content: Sources */}
        <section className="main-content" aria-label="Source Management">
          <SourcePanel sceneName={selectedScene} onToast={addToast} />
        </section>
      </main>

      {/* Toast notifications */}
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default function App() {
  return (
    <OBSProvider>
      <AppContent />
    </OBSProvider>
  );
}
