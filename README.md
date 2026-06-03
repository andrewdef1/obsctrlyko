# OBSctrlyko 🎙️

> Remote OBS Studio control panel — Scene management, Source editing, real-time updates.

**Live App:** [https://andrewdef1.github.io/obsctrlyko/](https://andrewdef1.github.io/obsctrlyko/)

Built with **React + Vite** · `obs-websocket-js` · GitHub Pages

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔌 Connect to OBS | Support for `ws://` (local) and `wss://` (remote/tunnel) with password auth |
| 🎬 Scene Management | View all scenes, see which is LIVE, switch scenes with one click |
| 📡 Real-time Updates | `CurrentProgramSceneChanged` event keeps UI in sync even if you switch in OBS directly |
| 📦 Source Management | View all sources in any selected scene |
| 👁️ Visibility Toggle | Show/hide individual sources instantly |
| 🔇 Mute Toggle | Mute/unmute audio sources |
| ✏️ Source Editor | Edit source settings (URL, text, image path, etc.) with tabbed UI |
| 🏷️ Rename Sources | Rename any input source directly from the UI |
| 🗑️ Remove Sources | Remove a source from a scene |
| ⚡ Error Handling | Friendly toast messages for all error conditions |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js** ≥ 18
- **OBS Studio** ≥ 28 (with built-in WebSocket server)

### 1. Clone & Install

```bash
git clone https://github.com/andrewdef1/obsctrlyko.git
cd obsctrlyko
npm install
```

### 2. Enable OBS WebSocket

In OBS Studio:
1. Go to **Tools → WebSocket Server Settings**
2. ✅ Enable WebSocket Server
3. Set Port: `4455`
4. (Optional) Set a password
5. Click **OK**

### 3. Run the app

```bash
npm run dev
```

Open: [http://localhost:5173/obsctrlyko/](http://localhost:5173/obsctrlyko/)

Enter your connection details:
- Host: `ws://127.0.0.1`
- Port: `4455`
- Password: *(your OBS password or leave blank)*

---

## 🌐 Remote Access via wss:// Tunnel (Cloudflare)

GitHub Pages is served over **HTTPS**, so browsers block plain `ws://` connections.
To use this app remotely, expose OBS WebSocket over a secure `wss://` tunnel.

### Option A: Cloudflare Tunnel (Free, No Account Needed)

```powershell
# 1. Install cloudflared (Windows)
winget install --id Cloudflare.cloudflared

# 2. Create a temporary public tunnel to OBS WebSocket
cloudflared tunnel --url ws://localhost:4455
```

Cloudflare will print a URL like:
```
https://random-name.trycloudflare.com
```

In the app, enter this as your Host:
- Host: `wss://random-name.trycloudflare.com`
- Port: `443` (or remove port — HTTPS default)
- Password: *(your OBS password)*

> ⚠️ The free tunnel URL changes every time you run the command. For a persistent URL, create a free Cloudflare account and use named tunnels.

### Option B: Nginx Reverse Proxy (Persistent, Self-Hosted)

```nginx
server {
    listen 443 ssl;
    server_name obs.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/obs.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/obs.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:4455;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Then use `wss://obs.yourdomain.com` as the host in the app.

---

## 📦 Deployment

### GitHub Pages (Automatic)

Push to `main` → GitHub Actions automatically builds and deploys to:
`https://andrewdef1.github.io/obsctrlyko/`

**Initial Setup** (one-time):
1. Go to your repo **Settings → Pages**
2. Under **Source**, select **GitHub Actions**
3. Push to `main` to trigger the first deploy

### Manual Deploy (Alternative)

```bash
npm run deploy
```

---

## 🏗️ Project Structure

```
src/
├── context/
│   └── OBSContext.jsx       # Global state: connection, scenes, API methods
├── hooks/
│   └── useOBS.js            # Hook to consume OBSContext
├── components/
│   ├── ConnectionPanel.jsx  # Connection form
│   ├── SceneList.jsx        # Scene cards with LIVE badge
│   ├── SourcePanel.jsx      # Sources list for selected scene
│   ├── SourceItem.jsx       # Individual source row (visibility, mute, edit, remove)
│   ├── SourceEditModal.jsx  # Modal: settings editor + rename + raw JSON
│   ├── StatusBar.jsx        # Connection status indicator
│   └── Toast.jsx            # Auto-dismiss notifications
└── index.css                # Design system tokens + components
```

---

## 🛠️ OBS WebSocket API Reference

| Feature | OBS v5 Request |
|---------|---------------|
| Get all scenes | `GetSceneList` |
| Switch scene | `SetCurrentProgramScene` |
| Get sources in scene | `GetSceneItemList` |
| Toggle source visibility | `SetSceneItemEnabled` |
| Get input settings | `GetInputSettings` |
| Save input settings | `SetInputSettings` |
| Mute/unmute audio | `GetInputMute` / `SetInputMute` |
| Rename source | `SetInputName` |
| Remove source from scene | `RemoveSceneItem` |

---

## ⚙️ Requirements

- OBS Studio ≥ 28 (WebSocket v5 is built-in)
- Node.js ≥ 18
- Modern browser (Chrome, Firefox, Edge)

---

## 📄 License

MIT
