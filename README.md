# 🚀 Credify — AI Video-Based Loan Onboarding System

## 📌 Overview

Credify is an AI-powered, video-based loan onboarding platform that replaces traditional form-based lending journeys with a **real-time, conversational, and intelligent experience**.

Instead of filling long forms, users interact with an AI loan officer through a live video session. The system captures user intent, verifies identity, processes financial information, and generates personalized loan offers — all in real time.

---

## ❗ Problem Statement

Traditional digital lending systems face several critical challenges:

* High drop-off rates (60–70%) due to long and complex forms
* Lack of real-time verification of user identity and intent
* Increased fraud and misrepresentation risks
* Manual KYC processes leading to higher operational costs
* Poor contextual understanding of users

---

## ✅ Solution

Credify solves these problems by introducing:

* 🎥 **Video-based onboarding**
* 🧠 **AI-driven conversational interface**
* 🎤 **Real-time speech-to-text processing**
* 📄 **Automated document verification**
* ⚡ **Instant risk assessment and offer generation**
* 🔐 **Audit-ready, compliant system**

---

## 🏗️ Tech Stack

### Frontend

* Next.js 14 (App Router)
* TypeScript
* Tailwind CSS

### Backend

* FastAPI (Python, async)
* Motor (MongoDB async driver)

### Database

* MongoDB Atlas

### AI & ML Stack

* Groq (LLaMA 3.3 70B) — Conversational AI Agent
* Deepgram — Real-time Speech-to-Text
* Gemini — OCR for document verification

---

## 🔄 System Flow

1. User starts application → session created
2. Camera & mic activated
3. User speaks → audio streamed via WebSocket
4. Deepgram converts speech → text
5. Groq AI processes text → responds dynamically
6. System progresses through onboarding stages
7. Document verification via OCR
8. Risk engine evaluates eligibility
9. Personalized loan offer generated

---

## ⚙️ How to Run the Project (Step-by-Step)

Follow these steps exactly:

---

### 1️⃣ Clone the repository

```bash
git clone https://github.com/rushikeshbathe096/Credify
cd Credify
```

---

### 2️⃣ Backend Setup

#### Create virtual environment

```bash
python -m venv venv
```

#### Activate it

```bash
source venv/bin/activate
```

(Windows: `venv\Scripts\activate`)

---

#### Install dependencies

```bash
pip install -r requirements.txt
```

---

#### Create `.env` file in root

```env
MONGODB_URL=your_mongodb_url
JWT_SECRET=your_secret_key
GROQ_API_KEY=your_groq_key
DEEPGRAM_API_KEY=your_deepgram_key
GEMINI_API_KEY=your_gemini_key
FRONTEND_URL=http://localhost:3000
```

---

### 3️⃣ MongoDB Setup

* Create a cluster (MongoDB Atlas)
* Add a database user
* Whitelist IP:

```
0.0.0.0/0
```

* Use connection string:

```
mongodb+srv://username:password@cluster.mongodb.net/credify
```

---

### 4️⃣ Run Backend

```bash
uvicorn app.main:app --reload
```

Test:

```
http://localhost:8000/health
```

---

### 5️⃣ Frontend Setup

Open new terminal:

```bash
cd frontend
npm install
```

---

#### Create `.env.local`

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

---

### 6️⃣ Run Frontend

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

## 🧪 Testing the Flow

1. Click **Start My Application**
2. Allow camera & microphone access
3. Speak → transcript should appear
4. AI responds in real-time
5. Progress bar updates
6. Complete flow → get loan offer

---

## 🎯 Final Outcome

Credify delivers:

* Faster onboarding
* Lower fraud risk
* Better user experience
* Real-time intelligent decision-making
