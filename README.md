# AI Gym Assistant — Phase 3A (React Frontend)

## What this app does

| Capability | Implementation |
|---|---|
| Exercise classification | Baseline GRU model (TF.js GraphModel) |
| Pose estimation | MediaPipe PoseLandmarker (WASM, runs in browser) |
| Rep counting | State machine on joint angles |
| Form feedback | Rule-based angle analysis |

### ⚠️ Scope
This app **identifies which exercise** is being performed.
Form rules are angle-based estimates and are **not medical advice**.
The training dataset had no correct/incorrect form labels.

---

## Setup (step by step)

### 1 — Clone or create the project

```bash
git clone <your-repo>          # OR
npm create vite@latest gym-form-corrector -- --template react
cd gym-form-corrector
```

### 2 — Install dependencies

```bash
npm install
```

### 3 — Copy model files from Google Drive

From your Colab training output, copy these files to the React `public/` folder:

```
public/
├── model/
│   ├── model.json                 ← from models/tfjs_final_gru_cpu_v1/
│   └── group1-shard1of1.bin       ← same folder (may have a different shard name)
└── scaler_params.json             ← from data/scaler_params.json
```

**Where to find them in Google Drive:**
```
GymFormCorrector/
  models/
    tfjs_final_gru_cpu_v1/
      model.json                   ← copy to public/model/model.json
      group1-shard1of1.bin         ← copy to public/model/
  data/
    scaler_params.json             ← copy to public/scaler_params.json
```

> If your .bin file has a different name (e.g. `group1-shard2of3.bin`), copy all
> shard files. The model.json already knows their names.

### 4 — Verify public/ structure

```
public/
├── model/
│   ├── model.json
│   └── group1-shard1of1.bin
└── scaler_params.json
```

### 5 — Run the dev server

```bash
npm run dev
```

Open: http://localhost:5173

> **Camera permission prompt will appear.** Allow it.

---

## How to use

1. Select your exercise (Bicep Curl / Push-up / Squat)
2. Position camera per the hint shown below the buttons:
   - **Bicep Curl** → side-on, full body visible
   - **Push-up** → side-on, low camera, full body in frame
   - **Squat** → side-on, full body visible
3. Click **▶ Start Session**
4. Watch the skeleton overlay and form feedback panel

---

## Feature pipeline (must match Phase 1 exactly)

The JavaScript extracts features in this exact order per frame:

```
Raw MediaPipe landmarks (33 × {x,y,z,visibility})
  ↓
Hip-centred + torso-scaled normalisation
  ↓
Flatten → 99 values  [x0,y0,z0, x1,y1,z1, ..., x32,y32,z32]
  +
12 joint angles (JOINT_TRIPLETS order)
  +
99 velocity values (delta xyz vs previous frame)
  ─────────────────────────────────────────────
  = 210 features per frame
  ↓
30-frame ring buffer → shape (30, 210)
  ↓
Z-score normalisation using scaler_params.json
  ↓
tf.tensor3d([buffer], [1, 30, 210])
  ↓
GraphModel.predict() → softmax [curl, pushup, squat]
```

---

## Deployment (Vercel / Netlify)

MediaPipe WASM needs cross-origin isolation headers.

**Vercel — add `vercel.json` to project root:**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy",   "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
      ]
    }
  ]
}
```

**Netlify — add `public/_headers`:**
```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Cannot load scaler_params.json" | Copy file to `public/scaler_params.json` |
| "Cannot load model.json" | Copy file to `public/model/model.json` |
| Black camera / no skeleton | Allow camera permission in browser |
| "SharedArrayBuffer is not defined" | Headers missing — check vite.config.js |
| Low confidence / wrong exercise | Check camera angle per hint; re-run in good light |
| Reps not counting | Ensure full range of motion; camera must see relevant joints |
