# 🏋️ AI Gym Form Corrector

<div align="center">

### Real-Time AI-Powered Exercise Recognition & Form Analysis

A browser-based fitness assistant that uses **Computer Vision**, **MediaPipe Pose Estimation**, and a **GRU Deep Learning model** to recognize exercises, count repetitions, analyze movement, and provide real-time form feedback.

[![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react\&logoColor=white)](https://react.dev/)
[![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-ML_Inference-FF6F00?logo=tensorflow\&logoColor=white)](https://www.tensorflow.org/js)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Pose_Estimation-0097A7?logo=google\&logoColor=white)](https://ai.google.dev/edge/mediapipe)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Styling-06B6D4?logo=tailwindcss\&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel\&logoColor=white)](https://gym-form-corrector.vercel.app/)

### 🚀 [Live Demo](https://gym-form-corrector.vercel.app/)

</div>

---

## 📌 Overview

**AI Gym Form Corrector** is a real-time fitness web application that combines **pose estimation, feature engineering, temporal deep learning, and rule-based biomechanics**.

The application captures exercise movement through the user's webcam, detects body landmarks using **MediaPipe PoseLandmarker**, and processes movement sequences using a trained **GRU neural network** running directly in the browser with **TensorFlow.js**.

The system currently supports:

* 💪 **Bicep Curl**
* 🤸 **Push-up**
* 🏋️ **Squat**

The final selected GRU model achieved **95% video-level test accuracy** on held-out evaluation videos.

---

## ✨ Key Features

* 🎥 Real-time webcam-based exercise analysis
* 🧍 **33-point body pose detection** using MediaPipe
* 🧠 GRU-based temporal exercise classification
* 🎯 **95% video-level test accuracy**
* 🔢 Automatic repetition counting
* 📐 Joint-angle based form analysis
* 💬 Real-time exercise feedback
* 🦴 Live pose skeleton visualization
* 📊 Workout session results and form scores
* 📈 Progress tracking across workout sessions
* 💾 Local browser storage for workout history
* 🔒 Client-side video processing
* ⚡ TensorFlow.js browser-based model inference
* 📱 Responsive React interface
* ☁️ Production deployment on Vercel

---

## 🧠 How It Works

The application follows this pipeline:

**Webcam Input → Pose Detection → Feature Extraction → 30-Frame Sequence → GRU Classification → Form Analysis → Rep Counting → Live Feedback**

### 1. Pose Detection

MediaPipe PoseLandmarker detects **33 body landmarks** from each webcam frame.

### 2. Pose Normalization

Detected landmarks are normalized using:

* Hip-centred coordinates
* Torso-scale normalization

This helps reduce the effect of body position and distance from the camera.

### 3. Feature Engineering

Each video frame is converted into a **210-dimensional feature vector**:

| Feature                    | Dimensions |
| -------------------------- | ---------: |
| Landmark coordinates       |         99 |
| Joint-angle features       |         12 |
| Landmark velocity features |         99 |
| **Total**                  |    **210** |

### 4. Temporal Sequence

The system maintains a rolling sequence of:

```text
30 Frames × 210 Features
```

Model input shape:

```text
(30, 210)
```

### 5. GRU Classification

The sequence is standardized using saved scaler parameters and passed to the trained **TensorFlow.js GRU model**.

The model predicts one of three exercise classes:

```text
Bicep Curl
Push-up
Squat
```

### 6. Rep Counting & Form Analysis

After pose detection:

* Exercise-specific joint angles are calculated
* Movement states are tracked
* Completed repetitions are counted
* Form rules analyze exercise technique
* Feedback is shown to the user in real time

---

## 🎯 Model Performance

| Metric                        |    Result |
| ----------------------------- | --------: |
| Exercise Classes              |         3 |
| Features per Frame            |       210 |
| Sequence Length               | 30 Frames |
| Pose Landmarks                |        33 |
| **Video-Level Test Accuracy** |   **95%** |

The GRU model analyzes **movement across multiple frames** instead of classifying a single image, allowing it to capture the temporal characteristics of each exercise.

---

## 🛠️ Tech Stack

| Category        | Technology               |
| --------------- | ------------------------ |
| Frontend        | React.js                 |
| Build Tool      | Vite                     |
| Styling         | Tailwind CSS             |
| Pose Estimation | MediaPipe PoseLandmarker |
| Deep Learning   | GRU Neural Network       |
| ML Inference    | TensorFlow.js            |
| Computer Vision | MediaPipe Tasks Vision   |
| Language        | JavaScript               |
| Browser Storage | LocalStorage             |
| Deployment      | Vercel                   |

---

## 📁 Project Structure

```text
gym-form-corrector/
│
├── public/
│   │
│   ├── images/
│   │   ├── logo.jpeg
│   │   ├── hero.jpg
│   │   ├── curl.jpg
│   │   ├── pushup.jpg
│   │   └── squat.jpg
│   │
│   ├── model/
│   │   ├── model.json
│   │   └── group1-shard1of1.bin
│   │
│   └── scaler_params.json
│
├── src/
│   │
│   ├── components/
│   │   ├── Icons.jsx
│   │   └── Navbar.jsx
│   │
│   ├── hooks/
│   │   ├── useExerciseModel.js
│   │   └── useMediaPipe.js
│   │
│   ├── lib/
│   │   ├── constants.js
│   │   ├── featureExtraction.js
│   │   ├── formRules.js
│   │   └── repCounter.js
│   │
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── ExercisePage.jsx
│   │   ├── AnalysisPage.jsx
│   │   ├── ResultsPage.jsx
│   │   ├── ProgressPage.jsx
│   │   └── HowItWorksPage.jsx
│   │
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.js
├── vercel.json
├── vite.config.js
└── README.md
```

### Important Files

| File                   | Purpose                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `useMediaPipe.js`      | Loads MediaPipe PoseLandmarker and processes webcam frames       |
| `useExerciseModel.js`  | Loads the TensorFlow.js GRU model and performs predictions       |
| `featureExtraction.js` | Converts landmarks into the 210-feature model input              |
| `formRules.js`         | Contains exercise-specific form analysis rules                   |
| `repCounter.js`        | Handles repetition counting using movement states                |
| `constants.js`         | Stores pose indices, configuration, and shared constants         |
| `AnalysisPage.jsx`     | Integrates webcam, AI inference, form analysis, and rep counting |
| `ProgressPage.jsx`     | Displays stored workout progress                                 |
| `scaler_params.json`   | Stores training-time feature normalization parameters            |
| `model.json`           | TensorFlow.js GRU model definition                               |
| `group1-shard1of1.bin` | Trained model weights                                            |

---

## 💻 Run Locally

### Prerequisites

Make sure you have installed:

* Node.js
* npm
* Git
* A modern browser with webcam access

### 1. Clone the Repository

```bash
git clone https://github.com/rohaanahmadtech/gym-form-corrector.git
```

### 2. Navigate to the Project

```bash
cd gym-form-corrector
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

Allow camera permission when prompted.

---

## 🏃 How to Use

1. Open the application.
2. Click **Start Training**.
3. Choose an exercise:

   * Bicep Curl
   * Push-up
   * Squat
4. Allow webcam access.
5. Position yourself according to the camera instructions.
6. Start performing the exercise.
7. The application will provide:

   * Exercise recognition
   * Pose tracking
   * Rep counting
   * Form analysis
   * Live feedback
8. Complete the session to view your results and progress.

---

## 📷 Recommended Camera Setup

For better pose detection:

### Bicep Curl

```text
Side View
Full body visible
Camera approximately at waist height
```

### Push-up

```text
Side View
Low camera position
Full body visible
```

### Squat

```text
Side View
Full body visible
Camera approximately at hip height
```

For the best results, use a **well-lit environment** and make sure important body joints remain visible.

---

## 🔒 Privacy

Pose estimation and AI inference are performed **inside the user's browser**.

The webcam feed is processed locally for real-time analysis rather than being uploaded to a dedicated inference server.

---

## 🚀 Production Build

Create a production build using:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## ☁️ Deployment

The application is deployed on **Vercel**.

### Live Application

🔗 **https://gym-form-corrector.vercel.app/**

The project includes a `vercel.json` configuration for deployment requirements related to browser-based MediaPipe processing.

---

## 🧩 Core AI Components

### MediaPipe PoseLandmarker

MediaPipe detects the user's body pose and provides **33 landmarks** containing spatial coordinates and visibility information.

### Feature Extraction

The raw landmarks are transformed into:

```text
Normalized Coordinates
        +
Joint Angles
        +
Movement Velocities
        ↓
210 Features / Frame
```

### GRU Model

A **Gated Recurrent Unit (GRU)** neural network processes a sequence of 30 frames.

GRUs are suitable for this task because exercise recognition depends on **movement over time**, not only a single body pose.

### Form Analysis

Exercise form is evaluated separately using interpretable joint-angle rules.

This allows the system to use:

```text
Deep Learning → Exercise Recognition

Rule-Based Logic → Form Analysis + Rep Counting
```

---

## ⚠️ Current Limitations

* Currently supports three exercises.
* Pose accuracy can be affected by poor lighting or camera placement.
* Important joints must remain visible to the camera.
* Form analysis uses predefined joint-angle rules.
* The classification model identifies exercise type rather than directly classifying correct vs incorrect form.
* The application is intended as an AI fitness project and is not medical advice or a replacement for a certified fitness professional.

---

## 🔮 Future Improvements

* Add more exercises
* Train a dedicated correct-vs-incorrect form classification model
* Detect specific form mistakes using learned models
* Personalized range-of-motion thresholds
* Voice-based real-time coaching
* User authentication
* Cloud-based workout history
* Advanced progress analytics
* Mobile/PWA optimization
* Personalized workout recommendations

---

## 👨‍💻 Developer

### Rohaan Ahmad

**Computer Science | AI / Machine Learning**

* 🌐 Portfolio: [devrohaan.vercel.app](https://devrohaan.vercel.app/)
* 💻 GitHub: [github.com/rohaanahmadtech](https://github.com/rohaanahmadtech)
* 🚀 Live Project: [gym-form-corrector.vercel.app](https://gym-form-corrector.vercel.app/)

---

<div align="center">

### ⭐ If you found this project useful, consider giving it a star!

**Built with React · MediaPipe · TensorFlow.js · GRU · Computer Vision**

</div>
