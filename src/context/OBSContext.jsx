import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import OBSWebSocket from 'obs-websocket-js';

// ─── State Shape ────────────────────────────────────────────────────────────
const initialState = {
  status: 'disconnected', // 'disconnected' | 'connecting' | 'connected' | 'error'
  obsVersion: null,
  scenes: [],
  currentScene: null,
  error: null,
};

// ─── Reducer ─────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'CONNECTING':
      return { ...state, status: 'connecting', error: null };
    case 'CONNECTED':
      return { ...state, status: 'connected', obsVersion: action.payload, error: null };
    case 'DISCONNECTED':
      return { ...initialState };
    case 'SET_SCENES':
      return { ...state, scenes: action.payload.scenes, currentScene: action.payload.currentScene };
    case 'SET_CURRENT_SCENE':
      return { ...state, currentScene: action.payload };
    case 'SET_ERROR':
      return { ...state, status: 'error', error: action.payload };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────
export const OBSContext = createContext(null);

export function OBSProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const obsRef = useRef(new OBSWebSocket());

  // ── Connect ────────────────────────────────────────────────────────────────
  const connect = useCallback(async ({ host, port, password }) => {
    const obs = obsRef.current;
    dispatch({ type: 'CONNECTING' });

    try {
      const url = host.includes('://') ? `${host}:${port}` : `ws://${host}:${port}`;
      const { obsVersion } = await obs.connect(url, password || undefined, { rpcVersion: 1 });

      dispatch({ type: 'CONNECTED', payload: obsVersion });

      // Fetch scene list
      const { scenes, currentProgramSceneName } = await obs.call('GetSceneList');
      dispatch({
        type: 'SET_SCENES',
        payload: {
          scenes: [...scenes].reverse(), // OBS returns in reverse order
          currentScene: currentProgramSceneName,
        },
      });

      // ── Real-time event listeners ─────────────────────────────────────────
      obs.on('CurrentProgramSceneChanged', ({ sceneName }) => {
        dispatch({ type: 'SET_CURRENT_SCENE', payload: sceneName });
      });

      obs.on('SceneListChanged', async () => {
        try {
          const { scenes: newScenes, currentProgramSceneName: current } = await obs.call('GetSceneList');
          dispatch({ type: 'SET_SCENES', payload: { scenes: [...newScenes].reverse(), currentScene: current } });
        } catch (_) {}
      });

      obs.on('ConnectionClosed', () => {
        dispatch({ type: 'DISCONNECTED' });
      });

    } catch (err) {
      let msg = 'Connection failed.';
      if (err.code === 4009) msg = 'Authentication failed. Wrong password.';
      else if (err.code === 1006 || err.message?.includes('ECONNREFUSED'))
        msg = 'Could not reach OBS. Is it running with WebSocket enabled?';
      else if (err.message) msg = err.message;
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw new Error(msg);
    }
  }, []);

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    try {
      obsRef.current.removeAllListeners();
      await obsRef.current.disconnect();
    } catch (_) {}
    // Re-create instance for a clean reconnect
    obsRef.current = new OBSWebSocket();
    dispatch({ type: 'DISCONNECTED' });
  }, []);

  // ── Switch scene ──────────────────────────────────────────────────────────
  const switchScene = useCallback(async (sceneName) => {
    await obsRef.current.call('SetCurrentProgramScene', { sceneName });
  }, []);

  // ── Get sources for a scene ───────────────────────────────────────────────
  const getSceneSources = useCallback(async (sceneName) => {
    const { sceneItems } = await obsRef.current.call('GetSceneItemList', { sceneName });
    return sceneItems;
  }, []);

  // ── Toggle source visibility ──────────────────────────────────────────────
  const setSourceVisible = useCallback(async (sceneName, sceneItemId, enabled) => {
    await obsRef.current.call('SetSceneItemEnabled', { sceneName, sceneItemId, sceneItemEnabled: enabled });
  }, []);

  // ── Get input settings ────────────────────────────────────────────────────
  const getInputSettings = useCallback(async (inputName) => {
    const result = await obsRef.current.call('GetInputSettings', { inputName });
    return result;
  }, []);

  // ── Set input settings ────────────────────────────────────────────────────
  const setInputSettings = useCallback(async (inputName, inputSettings) => {
    await obsRef.current.call('SetInputSettings', { inputName, inputSettings, overlay: true });
  }, []);

  // ── Get input mute ────────────────────────────────────────────────────────
  const getInputMute = useCallback(async (inputName) => {
    const { inputMuted } = await obsRef.current.call('GetInputMute', { inputName });
    return inputMuted;
  }, []);

  // ── Set input mute ────────────────────────────────────────────────────────
  const setInputMute = useCallback(async (inputName, inputMuted) => {
    await obsRef.current.call('SetInputMute', { inputName, inputMuted });
  }, []);

  // ── Rename source ─────────────────────────────────────────────────────────
  const renameSource = useCallback(async (inputName, newInputName) => {
    await obsRef.current.call('SetInputName', { inputName, newInputName });
  }, []);

  // ── Remove scene item ─────────────────────────────────────────────────────
  const removeSceneItem = useCallback(async (sceneName, sceneItemId) => {
    await obsRef.current.call('RemoveSceneItem', { sceneName, sceneItemId });
  }, []);

  const value = {
    ...state,
    connect,
    disconnect,
    switchScene,
    getSceneSources,
    setSourceVisible,
    getInputSettings,
    setInputSettings,
    getInputMute,
    setInputMute,
    renameSource,
    removeSceneItem,
  };

  return <OBSContext.Provider value={value}>{children}</OBSContext.Provider>;
}
