import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

const EmotionDetection = ({ onEmotionDetected, isActive = true }) => {
  const videoRef = useRef();
  const canvasRef = useRef();

  // Emotion emoji mapping
  const getEmotionEmoji = (emotion) => {
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
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [error, setError] = useState(null);
  const [autoCapture, setAutoCapture] = useState(false); // Disabled by default
  const [captureCountdown, setCaptureCountdown] = useState(0);
  const [captureSuccess, setCaptureSuccess] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [useUploadedImage, setUseUploadedImage] = useState(false);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Load models from public/models directory
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceExpressionNet.loadFromUri('/models');
        
        setIsLoaded(true);
        console.log('Face-API models loaded successfully');
      } catch (err) {
        console.error('Error loading face-api models:', err);
        setError('Failed to load face detection models');
      }
    };
    
    loadModels();
  }, []);

  // Start video stream
  useEffect(() => {
    if (isLoaded && isActive) {
      startVideo();
    }
    return () => {
      stopVideo();
    };
  }, [isLoaded, isActive]);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Camera access denied or not available');
    }
  };

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Start emotion detection
  const startDetection = () => {
    if (!isLoaded || !videoRef.current) return;
    
    setIsDetecting(true);
    setEmotionHistory([]);
    
    // No auto-capture countdown by default
    detectEmotions();
  };

  const stopDetection = () => {
    setIsDetecting(false);
    setCaptureCountdown(0);
  };

  const detectEmotions = async () => {
    if (!videoRef.current || !canvasRef.current || !isDetecting) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.5
      }))
      .withFaceLandmarks()
      .withFaceExpressions();

    // Clear previous drawings
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (detections.length > 0) {
      // Remove face detection box drawings for cleaner look
      // faceapi.draw.drawDetections(canvas, detections);
      // faceapi.draw.drawFaceExpressions(canvas, detections);

      // Get the most confident emotion with better accuracy
      const expressions = detections[0].expressions;
      
      // Only consider emotions with confidence > 0.3 to avoid false positives
      const validExpressions = Object.entries(expressions).filter(([emotion, confidence]) => confidence > 0.3);
      
      let maxExpression, maxConfidence;
      if (validExpressions.length > 0) {
        [maxExpression, maxConfidence] = validExpressions.reduce(([prevEmotion, prevConf], [emotion, conf]) => 
          conf > prevConf ? [emotion, conf] : [prevEmotion, prevConf]
        );
      } else {
        // Fallback to highest confidence even if low
        maxExpression = Object.keys(expressions).reduce((a, b) => 
          expressions[a] > expressions[b] ? a : b
        );
        maxConfidence = expressions[maxExpression];
      }

      const emotionData = {
        emotion: maxExpression,
        confidence: maxConfidence || expressions[maxExpression],
        timestamp: new Date().toISOString(),
        allExpressions: expressions,
        faceDetectionScore: detections[0].detection.score // Add face detection confidence
      };

      setCurrentEmotion(emotionData);
      
      // Add to emotion history - avoid duplicate consecutive emotions
      setEmotionHistory(prev => {
        const lastEmotion = prev.length > 0 ? prev[prev.length - 1] : null;
        
        // Only add if it's different from last emotion or confidence is significantly higher
        if (!lastEmotion || 
            lastEmotion.emotion !== emotionData.emotion || 
            emotionData.confidence > (lastEmotion.confidence + 0.1)) {
          const newHistory = [...prev, emotionData];
          // Keep only last 10 emotions
          return newHistory.slice(-10);
        }
        return prev;
      });

      // Call parent callback with emotion data
      if (onEmotionDetected) {
        onEmotionDetected(emotionData);
      }
    }

    // Handle auto-capture countdown (only if enabled)
    if (autoCapture && captureCountdown > 0) {
      setCaptureCountdown(prev => {
        const newCount = prev - 1;
        if (newCount === 0 && isDetecting) {
          // Auto-capture when countdown reaches 0
          setTimeout(() => {
            const image = captureImage();
            if (image && onEmotionDetected) {
              setIsDetecting(false);
              setCaptureSuccess(true);
              
              onEmotionDetected({
                emotion: currentEmotion?.emotion || 'neutral',
                confidence: currentEmotion?.confidence || 0,
                timestamp: new Date().toISOString(),
                capturedImage: image,
                faceDetectionScore: currentEmotion?.faceDetectionScore || 0
              });
              
              // Hide success message after 3 seconds
              setTimeout(() => setCaptureSuccess(false), 3000);
            }
          }, 100);
        }
        return newCount;
      });
    }

    // Continue detection if still active
    if (isDetecting) {
      setTimeout(detectEmotions, 500); // Detect every 0.5 seconds for better accuracy
    }
  };

  const captureImage = () => {
    if (useUploadedImage && uploadedImage) {
      return uploadedImage;
    }
    
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        setUploadedImage(e.target.result);
        setUseUploadedImage(true);
        
        // Analyze emotions in uploaded image
        await analyzeUploadedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeUploadedImage = async (imageSrc) => {
    if (!isLoaded) {
      setError('Face detection models not loaded yet');
      return;
    }

    try {
      // Create an image element to load the uploaded image
      const img = new Image();
      img.onload = async () => {
        try {
          // Detect emotions in the uploaded image
          const detections = await faceapi
            .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({
              inputSize: 416,
              scoreThreshold: 0.5
            }))
            .withFaceLandmarks()
            .withFaceExpressions();

          if (detections.length > 0) {
            const expressions = detections[0].expressions;
            
            // Get the emotion with highest confidence
            const validExpressions = Object.entries(expressions).filter(([emotion, confidence]) => confidence > 0.3);
            
            let maxExpression, maxConfidence;
            if (validExpressions.length > 0) {
              [maxExpression, maxConfidence] = validExpressions.reduce(([prevEmotion, prevConf], [emotion, conf]) => 
                conf > prevConf ? [emotion, conf] : [prevEmotion, prevConf]
              );
            } else {
              maxExpression = Object.keys(expressions).reduce((a, b) => 
                expressions[a] > expressions[b] ? a : b
              );
              maxConfidence = expressions[maxExpression];
            }

            const emotionData = {
              emotion: maxExpression,
              confidence: maxConfidence,
              timestamp: new Date().toISOString(),
              allExpressions: expressions,
              faceDetectionScore: detections[0].detection.score,
              capturedImage: imageSrc,
              isUploadedImage: true
            };

            setCurrentEmotion(emotionData);
            
            // Add to emotion history for uploaded image
            setEmotionHistory(prev => [...prev, emotionData]);
            
            // Send emotion data to parent
            if (onEmotionDetected) {
              onEmotionDetected(emotionData);
            }
            
            setCaptureSuccess(true);
            setTimeout(() => setCaptureSuccess(false), 3000);
            
          } else {
            setError('No face detected in uploaded image');
            // Still send the image data even if no face detected
            if (onEmotionDetected) {
              onEmotionDetected({
                emotion: 'neutral',
                confidence: 0,
                timestamp: new Date().toISOString(),
                capturedImage: imageSrc,
                faceDetectionScore: 0
              });
            }
          }
        } catch (error) {
          console.error('Error analyzing uploaded image:', error);
          setError('Failed to analyze uploaded image');
        }
      };
      
      img.src = imageSrc;
    } catch (error) {
      console.error('Error processing uploaded image:', error);
      setError('Failed to process uploaded image');
    }
  };

  const instantCapture = () => {
    const image = captureImage();
    if (image && onEmotionDetected) {
      setIsDetecting(false);
      setCaptureSuccess(true);
      
      // Send captured image data immediately
      onEmotionDetected({
        emotion: currentEmotion?.emotion || 'neutral',
        confidence: currentEmotion?.confidence || 0,
        timestamp: new Date().toISOString(),
        capturedImage: image,
        faceDetectionScore: currentEmotion?.faceDetectionScore || 0
      });
      
      // Hide success message after 2 seconds
      setTimeout(() => setCaptureSuccess(false), 2000);
    }
  };

  const getEmotionSummary = () => {
    if (emotionHistory.length === 0) return null;

    const emotionCounts = {};
    emotionHistory.forEach(item => {
      emotionCounts[item.emotion] = (emotionCounts[item.emotion] || 0) + 1;
    });

    const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) => 
      emotionCounts[a] > emotionCounts[b] ? a : b
    );

    return {
      dominantEmotion,
      emotionCounts,
      totalDetections: emotionHistory.length,
      capturedImage: captureImage()
    };
  };

  // Expose methods to parent component
  useEffect(() => {
    if (onEmotionDetected) {
      window.getEmotionSummary = getEmotionSummary;
      window.captureEmotionImage = captureImage;
    }
  }, [emotionHistory]);

  if (error) {
    return (
      <div className="emotion-detection-error">
        <p style={{ color: 'red' }}>❌ {error}</p>
        <p>Please ensure:</p>
        <ul>
          <li>Camera permission is granted</li>
          <li>Face detection models are available in /public/models/</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="emotion-detection-container" style={{ position: 'relative', maxWidth: '640px' }}>
      <h3>🎭 Real-time Emotion Detection</h3>
      
      {/* Upload or Camera Options */}
      <div style={{ marginBottom: '15px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="radio"
              name="imageSource"
              checked={!useUploadedImage}
              onChange={() => {
                setUseUploadedImage(false);
                setUploadedImage(null);
              }}
            />
            <span>📹 Use Camera</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="radio"
              name="imageSource"
              checked={useUploadedImage}
              onChange={() => setUseUploadedImage(true)}
            />
            <span>📁 Upload Picture</span>
          </label>
        </div>

        {/* File Upload */}
        {useUploadedImage && (
          <div style={{ marginBottom: '15px' }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{
                padding: '8px',
                border: '2px dashed #2196F3',
                borderRadius: '8px',
                backgroundColor: '#f8f9ff'
              }}
            />
            {uploadedImage && (
              <div style={{ marginTop: '10px' }}>
                <img 
                  src={uploadedImage} 
                  alt="Uploaded" 
                  style={{ 
                    maxWidth: '200px', 
                    maxHeight: '150px', 
                    borderRadius: '8px',
                    border: '2px solid #2196F3'
                  }} 
                />
                <p style={{ color: '#2196F3', fontWeight: 'bold' }}>✅ Picture uploaded successfully!</p>
                
                {/* Show detailed emotion analysis for uploaded image */}
                {currentEmotion && currentEmotion.isUploadedImage && (
                  <div style={{
                    marginTop: '15px',
                    padding: '15px',
                    backgroundColor: '#f0f8ff',
                    borderRadius: '8px',
                    border: '2px solid #2196F3'
                  }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#1976d2', textAlign: 'center' }}>
                      🎭 Photo Emotion Analysis Results
                    </h4>
                    
                    {/* Primary Emotion Display */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '20px',
                      padding: '15px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e3f2fd'
                    }}>
                      <span style={{ fontSize: '48px', marginRight: '20px' }}>
                        {getEmotionEmoji ? getEmotionEmoji(currentEmotion.emotion) : '😐'}
                      </span>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2', marginBottom: '5px' }}>
                          {currentEmotion.emotion.toUpperCase()}
                        </div>
                        <div style={{ 
                          fontSize: '18px', 
                          color: currentEmotion.confidence > 0.7 ? '#4caf50' : currentEmotion.confidence > 0.5 ? '#ff9800' : '#f44336',
                          fontWeight: 'bold'
                        }}>
                          {(currentEmotion.confidence * 100).toFixed(1)}% Confidence
                        </div>
                        <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                          Face Quality: <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
                            {(currentEmotion.faceDetectionScore * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* All Emotions with Levels */}
                    <div style={{ marginBottom: '15px' }}>
                      <h5 style={{ margin: '10px 0', color: '#1976d2', textAlign: 'center' }}>
                        📊 All Detected Emotions & Confidence Levels:
                      </h5>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                        gap: '10px',
                        marginTop: '10px'
                      }}>
                        {Object.entries(currentEmotion.allExpressions)
                          .sort(([,a], [,b]) => b - a) // Sort by confidence
                          .map(([emotion, confidence]) => (
                          <div key={emotion} style={{
                            padding: '10px 8px',
                            backgroundColor: emotion === currentEmotion.emotion ? '#e3f2fd' : '#f5f5f5',
                            border: emotion === currentEmotion.emotion ? '2px solid #2196f3' : '1px solid #ddd',
                            borderRadius: '8px',
                            textAlign: 'center',
                            fontSize: '12px'
                          }}>
                            <div style={{ fontSize: '20px', marginBottom: '5px' }}>
                              {getEmotionEmoji ? getEmotionEmoji(emotion) : '😐'}
                            </div>
                            <div style={{ 
                              fontWeight: emotion === currentEmotion.emotion ? 'bold' : 'normal',
                              color: emotion === currentEmotion.emotion ? '#1976d2' : '#333',
                              marginBottom: '3px'
                            }}>
                              {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                            </div>
                            <div style={{ 
                              fontWeight: 'bold',
                              color: confidence > 0.5 ? '#4caf50' : confidence > 0.3 ? '#ff9800' : '#f44336'
                            }}>
                              {(confidence * 100).toFixed(1)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Analysis Summary */}
                    <div style={{
                      padding: '10px',
                      backgroundColor: '#e8f5e8',
                      borderRadius: '6px',
                      border: '1px solid #c8e6c9',
                      textAlign: 'center',
                      fontSize: '14px'
                    }}>
                      <strong style={{ color: '#2e7d32' }}>Analysis Complete!</strong>
                      <br />
                      You can now click "Analyze with AI" to get detailed therapy recommendations
                      {currentEmotion.confidence < 0.5 && (
                        <div style={{ marginTop: '5px', color: '#f57c00', fontSize: '12px' }}>
                          💡 Note: Low confidence detected. Consider taking another photo with better lighting.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {!isLoaded && !useUploadedImage && (
        <p>Loading face detection models...</p>
      )}
      
      {/* Camera View */}
      {!useUploadedImage && (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <video
            ref={videoRef}
            width="640"
            height="480"
            style={{ 
              border: '2px solid #ccc',
              borderRadius: '8px',
              display: isLoaded ? 'block' : 'none'
            }}
            onLoadedMetadata={() => {
              if (isActive && isLoaded) {
                startDetection();
              }
            }}
          />
          
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none'
            }}
          />
        </div>
      )}

      {/* Control Buttons */}
      {!useUploadedImage && (
        <>
          {/* Auto-capture settings - only show for camera */}
          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={autoCapture}
                onChange={(e) => {
                  setAutoCapture(e.target.checked);
                  if (e.target.checked && isDetecting) {
                    setCaptureCountdown(5);
                  }
                }}
              />
              <span>Auto-capture after 5 seconds</span>
            </label>
          </div>

          <div style={{ marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={isDetecting ? stopDetection : startDetection}
              disabled={!isLoaded}
              style={{
                padding: '10px 20px',
                backgroundColor: isDetecting ? '#ff4444' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              {isDetecting ? '⏹️ Stop Detection' : '▶️ Start Detection'}
            </button>
            
            <button
              onClick={instantCapture}
              disabled={!isLoaded || !videoRef.current}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              📸 Instant Capture
            </button>
          </div>
        </>
      )}

      {/* Upload message for uploaded images */}
      {useUploadedImage && uploadedImage && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: '15px',
          padding: '15px',
          backgroundColor: '#e8f5e8',
          border: '1px solid #c3e6c3',
          borderRadius: '8px'
        }}>
          <p style={{ color: '#2e7d32', fontWeight: 'bold', margin: 0 }}>
            ✅ Picture ready for analysis! Click "Analyze with AI" to get report.
          </p>
        </div>
      )}

      {/* Countdown display - only for auto-capture */}
      {autoCapture && captureCountdown > 0 && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#856404'
        }}>
          📸 Auto-capturing in {captureCountdown} seconds...
        </div>
      )}

      {/* Success message */}
      {captureSuccess && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#155724'
        }}>
          ✅ Picture captured successfully! Click "Analyze with AI" to get report.
        </div>
      )}

      {currentEmotion && (
        <div style={{ 
          marginTop: '15px', 
          padding: '15px', 
          backgroundColor: '#f0f8ff',
          borderRadius: '8px',
          border: '1px solid #2196F3'
        }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#1976d2' }}>🎯 Live Detection Results:</h4>
          
          {/* Emotion with emoji */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e3f2fd'
          }}>
            <span style={{ fontSize: '32px', marginRight: '15px' }}>
              {getEmotionEmoji ? getEmotionEmoji(currentEmotion.emotion) : '😐'}
            </span>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1976d2' }}>
                {currentEmotion.emotion.toUpperCase()}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Emotion Confidence: <strong style={{ color: currentEmotion.confidence > 0.7 ? '#4caf50' : currentEmotion.confidence > 0.5 ? '#ff9800' : '#f44336' }}>
                  {(currentEmotion.confidence * 100).toFixed(1)}%
                </strong>
              </div>
            </div>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <strong>Face Quality:</strong> 
            <span style={{ 
              marginLeft: '8px',
              padding: '4px 8px',
              backgroundColor: currentEmotion.faceDetectionScore > 0.8 ? '#4caf50' : currentEmotion.faceDetectionScore > 0.6 ? '#ff9800' : '#f44336',
              color: 'white',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              {(currentEmotion.faceDetectionScore * 100).toFixed(1)}%
            </span>
          </div>
          
          {/* Show all emotions detected */}
          <div style={{ marginTop: '10px' }}>
            <strong>All Emotions:</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
              {Object.entries(currentEmotion.allExpressions).map(([emotion, confidence]) => (
                confidence > 0.1 && (
                  <span key={emotion} style={{
                    padding: '2px 6px',
                    backgroundColor: emotion === currentEmotion.emotion ? '#2196f3' : '#e0e0e0',
                    color: emotion === currentEmotion.emotion ? 'white' : '#333',
                    borderRadius: '12px',
                    fontSize: '11px'
                  }}>
                    {emotion}: {(confidence * 100).toFixed(0)}%
                  </span>
                )
              ))}
            </div>
          </div>
          
          <small style={{ color: '#666' }}>
            📅 {new Date(currentEmotion.timestamp).toLocaleTimeString()}
          </small>
        </div>
      )}

      {emotionHistory.length > 0 && (
        <div style={{ 
          marginTop: '15px', 
          padding: '15px', 
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #ddd',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>📊 Detection History:</h4>
          {emotionHistory.slice(-5).map((emotion, index) => (
            <div key={index} style={{ 
              marginBottom: '12px', 
              padding: '10px',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #eee'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{emotion.emotion.toUpperCase()}</span>
                <small style={{ color: '#666' }}>
                  {new Date(emotion.timestamp).toLocaleTimeString()}
                </small>
              </div>
              
              <div style={{ display: 'flex', gap: '15px', fontSize: '13px' }}>
                <span>
                  🎭 <strong>Emotion:</strong> 
                  <span style={{ 
                    marginLeft: '4px',
                    color: emotion.confidence > 0.7 ? '#4caf50' : emotion.confidence > 0.5 ? '#ff9800' : '#f44336',
                    fontWeight: 'bold'
                  }}>
                    {(emotion.confidence * 100).toFixed(1)}%
                  </span>
                </span>
                
                <span>
                  👤 <strong>Face:</strong> 
                  <span style={{ 
                    marginLeft: '4px',
                    color: emotion.faceDetectionScore > 0.8 ? '#4caf50' : emotion.faceDetectionScore > 0.6 ? '#ff9800' : '#f44336',
                    fontWeight: 'bold'
                  }}>
                    {(emotion.faceDetectionScore * 100).toFixed(1)}%
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmotionDetection;