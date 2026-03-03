import os

# Define the project name
PROJECT_NAME = "care-portal"

# Define the file structure and content
files = {
    "package.json": """
{
  "name": "care-portal",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "clsx": "^2.1.0",
    "date-fns": "^3.0.0",
    "lucide-react": "^0.300.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "vite": "^5.0.8"
  }
}
""",
    "vite.config.js": """
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})
""",
    "tailwind.config.js": """
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      padding: {
        'safe': 'env(safe-area-inset-bottom)',
      }
    },
  },
  plugins: [],
}
""",
    "postcss.config.js": """
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
""",
    "index.html": """
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Mother's Care Portal</title>
    <meta name="description" content="Family Care Portal" />
    <meta name="theme-color" content="#0f172a" />
  </head>
  <body class="bg-slate-950">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
""",
    "src/index.css": """
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  overscroll-behavior-y: none; /* Prevents pull-to-refresh on mobile */
}

/* Hide scrollbar for Chrome, Safari and Opera */
.no-scrollbar::-webkit-scrollbar {
    display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.no-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
}
""",
    "src/main.jsx": """
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
""",
    "src/lib/supabase.js": """
import { createClient } from '@supabase/supabase-js'

// These will be loaded from your .env file or Cloudflare Pages Environment Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Conditional creation to prevent crashing during initial setup without keys
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = () => !!supabase;
""",
    ".env.example": """
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
""",
    "src/App.jsx": """
import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Pill, 
  ClipboardList, 
  User, 
  Plus, 
  X, 
  Check, 
  AlertTriangle, 
  Clock, 
  ChevronRight,
  Droplets,
  StickyNote,
  Undo2,
  Phone,
  Wind,
  Archive,
  ShoppingCart
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';

// --- MOCK DATA FOR OFFLINE / PROTOTYPING ---
// In production, these are replaced by DB calls

const MOCK_USER = {
  name: "Sarah (Primary)",
  role: "primary"
};

const INITIAL_MEDS = [
  { id: 1, name: 'Lisinopril', dosage: '10mg', time: 'Morning', stock: 24, threshold: 7, takenToday: false },
  { id: 2, name: 'Metformin', dosage: '500mg', time: 'Morning', stock: 12, threshold: 14, takenToday: false },
  { id: 3, name: 'Atorvastatin', dosage: '20mg', time: 'Night', stock: 28, threshold: 7, takenToday: false },
];

const INITIAL_SUPPLIES = {
  oxygenTanksFull: 4,
  oxygenTanksEmpty: 2,
  cannulas: 5,
  distilledWater: 2 // bottles
};

const INITIAL_EVENTS = [
  { id: 101, type: 'med_taken', title: 'Lisinopril 10mg', time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), user: 'Sarah' },
  { id: 102, type: 'vitals', title: 'O2 Sat: 96%', value: '96', subValue: 'HR: 72', time: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), user: 'Sarah' },
  { id: 103, type: 'note', title: 'Care Note', text: 'Mom ate a good breakfast. Mood is stable.', time: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), user: 'Mike' },
];

const EMERGENCY_CONTACTS = [
  { name: "Dr. Smith (Cardio)", phone: "555-0123" },
  { name: "Emergency Room", phone: "911" },
];

// --- UTILITIES ---

const formatTime = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getRelativeTime = (isoString) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return date.toLocaleDateString();
};

// --- COMPONENTS ---

const Button = ({ children, onClick, variant = 'primary', size = 'md', className = '', icon: Icon, disabled = false }) => {
  const baseStyle = "flex items-center justify-center font-medium rounded-xl transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-900/20",
    secondary: "bg-slate-700 text-slate-100 hover:bg-slate-600 border border-slate-600",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-900/20",
    ghost: "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800",
    outline: "border-2 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
  };
  
  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-6 py-4 text-lg",
    xl: "px-8 py-5 text-xl h-20" // Easy hit target
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {Icon && <Icon className="w-5 h-5 mr-2" />}
      {children}
    </button>
  );
};

const Card = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-slate-800 rounded-2xl border border-slate-700 p-4 shadow-sm ${onClick ? 'cursor-pointer active:bg-slate-750' : ''} ${className}`}
  >
    {children}
  </div>
);

// --- MAIN APP ---

export default function App() {
  const [view, setView] = useState('auth'); // auth, home, meds, supplies, profile
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // State
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [meds, setMeds] = useState(INITIAL_MEDS);
  const [supplies, setSupplies] = useState(INITIAL_SUPPLIES);
  
  const [showLogModal, setShowLogModal] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Undo functionality
  const lastActionRef = useRef(null);

  // Supabase (Future Implementation Placeholder)
  // useEffect(() => {
  //   if (isSupabaseConfigured()) {
  //     // fetch data from DB
  //   }
  // }, []);

  // --- ACTIONS ---

  const handleLogin = (pin) => {
    if (pin === '1234') {
      setIsAuthenticated(true);
      setView('home');
    }
  };

  const addEvent = (newEvent) => {
    const eventWithId = { 
      ...newEvent, 
      id: Date.now(), 
      time: new Date().toISOString(),
      user: MOCK_USER.name.split(' ')[0]
    };
    
    setEvents(prev => [eventWithId, ...prev]);
    lastActionRef.current = { type: 'add_event', id: eventWithId.id };
    
    showToast(`${newEvent.title} logged`, true);
    setShowLogModal(false);
  };

  const handleUndo = () => {
    if (!lastActionRef.current) return;
    
    if (lastActionRef.current.type === 'add_event') {
      setEvents(prev => prev.filter(e => e.id !== lastActionRef.current.id));
      showToast("Entry removed");
      lastActionRef.current = null;
    }
  };

  const takeMedication = (medId) => {
    const med = meds.find(m => m.id === medId);
    if (!med) return;

    // Update med stock
    setMeds(prev => prev.map(m => 
      m.id === medId ? { ...m, stock: m.stock - 1, takenToday: true } : m
    ));

    // Log event
    addEvent({
      type: 'med_taken',
      title: `${med.name} ${med.dosage}`,
      text: `Inventory: ${med.stock - 1} remaining`
    });
  };

  const useTank = () => {
    if (supplies.oxygenTanksFull <= 0) return;
    
    setSupplies(prev => ({
      ...prev,
      oxygenTanksFull: prev.oxygenTanksFull - 1,
      oxygenTanksEmpty: prev.oxygenTanksEmpty + 1
    }));

    addEvent({
      type: 'supply',
      title: 'Oxygen Tank Swapped',
      text: `${supplies.oxygenTanksFull - 1} full tanks remaining`
    });
  };

  const showToast = (message, canUndo = false) => {
    setToast({ message, canUndo });
    setTimeout(() => setToast(null), 4000);
  };

  // --- SCREENS ---

  const AuthScreen = () => {
    const [pin, setPin] = useState('');
    
    const handleNum = (num) => {
      if (pin.length < 4) {
        const newPin = pin + num;
        setPin(newPin);
        if (newPin.length === 4) handleLogin(newPin);
      }
    };

    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Mother's Care</h1>
          <p className="text-slate-400 mt-2">Enter PIN to access</p>
        </div>

        <div className="flex gap-4 mb-8">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`w-4 h-4 rounded-full transition-colors ${i < pin.length ? 'bg-blue-500' : 'bg-slate-700'}`} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button 
              key={num}
              onClick={() => handleNum(num)}
              className="h-20 bg-slate-800 rounded-xl text-2xl font-semibold active:bg-slate-700 transition-colors"
            >
              {num}
            </button>
          ))}
          <div />
          <button 
            onClick={() => handleNum(0)}
            className="h-20 bg-slate-800 rounded-xl text-2xl font-semibold active:bg-slate-700 transition-colors"
          >
            0
          </button>
          <button 
            onClick={() => setPin(pin.slice(0, -1))}
            className="h-20 flex items-center justify-center text-slate-400 active:text-slate-200"
          >
            <Undo2 className="w-6 h-6" />
          </button>
        </div>
        <p className="mt-8 text-slate-500 text-sm">Secured by Cloudflare Access</p>
      </div>
    );
  };

  const LogModal = () => {
    const [step, setStep] = useState('menu'); // menu, vitals, note
    const [o2, setO2] = useState('98');
    const [hr, setHr] = useState('72');
    const [note, setNote] = useState('');

    if (!showLogModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">
              {step === 'menu' ? 'Log Event' : step === 'vitals' ? 'Record Vitals' : 'Add Note'}
            </h2>
            <button onClick={() => setShowLogModal(false)} className="p-2 bg-slate-800 rounded-full text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto">
            {step === 'menu' && (
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="primary" 
                  size="xl" 
                  className="flex-col gap-2 h-32"
                  onClick={() => setStep('vitals')}
                >
                  <Activity className="w-8 h-8 mb-1" />
                  <span>Vitals</span>
                </Button>
                <Button 
                  variant="secondary" 
                  size="xl" 
                  className="flex-col gap-2 h-32"
                  onClick={() => {
                    addEvent({ type: 'med_taken', title: 'Generic Med', text: 'Administered per schedule' });
                  }}
                >
                  <Pill className="w-8 h-8 mb-1" />
                  <span>Quick Med</span>
                </Button>
                <Button 
                  variant="secondary" 
                  size="xl" 
                  className="flex-col gap-2 h-32"
                  onClick={() => {
                    useTank();
                    setShowLogModal(false);
                  }}
                >
                  <Wind className="w-8 h-8 mb-1" />
                  <span>Swap O2 Tank</span>
                </Button>
                <Button 
                  variant="secondary" 
                  size="xl" 
                  className="flex-col gap-2 h-32"
                  onClick={() => setStep('note')}
                >
                  <StickyNote className="w-8 h-8 mb-1" />
                  <span>Note</span>
                </Button>
              </div>
            )}

            {step === 'vitals' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800 p-4 rounded-2xl">
                    <label className="text-slate-400 text-sm block mb-2">Oxygen (SpO2)</label>
                    <div className="flex items-center">
                      <input 
                        type="number" 
                        value={o2}
                        onChange={(e) => setO2(e.target.value)}
                        className="w-full bg-transparent text-4xl font-bold text-white focus:outline-none"
                      />
                      <span className="text-slate-500 font-medium">%</span>
                    </div>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-2xl">
                    <label className="text-slate-400 text-sm block mb-2">Heart Rate</label>
                    <div className="flex items-center">
                      <input 
                        type="number" 
                        value={hr}
                        onChange={(e) => setHr(e.target.value)}
                        className="w-full bg-transparent text-4xl font-bold text-white focus:outline-none"
                      />
                      <span className="text-slate-500 font-medium">BPM</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-xl flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                  <p className="text-sm text-yellow-200">
                    If SpO2 is below 88%, consider starting oxygen immediately and contacting Dr. Smith.
                  </p>
                </div>

                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={() => addEvent({
                    type: 'vitals',
                    title: `O2 Sat: ${o2}%`,
                    value: o2,
                    subValue: `HR: ${hr}`,
                    text: 'Routine check'
                  })}
                >
                  Save Vitals
                </Button>
              </div>
            )}

            {step === 'note' && (
              <div className="space-y-4">
                <textarea
                  className="w-full h-40 bg-slate-800 border-none rounded-2xl p-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 resize-none text-lg"
                  placeholder="Tap to type or dictate notes..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  autoFocus
                />
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={() => addEvent({ type: 'note', title: 'Care Note', text: note })}
                >
                  Save Note
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const Dashboard = () => {
    // Determine status based on last vital
    const lastVital = events.find(e => e.type === 'vitals');
    const lastO2 = lastVital ? parseInt(lastVital.value) : 98;
    const statusColor = lastO2 >= 92 ? 'text-green-400' : lastO2 >= 88 ? 'text-yellow-400' : 'text-red-400';
    const statusText = lastO2 >= 92 ? 'Stable' : lastO2 >= 88 ? 'Monitor' : 'Critical';

    return (
      <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header Status */}
        <div className="flex justify-between items-end px-1">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Today</h1>
            <p className="text-slate-400 text-sm mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${statusColor}`}>{statusText}</p>
            <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Current Status</p>
          </div>
        </div>

        {/* Vitals Summary Card */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-slate-300 font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Latest Vitals
            </h3>
            <span className="text-xs text-slate-500">{lastVital ? getRelativeTime(lastVital.time) : 'No data'}</span>
          </div>
          <div className="grid grid-cols-2 gap-8 mb-4">
            <div>
              <p className="text-4xl font-bold text-white">{lastO2}<span className="text-lg text-slate-500 font-medium ml-1">%</span></p>
              <p className="text-slate-400 text-sm mt-1">SpO2 (Oxygen)</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">{lastVital?.subValue?.split(' ')[1] || '--'}<span className="text-lg text-slate-500 font-medium ml-1">bpm</span></p>
              <p className="text-slate-400 text-sm mt-1">Heart Rate</p>
            </div>
          </div>
          
          {supplies.oxygenTanksFull < 3 && (
             <div className="bg-red-900/30 border border-red-800/50 rounded-lg p-3 flex items-center gap-3">
               <AlertTriangle className="w-5 h-5 text-red-500" />
               <p className="text-sm text-red-200">Low Oxygen: Only {supplies.oxygenTanksFull} full tanks left.</p>
             </div>
          )}
        </Card>

        {/* Upcoming Tasks (Simulated) */}
        <div>
          <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-3 px-1">Up Next</h3>
          <Card className="flex items-center justify-between group active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400">
                <Pill className="w-6 h-6" />
              </div>
              <div>
                <p className="text-white font-medium">Atorvastatin</p>
                <p className="text-slate-400 text-sm">20mg • Night Dose</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-bold">8:00 PM</p>
              <p className="text-slate-500 text-xs">Scheduled</p>
            </div>
          </Card>
        </div>

        {/* Timeline Stream */}
        <div>
          <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-3 px-1">Activity Log</h3>
          <div className="space-y-4">
            {events.map((event, idx) => (
              <div key={event.id} className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:w-[2px] before:h-full before:bg-slate-800 last:before:hidden">
                <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-slate-900 ${
                  event.type === 'incident' ? 'bg-red-500' : 
                  event.type === 'vitals' ? 'bg-blue-500' : 
                  event.type === 'med_taken' ? 'bg-green-500' : 
                  event.type === 'supply' ? 'bg-purple-500' : 'bg-slate-500'
                }`} />
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-start">
                    <p className="text-white font-medium">{event.title}</p>
                    <span className="text-xs text-slate-500 font-mono">{formatTime(event.time)}</span>
                  </div>
                  {event.text && <p className="text-slate-400 text-sm mt-1">{event.text}</p>}
                  <p className="text-slate-600 text-xs mt-2 flex items-center gap-1">
                    <User className="w-3 h-3" /> {event.user}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const MedsScreen = () => {
    return (
      <div className="pb-24 space-y-6">
        <h1 className="text-3xl font-bold text-white tracking-tight px-1">Medications</h1>
        
        {['Morning', 'Noon', 'Night'].map(time => {
          const timeMeds = meds.filter(m => m.time === time);
          if (timeMeds.length === 0) return null;

          return (
            <div key={time}>
              <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-3 px-1 bg-slate-900 sticky top-0 py-2 z-10">
                {time}
              </h3>
              <div className="space-y-3">
                {timeMeds.map(med => (
                  <Card key={med.id} className="relative overflow-hidden group">
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <h4 className="text-lg font-semibold text-white">{med.name}</h4>
                        <p className="text-slate-400 text-sm">{med.dosage} • {med.instructions || 'Take with food'}</p>
                        
                        {/* Inventory Bar */}
                        <div className="mt-3 flex items-center gap-2">
                          <div className="h-1.5 w-24 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${med.stock < med.threshold ? 'bg-red-500' : 'bg-green-500'}`} 
                              style={{ width: `${(med.stock / 30) * 100}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${med.stock < med.threshold ? 'text-red-400' : 'text-slate-500'}`}>
                            {med.stock} left
                          </span>
                        </div>
                      </div>

                      {med.takenToday ? (
                        <div className="flex flex-col items-center justify-center bg-green-900/30 text-green-400 px-3 py-2 rounded-lg border border-green-900/50">
                          <Check className="w-5 h-5 mb-1" />
                          <span className="text-xs font-bold">TAKEN</span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => takeMedication(med.id)}
                          className="bg-slate-700 hover:bg-blue-600 text-white p-3 rounded-xl transition-colors active:scale-95"
                        >
                          Take
                        </button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const SuppliesScreen = () => {
    return (
      <div className="pb-24 space-y-6">
        <div className="px-1">
          <h1 className="text-3xl font-bold text-white tracking-tight">Supplies</h1>
          <p className="text-slate-400 text-sm mt-1">Oxygen & Equipment Inventory</p>
        </div>

        <div className="grid gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-900/30 p-3 rounded-xl text-blue-400">
                   <Wind className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Oxygen Tanks</h3>
                  <p className="text-slate-400 text-sm">Size E Cylinders</p>
                </div>
              </div>
              <div className="text-right">
                 <p className="text-2xl font-bold text-white">{supplies.oxygenTanksFull}</p>
                 <p className="text-xs text-slate-500 uppercase font-bold">Full</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                <span className="text-slate-300">Empty Tanks</span>
                <span className="text-white font-mono">{supplies.oxygenTanksEmpty}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={useTank} disabled={supplies.oxygenTanksFull === 0}>
                  Swap Tank
                </Button>
                <Button variant="primary" icon={ShoppingCart} onClick={() => showToast("Order sent to Supplier")}>
                  Order More
                </Button>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <h3 className="text-slate-300 font-medium mb-3">Consumables</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2">
                <div className="flex items-center gap-3">
                  <Archive className="w-5 h-5 text-slate-500" />
                  <span className="text-white">Nasal Cannulas</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSupplies(s => ({...s, cannulas: Math.max(0, s.cannulas - 1)}))} className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center">-</button>
                  <span className="w-4 text-center text-white">{supplies.cannulas}</span>
                  <button onClick={() => setSupplies(s => ({...s, cannulas: s.cannulas + 1}))} className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center">+</button>
                </div>
              </div>
               <div className="flex justify-between items-center p-2 border-t border-slate-700/50">
                <div className="flex items-center gap-3">
                  <Droplets className="w-5 h-5 text-slate-500" />
                  <span className="text-white">Distilled Water</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSupplies(s => ({...s, distilledWater: Math.max(0, s.distilledWater - 1)}))} className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center">-</button>
                  <span className="w-4 text-center text-white">{supplies.distilledWater}</span>
                  <button onClick={() => setSupplies(s => ({...s, distilledWater: s.distilledWater + 1}))} className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center">+</button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const ProfileScreen = () => (
    <div className="pb-24 space-y-6">
      <div className="flex items-center gap-4 px-1">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
          EP
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Eleanor P.</h1>
          <p className="text-slate-400 text-sm">DOB: 04/12/1948 • A+</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider px-1">Emergency Instructions</h3>
        <Card className="border-red-900/50 bg-red-900/10">
          <div className="flex gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
            <div>
              <p className="text-red-200 font-medium mb-1">DNR Order on File</p>
              <p className="text-red-300/80 text-sm leading-relaxed">
                Patient has a valid Do Not Resuscitate order. Copies are located on the refrigerator and in the Document Vault.
              </p>
            </div>
          </div>
        </Card>

        <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider px-1">Quick Contacts</h3>
        <div className="grid gap-3">
          {EMERGENCY_CONTACTS.map((contact, idx) => (
            <Card key={idx} className="flex items-center justify-between active:bg-slate-800">
              <span className="text-white font-medium">{contact.name}</span>
              <Button size="sm" variant="secondary" className="rounded-full" icon={Phone}>
                Call
              </Button>
            </Card>
          ))}
        </div>

        <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider px-1">System</h3>
        <Button variant="outline" className="w-full justify-between" onClick={() => setIsAuthenticated(false)}>
          <span>Sign Out</span>
          <span className="text-xs bg-slate-700 px-2 py-1 rounded">v1.0.4</span>
        </Button>
      </div>
    </div>
  );

  // --- RENDER ---

  if (!isAuthenticated) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-slate-800 text-white px-4 py-3 rounded-full shadow-2xl border border-slate-700 animate-in slide-in-from-top-2">
          <span className="text-sm font-medium">{toast.message}</span>
          {toast.canUndo && (
            <button 
              onClick={handleUndo} 
              className="text-blue-400 hover:text-blue-300 text-sm font-bold pl-3 border-l border-slate-600"
            >
              UNDO
            </button>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-lg mx-auto min-h-screen p-4 pt-6">
        {view === 'home' && <Dashboard />}
        {view === 'meds' && <MedsScreen />}
        {view === 'supplies' && <SuppliesScreen />}
        {view === 'profile' && <ProfileScreen />}
      </main>

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-24 right-6 md:right-[calc(50%-14rem)] z-40">
        <button 
          onClick={() => setShowLogModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white w-14 h-14 rounded-full shadow-xl shadow-blue-900/40 flex items-center justify-center transition-transform hover:scale-105 active:scale-90"
        >
          <Plus className="w-8 h-8" />
        </button>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-slate-900/90 backdrop-blur-md border-t border-slate-800 z-50 pb-safe">
        <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-2">
          <button 
            onClick={() => setView('home')}
            className={`flex flex-col items-center justify-center w-16 h-full space-y-1 ${view === 'home' ? 'text-blue-400' : 'text-slate-500'}`}
          >
            <Clock className="w-6 h-6" />
            <span className="text-[10px] font-medium">Now</span>
          </button>
          
          <div className="w-12" /> {/* Spacer for FAB */}
          
          <button 
            onClick={() => setView('meds')}
            className={`flex flex-col items-center justify-center w-16 h-full space-y-1 ${view === 'meds' ? 'text-blue-400' : 'text-slate-500'}`}
          >
            <Pill className="w-6 h-6" />
            <span className="text-[10px] font-medium">Meds</span>
          </button>

          <button 
            onClick={() => setView('supplies')}
            className={`flex flex-col items-center justify-center w-16 h-full space-y-1 ${view === 'supplies' ? 'text-blue-400' : 'text-slate-500'}`}
          >
            <Wind className="w-6 h-6" />
            <span className="text-[10px] font-medium">Supplies</span>
          </button>
          
          <button 
            onClick={() => setView('profile')}
            className={`flex flex-col items-center justify-center w-16 h-full space-y-1 ${view === 'profile' ? 'text-blue-400' : 'text-slate-500'}`}
          >
            <User className="w-6 h-6" />
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </div>
      </nav>

      {/* Log Modal */}
      <LogModal />

    </div>
  );
}
"""
}

def create_project():
    # Create main project directory
    if not os.path.exists(PROJECT_NAME):
        os.makedirs(PROJECT_NAME)
        print(f"Created directory: {PROJECT_NAME}")
    
    # Create directories
    dirs = [
        "src",
        "src/assets",
        "src/components",
        "src/lib",
        "src/screens",
        "public"
    ]
    
    for d in dirs:
        path = os.path.join(PROJECT_NAME, d)
        if not os.path.exists(path):
            os.makedirs(path)
            print(f"Created directory: {path}")

    # Write files
    for filepath, content in files.items():
        full_path = os.path.join(PROJECT_NAME, filepath)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content.strip())
        print(f"Created file: {filepath}")

    print("\n" + "="*50)
    print("PROJECT SETUP COMPLETE")
    print("="*50)
    print(f"\nTo get started:")
    print(f"1. cd {PROJECT_NAME}")
    print("2. npm install")
    print("3. npm run dev")

if __name__ == "__main__":
    create_project()