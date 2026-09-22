🏋️ AI Gym Form Corrector

<div align="center">

Real-time AI-powered exercise recognition, pose tracking, rep counting, and form feedback — directly in the browser.








🚀 Live Demo · 💻 Source Code

</div>

📌 Overview

AI Gym Form Corrector is a browser-based fitness assistant that combines computer vision, pose estimation, and a custom GRU-based deep learning model to analyze exercise movements in real time.

The application uses MediaPipe PoseLandmarker to detect 33 body landmarks from a webcam feed, converts them into a custom 210-dimensional feature representation, and feeds a 30-frame sequence into a TensorFlow.js GRU classifier to recognize the performed exercise.

On top of exercise recognition, the application uses joint-angle rules and movement-state logic to provide form feedback, count repetitions, calculate session performance, and track progress locally in the browser.

The selected baseline GRU achieved 95% video-level test accuracy on the held-out test videos used during model evaluation.

Supported exercises

💪 Bicep Curl

🤸 Push-up

🏋️ Squat

Note: Form feedback is based on pose geometry and joint-angle rules. The training dataset was designed for exercise classification rather than clinically validated correct/incorrect form assessment, so the application should not be treated as medical or professional fitness advice.

✨ Key Features

Real-time pose estimation using MediaPipe PoseLandmarker

Deep learning exercise classification with a GRU model converted to TensorFlow.js

33-point body landmark tracking directly from the webcam

210 engineered features per frame

30-frame temporal sequence analysis

95% video-level test accuracy on held-out evaluation videos

Automatic repetition counting using movement-state logic

Rule-based form analysis using joint angles

Live skeleton visualization over the camera feed

Exercise-specific feedback during workout sessions

Session scoring and workout summaries

Local progress tracking using browser storage

Fully client-side inference — no backend is required for predictions

Responsive React interface

Production deployment on Vercel

🧠 AI / Computer Vision Pipeline

The project combines pose estimation, feature engineering, temporal deep learning, and rule-based biomechanics.

Webcam Video
     │
     ▼
MediaPipe PoseLandmarker
     │
     ├── 33 body landmarks
     │
     ▼
Pose Normalization
     │
     ├── Hip-centred coordinates
     └── Torso-scale normalization
     │
     ▼
Feature Engineering
     │
     ├── 99 landmark coordinates
     ├── 12 joint-angle features
     └── 99 landmark velocity features
     │
     ▼
210 Features / Frame
     │
     ▼
30-Frame Sequence Buffer
     │
     ▼
Z-Score Standardization
     │
     ▼
TensorFlow.js GRU Model
     │
     ▼
Exercise Prediction
[curl | pushup | squat]
     │
     ├── Rep Counter
     ├── Form Rules
     └── Session Analytics

Feature vector

For every detected frame:

33 landmarks × (x, y, z) = 99 features
12 joint angles           = 12 features
33 landmark velocities × 3 = 99 features
-----------------------------------------
Total                      = 210 features

A rolling sequence of 30 frames is used by the GRU model:

Input Shape: (30, 210)

This allows the classifier to learn movement over time, rather than making a decision from a single image.

🏗️ System Architecture

┌─────────────────────────────────────────────────────────────┐
│                       React Frontend                        │
│                                                             │
│  Webcam                                                     │
│    │                                                        │
│    ▼                                                        │
│  MediaPipe PoseLandmarker                                   │
│    │                                                        │
│    ▼                                                        │
│  Feature Extraction ──► Sequence Buffer ──► TF.js GRU       │
│         │                                     │             │
│         │                                     ▼             │
│         │                              Exercise Class        │
│         │                                                    │
│         ├────────► Joint-Angle Form Rules                    │
│         │                                                    │
│         └────────► Rep Counting State Machine                │
│                                                             │
│                    ▼                                        │
│        Live Feedback + Session Results                       │
│                    │                                        │
│                    ▼                                        │
│              LocalStorage Progress                           │
└─────────────────────────────────────────────────────────────┘

🛠️ Tech Stack

Area

Technology

Frontend

React 18

Build Tool

Vite

Styling

Tailwind CSS

Pose Estimation

MediaPipe Tasks Vision

ML Inference

TensorFlow.js

Exercise Model

GRU sequence classifier

Computer Vision Input

Browser Webcam API

Progress Storage

LocalStorage

Deployment

Vercel

🔍 How It Works

The user selects Bicep Curl, Push-up, or Squat.

The browser requests access to the user's webcam.

MediaPipe detects 33 pose landmarks from each frame.

Landmark coordinates are normalized to reduce sensitivity to body position and scale.

The application calculates joint-angle and motion features.

A 210-feature vector is generated for each frame.

The latest 30 frames form one temporal sequence.

The sequence is standardized using the training-time scaler parameters.

The TensorFlow.js GRU model predicts the exercise class.

Joint-angle rules evaluate movement quality while a state machine counts repetitions.

Session statistics and feedback are displayed to the user.

Workout progress can be retained locally in the browser.

🚀 Live Demo

The project is deployed on Vercel:

👉 https://gym-form-corrector.vercel.app/

For the best experience:

Use a laptop/desktop with a webcam.

Allow camera permission when prompted.

Keep your full body visible.

Use a well-lit environment.

Position the camera from the side for the supported exercises.

💻 Run Locally

1. Clone the repository

git clone https://github.com/rohaanahmadtech/gym-form-corrector.git
cd gym-form-corrector

2. Install dependencies

npm install

3. Verify AI model files

The application expects the trained TensorFlow.js model and scaler files inside public/.

public/
├── model/
│   ├── model.json
│   └── group1-shard1of1.bin
└── scaler_params.json

If the converted TensorFlow.js model contains multiple .bin shards, keep all of them in the public/model/ directory.

4. Start the development server

npm run dev

Then open:

http://localhost:5173

Allow camera access when requested.

📦 Production Build

Create an optimized production build with:

npm run build

Preview it locally with:

npm run preview

☁️ Deployment

The application is currently deployed using Vercel.

Because MediaPipe uses browser/WASM features that may require cross-origin isolation, the deployment includes the required security headers.

Example vercel.json:

{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        },
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        }
      ]
    }
  ]
}

📂 Project Structure

gym-form-corrector/
│
├── public/
│   ├── model/                 # TensorFlow.js model files
│   └── scaler_params.json     # Feature standardization parameters
│
├── src/
│   ├── components/            # Reusable UI components
│   ├── hooks/                 # MediaPipe / model-related React hooks
│   ├── lib/                   # Feature extraction, rules & rep logic
│   ├── pages/                 # Application screens
│   ├── App.jsx
│   └── main.jsx
│
├── package.json
├── tailwind.config.js
├── vite.config.js
└── vercel.json

🎯 Technical Highlights

Model Performance

The final selected GRU model achieved 95% video-level test accuracy on the held-out test set during evaluation. This metric represents classification performance after aggregating predictions at the video level.

1. Temporal exercise recognition

Instead of classifying a single pose image, the model processes a sequence of 30 frames. This allows it to capture how a movement changes over time.

2. Custom feature engineering

Raw MediaPipe outputs are transformed into a compact representation combining:

normalized pose coordinates,

biomechanically useful joint angles,

frame-to-frame body motion.

3. Browser-side AI inference

The trained model runs with TensorFlow.js directly in the browser, avoiding a dedicated inference server and reducing network dependency during predictions.

4. Hybrid AI + rule-based analysis

The architecture separates two responsibilities:

GRU model: identifies the exercise being performed.

Joint-angle rules: evaluates movement form and contributes to rep-counting logic.

This makes the system easier to interpret and extend than relying on a single black-box model for every task.

⚠️ Current Scope & Limitations

Supports Bicep Curl, Push-up, and Squat.

Classification quality depends on camera placement, lighting, and pose visibility.

Rep counting requires enough visible joint movement to detect exercise states.

Form feedback is based on engineered joint-angle rules.

The system is an educational AI fitness project and is not medical advice or a substitute for a certified trainer.

🔮 Future Improvements

Add more exercises and exercise variations

Train a dedicated correct-vs-incorrect form model

Add per-joint form error classification

Support personalized range-of-motion thresholds

Add workout history with a cloud database

Add authentication and user profiles

Add mobile/PWA optimization

Add voice coaching and real-time audio feedback

Add richer progress analytics and charts

Benchmark model performance across different camera angles and environments

👨‍💻 Developer

Rohaan Ahmad

AI / Machine Learning & Computer Science

GitHub: @rohaanahmadtech

Portfolio: devrohaan.vercel.app

Project Demo: AI Gym Form Corrector

⭐ Support

If you found this project useful or interesting, consider giving the repository a star ⭐.

It helps showcase the project and supports further development.

<div align="center">

Built with React, MediaPipe, TensorFlow.js, and Computer Vision.

</div>
