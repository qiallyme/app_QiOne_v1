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
  ShoppingCart,
  Calendar,
  CheckSquare,
  History,
  Stethoscope,
  Save,
  Trash2,
  Book
} from 'lucide-react';
import { db, isConfigured } from './lib/db';
import { supabase } from './lib/supabase';
import BPTracker from './components/BPTracker';
import BinderScreen from './BinderScreen';

// --- MOCK DATA FOR OFFLINE / PROTOTYPING ---
// In production, these are replaced by DB calls

const MOCK_USER = {
  name: "Sarah (Primary)",
  role: "primary"
};

const INITIAL_MEDS = [
  { id: 1, name: 'Lisinopril', dosage: '10mg', time: 'Morning', stock: 24, threshold: 7, takenToday: false, zone: 2, category: 'active', expirationDate: '2026-06-01' },
  { id: 2, name: 'Metformin', dosage: '500mg', time: 'Morning', stock: 12, threshold: 14, takenToday: false, zone: 2, category: 'active', expirationDate: '2026-08-15' },
  { id: 3, name: 'Atorvastatin', dosage: '20mg', time: 'Night', stock: 28, threshold: 7, takenToday: false, zone: 2, category: 'active', expirationDate: '2026-05-20' },
  { id: 4, name: 'Albuterol Inhaler', dosage: '2 Puffs', time: 'PRN', stock: 1, threshold: 1, takenToday: false, zone: 1, category: 'prn', expirationDate: '2027-01-01' },
];

const INITIAL_TASKS = [
  {
    id: 1,
    task_name: 'Weekly Care Inventory Reset',
    priority: 'high',
    description: 'Check expirations, stock daily meds, verify O2/CPAP, restock PRN.',
    recurrence: 'weekly'
  }
];

const INITIAL_SUPPLIES = {
  oxygenTanksFull: 4,
  oxygenTanksEmpty: 2,
  cannulas: 5,
  distilledWater: 2 // bottles
};

const INITIAL_MEDICAL_HISTORY = [
  { id: 1, condition_name: 'COPD (Chronic Obstructive Pulmonary Disease)', diagnosed_year: '2018' },
  { id: 2, condition_name: 'Hypertension', diagnosed_year: '2015' }
];

const INITIAL_APPOINTMENTS = [
  { id: 1, title: 'Cardiology Follow-up', provider_name: 'Dr. Smith', appointment_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), location: 'Heart Center, Suite 200' }
];

const INITIAL_EVENTS = [
  { id: 101, type: 'med_taken', title: 'Lisinopril 10mg', time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), user: 'Sarah' },
  { id: 102, type: 'vitals', title: 'O2 Sat: 96%', value: '96', subValue: 'HR: 72', time: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), user: 'Sarah' },
  { id: 103, type: 'note', title: 'Care Note', text: 'Mom ate a good breakfast. Mood is stable.', time: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), user: 'Mike' },
];

const INITIAL_CONTACTS = [
  { id: 1, name: "Dr. Smith (Cardio)", phone: "555-0123" },
  { id: 2, name: "Emergency Room", phone: "911" },
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

export const Card = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`bg-slate-800 rounded-2xl border border-slate-700 p-4 shadow-sm ${onClick ? 'cursor-pointer active:bg-slate-750' : ''} ${className}`}
  >
    {children}
  </div>
);

// --- MAIN APP ---

export default function App() {
  const [view, setView] = useState('auth'); // auth, home, meds, supplies, profile, binder
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  console.log("App rendering... Auth state:", isAuthenticated);

  // State
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [meds, setMeds] = useState(INITIAL_MEDS);
  const [contacts, setContacts] = useState(INITIAL_CONTACTS);
  const [supplies, setSupplies] = useState(INITIAL_SUPPLIES);
  const [patientStatus, setPatientStatus] = useState({ first_name: 'Eleanor', last_name: 'P.', dob: '1948-04-12', blood_type: 'A+', baseline_o2: 94, emergency_instructions: '', dnr_status: true });
  const [medicalHistory, setMedicalHistory] = useState(INITIAL_MEDICAL_HISTORY);
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [tasks, setTasks] = useState(INITIAL_TASKS);

  const [showLogModal, setShowLogModal] = useState(false);
  const [logModalMode, setLogModalMode] = useState('menu'); // menu, vitals, note, add_task, add_appointment, add_med, edit_med, log_visit
  const [editingItem, setEditingItem] = useState(null);
  const [toast, setToast] = useState(null);

  // Undo functionality
  const lastActionRef = useRef(null);

  // Railway Data Sync Implementation
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await db.sync();
        if (data.error) throw new Error(data.error);

        if (data.meds) setMeds(data.meds.map(m => ({
          id: m.id,
          name: m.name,
          dosage: m.dosage,
          instructions: m.instructions,
          time: m.schedule_time,
          stock: m.stock_current,
          threshold: m.stock_threshold,
          takenToday: false
        })));

        if (data.patientStatus) setPatientStatus(data.patientStatus);
        if (data.medicalHistory) setMedicalHistory(data.medicalHistory);
        if (data.appointments) setAppointments(data.appointments);
        if (data.tasks) setTasks(data.tasks);

        if (data.events) setEvents(data.events.map(e => ({
          id: e.id,
          type: e.event_type,
          title: e.title,
          text: e.description,
          time: e.performed_at,
          user: 'Family',
          value: e.value_numeric,
          subValue: e.value_sub
        })));

      } catch (err) {
        console.error("Sync Error:", err);
      }
    };

    fetchData();

    // Since we're not using Supabase Realtime anymore, 
    // we poll every 30 seconds for updates across family members
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, []);

  // --- ACTIONS ---

  const handleLogin = (pin) => {
    if (pin === '1234') {
      setIsAuthenticated(true);
      setView('home');
    }
  };

  const addEvent = async (newEvent) => {
    const tempId = Date.now();
    const eventWithId = {
      ...newEvent,
      id: tempId,
      time: new Date().toISOString(),
      user: MOCK_USER.name.split(' ')[0]
    };

    // Optimistic Update
    setEvents(prev => [eventWithId, ...prev]);

    try {
      await db.logEvent({
        event_type: newEvent.type,
        title: newEvent.title,
        description: newEvent.text || newEvent.description,
        value_numeric: newEvent.value ? parseFloat(newEvent.value) : null,
        value_sub: newEvent.subValue ? (typeof newEvent.subValue === 'string' && newEvent.subValue.includes(':') ? null : parseFloat(newEvent.subValue)) : null
      });
    } catch (err) {
      console.error("API Save Failed:", err);
      showToast("Sync Error (Saved Locally)");
    }

    lastActionRef.current = { type: 'add_event', id: tempId };
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

  const takeMedication = async (medId) => {
    const med = meds.find(m => m.id === medId);
    if (!med) return;



    // Parse consumption count (default to 1)
    const consumption = med.count_per_dose || 1;
    const newStock = med.stock - consumption;

    // Update Local State
    setMeds(prev => prev.map(m =>
      m.id === medId ? { ...m, stock: newStock, takenToday: true } : m
    ));

    // Persist to Railway API
    try {
      await db.updateMedStock(medId, newStock);
    } catch (err) {
      console.error("Stock Sync Error:", err);
    }

    // Log event
    addEvent({
      type: 'med_taken',
      title: `${med.name} ${med.dosage}`,
      text: `Inventory: ${newStock} remaining`
    });
  };

  const useTank = async () => {
    if (supplies.oxygenTanksFull <= 0) return;

    const newFull = supplies.oxygenTanksFull - 1;
    const newEmpty = supplies.oxygenTanksEmpty + 1;

    setSupplies(prev => ({
      ...prev,
      oxygenTanksFull: newFull,
      oxygenTanksEmpty: newEmpty
    }));

    if (isSupabaseConfigured()) {
      await supabase
        .from('inventory_supplies')
        .update({ quantity_full: newFull, quantity_empty: newEmpty })
        .eq('item_type', 'oxygen_tank');
    }

    addEvent({
      type: 'supply',
      title: 'Oxygen Tank Swapped',
      text: `${newFull} full tanks remaining`
    });
  };

  const completeTask = async (taskId) => {
    // Optimistic Update
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      await db.completeTask(taskId);
      showToast("Task completed");
    } catch (err) {
      console.error("Task Sync Error:", err);
      showToast("Check connection");
    }
  };

  const showToast = (message, canUndo = false) => {
    setToast({ message, canUndo });
    setTimeout(() => setToast(null), 4000);
  };

  // --- SCREENS ---

  const AuthScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState('login'); // 'login' or 'signup'
    const [error, setError] = useState(null);

    const handleAuth = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      try {
        if (mode === 'signup') {
          const { error } = await supabase.auth.signUp({
            email,
            password,
          });
          if (error) throw error;
          alert('Check your email for the confirmation link!');
        } else { // Login
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          setIsAuthenticated(true);
          setView('home');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Keep the PIN backdoor for demo if needed, or remove it. Keeping it for now as "Emergency Access"
    const [pin, setPin] = useState('');
    const handlePin = (e) => {
      const val = e.target.value;
      setPin(val);
      if (val === '1234') {
        setIsAuthenticated(true);
        setView('home');
      }
    };

    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Mother's Care</h1>
          <p className="text-slate-400 mt-2">Sign in to manage care</p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          {error && <div className="bg-red-500/20 border border-red-500/50 p-3 rounded text-red-200 text-sm">{error}</div>}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full mt-1 p-3 bg-slate-800 border-none rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                placeholder="caregiver@example.com"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full mt-1 p-3 bg-slate-800 border-none rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              className="w-full py-3 text-lg"
              disabled={loading}
              onClick={() => { }} // Form submit handles it
            >
              {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Sign Up')}
            </Button>
          </form>

          <div className="text-center text-sm">
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-blue-400 hover:text-blue-300"
            >
              {mode === 'login' ? "Need an account? Sign Up" : "Have an account? Sign In"}
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500">Or Emergency PIN</span></div>
          </div>

          <input
            type="password"
            value={pin}
            onChange={handlePin}
            placeholder="Enter PIN"
            className="w-full p-3 bg-slate-800 border-none rounded-xl text-center text-white text-lg tracking-widest placeholder:text-slate-600 focus:ring-2 focus:ring-slate-500"
            maxLength={4}
          />
        </div>

        <p className="mt-8 text-slate-500 text-sm">Secured by Supabase Auth</p>
      </div>
    );
  };

  const LogModal = () => {
    const [step, setStep] = useState('menu'); // menu, vitals, note, add_task, add_appointment
    const [o2, setO2] = useState('98');
    const [hr, setHr] = useState('72');
    const [note, setNote] = useState('');

    // Task Form State
    const [taskName, setTaskName] = useState('');
    const [taskPriority, setTaskPriority] = useState('normal');

    // Appointment Form State
    const [apptTitle, setApptTitle] = useState('');
    const [apptDate, setApptDate] = useState('');
    const [apptProvider, setApptProvider] = useState('');

    // Visit Form State
    const [visitProvider, setVisitProvider] = useState('');
    const [visitReason, setVisitReason] = useState('');
    const [visitInstructions, setVisitInstructions] = useState('');

    useEffect(() => {
      if (showLogModal) {
        setStep(logModalMode);
        // Pre-fill for editing
        if (logModalMode === 'edit_med' && editingItem) {
          setMedName(editingItem.name);
          setMedDosage(editingItem.dosage);
          setMedStock(editingItem.stock);
          setMedFreq(editingItem.time === 'PRN' ? 'PRN' : editingItem.time === 'Weekly' ? 'Weekly' : 'Daily');
        }
      }
    }, [showLogModal, logModalMode]);

    if (!showLogModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">
              {step === 'menu' ? 'Log Event' :
                step === 'vitals' ? 'Record Vitals' :
                  step === 'add_task' ? 'New Task' :
                    step === 'add_appointment' ? 'New Appointment' :
                      'Add Note'}
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
                    // Smart Med Logic: Find first scheduled med not taken
                    const nextMed = meds.find(m => !m.takenToday && m.category === 'active') || meds[0];
                    if (nextMed) {
                      takeMedication(nextMed.id);
                      setShowLogModal(false);
                      showToast(`Taken: ${nextMed.name}`);
                    } else {
                      addEvent({ type: 'med_taken', title: 'Generic Med', text: 'Administered per schedule' });
                      setShowLogModal(false);
                    }
                  }}
                >
                  <Pill className="w-8 h-8 mb-1" />
                  <span>Quick Med</span>
                  <span className="text-xs text-slate-400 mt-1">
                    {meds.find(m => !m.takenToday && m.category === 'active')?.name || 'Next Scheduled'}
                  </span>
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
                  onClick={() => setStep('log_visit')}
                >
                  <Stethoscope className="w-8 h-8 mb-1" />
                  <span>Log Visit</span>
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

            {step === 'add_task' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-slate-400 text-sm">Task Name</label>
                  <input
                    className="w-full bg-slate-800 border-none rounded-xl p-3 text-white"
                    placeholder="e.g. Call Pharmacy"
                    value={taskName}
                    onChange={e => setTaskName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-slate-400 text-sm">Priority</label>
                  <select
                    className="w-full bg-slate-800 border-none rounded-xl p-3 text-white"
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value)}
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
                <Button className="w-full mt-4" onClick={() => {
                  const newTask = {
                    id: Date.now(),
                    task_name: taskName,
                    priority: taskPriority,
                    description: 'Added via Quick Add',
                    recurrence: 'one_time'
                  };
                  setTasks(prev => [...prev, newTask]);
                  setShowLogModal(false);
                  showToast("Task Created");
                }}>Create Task</Button>
              </div>
            )}

            {step === 'add_appointment' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-slate-400 text-sm">Title</label>
                  <input
                    className="w-full bg-slate-800 border-none rounded-xl p-3 text-white"
                    placeholder="e.g. Cardio Checkup"
                    value={apptTitle}
                    onChange={e => setApptTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-slate-400 text-sm">Provider</label>
                  <input
                    className="w-full bg-slate-800 border-none rounded-xl p-3 text-white"
                    placeholder="Dr. Smith"
                    value={apptProvider}
                    onChange={e => setApptProvider(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-slate-400 text-sm">Date</label>
                  <input
                    type="date"
                    className="w-full bg-slate-800 border-none rounded-xl p-3 text-white"
                    value={apptDate}
                    onChange={e => setApptDate(e.target.value)}
                  />
                </div>
                <Button className="w-full mt-4" onClick={() => {
                  const newAppt = {
                    id: Date.now(),
                    title: apptTitle,
                    provider_name: apptProvider,
                    appointment_at: new Date(apptDate).toISOString(),
                    location: 'TBD'
                  };
                  setAppointments(prev => [...prev, newAppt]);
                  setShowLogModal(false);
                  showToast("Appointment Added");
                }}>Schedule Appointment</Button>
              </div>
            )}


            {
              step === 'add_med' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-slate-400 text-sm">Medication Name</label>
                    <input
                      className="w-full bg-slate-800 border-none rounded-xl p-3 text-white"
                      placeholder="e.g. Aspirin"
                      value={medName}
                      onChange={e => setMedName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-slate-400 text-sm">Dosage</label>
                      <input
                        className="w-full bg-slate-800 border-none rounded-xl p-3 text-white"
                        placeholder="e.g. 50mg"
                        value={medDosage}
                        onChange={e => setMedDosage(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-slate-400 text-sm">Initial Stock</label>
                      <input
                        type="number"
                        className="w-full bg-slate-800 border-none rounded-xl p-3 text-white"
                        value={medStock}
                        onChange={e => setMedStock(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-400 text-sm">Frequency</label>
                    <select
                      className="w-full bg-slate-800 border-none rounded-xl p-3 text-white"
                      value={medFreq}
                      onChange={e => setMedFreq(e.target.value)}
                    >
                      <option value="Daily">Daily</option>
                      <option value="PRN">PRN (As Needed)</option>
                      <option value="Weekly">Weekly</option>
                    </select>
                  </div>

                  <Button className="w-full mt-4" onClick={() => {
                    const newMed = {
                      id: Date.now(),
                      name: medName,
                      dosage: medDosage,
                      stock: parseInt(medStock),
                      threshold: 10,
                      time: medFreq === 'PRN' ? 'PRN' : 'Morning', // Defaulting for simplicity
                      category: medFreq === 'PRN' ? 'prn' : 'active',
                      zone: 2, // Default zone
                      takenToday: false,
                      count_per_dose: 1
                    };
                    setMeds(prev => [...prev, newMed]);
                    setShowLogModal(false);
                    showToast("Medication Added");
                  }}>Add Medication</Button>
                </div>
              )
            }
          </div >
        </div >
      </div >
    );
          </div >
        </div >
      </div >
    );
};

{/* Log Visit Form */ }
if (step === 'log_visit') {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Log Clinical Visit</h2>
          <button onClick={() => setShowLogModal(false)} className="p-2 bg-slate-800 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-slate-400 text-sm">Provider / Location</label>
            <input className="w-full bg-slate-800 border-none rounded-xl p-3 text-white" placeholder="e.g. Dr. Smith / ER" value={visitProvider} onChange={e => setVisitProvider(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-slate-400 text-sm">Reason for Visit</label>
            <input className="w-full bg-slate-800 border-none rounded-xl p-3 text-white" placeholder="e.g. Chest pain, Checkup" value={visitReason} onChange={e => setVisitReason(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-slate-400 text-sm">Instructions / Outcome</label>
            <textarea className="w-full h-32 bg-slate-800 border-none rounded-xl p-3 text-white resize-none" placeholder="Notes from doctor..." value={visitInstructions} onChange={e => setVisitInstructions(e.target.value)} />
          </div>
          <Button className="w-full" onClick={() => {
            addEvent({
              type: 'visit',
              title: `Visit: ${visitProvider}`,
              text: `${visitReason}. Instructions: ${visitInstructions}`,
              user: 'Sarah'
            });
            setShowLogModal(false);
          }}>Save Visit Record</Button>
        </div>
      </div>
    </div>
  );
}

{/* Edit Med Form */ }
if (step === 'edit_med') {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Edit Medication</h2>
          <button onClick={() => setShowLogModal(false)} className="p-2 bg-slate-800 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-2"><label className="text-slate-400 text-sm">Name</label><input className="w-full bg-slate-800 border-none rounded-xl p-3 text-white" value={medName} onChange={e => setMedName(e.target.value)} /></div>
          <div className="space-y-2"><label className="text-slate-400 text-sm">Dosage</label><input className="w-full bg-slate-800 border-none rounded-xl p-3 text-white" value={medDosage} onChange={e => setMedDosage(e.target.value)} /></div>
          <div className="space-y-2"><label className="text-slate-400 text-sm">Stock</label><input type="number" className="w-full bg-slate-800 border-none rounded-xl p-3 text-white" value={medStock} onChange={e => setMedStock(e.target.value)} /></div>
          <Button className="w-full" onClick={() => {
            setMeds(prev => prev.map(m => m.id === editingItem.id ? { ...m, name: medName, dosage: medDosage, stock: parseInt(medStock) } : m));
            setShowLogModal(false);
            showToast("Medication Updated");
          }}>Save Changes</Button>
          <Button variant="ghost" className="w-full text-red-400" onClick={() => {
            if (confirm("Delete this medication?")) {
              setMeds(prev => prev.filter(m => m.id !== editingItem.id));
              setShowLogModal(false);
              showToast("Medication Deleted");
            }
          }}>Delete Medication</Button>
        </div>
      </div>
    </div>
  );
}


const EditProfileModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({ ...patientStatus });

  if (!isOpen) return null;

  const handleSave = async () => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('patient_status')
        .update(formData)
        .eq('id', 1);

      if (error) console.error("Error updating profile:", error);
    } else {
      setPatientStatus(formData);
    }
    onClose();
    showToast("Profile Updated");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-700 shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Edit Profile</h2>
          <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 text-xs uppercase font-bold mb-1 block">First Name</label>
              <input
                className="w-full bg-slate-800 border-none rounded-xl p-3 text-white"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs uppercase font-bold mb-1 block">Last Name</label>
              <input
                className="w-full bg-slate-800 border-none rounded-xl p-3 text-white"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>

          {/* Medical History Form Section (Quick Add for Profiling) */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-slate-400">Add Condition</h3>
            <div className="flex gap-2">
              <input
                placeholder="Condition"
                className="flex-1 bg-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setMedicalHistory(prev => [...prev, { id: Date.now(), condition_name: e.target.value, diagnosed_year: new Date().getFullYear().toString() }]);
                    e.target.value = '';
                  }
                }}
              />
              <Button size="sm" variant="secondary">Add</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 text-xs uppercase font-bold mb-1 block">DOB</label>
              <input
                type="date"
                className="w-full bg-slate-800 border-none rounded-xl p-3 text-white"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs uppercase font-bold mb-1 block">Blood Type</label>
              <input
                className="w-full bg-slate-800 border-none rounded-xl p-3 text-white"
                value={formData.blood_type}
                onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
              />
            </div>
          </div>

          <Button onClick={handleSave} className="w-full" icon={Save}>
            Save Profile
          </Button>
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

      {/* COPD Communication Reminder */}
      <Card className="bg-indigo-900/20 border-indigo-500/30">
        <div className="flex gap-3">
          <div className="bg-indigo-500/20 p-2 rounded-lg h-fit">
            <Wind className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <h3 className="text-indigo-200 font-bold text-sm uppercase">COPD Communication Support</h3>
            <p className="text-white font-medium mt-1">"Pause — breathe in through nose — slow out through mouth."</p>
            <p className="text-indigo-300/80 text-xs mt-1">Keep instructions short and calm. Minimize interruptions during meds.</p>
          </div>
        </div>
      </Card>

      {/* Vitals Summary Card */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-slate-300 font-medium flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            Latest Vitals
          </h3>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setView('bp')} className="text-xs text-blue-300 px-2 h-7">
              Full Log <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
            <span className="text-xs text-slate-500">{lastVital ? getRelativeTime(lastVital.time) : 'No data'}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 mb-4">
          <div>
            <p className="text-4xl font-bold text-white">{lastO2}<span className="text-lg text-slate-500 font-medium ml-1">%</span></p>
            <p className="text-slate-400 text-sm mt-1">SpO2 (Oxygen)</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-white">
              {lastVital ? (
                typeof lastVital.subValue === 'string' && lastVital.subValue.includes(' ')
                  ? lastVital.subValue.split(' ')[1]
                  : lastVital.subValue || '--'
              ) : '--'}
              <span className="text-lg text-slate-500 font-medium ml-1">bpm</span>
            </p>
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

      {/* Dynamic Up Next */}
      <div>
        <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-3 px-1">Up Next</h3>
        {(() => {
          const now = new Date();
          const items = [];

          // Meds Logic
          meds.forEach(med => {
            if (med.category === 'active' && !med.takenToday) {
              const time = med.time === 'Morning' ? new Date(new Date().setHours(8, 0, 0, 0)) :
                med.time === 'Night' ? new Date(new Date().setHours(20, 0, 0, 0)) : new Date();
              // If time passed, still show unless taken
              items.push({ type: 'med', data: med, time });
            }
          });

          // Appointments Logic
          appointments.forEach(appt => {
            const time = new Date(appt.appointment_at);
            if (time > now) items.push({ type: 'appt', data: appt, time });
          });

          const nextItems = items.sort((a, b) => a.time - b.time).slice(0, 3);

          if (nextItems.length === 0) return <p className="text-slate-500 px-1 italic">Nothing scheduled for today.</p>;

          return nextItems.map((item, i) => (
            <Card key={i} className="flex items-center justify-between mb-3 active:scale-[0.98] transition-transform cursor-pointer" onClick={() => {
              if (item.type === 'med') takeMedication(item.data.id);
            }}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.type === 'med' ? 'bg-blue-900/30 text-blue-400' : 'bg-purple-900/30 text-purple-400'}`}>
                  {item.type === 'med' ? <Pill className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                </div>
                <div>
                  <p className="text-white font-medium">{item.type === 'med' ? item.data.name : item.data.title}</p>
                  <p className="text-slate-400 text-sm">
                    {item.type === 'med' ? `${item.data.dosage} • ${item.data.time}` : item.data.provider_name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">
                  {item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className={`text-xs font-bold ${item.time < now ? 'text-red-400' : 'text-slate-500'}`}>
                  {item.time < now ? 'DUE NOW' : 'Scheduled'}
                </p>
              </div>
            </Card>
          ));
        })()}
      </div>

      {/* Timeline Stream */}
      <div>
        <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-3 px-1">Activity Log</h3>
        <div className="space-y-4">
          {events.map((event, idx) => (
            <div key={event.id} className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:w-[2px] before:h-full before:bg-slate-800 last:before:hidden">
              <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-slate-900 ${event.type === 'incident' ? 'bg-red-500' :
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
      <div className="px-1 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white tracking-tight">Medications</h1>
        <Button
          variant="secondary"
          size="sm"
          icon={Plus}
          onClick={() => {
            setLogModalMode('add_med');
            setShowLogModal(true);
          }}
        >Add</Button>
      </div>

      <div className="space-y-8">
        {/* Active Meds (Zone 2/1) */}
        <div>
          <h2 className="text-xl font-bold text-white px-1 mb-4 flex items-center gap-2">
            <span className="bg-blue-600 text-xs px-2 py-1 rounded">ZONE 1 & 2</span>
            Daily Medications
          </h2>
          {['Morning', 'Noon', 'Night'].map(time => {
            const timeMeds = meds.filter(m => m.category === 'active' && m.time === time);
            if (timeMeds.length === 0) return null;

            return (
              <div key={time} className="mb-6 last:mb-0">
                <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-3 px-1">
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
                            <span className={`text-xs font-medium px-2 py-0.5 rounded bg-slate-700 text-slate-300`}>
                              Zone {med.zone}
                            </span>
                            <span className={`text-xs font-medium ${med.stock < med.threshold ? 'text-red-400' : 'text-slate-500'}`}>
                              {med.stock} left
                            </span>
                          </div>
                          {med.expirationDate && (
                            <p className="text-[10px] text-slate-500 mt-1 font-mono">Exp: {med.expirationDate}</p>
                          )}
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

        {/* PRN Meds */}
        <div>
          <h2 className="text-xl font-bold text-white px-1 mb-4 flex items-center gap-2">
            <span className="bg-purple-600 text-xs px-2 py-1 rounded">PRN</span>
            As Needed
          </h2>
          <div className="space-y-3">
            {meds.filter(m => m.category === 'prn').map(med => (
              <Card key={med.id}>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-white">{med.name}</h4>
                    <p className="text-slate-400 text-sm">{med.dosage}</p>
                    <div className="flex gap-2 items-center mt-1">
                      <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">Zone {med.zone || 2}</span>
                      {med.expirationDate && (
                        <span className="text-[10px] text-slate-500 font-mono">Exp: {med.expirationDate}</span>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => takeMedication(med.id)}>Take</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div >
  );
};

const AppointmentsScreen = () => {
  return (
    <div className="pb-24 space-y-6">
      <div className="px-1 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Appointments</h1>
          <p className="text-slate-400 text-sm mt-1">Calendar & Doctor Visits</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={Plus}
          onClick={() => {
            setLogModalMode('add_appointment');
            setShowLogModal(true);
          }}
        >Add</Button>
      </div>

      <div className="space-y-4">
        {appointments.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-dashed border-slate-700">
            <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500">No upcoming appointments</p>
          </div>
        ) : (
          appointments.map(appt => (
            <Card key={appt.id} className="relative overflow-hidden">
              <div className="flex gap-4">
                <div className="bg-blue-900/30 p-3 rounded-xl h-fit">
                  <Calendar className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-white">{appt.title}</h3>
                    <span className="text-xs font-mono text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
                      {new Date(appt.appointment_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mt-1 flex items-center gap-1">
                    <Stethoscope className="w-4 h-4" /> {appt.provider_name || 'General Provider'}
                  </p>
                  <p className="text-slate-500 text-xs mt-2 italic">{appt.location}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

const TasksScreen = () => {
  return (
    <div className="pb-24 space-y-6">
      <div className="px-1 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Care Tasks</h1>
          <p className="text-slate-400 text-sm mt-1">Daily Routine & To-Do</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={Plus}
          onClick={() => {
            setLogModalMode('add_task');
            setShowLogModal(true);
          }}
        >New</Button>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-dashed border-slate-700">
            <CheckSquare className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500">All caught up!</p>
          </div>
        ) : (
          tasks.map(task => (
            <Card key={task.id} className="flex items-center gap-4 group">
              <button
                onClick={() => completeTask(task.id)}
                className="w-10 h-10 rounded-full border-2 border-slate-700 flex items-center justify-center text-transparent hover:border-blue-500 hover:text-blue-500 transition-colors shrink-0"
              >
                <Check className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium">{task.task_name}</p>
                  {task.priority === 'high' && <span className="w-2 h-2 rounded-full bg-red-500" />}
                </div>
                {task.description && <p className="text-slate-400 text-sm">{task.description}</p>}
              </div>
            </Card>
          ))
        )}
      </div>
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
                <p className="text-green-400 text-xs mt-1 font-medium">Fully stocked – check weekly</p>
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
              <Button variant="primary" icon={ShoppingCart} onClick={() => {
                const body = encodeURIComponent("Need oxygen refill for Eleanor");
                window.open(`sms:+15550000000&body=${body}`, '_blank');
                showToast("Opening SMS to Supplier");
              }}>
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
                <button onClick={() => setSupplies(s => ({ ...s, cannulas: Math.max(0, s.cannulas - 1) }))} className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center">-</button>
                <span className="w-4 text-center text-white">{supplies.cannulas}</span>
                <button onClick={() => setSupplies(s => ({ ...s, cannulas: s.cannulas + 1 }))} className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center">+</button>
              </div>
            </div>
            <div className="flex justify-between items-center p-2 border-t border-slate-700/50">
              <div className="flex items-center gap-3">
                <Droplets className="w-5 h-5 text-slate-500" />
                <span className="text-white">Distilled Water</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setSupplies(s => ({ ...s, distilledWater: Math.max(0, s.distilledWater - 1) }))} className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center">-</button>
                <span className="w-4 text-center text-white">{supplies.distilledWater}</span>
                <button onClick={() => setSupplies(s => ({ ...s, distilledWater: s.distilledWater + 1 }))} className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center">+</button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const ProfileScreen = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <div className="pb-24 space-y-6">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
            {patientStatus.first_name[0]}{patientStatus.last_name[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{patientStatus.first_name} {patientStatus.last_name}</h1>
            <p className="text-slate-400 text-sm">Born: {new Date(patientStatus.dob).toLocaleDateString()} • {patientStatus.blood_type}</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setIsEditModalOpen(true)}>Edit</Button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Medical History</h3>
          <Button variant="ghost" size="sm" icon={Plus}>Add</Button>
        </div>
        <div className="grid gap-3">
          {medicalHistory.length === 0 ? (
            <p className="text-slate-500 text-sm italic px-2">No history recorded.</p>
          ) : (
            medicalHistory.map(item => (
              <Card key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="text-white font-medium">{item.condition_name}</p>
                  <p className="text-slate-500 text-xs">Diagnosed: {item.diagnosed_year}</p>
                </div>
                <Stethoscope className="w-5 h-5 text-slate-600" />
              </Card>
            ))
          )}
        </div>

        <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider px-1">Emergency Instructions</h3>
        <Card className="border-red-900/50 bg-red-900/10">
          <div className="flex gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
            <div>
              <p className="text-red-200 font-medium mb-1">{patientStatus.dnr_status ? 'DNR Order on File' : 'Full Resuscitation'}</p>
              <p className="text-red-300/80 text-sm leading-relaxed">
                {patientStatus.emergency_instructions || 'No specific instructions provided.'}
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

        <div className="pt-4">
          <Button variant="outline" className="w-full justify-between" onClick={() => setIsAuthenticated(false)}>
            <span>Sign Out Caregiver</span>
            <span className="text-xs bg-slate-700 px-2 py-1 rounded">v2.1.0</span>
          </Button>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
};

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
      {view === 'appointments' && <AppointmentsScreen />}
      {view === 'tasks' && <TasksScreen />}
      {view === 'binder' && <BinderScreen />}
      {view === 'bp' && <BPTracker />}
      {view === 'profile' && <ProfileScreen />}
    </main>

    {/* Floating Action Button (FAB) */}
    <div className="fixed bottom-24 right-6 md:right-[calc(50%-14rem)] z-40">
      <button
        onClick={() => {
          if (view === 'meds') setLogModalMode('add_med');
          else if (view === 'tasks') setLogModalMode('add_task');
          else if (view === 'appointments') setLogModalMode('add_appointment');
          else setLogModalMode('menu');
          setEditingItem(null); // Clear editing state
          setShowLogModal(true);
        }}
        className="bg-blue-600 hover:bg-blue-500 text-white w-14 h-14 rounded-full shadow-xl shadow-blue-900/40 flex items-center justify-center transition-transform hover:scale-105 active:scale-90"
      >
        <Plus className="w-8 h-8" />
      </button>
    </div>

    {/* Bottom Navigation */}
    <nav className="fixed bottom-0 left-0 w-full bg-slate-900/90 backdrop-blur-md border-t border-slate-800 z-50 pb-safe">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-1">
        <button
          onClick={() => setView('home')}
          className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 ${view === 'home' ? 'text-blue-400' : 'text-slate-500'}`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px] font-medium">Now</span>
        </button>

        <button
          onClick={() => setView('meds')}
          className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 ${view === 'meds' ? 'text-blue-400' : 'text-slate-500'}`}
        >
          <Pill className="w-5 h-5" />
          <span className="text-[10px] font-medium">Meds</span>
        </button>

        <button
          onClick={() => setView('tasks')}
          className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 ${view === 'tasks' ? 'text-blue-400' : 'text-slate-500'}`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[10px] font-medium">Tasks</span>
        </button>

        <div className="w-12 h-full" /> {/* FAB Space */}

        <button
          onClick={() => setView('appointments')}
          className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 ${view === 'appointments' ? 'text-blue-400' : 'text-slate-500'}`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] font-medium">Dates</span>
        </button>

        <button
          onClick={() => setView('binder')}
          className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 ${view === 'binder' ? 'text-blue-400' : 'text-slate-500'}`}
        >
          <Book className="w-5 h-5" />
          <span className="text-[10px] font-medium">Binder</span>
        </button>

        <button
          onClick={() => setView('supplies')}
          className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 ${view === 'supplies' ? 'text-blue-400' : 'text-slate-500'}`}
        >
          <Wind className="w-5 h-5" />
          <span className="text-[10px] font-medium">Supply</span>
        </button>

        <button
          onClick={() => setView('profile')}
          className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 ${view === 'profile' ? 'text-blue-400' : 'text-slate-500'}`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">Mother</span>
        </button>
      </div>
    </nav>

    {/* Log Modal */}
    <LogModal />

    {/* New Event FAB Modals could be added here */}
  </div>
);
}