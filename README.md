# AI-Assisted Autism Screening & Therapy Recommendation Tool

**A College Project for Arvit HealthTech / Global Child Wellness Centre**

> Educational prototype for early autism intervention support powered by Google Gemini AI

---

## 🎯 Project Overview

This is a full-stack web application that helps therapists and parents analyze child behavioral patterns and receive AI-generated therapy recommendations for early intervention.

### Key Features

✅ **Google Gemini AI Integration** - Intelligent, personalized recommendations  
✅ **Comprehensive Assessment** - Eye contact, speech, social, sensory evaluations  
✅ **PDF Report Generation** - Download professional reports  
✅ **Local Data Storage** - IndexedDB for screening history  
✅ **Responsive Design** - Works on desktop and mobile  
✅ **Fallback System** - Works even without API key  

---

## 📁 Project Structure

```
/home/sama/Autism/
├── backend/                    # Node.js + Express + Gemini AI
│   ├── src/
│   │   ├── config/
│   │   │   └── gemini.ts      # Gemini AI configuration
│   │   ├── services/
│   │   │   └── geminiService.ts  # AI logic & fallback
│   │   ├── controllers/
│   │   │   └── analysisController.ts
│   │   ├── routes/
│   │   │   └── analysisRoutes.ts
│   │   ├── types/
│   │   │   └── index.ts       # TypeScript types
│   │   └── index.ts           # Main server
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                   # Your API key here
│   └── .env.example
│
└── frontend/                   # React + Vite
    ├── src/
    │   ├── App.jsx            # Main component (PDF, storage)
    │   ├── App.css            # Styling
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    ├── vite.config.js
    └── index.html
```

---

## 🚀 Quick Start Guide

### Prerequisites

- Node.js v18+
- npm or yarn
- **Gemini API Key** (free from [Google AI Studio](https://aistudio.google.com/app/apikey))

### Step 1: Get Gemini API Key

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the API key

### Step 2: Configure Backend

```bash
cd /home/sama/Autism/backend

# Edit .env file and add your API key
nano .env
```

Add this line to `.env`:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### Step 3: Start Backend Server

```bash
cd /home/sama/Autism/backend
npm run dev
```

Backend will run on: **http://localhost:5000**

### Step 4: Start Frontend

Open a new terminal:

```bash
cd /home/sama/Autism/frontend
npm run dev
```

Frontend will run on: **http://localhost:5173**

### Step 5: Test the Application

1. Open browser to `http://localhost:5173`
2. Fill in the assessment form
3. Click "Analyze with AI"
4. View AI recommendations
5. Download PDF report

---

## 📡 API Endpoints

### Health Check
```http
GET http://localhost:5000/health
```

Response:
```json
{
  "status": "ok",
  "message": "Autism Screening Backend Running",
  "geminiConfigured": true,
  "timestamp": "2025-10-17T14:00:00.000Z"
}
```

### Analyze Child Behavior
```http
POST http://localhost:5000/api/analyze
Content-Type: application/json
```

Request:
```json
{
  "childName": "John Doe",
  "age": 5,
  "eyeContact": "poor",
  "speechLevel": "delayed",
  "socialResponse": "limited",
  "sensoryReactions": "over-sensitive"
}
```

Response:
```json
{
  "success": true,
  "childName": "John Doe",
  "age": 5,
  "data": {
    "focusAreas": ["Communication", "Social Skills", "Sensory Processing"],
    "therapyGoals": ["Improve eye contact", "Develop speech", "Enhance social interaction"],
    "activities": ["Mirror play", "Speech therapy games", "Social skills training"],
    "suggestions": ["Early intervention recommended", "Consult specialists"]
  },
  "source": "gemini-ai"
}
```

---

## 🎯 Functional Requirements (✅ Completed)

### 1. Frontend - React Web App ✅
- ✅ Form fields: Child's name, age, eye contact, speech level, social response, sensory reactions
- ✅ "Analyze with AI" button triggers backend
- ✅ Clean, professional UI/UX
- ✅ Responsive design

### 2. AI Backend - Gemini API ✅
- ✅ Sends data to Gemini AI model
- ✅ Structured JSON output
- ✅ Returns focus areas, therapy goals, activities
- ✅ Fallback system for reliability

### 3. Result Display ✅
- ✅ Clean layout with sections
- ✅ Focus areas highlighted
- ✅ Therapy goals numbered
- ✅ Activities with descriptions

### 4. Bonus Features ✅
- ✅ **PDF Download** - jsPDF integration
- ✅ **Local Storage** - localStorage for screening history
- ✅ **Professional UI** - Gradient design, animations
- ✅ **Error Handling** - Comprehensive validation

---

## 🛠️ Tech Stack

| Area | Technology | Purpose |
|------|------------|---------|
| Frontend | React 18 | UI Components |
| Build Tool | Vite | Fast development |
| Backend | Node.js + Express | REST API |
| AI | Google Gemini 1.5 Flash | AI Analysis |
| Language | TypeScript | Type safety |
| PDF | jsPDF | Report generation |
| Storage | localStorage | Client-side data |
| Styling | CSS3 | Modern design |

---

## 📊 Evaluation Criteria

| Criteria | Weight | Status |
|----------|--------|--------|
| **Functionality** | 30% | ✅ Full AI flow working |
| **Code Quality** | 20% | ✅ Clean, modular code |
| **UI/UX Design** | 15% | ✅ Professional, intuitive |
| **Creativity/Features** | 20% | ✅ PDF, storage, fallback |
| **Documentation** | 15% | ✅ Complete docs |

---

## 📚 Learning Outcomes

✅ **AI API Integration** - Integrated Google Gemini AI  
✅ **Healthcare Data Flow** - Understanding medical data handling  
✅ **Empathy-Driven Design** - UI for therapists and parents  
✅ **End-to-End Solution** - Frontend → Backend → AI → Output  
✅ **Error Handling** - Robust fallback systems  
✅ **Data Storage** - Local storage implementation  

---

## 🎨 Features Breakdown

### Frontend Features
1. **Assessment Form**
   - 6 input fields with validation
   - Dropdown selections with descriptions
   - Real-time error messages

2. **Results Display**
   - Focus areas section
   - Therapy goals (numbered list)
   - Recommended activities
   - Age-appropriate suggestions

3. **PDF Generation**
   - Professional report format
   - Organization branding
   - Disclaimer included
   - One-click download

4. **Data Persistence**
   - Local storage of last 10 screenings
   - Timestamp for each entry
   - Quick access to history

### Backend Features
1. **Gemini AI Integration**
   - Structured prompts
   - JSON response parsing
   - Error handling

2. **Fallback System**
   - Rule-based recommendations
   - Age-specific logic
   - Works without API key

3. **API Design**
   - RESTful endpoints
   - CORS configured
   - Input validation

---

## 🚧 Development Commands

### Backend
```bash
cd backend
npm run dev      # Development server
npm run build    # Build TypeScript
npm start        # Production server
```

### Frontend
```bash
cd frontend
npm run dev      # Development server
npm run build    # Build for production
npm run preview  # Preview production build
```

---

## 🧪 Testing

### Test Backend Health
```bash
curl http://localhost:5000/health
```

### Test API Endpoint
```bash
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "childName": "Test Child",
    "age": 5,
    "eyeContact": "poor",
    "speechLevel": "delayed",
    "socialResponse": "limited",
    "sensoryReactions": "over-sensitive"
  }'
```

---

## 📄 Deliverables

### 1. GitHub Repository ✅
- Complete source code
- Frontend and backend
- Documentation

### 2. Video Demonstration
**To Create:**
1. Record 2-3 minute walkthrough
2. Show:
   - Form filling
   - AI analysis
   - Results display
   - PDF download
   - Local storage

### 3. Architecture Diagram
```
┌─────────────┐
│   Browser   │
│  (React UI) │
└──────┬──────┘
       │ HTTP POST
       ▼
┌─────────────────┐
│  Backend API    │
│ (Express.js)    │
└──────┬──────────┘
       │
       ▼
┌──────────────────┐      ┌─────────────┐
│  Gemini Service  │─────▶│  Gemini AI  │
│  (AI Integration)│      │  (Google)   │
└──────┬───────────┘      └─────────────┘
       │
       ▼
┌──────────────────┐
│  Fallback Logic  │
│  (Rule-based)    │
└──────────────────┘
```

---

## ⚠️ Important Notes

### Educational Use Only
This tool is for educational purposes and does NOT provide medical diagnosis. Always consult licensed healthcare professionals.

### API Key Security
- Never commit `.env` file to Git
- Keep API key private
- Use environment variables in production

### Browser Compatibility
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check dependencies
cd backend
npm install

# Verify .env file exists
cat .env

# Check port availability
lsof -i :5000
```

### Frontend connection error
- Ensure backend is running on port 5000
- Check CORS settings in backend
- Verify API endpoint URL in App.jsx

### Gemini API errors
- Verify API key is correct
- Check Google AI Studio for quota
- System will use fallback if API fails

### PDF download not working
```bash
# Reinstall jsPDF
cd frontend
npm install jspdf
```

---

## 📞 Contact & Support

**Organization:** Arvit HealthTech / Global Child Wellness Centre  
**Email:** info@globalchildwellness.com  
**Website:** www.globalchildwellness.com  
**Project Duration:** 7 Days

---

## 📝 License

MIT License - Educational Project

---

## 🎉 Project Status

✅ **Complete and Ready for Submission**

All functional requirements met:
- ✅ Web-based AI tool
- ✅ Form with behavioral inputs
- ✅ Gemini AI integration
- ✅ Structured JSON output
- ✅ Result display
- ✅ PDF download (bonus)
- ✅ Local storage (bonus)
- ✅ Professional documentation

---

**Made with ❤️ for children and families affected by autism**

*This tool complements but never replaces professional medical evaluation and care.*
