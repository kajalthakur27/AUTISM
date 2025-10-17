# MongoDB Setup Guide

## 📦 What was added:

- **MongoDB integration** using Mongoose ODM
- **Screening model** to store child assessment records
- **New API endpoints** to fetch stored screenings
- **Automatic saving** of all screening results to database

## 🗄️ Database Schema:

Each screening record stores:
- Child name
- Age
- Assessment scores (eyeContact, speechLevel, socialResponse, sensoryReactions)
- Gemini AI results (assessment, riskLevel, focusAreas, therapyGoals, activities, suggestions)
- Source (gemini-ai or fallback)
- Timestamps (createdAt, updatedAt)

## 🚀 How to Install MongoDB:

### Option 1: Install MongoDB Locally (Ubuntu/Debian)

```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -sc)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod

# Enable MongoDB to start on boot
sudo systemctl enable mongod

# Check status
sudo systemctl status mongod
```

### Option 2: Use MongoDB Atlas (Cloud - FREE)

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create a free account
3. Create a free cluster (M0 tier - no credit card required)
4. Get your connection string
5. Update `backend/.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/autism_screening?retryWrites=true&w=majority
   ```

### Option 3: Use Docker

```bash
# Pull MongoDB image
docker pull mongo:latest

# Run MongoDB container
docker run -d \
  --name autism-mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_DATABASE=autism_screening \
  mongo:latest

# Verify it's running
docker ps
```

## 🔧 Current Configuration:

File: `backend/.env`
```
MONGODB_URI=mongodb://localhost:27017/autism_screening
```

## 📡 New API Endpoints:

### 1. Get All Screenings
```bash
GET http://localhost:5000/api/screenings

# With query parameters:
GET http://localhost:5000/api/screenings?limit=20
GET http://localhost:5000/api/screenings?childName=John
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "childName": "John Doe",
      "age": 5,
      "eyeContact": 3,
      "speechLevel": 2,
      "socialResponse": 3,
      "sensoryReactions": 4,
      "results": {
        "assessment": "...",
        "riskLevel": "Moderate",
        "focusAreas": [...],
        "therapyGoals": [...],
        "activities": [...],
        "suggestions": [...]
      },
      "source": "gemini-ai",
      "createdAt": "2025-10-18T10:30:00.000Z",
      "updatedAt": "2025-10-18T10:30:00.000Z"
    }
  ]
}
```

### 2. Get Screening by ID
```bash
GET http://localhost:5000/api/screenings/:id
```

## ⚙️ Behavior:

1. **With MongoDB running:**
   - All screenings are saved to database
   - You can retrieve historical records
   - Data persists between server restarts

2. **Without MongoDB:**
   - Server still works normally
   - Screenings are processed by Gemini AI
   - Results returned to frontend
   - ⚠️ Data is NOT saved (graceful degradation)
   - Console shows: `⚠️ Continuing without database - records will not be saved`

## 🧪 Testing:

```bash
# Test analyze endpoint (creates a record)
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "childName": "Test Child",
    "age": 5,
    "eyeContact": 3,
    "speechLevel": 2,
    "socialResponse": 4,
    "sensoryReactions": 3
  }'

# Get all screenings
curl http://localhost:5000/api/screenings

# Get specific screening (replace ID)
curl http://localhost:5000/api/screenings/507f1f77bcf86cd799439011
```

## 📊 Using MongoDB Compass (GUI):

1. Download from https://www.mongodb.com/try/download/compass
2. Connect to: `mongodb://localhost:27017`
3. Select database: `autism_screening`
4. View collection: `screenings`

## 🔍 MongoDB Queries (via mongosh):

```bash
# Connect to MongoDB
mongosh

# Switch to database
use autism_screening

# View all screenings
db.screenings.find()

# Count screenings
db.screenings.countDocuments()

# Find by child name
db.screenings.find({ childName: "John Doe" })

# Find recent screenings (last 24 hours)
db.screenings.find({ 
  createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) } 
})

# Get statistics
db.screenings.aggregate([
  { $group: { 
    _id: "$results.riskLevel", 
    count: { $sum: 1 } 
  }}
])
```

## 🛠️ Troubleshooting:

### MongoDB not starting?
```bash
# Check status
sudo systemctl status mongod

# View logs
sudo tail -f /var/log/mongodb/mongod.log

# Restart
sudo systemctl restart mongod
```

### Connection refused?
- Verify MongoDB is running: `sudo systemctl status mongod`
- Check port 27017 is open: `netstat -tlnp | grep 27017`
- Try using MongoDB Atlas cloud connection instead

### Data not saving?
- Check backend logs for database connection errors
- Verify MONGODB_URI in `.env` is correct
- The app will continue working without MongoDB (graceful failure)

## 🎯 Next Steps:

1. **Install MongoDB** using one of the options above
2. **Restart backend server**: `cd backend && npm run dev`
3. **Verify connection**: Look for `✅ MongoDB connected successfully` in console
4. **Test it**: Submit a screening and check `GET /api/screenings`

## 📝 Notes:

- MongoDB is **optional** - the app works without it
- All screening data is stored with full Gemini AI results
- Timestamps are automatically added (createdAt, updatedAt)
- Indexes are created for faster queries on childName and createdAt
- Connection errors are handled gracefully (app continues running)
