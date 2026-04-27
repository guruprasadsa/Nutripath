import React, { useEffect, useState, useRef } from 'react';
import { Home, Scan, Bell, Database, LineChart, Target, Clock, User, ArrowUpRight, Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHealth } from './HealthContext';

const RingProgress = ({ radius = 26, progress = 0, color = "#2EFF9A" }) => {
  const strokeWidth = 3.5;
  const circumference = 163.4; // 2 * pi * 26
  const [offset, setOffset] = useState(circumference);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentOffset = circumference - (progress / 100) * circumference;
      setOffset(currentOffset);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress, circumference]);

  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
      <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
      <circle
        cx="32" cy="32" r={radius} fill="none" stroke={color}
        strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        className="transition-all duration-800 ease-spring"
      />
    </svg>
  );
};

const NavItem = ({ icon: Icon, label, active, badge, onClick }) => (
  <motion.button 
    onClick={onClick}
    whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
    whileTap={{ scale: 0.98 }}
    aria-label={label}
    className={`w-full flex items-center gap-[10px] p-[9px_10px] rounded-[10px] transition-colors duration-150 cursor-pointer ${
    active ? 'bg-[rgba(46,255,154,0.08)] border-[0.6px] border-[rgba(46,255,154,0.15)] text-jade' : 'text-[rgba(255,255,255,0.45)]'
  }`}>
    <Icon size={15} strokeWidth={1.2} className={`shrink-0 ${active ? 'text-jade' : 'text-[rgba(255,255,255,0.3)]'}`} />
    <span className="font-sans text-[13px] font-normal hidden md:inline">{label}</span>
    {badge && (
      <span className="ml-auto font-mono text-[9px] text-jade border-[0.6px] border-jade bg-jade/15 px-[7px] py-[2px] rounded-[20px] hidden md:inline">
        {badge}
      </span>
    )}
  </motion.button>
);

const Chip = ({ variant = 'default', children, onClick, disabled }) => {
  const baseClasses = "font-mono text-[10px] rounded-[20px] px-[10px] py-[4px] border-[0.5px] cursor-pointer inline-block text-center";
  const variants = {
    jade: "text-jade border-[rgba(46,255,154,0.35)] bg-[rgba(46,255,154,0.07)]",
    mauve: "text-mauve border-[rgba(196,168,255,0.35)] bg-[rgba(196,168,255,0.07)]",
    default: "text-[rgba(255,255,255,0.5)] border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)]",
    deprecated: "text-[rgba(255,255,255,0.5)] border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] line-through opacity-50"
  };
  return (
    <motion.button 
      whileHover={!disabled ? { scale: 0.97, opacity: 0.85 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={disabled}
      aria-label={typeof children === 'string' ? children : 'Chip'}
      className={`${baseClasses} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {children}
    </motion.button>
  );
};

const CalorieBar = ({ target = 2000, consumed = 1847 }) => {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    setTimeout(() => setPct(Math.min((consumed / target) * 100, 100)), 100);
  }, [consumed, target]);
  const over = consumed > target;
  
  return (
    <div className="w-full mt-[12px]">
      <div className="flex justify-between font-mono text-[10px] text-[rgba(255,255,255,0.3)] mb-1">
        <span>0</span><span>consumed</span><span>{target}</span>
      </div>
      <div className="bg-[rgba(255,255,255,0.06)] rounded-[3px] h-[4px] overflow-hidden">
        <div 
          className={`h-full rounded-[3px] transition-all duration-600 ease-spring ${over ? 'bg-mauve' : 'bg-jade'}`} 
          style={{ width: `${pct}%` }} 
        />
      </div>
    </div>
  );
};

const TasteBar = ({ label, pct, variant, delay }) => {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), delay);
    return () => clearTimeout(t);
  }, [pct, delay]);
  
  const colors = { jade: 'bg-jade', mauve: 'bg-mauve', muted: 'bg-[rgba(255,255,255,0.25)]' };

  return (
    <div className="flex items-center gap-[10px]">
      <span className="font-mono text-[10px] text-[rgba(255,255,255,0.4)] w-[72px] text-right shrink-0">{label}</span>
      <div className="flex-1 bg-[rgba(255,255,255,0.05)] rounded-[3px] h-[5px] overflow-hidden">
        <div className={`h-[5px] rounded-[3px] ${colors[variant]} transition-all duration-500 ease-spring`} style={{ width: `${w}%` }} />
      </div>
      <span className="font-mono text-[10px] text-[rgba(255,255,255,0.25)] w-[30px]">{pct}%</span>
    </div>
  );
};

const EmptyPage = ({ title }) => {
  const messages = {
    'Nudges': 'No new nudges. You are on track.',
    'Health Artifact': 'Your artifact is synchronizing.',
    'Analytics': 'Not enough data to form trends yet.',
    'Goals': 'Every streak starts somewhere.'
  };
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[300px]">
      <div className="font-display italic text-[18px] text-[rgba(255,255,255,0.18)] text-center animate-floatIn">
        {messages[title] || 'This section is currently empty.'}
      </div>
    </div>
  );
};

const NutriScan = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [camError, setCamError] = useState(null);
  const [image, setImage] = useState(null);
  const { analyzeImage, scanResult, scanLoading, clearScanResult } = useHealth();

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = mediaStream;
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch { setCamError('Camera permission denied or unavailable.'); }
  };

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  };

  useEffect(() => { startCamera(); return () => stopCamera(); }, []);

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth || 600;
    canvasRef.current.height = videoRef.current.videoHeight || 800;
    ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    setImage(canvasRef.current.toDataURL('image/jpeg'));
    stopCamera();
  };

  const resetCamera = () => { setImage(null); clearScanResult(); startCamera(); };

  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[400px] animate-floatIn gap-4">
      <div className="micro-label">Nutri-Scan Active</div>
      <div className="w-full max-w-[340px] aspect-[3/4] bg-[#0E0E12] border-[0.6px] border-borderSubtle rounded-[16px] overflow-hidden relative flex flex-col items-center justify-center">
        {camError ? (
          <div className="font-sans text-[13px] text-mauve px-6 text-center">{camError}</div>
        ) : image ? (
          <>
            <img src={image} alt="Scanned food" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-bgBase/40 backdrop-blur-[2px] flex flex-col items-center justify-end pb-8">
               {scanLoading ? (
                 <div className="flex flex-col items-center gap-3 mb-4">
                   <Loader2 size={24} className="text-jade animate-spin" />
                   <span className="font-mono text-[10px] text-jade uppercase tracking-wider">Analyzing Photo</span>
                 </div>
               ) : !scanResult ? (
                 <div className="flex gap-4">
                   <Chip variant="default" onClick={resetCamera}>Retake</Chip>
                   <Chip variant="jade" onClick={() => analyzeImage(image)}>Analyze Food</Chip>
                 </div>
               ) : (
                 <div className="flex gap-4">
                   <Chip variant="default" onClick={resetCamera}>Scan Another</Chip>
                 </div>
               )}
            </div>
          </>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-4 border-[1.5px] border-dashed border-[rgba(46,255,154,0.3)] rounded-[12px] pointer-events-none" />
            <motion.button whileHover={{ scale: 0.95 }} whileTap={{ scale: 0.9 }} onClick={captureImage} aria-label="Capture photo"
              className="absolute bottom-6 w-[64px] h-[64px] rounded-full border-[2px] border-[rgba(255,255,255,0.4)] flex items-center justify-center cursor-pointer hover:border-jade group transition-colors">
               <div className="w-[52px] h-[52px] rounded-full bg-[rgba(255,255,255,0.8)] group-hover:bg-jade transition-colors" />
            </motion.button>
          </>
        )}
      </div>
      {/* Scan Results Card */}
      {scanResult && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[340px] panel">
          <div className="micro-label mb-3">Scan Results</div>
          <div className="grid grid-cols-4 gap-[8px]">
            <div className="text-center"><div className="font-mono text-[16px] text-white">{scanResult.estimates.calories}</div><div className="font-mono text-[9px] text-[rgba(255,255,255,0.25)]">kcal</div></div>
            <div className="text-center"><div className="font-mono text-[16px] text-jade">{scanResult.estimates.protein}</div><div className="font-mono text-[9px] text-[rgba(255,255,255,0.25)]">pro</div></div>
            <div className="text-center"><div className="font-mono text-[16px] text-mauve">{scanResult.estimates.carbs}</div><div className="font-mono text-[9px] text-[rgba(255,255,255,0.25)]">carb</div></div>
            <div className="text-center"><div className="font-mono text-[16px] text-white">{scanResult.estimates.fats}</div><div className="font-mono text-[9px] text-[rgba(255,255,255,0.25)]">fat</div></div>
          </div>
          <div className="font-mono text-[10px] text-[rgba(255,255,255,0.3)] mt-3 text-center">{scanResult.message}</div>
        </motion.div>
      )}
    </div>
  );
};

export default function App() {
  const { loading, error, recommendation, scenarioIndex, setScenarioIndex, fetchRecommendation, scenarios, submitFeedback, toastMessage } = useHealth();
  const currentScenario = scenarios[scenarioIndex];
  const [activeTab, setActiveTab] = useState('Dashboard');

  return (
    <div className="flex flex-row h-screen w-full bg-bgBase text-textPrimary overflow-hidden font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#131318] border-[0.6px] border-borderSubtle text-white font-mono text-[11px] px-4 py-2 rounded-full animate-floatIn">
          {toastMessage}
        </div>
      )}

      {/* SIDEBAR */}
      <div className="shrink-0 w-[60px] md:w-[220px] bg-bgSidebar border-r-[0.6px] border-borderSubtle flex flex-col z-20 transition-all duration-300">
        
        {/* Logo Block */}
        <div className="h-[68px] border-b-[0.6px] border-[rgba(255,255,255,0.05)] p-[22px_16px_18px] md:p-[22px_20px_18px] flex items-center justify-center md:justify-start gap-3">
          <div className="w-[28px] h-[28px] rounded-[8px] bg-[rgba(46,255,154,0.12)] border-[0.6px] border-[rgba(46,255,154,0.3)] flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2EFF9A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
              <line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" />
              <line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" />
            </svg>
          </div>
          <div className="md:flex items-baseline gap-2 hidden">
            <span className="font-display italic text-[16px]">NutriFloat</span>
            <span className="font-mono text-[9px] text-[rgba(255,255,255,0.2)]">v2 · web</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-[14px_10px] flex flex-col gap-1 items-center md:items-stretch">
          <div className="font-mono text-[9px] uppercase text-[rgba(255,255,255,0.25)] tracking-[0.10em] p-[10px_10px_6px] hidden md:block">Core</div>
          <NavItem icon={Home} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} />
          <NavItem icon={Scan} label="Nutri-Scan" active={activeTab === 'Nutri-Scan'} onClick={() => setActiveTab('Nutri-Scan')} />
          <NavItem icon={Bell} label="Nudges" badge="live" active={activeTab === 'Nudges'} onClick={() => setActiveTab('Nudges')} />
          <NavItem icon={Database} label="Health Artifact" active={activeTab === 'Health Artifact'} onClick={() => setActiveTab('Health Artifact')} />
          
          <div className="font-mono text-[9px] uppercase text-[rgba(255,255,255,0.25)] tracking-[0.10em] p-[10px_10px_6px] mt-4 hidden md:block">Progress</div>
          <NavItem icon={LineChart} label="Analytics" active={activeTab === 'Analytics'} onClick={() => setActiveTab('Analytics')} />
          <NavItem icon={Target} label="Goals" active={activeTab === 'Goals'} onClick={() => setActiveTab('Goals')} />
        </div>

        {/* User Block */}
        <div className="border-t-[0.6px] border-[rgba(255,255,255,0.05)] p-[14px_10px] flex justify-center md:justify-start items-center gap-3">
          <div className="w-[30px] h-[30px] rounded-full bg-[rgba(196,168,255,0.15)] border-[0.6px] border-[rgba(196,168,255,0.3)] flex items-center justify-center font-mono text-[11px] text-mauve shrink-0">
            GP
          </div>
          <div className="md:flex flex-col hidden">
            <span className="font-sans text-[12px] text-[rgba(255,255,255,0.6)]">Guruprasad</span>
            <span className="font-mono text-[9px] text-[rgba(255,255,255,0.25)]">–0.5 kg/week</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col z-10 bg-bgBase relative overflow-hidden">
        
        {/* Topbar */}
        <div className="h-[72px] flex items-center justify-between p-[18px_20px] md:p-[18px_28px_16px] border-b-[0.6px] border-[rgba(255,255,255,0.05)] bg-bgBase/80 backdrop-blur-md shrink-0">
          <div className="flex flex-col">
            <span className="font-display italic text-[16px] md:text-[20px] text-white">Good afternoon, Guruprasad</span>
            <span className="font-mono text-[9px] md:text-[10px] text-[rgba(255,255,255,0.3)] mt-[3px] tracking-[0.04em] hidden sm:block">Monday · Apr 27 · {currentScenario.current_location} · 1,847 of 2,200 kcal consumed</span>
          </div>
          <div className="flex items-center gap-[6px] md:gap-[10px]">
            <motion.button 
              onClick={() => setScenarioIndex((prev) => (prev + 1) % scenarios.length)}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
              whileTap={{ scale: 0.95 }}
              aria-label="Cycle Scenario"
              className="bg-[#131318] border-[0.6px] border-[rgba(255,255,255,0.08)] rounded-[22px] p-[8px_14px] flex items-center gap-2 cursor-pointer transition-colors"
            >
              <RefreshCw size={12} className="text-mauve" />
              <span className="font-mono text-[11px] text-[rgba(255,255,255,0.45)] hidden md:inline">Simulate Context</span>
            </motion.button>
            <motion.button 
              onClick={() => setActiveTab('Nutri-Scan')}
              whileHover={{ backgroundColor: 'rgba(46,255,154,0.16)' }}
              whileTap={{ scale: 0.95 }}
              aria-label="Scan Food"
              className="bg-[rgba(46,255,154,0.1)] border-[0.6px] border-[rgba(46,255,154,0.3)] rounded-[22px] p-[8px_14px] flex items-center gap-2 cursor-pointer transition-colors"
            >
              <div className="w-[6px] h-[6px] rounded-full bg-jade" />
              <span className="font-mono text-[11px] text-jade hidden md:inline">Scan food</span>
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              aria-label="Profile"
              className="w-[30px] h-[30px] shrink-0 rounded-full bg-[rgba(196,168,255,0.12)] border-[0.6px] border-[rgba(196,168,255,0.25)] flex items-center justify-center cursor-pointer"
            >
              <User size={14} className="text-mauve" />
            </motion.button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar p-[14px] md:p-[22px_28px]">
          
          {activeTab === 'Nutri-Scan' ? (
            <NutriScan />
          ) : activeTab === 'Dashboard' ? (
            <>
              {/* Top Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[14px] mb-[14px]">
                
                {/* Panel 1: Proactive Nudge */}
                <div className="panel animate-floatIn" style={{ animationDelay: '80ms' }}>
                  <div className="micro-label mb-[14px]">Proactive Nudge</div>
                  
                  {/* Nudge Card */}
                  <div className="bg-[#0E0E12] border-[0.6px] border-[rgba(46,255,154,0.15)] rounded-[12px] p-[14px] mb-[12px] -rotate-1 relative z-10 transition-all h-[120px] flex flex-col justify-center">
                    {error ? (
                      <div className="text-center">
                        <span className="font-mono text-[11px] text-mauve block mb-1">Agent Error</span>
                        <span className="font-sans text-[12px] text-[rgba(255,255,255,0.6)]">{error}</span>
                      </div>
                    ) : loading ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 size={16} className="text-jade animate-spin" />
                        <span className="font-mono text-[10px] text-[rgba(255,255,255,0.4)]">Analyzing context...</span>
                      </div>
                    ) : recommendation ? (
                      <>
                        <div className="flex items-center gap-[7px] mb-[8px]">
                          <div className="font-mono text-[9px] text-jade bg-[rgba(46,255,154,0.10)] border-[0.5px] border-[rgba(46,255,154,0.25)] rounded-[20px] p-[3px_8px] whitespace-nowrap">
                            {currentScenario.upcoming_events[0].event_type} · In {Math.abs(parseInt(currentScenario.upcoming_events[0].start_time.split(':')[1]) - parseInt(currentScenario.current_time.split(':')[1]))} min
                          </div>
                          <div className="font-mono text-[9px] text-[rgba(255,255,255,0.25)] truncate">
                            ◎ {currentScenario.current_location}
                          </div>
                        </div>
                        <div className="font-display italic text-[14px] text-[rgba(255,255,255,0.85)] leading-[1.45] mb-[10px] line-clamp-2">
                          {recommendation.reason || "We found a great option that fits your current targets."}
                        </div>
                        <div className="flex gap-[6px] flex-wrap">
                          <Chip variant="jade" onClick={() => submitFeedback(recommendation.suggested_item, true)}>
                            {recommendation.suggested_item || "Accept suggestion"}
                          </Chip>
                          <Chip variant="mauve" onClick={() => submitFeedback(recommendation.suggested_item, false)}>Reject</Chip>
                        </div>
                      </>
                    ) : (
                      <div className="text-center font-display italic text-[16px] text-[rgba(255,255,255,0.18)]">
                        Location data pending. Check back soon.
                      </div>
                    )}
                  </div>

                  {/* Today's log feed */}
                  <div className="micro-label mt-5 mb-2">Today's log</div>
                  <div className="flex flex-col">
                    <div className="flex items-center py-[8px] border-b-[0.5px] border-[rgba(255,255,255,0.04)] transition-colors hover:bg-[rgba(255,255,255,0.02)]">
                      <div className="w-[5px] h-[5px] rounded-full bg-[rgba(46,255,154,0.6)] shrink-0 mr-3"></div>
                      <div className="font-sans text-[12px] text-[rgba(255,255,255,0.6)] flex-1 truncate">Morning Protein Shake</div>
                      <div className="font-mono text-[10px] text-[rgba(255,255,255,0.2)] mr-4">08:45</div>
                      <div className="font-mono text-[11px] text-[rgba(255,255,255,0.4)]">320 kcal</div>
                    </div>
                    <div className="flex items-center py-[8px] border-b-[0.5px] border-[rgba(255,255,255,0.04)] transition-colors hover:bg-[rgba(255,255,255,0.02)]">
                      <div className="w-[5px] h-[5px] rounded-full bg-[rgba(196,168,255,0.6)] shrink-0 mr-3"></div>
                      <div className="font-sans text-[12px] text-[rgba(255,255,255,0.6)] flex-1 truncate">Black Coffee</div>
                      <div className="font-mono text-[10px] text-[rgba(255,255,255,0.2)] mr-4">10:15</div>
                      <div className="font-mono text-[11px] text-[rgba(255,255,255,0.4)]">5 kcal</div>
                    </div>
                    <div className="flex items-center py-[8px] opacity-30 transition-colors hover:bg-[rgba(255,255,255,0.02)]">
                      <div className="w-[5px] h-[5px] rounded-full border-[0.5px] border-dashed border-[rgba(255,255,255,0.2)] shrink-0 mr-3"></div>
                      <div className="font-sans italic text-[12px] text-[rgba(255,255,255,0.6)] flex-1 truncate">Pending {currentScenario.upcoming_events[0].event_type}</div>
                      <div className="font-mono text-[10px] text-[rgba(255,255,255,0.2)] mr-4">—</div>
                      <div className="font-mono text-[11px] text-[rgba(255,255,255,0.4)]">—</div>
                    </div>
                  </div>
                </div>

                {/* Panel 2: Daily Macros */}
                <div className="panel animate-floatIn flex flex-col" style={{ animationDelay: '160ms' }}>
                  <div className="micro-label mb-0">Daily Macros</div>
                  
                  <div className="flex flex-col items-center mt-2 mb-0">
                    <div className="font-display italic text-[38px] text-white leading-none">1,847</div>
                    <div className="font-mono text-[10px] text-[rgba(255,255,255,0.25)] text-center mt-[4px]">of 2,200 kcal · 353 remaining</div>
                  </div>
                  
                  <CalorieBar consumed={1847} target={2200} />

                  <div className="flex justify-around mt-[16px]">
                    <div className="text-center flex flex-col items-center">
                      <RingProgress progress={75} color="#2EFF9A" />
                      <div className="font-mono text-[16px] text-white mt-[6px]">120g</div>
                      <div className="font-mono text-[9px] uppercase text-[rgba(255,255,255,0.28)] tracking-[0.06em] mt-[2px]">Pro</div>
                    </div>
                    <div className="text-center flex flex-col items-center">
                      <RingProgress progress={85} color="#C4A8FF" />
                      <div className="font-mono text-[16px] text-white mt-[6px]">250g</div>
                      <div className="font-mono text-[9px] uppercase text-[rgba(255,255,255,0.28)] tracking-[0.06em] mt-[2px]">Carb</div>
                    </div>
                    <div className="text-center flex flex-col items-center">
                      <RingProgress progress={45} color="rgba(255,255,255,0.4)" />
                      <div className="font-mono text-[16px] text-white mt-[6px]">40g</div>
                      <div className="font-mono text-[9px] uppercase text-[rgba(255,255,255,0.28)] tracking-[0.06em] mt-[2px]">Fat</div>
                    </div>
                  </div>

                  <motion.button 
                    onClick={() => setActiveTab('Nutri-Scan')}
                    whileHover={{ scale: 0.98 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Nutri-Scan Tool"
                    className="flex items-center gap-[8px] bg-[rgba(46,255,154,0.10)] border-[0.6px] border-[rgba(46,255,154,0.30)] rounded-[12px] p-[11px_16px] cursor-pointer w-full mb-[12px] mt-auto transition-colors hover:bg-[rgba(46,255,154,0.15)]"
                  >
                    <div className="w-[32px] h-[32px] shrink-0 relative flex items-center justify-center animate-pulseScan">
                      <div className="absolute top-0 left-0 w-[10px] h-[10px] border-l-[1.5px] border-t-[1.5px] border-jade rounded-tl-[4px]"></div>
                      <div className="absolute top-0 right-0 w-[10px] h-[10px] border-r-[1.5px] border-t-[1.5px] border-jade rounded-tr-[4px]"></div>
                      <div className="absolute bottom-0 left-0 w-[10px] h-[10px] border-l-[1.5px] border-b-[1.5px] border-jade rounded-bl-[4px]"></div>
                      <div className="absolute bottom-0 right-0 w-[10px] h-[10px] border-r-[1.5px] border-b-[1.5px] border-jade rounded-br-[4px]"></div>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-sans text-[13px] text-jade font-medium">Nutri-Scan</div>
                      <div className="font-mono text-[10px] text-[rgba(46,255,154,0.5)] mt-[2px]">photo · barcode · label</div>
                    </div>
                    <ArrowUpRight size={14} className="text-[rgba(46,255,154,0.5)]" />
                  </motion.button>

                  <div className="raised-card hidden md:block">
                    <div className="flex justify-between items-center mb-[8px]">
                      <div className="font-sans text-[13px] text-[rgba(255,255,255,0.7)] truncate">Oatmeal Bowl</div>
                      <div className="font-mono text-[10px] text-[rgba(255,255,255,0.2)] shrink-0 ml-2">Scanned 4 hr ago</div>
                    </div>
                    <div className="grid grid-cols-4 gap-[8px]">
                      <div className="text-center">
                        <div className="font-mono text-[14px] text-white">240</div>
                        <div className="font-mono text-[9px] text-[rgba(255,255,255,0.25)]">kcal</div>
                      </div>
                      <div className="text-center">
                        <div className="font-mono text-[14px] text-jade">12g</div>
                        <div className="font-mono text-[9px] text-[rgba(255,255,255,0.25)]">pro</div>
                      </div>
                      <div className="text-center">
                        <div className="font-mono text-[14px] text-white">40g</div>
                        <div className="font-mono text-[9px] text-[rgba(255,255,255,0.25)]">carb</div>
                      </div>
                      <div className="text-center">
                        <div className="font-mono text-[14px] text-white">4g</div>
                        <div className="font-mono text-[9px] text-[rgba(255,255,255,0.25)]">fat</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel 3: Streak & Goals */}
                <div className="panel animate-floatIn md:col-span-2 xl:col-span-1" style={{ animationDelay: '240ms' }}>
                  <div className="micro-label mb-[14px]">Streak & Goals</div>
                  
                  <div className="flex justify-between items-start mb-[14px]">
                    <div>
                      <div className="font-display italic text-[42px] text-jade leading-none">14</div>
                      <div className="font-mono text-[9px] text-[rgba(46,255,154,0.5)] uppercase tracking-[0.08em] mt-1">day streak</div>
                      <div className="font-sans text-[12px] text-[rgba(255,255,255,0.4)] mt-[4px]">Best: 21 days</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-[10px] text-[rgba(255,255,255,0.3)]">this week</div>
                      <div className="font-display italic text-[18px] text-jade">7 / 7</div>
                    </div>
                  </div>

                  {/* Streak Waveform */}
                  <div className="flex items-end gap-[3px] h-[40px] w-full">
                    <div className="flex-1 rounded-[2px] bg-[rgba(255,255,255,0.08)]" style={{ height: '30%' }} />
                    <div className="flex-1 rounded-[2px] bg-[rgba(255,255,255,0.08)]" style={{ height: '40%' }} />
                    <div className="flex-1 rounded-[2px] bg-[rgba(255,255,255,0.08)]" style={{ height: '20%' }} />
                    <div className="flex-1 rounded-[2px] bg-[rgba(255,255,255,0.08)]" style={{ height: '50%' }} />
                    <div className="flex-1 rounded-[2px] bg-[rgba(255,255,255,0.08)]" style={{ height: '60%' }} />
                    
                    <div className="flex-1 rounded-[2px] bg-[rgba(46,255,154,0.3)]" style={{ height: '40%' }} />
                    <div className="flex-1 rounded-[2px] bg-[rgba(46,255,154,0.3)]" style={{ height: '70%' }} />
                    <div className="flex-1 rounded-[2px] bg-[rgba(46,255,154,0.3)]" style={{ height: '55%' }} />
                    <div className="flex-1 rounded-[2px] bg-[rgba(46,255,154,0.3)]" style={{ height: '80%' }} />
                    
                    <div className="flex-1 rounded-[2px] bg-jade" style={{ height: '65%' }} />
                    <div className="flex-1 rounded-[2px] bg-jade" style={{ height: '90%' }} />
                    <div className="flex-1 rounded-[2px] bg-jade" style={{ height: '75%' }} />
                    <div className="flex-1 rounded-[2px] bg-jade" style={{ height: '85%' }} />
                    <div className="flex-1 rounded-[2px] bg-jade" style={{ height: '100%' }} />
                  </div>

                  <div className="grid grid-cols-2 gap-[8px] mt-[12px]">
                    <motion.div whileHover={{ scale: 0.99, backgroundColor: 'rgba(255,255,255,0.03)' }} className="bg-[#0E0E12] border-[0.6px] border-[rgba(255,255,255,0.06)] rounded-[12px] p-[12px] cursor-pointer">
                      <div className="font-mono text-[9px] uppercase text-[rgba(255,255,255,0.25)] mb-[6px]">Today's kcal</div>
                      <div className="font-display italic text-[22px] text-white leading-none">1,847</div>
                      <div className="font-mono text-[10px] text-[rgba(196,168,255,0.65)] mt-[4px]">on track</div>
                    </motion.div>
                    <motion.div whileHover={{ scale: 0.99, backgroundColor: 'rgba(255,255,255,0.03)' }} className="bg-[#0E0E12] border-[0.6px] border-[rgba(255,255,255,0.06)] rounded-[12px] p-[12px] cursor-pointer">
                      <div className="font-mono text-[9px] uppercase text-[rgba(255,255,255,0.25)] mb-[6px]">Goal pace</div>
                      <div className="font-display italic text-[16px] text-white leading-none">On track</div>
                      <div className="font-mono text-[10px] text-[rgba(196,168,255,0.65)] mt-[4px]">–0.5 kg/w</div>
                    </motion.div>
                    <motion.div whileHover={{ scale: 0.99, backgroundColor: 'rgba(255,255,255,0.03)' }} className="bg-[#0E0E12] border-[0.6px] border-[rgba(255,255,255,0.06)] rounded-[12px] p-[12px] cursor-pointer">
                      <div className="font-mono text-[9px] uppercase text-[rgba(255,255,255,0.25)] mb-[6px]">Weekly avg</div>
                      <div className="font-display italic text-[22px] text-white leading-none">2,104</div>
                      <div className="font-mono text-[10px] text-[rgba(196,168,255,0.65)] mt-[4px]">kcal</div>
                    </motion.div>
                    <motion.div whileHover={{ scale: 0.99, backgroundColor: 'rgba(255,255,255,0.03)' }} className="bg-[#0E0E12] border-[0.6px] border-[rgba(255,255,255,0.06)] rounded-[12px] p-[12px] cursor-pointer">
                      <div className="font-mono text-[9px] uppercase text-[rgba(255,255,255,0.25)] mb-[6px]">Milestone</div>
                      <div className="font-display italic text-[16px] text-white leading-none">May 14</div>
                      <div className="font-mono text-[10px] text-[rgba(196,168,255,0.65)] mt-[4px]">projected</div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Bottom Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-[14px]">
                
                {/* Panel 4: Health Artifact */}
                <div className="panel col-span-1 animate-floatIn" style={{ animationDelay: '320ms' }}>
                  <div className="micro-label mb-[14px]">Health Artifact</div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-[18px]">
                    {/* Left - Memory Feed */}
                    <div>
                      <div className="font-display italic text-[16px] text-[rgba(255,255,255,0.8)] leading-[1.5] mb-[14px]">
                        You've shifted towards a low-glycemic breakfast routine, improving morning energy levels.
                      </div>
                      <div className="flex flex-wrap gap-[6px] mb-[14px]">
                        <Chip variant="jade">low-glycemic</Chip>
                        <Chip variant="jade">high-protein</Chip>
                        <Chip variant="mauve">plant-forward</Chip>
                        <Chip variant="deprecated">sweet-tooth</Chip>
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <div className="flex items-center gap-[10px] p-[8px_10px] rounded-[10px] bg-[#0E0E12]">
                          <div className="w-[3px] h-[28px] rounded-[2px] shrink-0 bg-jade"></div>
                          <div className="font-sans text-[12px] text-[rgba(255,255,255,0.6)] flex-1 truncate">Avocado Toast swap</div>
                          <div className="font-mono text-[10px] text-[rgba(255,255,255,0.3)]">320 kcal</div>
                          <div className="font-mono text-[9px] rounded-[20px] p-[2px_7px] border-[0.5px] text-jade border-[rgba(46,255,154,0.35)] bg-[rgba(46,255,154,0.07)]">Accepted</div>
                        </div>
                        <div className="flex items-center gap-[10px] p-[8px_10px] rounded-[10px] bg-[#0E0E12]">
                          <div className="w-[3px] h-[28px] rounded-[2px] shrink-0 bg-mauve"></div>
                          <div className="font-sans text-[12px] text-[rgba(255,255,255,0.6)] flex-1 truncate">Kale Caesar</div>
                          <div className="font-mono text-[10px] text-[rgba(255,255,255,0.3)]">410 kcal</div>
                          <div className="font-mono text-[9px] rounded-[20px] p-[2px_7px] border-[0.5px] text-mauve border-[rgba(196,168,255,0.35)] bg-[rgba(196,168,255,0.07)] line-through">Rejected</div>
                        </div>
                      </div>
                    </div>

                    {/* Right - Taste Profile */}
                    <div>
                      <div className="micro-label mb-[14px] mt-[14px] md:mt-0">Taste profile · adaptive</div>
                      <div className="flex flex-col gap-[8px]">
                        <TasteBar label="Savoury" pct={85} variant="jade" delay={300} />
                        <TasteBar label="Protein-rich" pct={75} variant="jade" delay={360} />
                        <TasteBar label="Plant-based" pct={60} variant="mauve" delay={420} />
                        <TasteBar label="Spicy" pct={45} variant="mauve" delay={480} />
                        <TasteBar label="Sweet" pct={30} variant="muted" delay={540} />
                        <TasteBar label="High-carb" pct={15} variant="muted" delay={600} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel 5: Weekly Progress */}
                <div className="panel col-span-1 flex flex-col justify-between animate-floatIn" style={{ animationDelay: '400ms' }}>
                  <div>
                    <div className="micro-label mb-[8px]">Weekly Progress</div>
                    
                    {/* Weekly Bar Chart */}
                    <div className="flex items-end gap-[6px] h-[80px] mt-[8px]">
                      {['M','T','W','T','F','S','S'].map((day, i) => {
                        const heights = [70, 85, 60, 95, 80, 0, 0];
                        const isToday = i === 4;
                        return (
                          <div key={i} className="flex flex-col items-center gap-[4px] flex-1">
                            <div className="flex-1 flex items-end w-full">
                              <div 
                                className={`w-full rounded-t-[3px] transition-all duration-500 ease-spring ${isToday ? 'bg-jade' : 'bg-[rgba(255,255,255,0.12)]'}`}
                                style={{ height: `${heights[i]}%` }}
                              />
                            </div>
                            <div className={`font-mono text-[9px] ${isToday ? 'text-jade' : 'text-[rgba(255,255,255,0.2)]'}`}>{day}</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary Stats Row */}
                    <div className="flex justify-between mt-[14px]">
                      <div>
                        <div className="micro-label">Weekly avg</div>
                        <div className="font-mono text-[18px] text-white mt-[4px]">2,104</div>
                        <div className="font-mono text-[10px] text-[rgba(255,255,255,0.25)]">kcal / day</div>
                      </div>
                      <div className="text-right">
                        <div className="micro-label">vs target</div>
                        <div className="font-display italic text-[18px] text-jade mt-[4px]">−96</div>
                        <div className="font-mono text-[10px] text-[rgba(46,255,154,0.5)]">under budget</div>
                      </div>
                    </div>
                  </div>

                  {/* Macro Split Bar */}
                  <div className="mt-[14px] pt-[14px] border-t-[0.5px] border-[rgba(255,255,255,0.05)]">
                    <div className="micro-label">Macros split · today</div>
                    <div className="flex h-[6px] rounded-[3px] overflow-hidden gap-[2px] mt-[8px]">
                      <div className="bg-jade rounded-[3px]" style={{ flex: 35 }}></div>
                      <div className="bg-mauve rounded-[3px]" style={{ flex: 45 }}></div>
                      <div className="bg-[rgba(255,255,255,0.25)] rounded-[3px]" style={{ flex: 20 }}></div>
                    </div>
                    <div className="flex justify-between md:justify-start md:gap-[14px] mt-[7px]">
                      <div className="font-mono text-[9px] md:text-[10px] text-white"><span className="text-jade">●</span> Pro 35%</div>
                      <div className="font-mono text-[9px] md:text-[10px] text-white"><span className="text-mauve">●</span> Carb 45%</div>
                      <div className="font-mono text-[9px] md:text-[10px] text-white"><span className="text-[rgba(255,255,255,0.25)]">●</span> Fat 20%</div>
                    </div>
                  </div>
                </div>

              </div>
            </>
          ) : (
            <EmptyPage title={activeTab} />
          )}
        </div>
      </div>
    </div>
  );
}
