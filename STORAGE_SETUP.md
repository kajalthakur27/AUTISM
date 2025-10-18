# External Storage Configuration

## Overview
The autism screening application now supports external data storage via API. Child screening data can be automatically saved to your configured storage service while maintaining local memory backup.

## Configuration

### Environment Variables
Add these variables to your `.env` file:

```env
# External Storage API Configuration
STORAGE_API_URL=https://api.your-storage-service.com/autism-screenings
STORAGE_API_KEY=your_storage_api_key_here
```

### Storage Service Features
- **Automatic fallback**: If external storage fails, data is saved locally in memory
- **Dual retrieval**: Attempts to fetch from external storage first, then local memory
- **Flexible API**: Supports various storage service response formats

## API Endpoints

### Save Screening Data
When a child analysis is performed, the system will:
1. Try to save to external storage API
2. Fallback to local memory if external storage fails
3. Continue analysis regardless of storage outcome

### Retrieve Screenings
- `GET /api/screenings` - Returns screenings from external storage or memory
- `GET /api/screenings/:id` - Returns specific screening from external or local storage

## Expected Storage API Format

### POST Request (Save Data)
```json
{
  "childName": "John Doe",
  "age": 5,
  "eyeContact": "2",
  "speechLevel": "3", 
  "socialResponse": "1",
  "sensoryReactions": "2",
  "geminiResults": {
    "riskLevel": "moderate",
    "recommendations": ["..."],
    "exercises": ["..."]
  },
  "source": "gemini-ai"
}
```

### POST Response (Save Data)
```json
{
  "id": "unique-screening-id",
  "childName": "John Doe",
  "age": 5,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  // ... other fields
}
```

### GET Response (Retrieve Data)
```json
{
  "screenings": [
    {
      "id": "unique-screening-id",
      "childName": "John Doe",
      "age": 5,
      "geminiResults": { "..." },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Running the Application

1. **Configure storage** (optional):
   ```bash
   # Edit .env file
   STORAGE_API_URL=https://your-storage-api.com/screenings
   STORAGE_API_KEY=your-api-key
   ```

2. **Start backend**:
   ```bash
   cd backend
   npm run dev
   # Server: http://localhost:5000
   ```

3. **Start frontend**:
   ```bash
   cd frontend  
   npm run dev
   # Frontend: http://localhost:5174
   ```

## Status Messages
- ✅ External storage service configured - Storage API is ready
- ⚠️ External storage not configured - Using local memory only
- 🌐 Screening saved to external storage - Data saved remotely
- 💾 Screening saved to memory - Data saved locally (fallback)

## Benefits
- **Persistent storage**: Data survives server restarts when external API is configured
- **Reliability**: Local memory backup ensures no data loss
- **Flexibility**: Works with any REST API that accepts JSON data
- **Scalability**: External storage can handle large datasets and multiple instances