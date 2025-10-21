import React, { useState } from 'react';
import jsPDF from 'jspdf';
import EmotionDetection from './components/EmotionDetection';
import config from './config';
import './App.css';

function App() {
  const [formData, setFormData] = useState({
    childName: '',
    age: '',
    eyeContact: '',
    speechLevel: '',
    socialResponse: '',
    sensoryReactions: ''
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [savedData, setSavedData] = useState([]);
  const [emotionData, setEmotionData] = useState([]);
  const [showEmotionDetection, setShowEmotionDetection] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [hasCurrentSessionData, setHasCurrentSessionData] = useState(false);

  // Clear old localStorage data on page load and initialize session
  React.useEffect(() => {
    // Clear previous session data
    localStorage.removeItem('autism_screenings');
    setSavedData([]);
    setHasCurrentSessionData(false);
  }, []);

  // Utility function for fetch with timeout
  const fetchWithTimeout = async (url, options = {}, timeout = 60000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmotionDetected = async (emotion) => {
    setEmotionData(prev => [...prev, emotion]);
    
    // If this emotion detection includes a captured image, store it
    if (emotion.capturedImage) {
      setCapturedImage(emotion.capturedImage);
      
      // For uploaded images, don't hide the emotion detection automatically
      if (!emotion.isUploadedImage) {
        setShowEmotionDetection(false);
      }
      
      // Auto-analyze if we have form data, otherwise just store the emotion data
      if (formData.childName.trim()) {
        try {
          setLoading(true);
          setError('');
          
          const requestData = {
            childName: formData.childName,
            age: formData.age ? Number(formData.age) : undefined,
            eyeContact: formData.eyeContact || undefined,
            speechLevel: formData.speechLevel || undefined,
            socialResponse: formData.socialResponse || undefined,
            sensoryReactions: formData.sensoryReactions || undefined,
            emotionAnalysis: emotion,
            capturedImage: emotion.capturedImage
          };

          console.log('Sending emotion data to backend:', {
            childName: requestData.childName,
            hasImage: !!requestData.capturedImage,
            emotion: emotion.emotion,
            confidence: emotion.confidence
          });

          const response = await fetchWithTimeout(`${config.API_BASE_URL}${config.ENDPOINTS.ANALYZE}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
          }, 60000);

          const data = await response.json();

          if (data.success) {
            setResult(data);
            
            // Save to localStorage
            const newEntry = {
              ...data,
              timestamp: new Date().toISOString()
            };
            const updated = [newEntry, ...savedData].slice(0, 10);
            setSavedData(updated);
            localStorage.setItem('autism_screenings', JSON.stringify(updated));
            setHasCurrentSessionData(true); // Mark that we have current session data
          } else {
            setError(data.error || 'Analysis failed');
          }
        } catch (err) {
          console.error('Error analyzing emotion:', err);
          setError('Failed to analyze emotion. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const getEmotionSummary = () => {
    if (emotionData.length === 0) return null;
    
    const emotionCounts = {};
    emotionData.forEach(item => {
      emotionCounts[item.emotion] = (emotionCounts[item.emotion] || 0) + 1;
    });

    const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) => 
      emotionCounts[a] > emotionCounts[b] ? a : b
    );

    return {
      dominantEmotion,
      emotionCounts,
      totalDetections: emotionData.length,
      emotionHistory: emotionData
    };
  };

  const getEmotionEmoji = (emotion) => {
    // Add safety check for undefined/null emotion
    if (!emotion || typeof emotion !== 'string') {
      return '😐'; // Default neutral emoji
    }
    
    const emojiMap = {
      'happy': '😊',
      'sad': '😢', 
      'angry': '😠',
      'surprised': '😲',
      'fearful': '😰',
      'disgusted': '🤢',
      'neutral': '😐',
      'joy': '😄',
      'fear': '😨',
      'disgust': '🤮',
      'anger': '😡',
      'sadness': '😭',
      'surprise': '😯'
    };
    return emojiMap[emotion.toLowerCase()] || '😐';
  };

  const captureEmotionImage = () => {
    // Try to capture image from emotion detection component
    if (window.captureEmotionImage) {
      const image = window.captureEmotionImage();
      if (image) {
        setCapturedImage(image);
        return image;
      }
    }
    
    // Fallback: try to get from summary
    if (window.getEmotionSummary) {
      const summary = window.getEmotionSummary();
      if (summary && summary.capturedImage) {
        setCapturedImage(summary.capturedImage);
        return summary.capturedImage;
      }
    }
    return null;
  };

  const handlePhotoOnlyAnalysis = async () => {
    if (emotionData.length === 0) {
      setError('No photo analysis data available. Please upload or capture a photo first.');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);

    try {
      // Get the latest emotion data (most recent photo)
      const latestEmotion = emotionData[emotionData.length - 1];
      
      const requestData = {
        childName: 'Anonymous Child', // Default name for photo-only analysis
        age: 5, // Default age - could be made configurable
        emotionAnalysis: latestEmotion,
        capturedImage: latestEmotion.capturedImage,
        photoOnlyAnalysis: true // Flag to indicate this is photo-only
      };

      console.log('Sending photo-only analysis to backend:', {
        hasImage: !!requestData.capturedImage,
        emotion: latestEmotion.emotion,
        confidence: latestEmotion.confidence,
        photoOnly: true
      });

      const response = await fetchWithTimeout(`${config.API_BASE_URL}${config.ENDPOINTS.ANALYZE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      }, 60000);

      const data = await response.json();

      if (data.success) {
        setResult(data);
        
        // Save to localStorage with photo-only flag
        const newEntry = {
          ...data,
          timestamp: new Date().toISOString(),
          photoOnlyAnalysis: true
        };
        const updated = [newEntry, ...savedData].slice(0, 10);
        setSavedData(updated);
        localStorage.setItem('autism_screenings', JSON.stringify(updated));
        setHasCurrentSessionData(true); // Mark that we have current session data
      } else {
        setError(data.error || 'Photo analysis failed');
      }
    } catch (err) {
      console.error('Error in photo-only analysis:', err);
      setError('Failed to analyze photo. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);

    // Validation
    if (!formData.age || isNaN(Number(formData.age))) {
      setError('Please enter a valid age');
      setLoading(false);
      return;
    }

    try {
      // Capture image when analyzing
      const capturedImg = captureEmotionImage();
      
      // Get emotion summary if available
      const emotionSummary = getEmotionSummary();
      
      const requestData = {
        ...formData,
        age: Number(formData.age),
        ...(emotionSummary && { emotionAnalysis: emotionSummary })
      };

      const response = await fetchWithTimeout(`${config.API_BASE_URL}${config.ENDPOINTS.ANALYZE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      }, 60000);

      const data = await response.json();

      if (data.success) {
        setResult(data);
        
        // Save to localStorage
        const newEntry = {
          ...data,
          timestamp: new Date().toISOString()
        };
        const updated = [newEntry, ...savedData].slice(0, 10); // Keep last 10
        setSavedData(updated);
        localStorage.setItem('autism_screenings', JSON.stringify(updated));
        setHasCurrentSessionData(true); // Mark that we have current session data
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to connect to server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!result) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 70, 180);
    doc.text('Autism Screening Report', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Arvit HealthTech / Global Child Wellness Centre', pageWidth / 2, 28, { align: 'center' });
    
    // Child Info
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Child: ${result.childName}`, 20, 45);
    doc.text(`Age: ${result.age} years`, 20, 52);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 59);
    
    // Focus Areas
    doc.setFontSize(16);
    doc.setTextColor(40, 70, 180);
    doc.text('Focus Areas:', 20, 75);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    let y = 85;
    result.data.focusAreas.forEach((area, i) => {
      doc.text(`${i + 1}. ${area}`, 25, y);
      y += 7;
    });
    
    // Therapy Goals
    y += 8;
    doc.setFontSize(16);
    doc.setTextColor(40, 70, 180);
    doc.text('Therapy Goals:', 20, y);
    y += 10;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    result.data.therapyGoals.forEach((goal, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${goal}`, pageWidth - 50);
      lines.forEach(line => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 25, y);
        y += 7;
      });
    });
    
    // Activities
    y += 8;
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(16);
    doc.setTextColor(40, 70, 180);
    doc.text('Recommended Activities:', 20, y);
    y += 10;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    result.data.activities.forEach((activity, i) => {
      // Handle both string and object formats
      let activityText = '';
      if (typeof activity === 'string') {
        activityText = activity;
      } else if (typeof activity === 'object' && activity !== null) {
        activityText = `${activity.name || `Activity ${i + 1}`}`;
        if (activity.instructions) activityText += ` - ${activity.instructions}`;
        if (activity.materials) activityText += ` Materials: ${activity.materials}`;
        if (activity.durationFrequency) activityText += ` Duration: ${activity.durationFrequency}`;
      }
      
      const lines = doc.splitTextToSize(`${i + 1}. ${activityText}`, pageWidth - 50);
      lines.forEach(line => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 25, y);
        y += 7;
      });
    });
    
    // Disclaimer
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    y += 15;
    doc.setFontSize(10);
    doc.setTextColor(150, 0, 0);
    const disclaimer = 'IMPORTANT: This is an educational screening tool and does NOT replace professional medical diagnosis. Please consult licensed healthcare professionals for proper evaluation.';
    const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - 40);
    disclaimerLines.forEach(line => {
      doc.text(line, 20, y);
      y += 5;
    });
    
    // Save
    doc.save(`${result.childName}_Screening_Report.pdf`);
  };

  const resetForm = () => {
    setFormData({
      childName: '',
      age: '',
      eyeContact: '',
      speechLevel: '',
      socialResponse: '',
      sensoryReactions: ''
    });
    setResult(null);
    setError('');
    setEmotionData([]);
    setShowEmotionDetection(false);
    setCapturedImage(null);
    setSelectedHistoryItem(null);
    setShowHistory(false);
  };

  const viewHistoryItem = (item) => {
    setSelectedHistoryItem(item);
    setResult(item.result);
    setShowHistory(false);
    // Scroll to results
    setTimeout(() => {
      const resultsElement = document.querySelector('.results');
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
    if (showHistory) {
      setSelectedHistoryItem(null);
    }
  };

  return (
    <div className="app">
      <div className="container">
        {/* Header */}
        <div className="header">
          <div className="header-content">
            <div className="icon">�</div>
            <div className="header-text">
              <h1>AI-Assisted Autism Screening & Assessment</h1>
              <p className="subtitle">Professional Developmental Screening Tool Powered by Gemini AI</p>
              <div className="org-badge">
                🏢 Arvit HealthTech / Global Child Wellness Centre
              </div>
              <div className="ai-powered-badge">
                ⚡ Powered by Google Gemini AI
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="info-box">
          <h3>📋 About This Tool</h3>
          <p>
            This AI-powered screening tool helps therapists and parents analyze child behavioral
            patterns and receive personalized therapy recommendations powered by <strong>Google Gemini AI</strong>.
          </p>
          <div className="warning">
            <strong>⚠️ Important:</strong> This is for educational purposes only and does NOT provide 
            medical diagnosis. Always consult licensed clinicians.
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="form">
          <h2>Behavioral Assessment</h2>
          
          <div className="form-group">
            <label>Child's Name *</label>
            <input
              type="text"
              name="childName"
              value={formData.childName}
              onChange={handleChange}
              placeholder="Enter child's full name"
              required
            />
          </div>

          <div className="form-group">
            <label>Child's Age (years) *</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="e.g., 5"
              min="1"
              max="18"
              required
            />
          </div>

          <div className="form-group">
            <label>Eye Contact *</label>
            <select
              name="eyeContact"
              value={formData.eyeContact}
              onChange={handleChange}
              required
            >
              <option value="">-- Select --</option>
              <option value="good">Good - Makes regular eye contact</option>
              <option value="average">Average - Sometimes avoids eye contact</option>
              <option value="poor">Poor - Rarely makes eye contact</option>
            </select>
          </div>

          <div className="form-group">
            <label>Speech Level *</label>
            <select
              name="speechLevel"
              value={formData.speechLevel}
              onChange={handleChange}
              required
            >
              <option value="">-- Select --</option>
              <option value="normal">Normal - Age-appropriate speech</option>
              <option value="delayed">Delayed - Behind age level</option>
              <option value="absent">Absent / Non-verbal</option>
            </select>
          </div>

          <div className="form-group">
            <label>Social Response *</label>
            <select
              name="socialResponse"
              value={formData.socialResponse}
              onChange={handleChange}
              required
            >
              <option value="">-- Select --</option>
              <option value="active">Active - Engages with others</option>
              <option value="limited">Limited - Minimal social interaction</option>
              <option value="withdrawn">Withdrawn - Avoids social situations</option>
            </select>
          </div>

          <div className="form-group">
            <label>Sensory Reactions *</label>
            <select
              name="sensoryReactions"
              value={formData.sensoryReactions}
              onChange={handleChange}
              required
            >
              <option value="">-- Select --</option>
              <option value="normal">Normal - Typical sensory responses</option>
              <option value="over-sensitive">Over-sensitive - Reacts strongly to stimuli</option>
              <option value="under-sensitive">Under-sensitive - Seeks intense stimulation</option>
            </select>
          </div>

          {/* Emotion Detection Section */}
          <div className="form-group emotion-section">
            <div className="emotion-header">
              <label>🎭 Real-time Emotion Detection (Optional)</label>
              <button
                type="button"
                className="btn-emotion-toggle"
                onClick={() => setShowEmotionDetection(!showEmotionDetection)}
              >
                {showEmotionDetection ? '👁️ Hide Camera' : '📹 Start Face Analysis'}
              </button>
            </div>
            
            {showEmotionDetection && (
              <div className="emotion-detection-wrapper">
                <p className="emotion-info">
                  📊 This feature captures real-time facial expressions to provide additional behavioral insights.
                  Allow camera access and look at the camera while answering questions.
                </p>
                <EmotionDetection 
                  onEmotionDetected={handleEmotionDetected}
                  isActive={showEmotionDetection}
                />
                
                {emotionData.length > 0 && (
                  <div className="emotion-summary">
                    <h4>📈 Emotion Analysis Summary:</h4>
                    <p>Total detections: {emotionData.length}</p>
                    {getEmotionSummary() && (
                      <p>Dominant emotion: <strong>{getEmotionSummary().dominantEmotion}</strong></p>
                    )}
                    
                    {/* Photo-only analysis info */}
                    {!formData.childName.trim() && (
                      <div style={{
                        marginTop: '15px',
                        padding: '12px',
                        backgroundColor: '#fff3cd',
                        border: '1px solid #ffeaa7',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}>
                        <strong>💡 Quick Analysis:</strong> You can get instant AI recommendations based on just this photo analysis by clicking "Analyze Photo Only" below - no form required!
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="error" style={{
              background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
              color: '#c62828',
              padding: '15px 20px',
              borderRadius: '10px',
              border: '2px solid #e57373',
              marginTop: '15px',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              ❌ {error}
            </div>
          )}

          <div className="button-group">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ animation: 'spin 1s linear infinite' }}>🔄</span>
                  Analyzing with AI...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  🤖 Analyze with AI
                </span>
              )}
            </button>
            
            {/* Photo-only analysis button */}
            {emotionData.length > 0 && !formData.childName.trim() && (
              <button 
                type="button" 
                className="btn-photo-analysis" 
                onClick={handlePhotoOnlyAnalysis}
                disabled={loading}
              >
                {loading ? '🔄 Analyzing Photo...' : '📸 Analyze Photo Only'}
              </button>
            )}
            
            <button type="button" className="btn-secondary" onClick={resetForm}>
              🔄 Reset Form
            </button>
          </div>
        </form>

        {/* Results */}
        {result && (
          <div className="results">
            <div className="results-header">
              <h2>📊 Analysis Results</h2>
              <button className="btn-download" onClick={downloadPDF}>
                📄 Download PDF Report
              </button>
            </div>

            <div className="child-info">
              <strong>Child:</strong> {result.childName} | <strong>Age:</strong> {result.age} years
              <span className="ai-badge">Powered by Gemini AI</span>
              {result.photoOnlyAnalysis && (
                <span className="photo-only-badge" style={{
                  marginLeft: '10px',
                  padding: '4px 8px',
                  backgroundColor: '#FF6B35',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  📸 Photo-Only Analysis
                </span>
              )}
            </div>

            {/* Emotion Analysis Results */}
            {result.emotionAnalysis && (
              <div className="result-section emotion-results">
                <h3>🎭 {result.childName}'s Facial Expression Analysis</h3>
                {result.photoOnlyAnalysis && (
                  <div style={{
                    padding: '10px',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffeaa7',
                    borderRadius: '6px',
                    marginBottom: '15px',
                    fontSize: '14px'
                  }}>
                    <strong>📸 Photo-Only Analysis:</strong> This analysis is based solely on facial expression data. 
                    For more comprehensive recommendations, please fill out the complete assessment form.
                  </div>
                )}
                <div className="emotion-analysis-grid">
                  {capturedImage && (
                    <div className="captured-image">
                      <h4>📸 Captured Image</h4>
                      <img src={capturedImage} alt="Captured during analysis" style={{
                        maxWidth: '200px',
                        maxHeight: '150px',
                        borderRadius: '8px',
                        border: '2px solid #ddd'
                      }} />
                    </div>
                  )}
                  
                  <div className="emotion-details">
                    <div className="dominant-emotion">
                      <h4>{result.childName}'s Primary Emotion:</h4>
                      <div className="emotion-display">
                        <span className="emotion-emoji">{getEmotionEmoji(result.emotionAnalysis.dominantEmotion)}</span>
                        <span className="emotion-name">{(result.emotionAnalysis.dominantEmotion || 'UNKNOWN').toUpperCase()}</span>
                      </div>
                      <p className="emotion-count">
                        Detected {result.emotionAnalysis.totalDetections} times during {result.childName}'s assessment
                      </p>
                      
                      {/* Show confidence percentage prominently */}
                      <div style={{ 
                        marginTop: '10px', 
                        padding: '10px', 
                        backgroundColor: '#e3f2fd', 
                        borderRadius: '8px',
                        border: '2px solid #2196f3'
                      }}>
                        <strong style={{ color: '#1976d2', fontSize: '16px' }}>
                          🎯 Confidence: {(() => {
                            // Try multiple sources for confidence
                            const confidence = result.emotionAnalysis?.confidence || 
                                             (result.emotionAnalysis?.emotionHistory?.[0]?.confidence) ||
                                             0;
                            return confidence > 0 ? (confidence * 100).toFixed(1) + '%' : 'Processing...';
                          })()}
                        </strong>
                      </div>
                      
                      {/* Face Detection Confidence */}
                      {result.emotionAnalysis && (
                        <div className="confidence-display" style={{ marginTop: '10px' }}>
                          <h5 style={{ margin: '5px 0', color: '#1976d2' }}>🎯 Detection Quality:</h5>
                          <div style={{ display: 'flex', gap: '15px', fontSize: '14px' }}>
                            <span>
                              👤 <strong>Face Detection:</strong> 
                              <span style={{ 
                                marginLeft: '5px',
                                padding: '2px 6px',
                                backgroundColor: '#2196F3',
                                color: 'white',
                                borderRadius: '3px',
                                fontSize: '12px'
                              }}>
                                {(() => {
                                  const faceScore = result.emotionAnalysis?.faceDetectionScore || 
                                                  (result.emotionAnalysis?.emotionHistory?.[0]?.faceDetectionScore) ||
                                                  0;
                                  return faceScore > 0 ? (faceScore * 100).toFixed(1) + '%' : 'N/A';
                                })()}
                              </span>
                            </span>
                            
                            <span>
                              🎭 <strong>Emotion Accuracy:</strong> 
                              <span style={{ 
                                marginLeft: '5px',
                                padding: '2px 6px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                borderRadius: '3px',
                                fontSize: '12px'
                              }}>
                                {(() => {
                                  const confidence = result.emotionAnalysis?.confidence || 
                                                   (result.emotionAnalysis?.emotionHistory?.[0]?.confidence) ||
                                                   0;
                                  return confidence > 0 ? (confidence * 100).toFixed(1) + '%' : 'N/A';
                                })()}
                              </span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="emotion-breakdown">
                      <h4>All Emotions Detected:</h4>
                      <div className="emotion-list">
                        {Object.entries(result.emotionAnalysis.emotionCounts || {}).map(([emotion, count]) => (
                          <div key={emotion} className="emotion-item">
                            <span className="emotion-emoji">{getEmotionEmoji(emotion)}</span>
                            <span className="emotion-text">{emotion}</span>
                            <span className="emotion-count">({count}x)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="emotion-note">
                  <p><strong>Note:</strong> Facial expression analysis provides additional behavioral insights and should be considered alongside other assessment factors.</p>
                </div>
              </div>
            )}

            <div className="result-section">
              <h3>🎯 Focus Areas</h3>
              <div style={{ marginBottom: '15px' }}>
                <p style={{ 
                  color: '#666', 
                  fontStyle: 'italic', 
                  marginBottom: '20px',
                  background: '#f8f9fa',
                  padding: '12px',
                  borderRadius: '8px',
                  borderLeft: '4px solid #2196f3'
                }}>
                  These are the key developmental areas that need attention based on {result.childName}'s assessment:
                </p>
              </div>
              <ul>
                {result.data.focusAreas.map((area, i) => (
                  <li key={i} style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#1976d2' }}>Area {i + 1}:</strong> {area}
                  </li>
                ))}
              </ul>
            </div>

            <div className="result-section">
              <h3>🎯 Therapy Goals</h3>
              <div style={{ marginBottom: '15px' }}>
                <p style={{ 
                  color: '#666', 
                  fontStyle: 'italic', 
                  marginBottom: '20px',
                  background: '#f8f9fa',
                  padding: '12px',
                  borderRadius: '8px',
                  borderLeft: '4px solid #2196f3'
                }}>
                  Specific, measurable goals designed for {result.childName}'s development:
                </p>
              </div>
              <ol>
                {result.data.therapyGoals.map((goal, i) => (
                  <li key={i} style={{ marginBottom: '15px' }}>
                    <div style={{ lineHeight: '1.6' }}>
                      <strong style={{ color: '#1976d2' }}>Goal {i + 1}:</strong> {goal}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="result-section">
              <h3>✨ Recommended Activities</h3>
              <div style={{ marginBottom: '15px' }}>
                <p style={{ 
                  color: '#666', 
                  fontStyle: 'italic', 
                  marginBottom: '20px',
                  background: '#f8f9fa',
                  padding: '12px',
                  borderRadius: '8px',
                  borderLeft: '4px solid #2196f3'
                }}>
                  Fun and engaging activities to support {result.childName}'s development at home:
                </p>
              </div>
              <ul>
                {result.data.activities.map((activity, i) => {
                  // Handle both string and object formats from Gemini
                  if (typeof activity === 'string') {
                    return (
                      <li key={i} style={{ marginBottom: '20px' }}>
                        <div style={{ 
                          background: '#f8f9fa', 
                          padding: '15px', 
                          borderRadius: '8px',
                          borderLeft: '4px solid #4caf50'
                        }}>
                          <strong style={{ color: '#1976d2' }}>Activity {i + 1}:</strong>
                          <div style={{ marginTop: '8px', lineHeight: '1.6' }}>{activity}</div>
                        </div>
                      </li>
                    );
                  } else if (typeof activity === 'object' && activity !== null) {
                    return (
                      <li key={i} style={{ marginBottom: '25px' }}>
                        <div style={{ 
                          background: '#f8f9fa', 
                          padding: '20px', 
                          borderRadius: '12px',
                          borderLeft: '4px solid #4caf50',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                        }}>
                          <strong style={{ color: '#1976d2', fontSize: '1.1rem' }}>
                            {activity.name || `Activity ${i + 1}`}
                          </strong>
                          {activity.instructions && (
                            <div className="activity-detail" style={{ marginTop: '10px' }}>
                              <em style={{ color: '#2e7d32' }}>📝 Instructions:</em> 
                              <div style={{ marginTop: '5px' }}>{activity.instructions}</div>
                            </div>
                          )}
                          {activity.materials && (
                            <div className="activity-detail" style={{ marginTop: '8px' }}>
                              <em style={{ color: '#1976d2' }}>🧰 Materials:</em> 
                              <div style={{ marginTop: '5px' }}>{activity.materials}</div>
                            </div>
                          )}
                          {activity.durationFrequency && (
                            <div className="activity-detail" style={{ marginTop: '8px' }}>
                              <em style={{ color: '#7b1fa2' }}>⏰ Duration:</em> 
                              <div style={{ marginTop: '5px' }}>{activity.durationFrequency}</div>
                            </div>
                          )}
                          {activity.successLooksLike && (
                            <div className="activity-detail" style={{ marginTop: '8px' }}>
                              <em style={{ color: '#d32f2f' }}>🎯 Success:</em> 
                              <div style={{ marginTop: '5px' }}>{activity.successLooksLike}</div>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  }
                  return null;
                })}
              </ul>
            </div>

            {result.data.suggestions && result.data.suggestions.length > 0 && (
              <div className="result-section suggestions">
                <h3>💡 Additional Suggestions</h3>
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ 
                    color: '#666', 
                    fontStyle: 'italic', 
                    marginBottom: '20px',
                    background: '#fff3e0',
                    padding: '12px',
                    borderRadius: '8px',
                    borderLeft: '4px solid #ff9800'
                  }}>
                    Professional recommendations for {result.childName}'s continued development:
                  </p>
                </div>
                <ul>
                  {result.data.suggestions.map((suggestion, i) => (
                    <li key={i} style={{ marginBottom: '15px' }}>
                      <div style={{ 
                        background: '#fff8e1', 
                        padding: '15px', 
                        borderRadius: '8px',
                        borderLeft: '4px solid #ffa726'
                      }}>
                        <strong style={{ color: '#e65100' }}>Suggestion {i + 1}:</strong>
                        <div style={{ marginTop: '8px', lineHeight: '1.6' }}>{suggestion}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Saved History */}
        {savedData.length > 0 && (
          <div className="history">
            <h3>📚 Recent Screenings (Stored Locally)</h3>
            <div className="history-list">
              {savedData.slice(0, 5).map((item, i) => (
                <div key={i} className="history-item">
                  <strong>{item.childName}</strong> - Age {item.age} 
                  <span className="timestamp">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Simple History - Only show when results are displayed AND we have current session data */}
        {result && savedData.length > 0 && hasCurrentSessionData && (
          <div className="simple-history">
            <h3>📋 Recent Screenings (Stored Locally)</h3>
            <div className="simple-history-list">
              {savedData.slice(0, 5).map((item, index) => (
                <div 
                  key={index} 
                  className="simple-history-item"
                  onClick={() => viewHistoryItem(item)}
                >
                  <span className="history-name">
                    👶 {item.childName || 'Photo Analysis'} - Age {item.age || 'Unknown'}
                  </span>
                  <span className="history-date">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="footer">
          <p>
            <strong>Organization:</strong> Arvit HealthTech / Global Child Wellness Centre<br />
            <strong>Contact:</strong> info@globalchildwellness.com | www.globalchildwellness.com<br />
            <strong>Technology:</strong> React + Gemini AI
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
