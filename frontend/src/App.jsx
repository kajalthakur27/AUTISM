import React, { useState } from 'react';
import jsPDF from 'jspdf';
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

  // Load saved data from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('autism_screenings');
    if (saved) {
      try {
        setSavedData(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading saved data:', e);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          age: Number(formData.age)
        })
      });

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
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to connect to server. Make sure backend is running on port 5000.');
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
      const lines = doc.splitTextToSize(`${i + 1}. ${activity}`, pageWidth - 50);
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

          {error && <div className="error">{error}</div>}

          <div className="button-group">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '🔄 Analyzing with AI...' : '🤖 Analyze with AI'}
            </button>
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
            </div>

            <div className="result-section">
              <h3>🎯 Focus Areas</h3>
              <ul>
                {result.data.focusAreas.map((area, i) => (
                  <li key={i}>{area}</li>
                ))}
              </ul>
            </div>

            <div className="result-section">
              <h3>🎯 Therapy Goals</h3>
              <ol>
                {result.data.therapyGoals.map((goal, i) => (
                  <li key={i}>{goal}</li>
                ))}
              </ol>
            </div>

            <div className="result-section">
              <h3>✨ Recommended Activities</h3>
              <ul>
                {result.data.activities.map((activity, i) => (
                  <li key={i}>{activity}</li>
                ))}
              </ul>
            </div>

            {result.data.suggestions && result.data.suggestions.length > 0 && (
              <div className="result-section suggestions">
                <h3>💡 Additional Suggestions</h3>
                <ul>
                  {result.data.suggestions.map((suggestion, i) => (
                    <li key={i}>{suggestion}</li>
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

        {/* Footer */}
        <div className="footer">
          <p>
            <strong>Organization:</strong> Arvit HealthTech / Global Child Wellness Centre<br />
            <strong>Contact:</strong> info@globalchildwellness.com | www.globalchildwellness.com<br />
            <strong>Project Duration:</strong> 7 Days | <strong>Technology:</strong> React + Gemini AI
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
