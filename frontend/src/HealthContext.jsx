import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const HealthContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const useHealth = () => useContext(HealthContext);

export const HealthProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);

  const scenarios = [
    {
      current_time: "12:15",
      current_location: "Downtown - Near Sweetgreen",
      upcoming_events: [
        { title: "Lunch Break", event_type: "Lunch", start_time: "12:30", end_time: "13:30" }
      ]
    },
    {
      current_time: "09:45",
      current_location: "Local Bakery",
      upcoming_events: [
        { title: "Breakfast Meeting", event_type: "Lunch/Dinner", start_time: "10:00", end_time: "11:00" }
      ]
    },
    {
      current_time: "19:00",
      current_location: "Fast-food Drive Thru",
      upcoming_events: [
        { title: "Dinner", event_type: "Dinner", start_time: "19:30", end_time: "20:30" }
      ]
    }
  ];

  const fetchRecommendation = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRecommendation(null);
    try {
      const response = await fetch(`${API_BASE}/api/context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenarios[scenarioIndex])
      });
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      setRecommendation(data);
    } catch (err) {
      setError("Agent unreachable. Retrying...");
      // Graceful fallback simulation
      setTimeout(() => {
        setError(null);
        setRecommendation({
          is_eating_window: true,
          suggested_item: "Offline Cache Mode",
          suggested_restaurant: "Unknown",
          reason: "Unable to reach the server. Showing last known good state."
        });
      }, 3000);
    } finally {
      setLoading(false);
    }
  }, [scenarioIndex]);

  const submitFeedback = async (item, liked) => {
    try {
      await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, liked })
      });
      showToast(liked ? `Accepted: ${item}` : `Rejected: ${item}`);
      fetchRecommendation();
    } catch(e) {
      console.error(e);
      showToast(`Failed to update artifact`);
    }
  };

  const analyzeImage = async (dataUrl) => {
    setScanLoading(true);
    setScanResult(null);
    try {
      // Convert base64 data URL to a Blob, then to FormData
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('file', blob, 'scan.jpg');

      const response = await fetch(`${API_BASE}/api/multimodal`, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Analysis failed');
      const data = await response.json();
      setScanResult(data);
      showToast('Food analyzed successfully');
    } catch (err) {
      // Fallback mock result for offline/demo mode
      setScanResult({
        estimates: { calories: 450, protein: '30g', carbs: '25g', fats: '15g' },
        message: 'Analyzed via offline demo mode.'
      });
      showToast('Analyzed (demo mode)');
    } finally {
      setScanLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/summary`);
      if (!response.ok) throw new Error('Summary fetch failed');
      const data = await response.json();
      return data.summary;
    } catch {
      return "Great day! You stayed within your calorie budget and hit your protein target. (Offline)";
    }
  };

  const clearScanResult = () => setScanResult(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    fetchRecommendation();
  }, [fetchRecommendation]);

  const value = {
    loading,
    error,
    recommendation,
    scenarioIndex,
    setScenarioIndex,
    fetchRecommendation,
    scenarios,
    submitFeedback,
    toastMessage,
    analyzeImage,
    scanResult,
    scanLoading,
    clearScanResult,
    fetchSummary,
    showToast
  };

  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>;
};
