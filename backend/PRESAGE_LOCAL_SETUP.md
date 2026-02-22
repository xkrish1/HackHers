# Local Presage C++ Daemon Setup (macOS)

This setup removes the phone QR dependency by using laptop camera capture and a local Presage-compatible daemon.

## 1) Install prerequisites

```bash
xcode-select --install
brew install cmake pkg-config opencv ffmpeg
```

Install the Presage C++ SDK/runtime from your vendor package and note:
- include directory
- library directory
- runtime model/assets path

## 2) Build and run your C++ daemon

Run your daemon on localhost only and expose:
- `GET /health` -> `{ "ok": true }`
- `POST /analyze` multipart form with field `file`

Expected analyze response (any compatible naming is accepted):

```json
{
  "heart_rate": 78,
  "breathing_rate": 15,
  "confidence": 0.92
}
```

Supported aliases by app normalizer:
- `heart_rate` | `hr` | `heartRate`
- `breathing_rate` | `br` | `breathingRate`

## 3) Configure app env

In `.env.local`:

```dotenv
PRESAGE_LOCAL_MODE="true"
PRESAGE_LOCAL_URL="http://127.0.0.1:8088/analyze"
PRESAGE_LOCAL_AUTH_HEADER=""
```

Then restart Next.js.

## 4) Run app

```bash
pnpm dev
```

Open dashboard -> Check-in -> Pulse Check -> **Start on Laptop**.

## 5) Quick diagnostics

- App health endpoint: `GET /api/pulse/health`
- Local daemon check:

```bash
curl http://127.0.0.1:8088/health
```

If local daemon is down, app gracefully falls back to cloud (if configured) and then simulated values.
