Here’s your **README.md rewritten with a professional design, your provided content, and an image at the top**. You can copy and paste it directly. Just make sure you save your image (e.g. screenshot) as `screenshot.png` in your repo root.

---

````markdown
# ✨ SkillSpark — OneChance + DreamSwap Hybrid

<img width="1785" height="967" alt="image" src="https://github.com/user-attachments/assets/83049f75-6398-4a99-b2cb-55b619699782" />


*AI-powered talent discovery and skill-swapping platform to help students and job-seekers showcase hidden talents and learn new skills.*

- **🎥 OneChance:** Upload a 30–60s talent video — *only once per week!*  
- **🔄 DreamSwap:** Offer one skill and request another — AI matches you with the best partners.  
- **🤖 AI Powered:** Automatic talent detection and intelligent skill matching.

---

## 🚀 Live Demo & Repo
- **Live App:** [https://skill-swap-self.vercel.app/](https://skill-swap-self.vercel.app/)  
- **Source Code:** [https://github.com/kottanaindrakiran/SkillSwap-.git](https://github.com/kottanaindrakiran/SkillSwap-.git)  

---

## 🌟 Features

- **AI Talent Recognition** — detect skill type from video/audio/text  
- **AI Skill Matching** — connect learners and mentors instantly  
- **Weekly Upload Limit** — keeps content high-quality  
- **User Profiles** — skills, badges, followers  
- **Leaderboard** — top mentors and creators every week  
- **Secure Auth** — Supabase OTP/email login  
- **Real-time Suggestions** — AI ranks top 5 matches  

---

## 🛠 Tech Stack

### Frontend (`/frontend`)
- [React + Vite](https://vitejs.dev/)  
- [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/)  
- Supabase Auth (OTP / Email)  
- **Deploy:** Vercel / Netlify  

### Backend (`/backend`)
- Supabase DB + Edge Functions  
- Weekly video upload validation  
- SkillSwap matching logic  
- Optional **Node.js APIs** for chat/recommendations  
- **Deploy:** Supabase / Render / Heroku  

### AI Module (`/ai`)
- Google Colab + Flask/FastAPI  
- **Talent Recognition Model:** detects skill category from video/audio/text  
- **Skill Matching AI:** ranks people by skill relevance  
- **Deploy:** Ngrok (dev) / Render (prod)  

---

## 🧠 AI Module Details (`/ai`)

**Files:**
- `app.py` — Flask/FastAPI endpoints  
- `model.py` — ML logic for detection + matching  
- `requirements.txt` — dependencies (Flask, OpenCV, PyTorch/TF, etc.)

**Endpoints:**
1. `POST /detect-skill` → `{ "skill": "singing" }`  
2. `POST /match-skill` → `{ "matches": [...] }`  

---

## 🗄 Database Schema

- **users** → (id, name, email, bio, skill_tags, video_url)  
- **skills** → (user_id, skill_name, level, category)  
- **requests** → (user_id, offer_skill, want_skill)  
- **matches** → (request_id, matched_user_id, score)  

---

## 🏗 Deployment Plan

| Module   | Platform               | Description                          |
|----------|------------------------|--------------------------------------|
| Frontend | Vercel / Netlify       | React + Tailwind hosting              |
| Backend  | Supabase / Render      | Auth + DB + Edge Functions            |
| AI Model | Colab + Ngrok / Render | Flask API for talent & skill matching |

---

## 🖥 How to Run Locally

### 1. Clone the Repo
```bash
git clone https://github.com/kottanaindrakiran/SkillSwap-.git
cd SkillSwap-
````

### 2. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Setup Backend

* Configure Supabase project and database tables
* Add environment variables to `.env`

### 4. Setup AI Module

```bash
cd ai
pip install -r requirements.txt
python app.py
```

For testing, expose via Ngrok:

```bash
ngrok http 5000
```
