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

## 🌐 Remote Access via Cloudflare Tunnel

GitHub Pages is served over **HTTPS**, so browsers block plain `ws://` connections.
Gunakan Cloudflare Tunnel untuk membuat OBS bisa diakses secara remote dengan aman via `wss://`.

---

### 📋 Step-by-Step: Connect OBS ke App via Tunnel

#### Step 1 — Pastikan OBS Sudah Running

Buka **OBS Studio**, lalu aktifkan WebSocket Server:

1. Klik menu **Tools → WebSocket Server Settings**
2. ✅ Centang **Enable WebSocket Server**
3. Set Port: `4455`
4. (Opsional) Set password
5. Klik **OK**

---

#### Step 2 — Download `cloudflared`

> Jika sudah terinstall via `winget`, skip ke Step 3.

Download manual (Windows 64-bit):

```powershell
# Download ke folder project
Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "cloudflared.exe"
```

Atau install via winget:

```powershell
winget install --id Cloudflare.cloudflared
```

---

#### Step 3 — Jalankan Tunnel di Terminal Baru

> ⚠️ Buka **terminal baru** (jangan pakai terminal yang sedang menjalankan `npm run dev`)

```powershell
# Jika download manual ke folder project:
cd e:\Andrew\Code\obsctrlyko
.\cloudflared.exe tunnel --url http://localhost:4455

# Jika install via winget (sudah ada di PATH):
cloudflared tunnel --url http://localhost:4455
```

Tunggu sampai muncul output seperti ini:

```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
|  https://xxxxx-xxxxx-xxxxx.trycloudflare.com                                               |
+--------------------------------------------------------------------------------------------+
```

**Salin URL `https://xxxxx-xxxxx-xxxxx.trycloudflare.com` tersebut.**

> ⚠️ Jangan tutup terminal ini selama menggunakan app — tunnel akan mati jika terminal ditutup.

---

#### Step 4 — Buka App di Browser

Buka: **[https://andrewdef1.github.io/obsctrlyko/](https://andrewdef1.github.io/obsctrlyko/)**

---

#### Step 5 — Isi Form Koneksi di App

Di panel **CONNECTION** sebelah kiri, isi seperti ini:

| Field | Value |
|-------|-------|
| **Host / URL** | `wss://xxxxx-xxxxx-xxxxx.trycloudflare.com` |
| **Port** | `443` |
| **Password** | *(password OBS kamu, atau kosongkan jika tidak diset)* |

> ⚠️ **Penting:** Ganti `https://` menjadi `wss://` saat mengisi ke form!
>
> Contoh:
> - Dari: `https://certainly-regard-jurisdiction-prague.trycloudflare.com`
> - Menjadi: `wss://certainly-regard-jurisdiction-prague.trycloudflare.com`

---

#### Step 6 — Klik Connect

Klik tombol **⚡ Connect**

Jika berhasil:
- ✅ Status bar di kanan atas berubah menjadi 🟢 **Connected**
- ✅ Daftar scene OBS kamu muncul di panel **SCENES**
- ✅ Klik scene mana saja untuk melihat sources-nya

---

### 🗺️ Ringkasan Alur

```
[OBS Studio]                    [Terminal/PowerShell Baru]
  WebSocket ON      ──────────→  .\cloudflared.exe tunnel --url http://localhost:4455
  Port: 4455                              ↓
                              https://random.trycloudflare.com
                                          ↓ (ganti https → wss)
                         [Browser: andrewdef1.github.io/obsctrlyko/]
                            Host: wss://random.trycloudflare.com
                            Port: 443
                            Password: (opsional)
                            → Klik ⚡ Connect!
```

---

### Option B: Nginx Reverse Proxy (Persistent, Self-Hosted)

Untuk URL tetap yang tidak berubah, gunakan Nginx sebagai reverse proxy dengan SSL:

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

Lalu gunakan `wss://obs.yourdomain.com` sebagai Host di app.

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
