# 🚀 QUICK START - Autism Screening Tool

## ✅ Current Status

**Backend:** Ready to start ✅  
**Frontend:** Ready to start ✅  
**Dependencies:** Installed ✅  

---

## 📝 3-Step Setup

### Step 1: Get Gemini API Key (2 minutes)

1. Visit: https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click **"Create API Key"**
4. Copy the key

### Step 2: Configure & Start Backend (1 minute)

```bash
# Edit .env file
cd /home/sama/Autism/backend
nano .env

# Add your API key:
# GEMINI_API_KEY=your_actual_key_here

# Start backend
npm run dev
```

Backend runs on: **http://localhost:5000** ✅

### Step 3: Start Frontend (30 seconds)

Open a **new terminal**:

```bash
cd /home/sama/Autism/frontend
npm run dev
```

Frontend runs on: **http://localhost:5173** ✅

---

## 🎯 Test the App

1. Open browser: **http://localhost:5173**
2. Fill the form:
   - Child Name: Test Child
   - Age: 5
   - Select options for all fields
3. Click **"Analyze with AI"**
4. View results!
5. Download PDF report

---

## 📡 Quick Tests

### Test Backend
```bash
curl http://localhost:5000/health
```

Should return:
```json
{
  "status": "ok",
  "geminiConfigured": true
}
```

### Test API
```bash
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "childName": "Test",
    "age": 5,
    "eyeContact": "poor",
    "speechLevel": "delayed",
    "socialResponse": "limited",
    "sensoryReactions": "over-sensitive"
  }'
```

---

## ✨ Features

### ✅ Working Features
- **AI Analysis** - Powered by Gemini AI
- **PDF Download** - Professional reports
- **Local Storage** - Last 10 screenings saved
- **Fallback System** - Works without API key
- **Responsive Design** - Mobile & desktop

### 📊 What It Does
1. Collects behavioral data
2. Sends to Gemini AI
3. Gets personalized recommendations
4. Displays:
   - Focus areas
   - Therapy goals (3 goals)
   - Activities (2+ detailed activities)
   - Age-appropriate suggestions
5. Download as PDF
6. Save locally

---

## 🎓 Project Requirements Met

✅ **Functional Requirements**
- Web-based AI tool
- Form with all 6 fields
- AI backend (Gemini)
- Structured JSON output
- Clean result display

✅ **Bonus Points**
- PDF download ✅
- Local data storage ✅
- Professional UI/UX ✅

✅ **Tech Stack**
- Frontend: React + Vite
- Backend: Node.js + Express
- AI: Google Gemini API
- Database: localStorage

---

## 📚 Documentation Files

1. **README.md** - Complete project documentation
2. **QUICKSTART.md** - This file (quick setup)
3. **backend/.env.example** - Environment template
4. **Architecture diagram** - In README.md

---

## 🐛 Common Issues

### Backend not starting?
```bash
cd backend
npm install
cat .env  # Check if file exists
```

### Frontend errors?
```bash
cd frontend
npm install
```

### Can't connect to backend?
- Make sure backend is running (port 5000)
- Check browser console for errors

### API key not working?
- The app will use fallback mode (still works!)
- Check API key at Google AI Studio

---

## 📞 Important Links

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5000
- **Health Check:** http://localhost:5000/health
- **Get API Key:** https://aistudio.google.com/app/apikey

---

## 🎉 You're Ready!

Your project is complete and ready to run. Just:
1. Add Gemini API key
2. Start backend
3. Start frontend
4. Test and demo!

**For video demo:**
- Show form filling
- Show AI analysis
- Show results
- Download PDF
- Show local storage history

---

**Organization:** Arvit HealthTech / Global Child Wellness Centre  
**Duration:** 7 Days  
**Status:** ✅ Complete & Ready for Submission
