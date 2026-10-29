# MyAlumni 2.0 — Terminal Commands Manual

Run these exact commands in your terminal to install requirements, run frontend, backend, both together, and launch Cloudflare Tunnel.

---

## 1. Download & Install Requirements

### Install Backend Requirements (Python):
```powershell
pip install -r "e:\updated alumni\backend\requirements.txt"
```

### Install Frontend Requirements (Node.js):
```powershell
cd "e:\updated alumni\frontend"
npm install
```

### One-Line Install All Requirements:
```powershell
pip install -r "e:\updated alumni\backend\requirements.txt"; cd "e:\updated alumni\frontend"; npm install; cd ..
```

---

## 2. Run Backend Only

Start the Flask REST API on `http://127.0.0.1:5000`:

```powershell
cd "e:\updated alumni\backend"
python run.py
```

---

## 3. Run Frontend Only

Start the Vite development server on `http://localhost:5173`:

```powershell
cd "e:\updated alumni\frontend"
npm run dev
```

---

## 4. Run All at a Time (Backend + Frontend Together)

Launch both the Backend and Frontend simultaneously in separate terminal windows:

```powershell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'e:\updated alumni\backend'; python run.py"; Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'e:\updated alumni\frontend'; npm run dev"
```

*(This command opens two dedicated PowerShell windows—one running the Flask backend API and one running the Vite frontend server).*

---

## 5. Run Cloudflare Tunnel

To expose your local application to the internet via Cloudflare Tunnel:

### Expose Frontend:
```powershell
cloudflared tunnel --url http://localhost:5173
```

### Expose Backend API:
```powershell
cloudflared tunnel --url http://127.0.0.1:5000
```
