import React, { useState, useEffect, useRef } from 'react';
import { Activity, Send, Settings, History, Trash2, CheckCircle, AlertCircle, Heart, RefreshCw, BarChart3, HelpCircle, Link as LinkIcon, Pill, Droplet, Minus, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Hard-coded webhook URL from text.py - cannot be changed
const WEBHOOK_URL = 'https://flow.zoho.com/886846795/flow/webhook/incoming?zapikey=1001.a155e174ee504cc1062405e2f9288592.fcd9d6cb84d59e610895da5144f2fc65&isdebug=false';

export default function BPTracker() {
    const [systolic, setSystolic] = useState('');
    const [diastolic, setDiastolic] = useState('');
    const [pulse, setPulse] = useState('');
    const [symptoms, setSymptoms] = useState([]);
    const [aspirin, setAspirin] = useState(false);
    const [water, setWater] = useState(0);
    // Pre-filled with the user's provided Google Sheet CSV link
    const [sheetUrl, setSheetUrl] = useState('https://docs.google.com/spreadsheets/d/e/2PACX-1vR1hAaSh8zTyg1jStQPPx3a5Lb5vLjn-wY6b9JexV2tPbZxHayeJ1oEOWQNVafMef2RSY-k1yDw54u8/pub?gid=0&single=true&output=csv');
    const [logs, setLogs] = useState([]); // Local logs
    const [sheetData, setSheetData] = useState([]); // Data from Google Sheet
    const [patientId, setPatientId] = useState(null);

    const [view, setView] = useState('track'); // 'track', 'history', 'dashboard', 'settings'
    const [status, setStatus] = useState('idle'); // 'idle', 'sending', 'success', 'error'
    const [statusMsg, setStatusMsg] = useState('');
    const [isLoadingSheet, setIsLoadingSheet] = useState(false);
    const [sheetError, setSheetError] = useState('');

    // Debug: Log on component mount
    useEffect(() => {
        console.log('🔵 BP Tracker component mounted');
        console.log('🔵 WEBHOOK_URL:', WEBHOOK_URL);
    }, []);

    // Load settings and data from Supabase/Local
    useEffect(() => {
        const init = async () => {
            const { data: patient } = await supabase.from('patients').select('id').limit(1).single();
            if (patient) {
                setPatientId(patient.id);
                fetchSupabaseVitals(patient.id);
            }
        };
        init();

        const savedSheetUrl = localStorage.getItem('bp_sheet_url');
        const savedLogs = localStorage.getItem('bp_logs');

        if (savedSheetUrl && savedSheetUrl !== '') setSheetUrl(savedSheetUrl);
        if (savedLogs) setLogs(JSON.parse(savedLogs));
    }, []);

    // Fetch Vitals from Supabase
    const fetchSupabaseVitals = async (pid) => {
        const id = pid || patientId;
        if (!id) return;

        setIsLoadingSheet(true);
        try {
            const { data, error } = await supabase
                .from('vitals')
                .select('*')
                .eq('patient_id', id)
                .eq('type', 'Blood Pressure')
                .order('recorded_at', { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                const formatted = data.map(v => {
                    const [sys, dia] = v.value.split('/');
                    return {
                        systolic: parseInt(sys),
                        diastolic: parseInt(dia),
                        timestamp: new Date(v.recorded_at).toLocaleString(),
                        notes: v.notes
                    };
                });
                setSheetData(formatted);
            }
        } catch (err) {
            console.error('Error fetching vitals:', err);
        } finally {
            setIsLoadingSheet(false);
        }
    };

    // Save logs when changed
    useEffect(() => {
        localStorage.setItem('bp_logs', JSON.stringify(logs));
    }, [logs]);

    // Save settings when changed
    useEffect(() => {
        localStorage.setItem('bp_sheet_url', sheetUrl);
    }, [sheetUrl]);

    // Fetch data when entering dashboard
    useEffect(() => {
        if (view === 'dashboard') {
            fetchSupabaseVitals();
        }
    }, [view]);

    // Robust CSV parser - keep for settings fallback if needed, but primary is Supabase
    const parseCSVLine = (line) => {
        const result = [];
        let start = 0;
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') {
                inQuotes = !inQuotes;
            } else if (line[i] === ',' && !inQuotes) {
                result.push(line.substring(start, i).replace(/^"|"$/g, '').trim());
                start = i + 1;
            }
        }
        result.push(line.substring(start).replace(/^"|"$/g, '').trim());
        return result;
    };

    const getBPColor = (sys, dia) => {
        if (!sys || !dia) return 'text-gray-400';
        if (sys > 140 || dia > 90) return 'text-red-500';
        if (sys > 120 || dia > 80) return 'text-yellow-500';
        return 'text-green-500';
    };

    const getBPCategory = (sys, dia) => {
        if (!sys || !dia) return '';
        if (sys > 180 || dia > 120) return 'Crisis';
        if (sys >= 140 || dia >= 90) return 'High (Stage 2)';
        if (sys >= 130 || dia >= 80) return 'High (Stage 1)';
        if (sys >= 120 && dia < 80) return 'Elevated';
        return 'Normal';
    };

    const toggleSymptom = (symptom) => {
        if (symptoms.includes(symptom)) {
            setSymptoms(symptoms.filter(s => s !== symptom));
        } else {
            setSymptoms([...symptoms, symptom]);
        }
    };

    const fetchSheetData = async () => {
        // Obsolete: Transitioned to Supabase. 
        // We now use fetchSupabaseVitals() instead.
        return;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!systolic || !diastolic) {
            setStatusMsg('Please enter both numbers.');
            return;
        }

        setStatus('sending');
        setStatusMsg('');

        const payload = {
            systolic: parseInt(systolic),
            diastolic: parseInt(diastolic),
            pulse: pulse ? parseInt(pulse) : null,
            symptoms: symptoms.length > 0 ? symptoms.join(', ') : '',
            aspirin: aspirin ? 'Yes' : 'No',
            water_cups: water,
            category: getBPCategory(parseInt(systolic), parseInt(diastolic)),
            timestamp: new Date().toISOString(),
            readableDate: new Date().toLocaleString(),
        };

        try {
            // 1. Save to Supabase (Vitals Table)
            if (patientId) {
                const { error: bpError } = await supabase.from('vitals').insert([
                    {
                        patient_id: patientId,
                        type: 'Blood Pressure',
                        value: `${systolic}/${diastolic}`,
                        notes: `Symptoms: ${payload.symptoms}, Aspirin: ${payload.aspirin}, Water: ${payload.water_cups} cups`
                    }
                ]);

                if (bpError) throw bpError;

                if (pulse) {
                    await supabase.from('vitals').insert([
                        {
                            patient_id: patientId,
                            type: 'Pulse',
                            value: pulse.toString(),
                            notes: ''
                        }
                    ]);
                }
            }

            // 2. Also send to Webhook (Legacy/Backup)
            fetch(WEBHOOK_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify(payload),
            }).catch(e => console.warn('Webhook backup failed', e));

            const newLogs = [payload, ...logs];
            setLogs(newLogs);

            // Reset Form
            setSystolic('');
            setDiastolic('');
            setPulse('');
            setSymptoms([]);
            setAspirin(false);
            setWater(0);

            setStatus('success');
            fetchSupabaseVitals(); // Refresh dashboard with new data
            setTimeout(() => setStatus('idle'), 3000);
        } catch (err) {
            console.error('❌ SUBMISSION ERROR:', err);
            setStatus('error');
            setStatusMsg('Failed to save to database.');
        }
    };

    const clearLogs = () => {
        if (confirm('Clear all local history?')) {
            setLogs([]);
        }
    };

    // Simple Trend Chart Component (SVG)
    const TrendChart = ({ data }) => {
        if (!data || data.length < 2) return <div className="text-center text-slate-400 text-sm py-8">Need more data to show trends</div>;

        // Take last 15 readings. Since 'data' is reversed (newest first), 
        // we slice first, then reverse back to chronological (oldest -> newest) for the chart L->R
        const chartData = [...data].slice(0, 15).reverse();

        const height = 150;
        const width = 300;
        const padding = 20;

        const maxVal = Math.max(...chartData.map(d => Math.max(d.systolic, d.diastolic))) + 10;
        const minVal = Math.min(...chartData.map(d => Math.min(d.systolic, d.diastolic))) - 10;

        // Safety check for flat lines
        const range = maxVal - minVal || 10;

        const getX = (i) => (i / (chartData.length - 1)) * (width - padding * 2) + padding;
        const getY = (val) => height - padding - ((val - minVal) / range) * (height - padding * 2);

        const pointsSys = chartData.map((d, i) => `${getX(i)},${getY(d.systolic)}`).join(' ');
        const pointsDia = chartData.map((d, i) => `${getX(i)},${getY(d.diastolic)}`).join(' ');

        return (
            <div className="w-full overflow-hidden">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                    {/* Grid lines */}
                    <line x1={padding} y1={getY(120)} x2={width - padding} y2={getY(120)} stroke="#e2e8f0" strokeDasharray="4" />
                    <line x1={padding} y1={getY(80)} x2={width - padding} y2={getY(80)} stroke="#e2e8f0" strokeDasharray="4" />

                    {/* Paths */}
                    <polyline fill="none" stroke="#ef4444" strokeWidth="2" points={pointsSys} />
                    <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={pointsDia} />

                    {/* Dots */}
                    {chartData.map((d, i) => (
                        <g key={i}>
                            <circle cx={getX(i)} cy={getY(d.systolic)} r="3" fill="#ef4444" />
                            <circle cx={getX(i)} cy={getY(d.diastolic)} r="3" fill="#3b82f6" />
                        </g>
                    ))}
                </svg>
                <div className="flex justify-center gap-4 text-xs mt-2">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Systolic</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Diastolic</span>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col w-full shadow-2xl overflow-hidden relative">

            {/* Header */}
            <header className="bg-blue-600 text-white p-6 pb-12 rounded-b-3xl shadow-lg relative z-10">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <Activity className="w-6 h-6" />
                        <h1 className="text-xl font-bold tracking-tight">BP Tracker</h1>
                    </div>
                    <button
                        onClick={() => setView('settings')}
                        className="p-2 bg-blue-500 hover:bg-blue-400 rounded-full transition-colors"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
                <div className="text-blue-100 text-sm opacity-90">
                    Track, log, and push your vitals.
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 -mt-8 px-4 pb-20 z-20 relative overflow-y-auto">

                {/* Navigation Tabs */}
                {view !== 'settings' && (
                    <div className="flex bg-white rounded-xl shadow-sm mb-4 p-1">
                        <button
                            onClick={() => setView('track')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${view === 'track' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-500'}`}
                        >
                            Entry
                        </button>
                        <button
                            onClick={() => setView('dashboard')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${view === 'dashboard' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-500'}`}
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => setView('history')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${view === 'history' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-500'}`}
                        >
                            History
                        </button>
                    </div>
                )}

                {/* --- TRACK VIEW --- */}
                {view === 'track' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">

                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                            <div className="flex justify-between items-end mb-6">
                                <h2 className="text-lg font-semibold text-slate-700">New Reading</h2>
                                <span className={`text-sm font-bold ${getBPColor(systolic, diastolic)}`}>
                                    {getBPCategory(systolic, diastolic)}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Systolic</label>
                                    <input
                                        type="tel"
                                        value={systolic}
                                        onChange={(e) => setSystolic(e.target.value)}
                                        placeholder="120"
                                        className="w-full text-4xl font-light text-slate-800 border-b-2 border-slate-200 focus:border-blue-500 focus:outline-none py-2 bg-transparent transition-colors placeholder:text-slate-200"
                                    />
                                    <div className="text-xs text-slate-400">Top number</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Diastolic</label>
                                    <input
                                        type="tel"
                                        value={diastolic}
                                        onChange={(e) => setDiastolic(e.target.value)}
                                        placeholder="80"
                                        className="w-full text-4xl font-light text-slate-800 border-b-2 border-slate-200 focus:border-blue-500 focus:outline-none py-2 bg-transparent transition-colors placeholder:text-slate-200"
                                    />
                                    <div className="text-xs text-slate-400">Bottom number</div>
                                </div>
                            </div>

                            <div className="space-y-1 mt-6">
                                <label className="flex items-center gap-1 text-xs font-semibold uppercase text-slate-400 tracking-wider">
                                    <Heart className="w-3 h-3" /> Pulse <span className="text-[10px] opacity-50 font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="tel"
                                    value={pulse}
                                    onChange={(e) => setPulse(e.target.value)}
                                    placeholder="70"
                                    className="w-full text-2xl font-light text-slate-800 border-b-2 border-slate-200 focus:border-blue-500 focus:outline-none py-1 bg-transparent transition-colors placeholder:text-slate-200"
                                />
                            </div>

                            <hr className="my-6 border-slate-100" />

                            {/* Reminders: Aspirin & Water */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase text-slate-400 tracking-wider block">Aspirin</label>
                                    <button
                                        onClick={() => setAspirin(!aspirin)}
                                        className={`w-full p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${aspirin
                                            ? 'bg-rose-100 border-rose-300 text-rose-700 shadow-sm'
                                            : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                                            }`}
                                    >
                                        <Pill className={`w-6 h-6 ${aspirin ? 'fill-current' : ''}`} />
                                        <span className="text-xs font-bold">{aspirin ? 'Taken' : 'Missed'}</span>
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase text-slate-400 tracking-wider block">Water (Cups)</label>
                                    <div className={`w-full p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${water > 0
                                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                                        : 'bg-slate-50 border-slate-100 text-slate-400'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => setWater(Math.max(0, water - 1))} className="p-1 hover:bg-white rounded-full"><Minus className="w-4 h-4" /></button>
                                            <span className="text-xl font-bold w-4 text-center">{water}</span>
                                            <button onClick={() => setWater(water + 1)} className="p-1 hover:bg-white rounded-full"><Plus className="w-4 h-4" /></button>
                                        </div>
                                        <div className="flex gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Droplet key={i} className={`w-3 h-3 ${i < water ? 'fill-blue-500 text-blue-500' : 'text-slate-300'}`} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Symptom Quadrants */}
                            <div>
                                <label className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2 block">Symptoms</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => toggleSymptom('Dizziness')}
                                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${symptoms.includes('Dizziness')
                                            ? 'bg-purple-100 border-purple-300 text-purple-700 shadow-sm'
                                            : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                                            }`}
                                    >
                                        <span className="text-3xl">😵‍💫</span>
                                        <span className="text-xs font-bold">Dizziness</span>
                                    </button>

                                    <button
                                        onClick={() => toggleSymptom('Headache')}
                                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${symptoms.includes('Headache')
                                            ? 'bg-amber-100 border-amber-300 text-amber-700 shadow-sm'
                                            : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                                            }`}
                                    >
                                        <span className="text-3xl">🤕</span>
                                        <span className="text-xs font-bold">Headache</span>
                                    </button>

                                    <button
                                        onClick={() => toggleSymptom('Short of Breath')}
                                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${symptoms.includes('Short of Breath')
                                            ? 'bg-sky-100 border-sky-300 text-sky-700 shadow-sm'
                                            : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                                            }`}
                                    >
                                        <span className="text-3xl">😮‍💨</span>
                                        <span className="text-xs font-bold">Short Breath</span>
                                    </button>

                                    <button
                                        onClick={() => toggleSymptom('Fatigue')}
                                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${symptoms.includes('Fatigue')
                                            ? 'bg-indigo-100 border-indigo-300 text-indigo-700 shadow-sm'
                                            : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                                            }`}
                                    >
                                        <span className="text-3xl">🥱</span>
                                        <span className="text-xs font-bold">Fatigue</span>
                                    </button>
                                </div>
                            </div>

                        </div>

                        <button
                            type="button"
                            onClick={(e) => {
                                console.log('🔴 Button clicked!');
                                handleSubmit(e);
                            }}
                            disabled={status === 'sending'}
                            className={`w-full py-4 rounded-xl text-lg font-semibold shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${status === 'success' ? 'bg-green-500 text-white' :
                                status === 'error' ? 'bg-red-500 text-white' :
                                    'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                        >
                            {status === 'sending' ? (
                                <span className="animate-pulse">Sending...</span>
                            ) : status === 'success' ? (
                                <>Sent <CheckCircle className="w-5 h-5" /></>
                            ) : status === 'error' ? (
                                <>Retry <AlertCircle className="w-5 h-5" /></>
                            ) : (
                                <>Send Result <Send className="w-5 h-5" /></>
                            )}
                        </button>

                        {statusMsg && (
                            <p className="text-center text-sm text-slate-500 animate-pulse">{statusMsg}</p>
                        )}
                    </div>
                )}

                {/* --- DASHBOARD VIEW --- */}
                {view === 'dashboard' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-slate-600">Live Analytics</h3>
                            <button onClick={fetchSheetData} className="text-blue-500 p-2 hover:bg-blue-50 rounded-full">
                                <RefreshCw className={`w-4 h-4 ${isLoadingSheet ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        {sheetData.length === 0 ? (
                            <div className="text-center py-12 bg-blue-50 rounded-xl p-6 border border-blue-100">
                                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-blue-300" />
                                <h4 className="font-bold text-blue-900 mb-2">No Records Found</h4>
                                <p className="text-sm text-blue-700 mb-4">
                                    Start by entering your blood pressure readings in the Entry tab.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Chart Card */}
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                    <h4 className="text-xs font-bold uppercase text-slate-400 mb-4 tracking-wider">Database Trend</h4>
                                    <TrendChart data={sheetData} />
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                        <div className="text-xs text-slate-400 mb-1">Avg Systolic</div>
                                        <div className="text-2xl font-bold text-slate-700">
                                            {sheetData.length ? Math.round(sheetData.reduce((acc, curr) => acc + curr.systolic, 0) / sheetData.length) : '-'}
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                        <div className="text-xs text-slate-400 mb-1">Avg Diastolic</div>
                                        <div className="text-2xl font-bold text-slate-700">
                                            {sheetData.length ? Math.round(sheetData.reduce((acc, curr) => acc + curr.diastolic, 0) / sheetData.length) : '-'}
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Sheet List */}
                                <h4 className="text-xs font-bold uppercase text-slate-400 mt-4 tracking-wider">Recent Records (DB)</h4>
                                <div className="space-y-2">
                                    {sheetData.slice(0, 5).map((log, i) => (
                                        <div key={i} className="bg-white p-3 rounded-lg border border-slate-100 flex justify-between items-center text-sm">
                                            <span className="font-mono font-medium text-slate-600">{log.systolic}/{log.diastolic}</span>
                                            <span className="text-slate-400 text-xs">{log.timestamp}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* --- HISTORY VIEW (Local) --- */}
                {view === 'history' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-slate-600">Local Log</h3>
                            {logs.length > 0 && (
                                <button onClick={clearLogs} className="text-xs text-red-400 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50">
                                    <Trash2 className="w-3 h-3" /> Clear
                                </button>
                            )}
                        </div>

                        {logs.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>No readings recorded yet.</p>
                            </div>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-start gap-2">
                                    <div className="flex justify-between w-full">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-bold text-slate-800">{log.systolic}</span>
                                            <span className="text-slate-400">/</span>
                                            <span className="text-xl font-bold text-slate-800">{log.diastolic}</span>
                                            <span className={`text-xs ml-2 font-medium px-2 py-0.5 rounded-full ${log.category === 'Normal' ? 'bg-green-100 text-green-700' :
                                                log.category === 'Elevated' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {log.category}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            {log.readableDate}
                                        </div>
                                    </div>

                                    {/* Badges for Aspirin, Water, Symptoms */}
                                    <div className="flex flex-wrap gap-2 w-full">
                                        {log.aspirin === 'Yes' && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded border border-rose-100 flex items-center gap-1">
                                                <Pill className="w-3 h-3" /> Aspirin
                                            </span>
                                        )}
                                        {log.water_cups > 0 && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 flex items-center gap-1">
                                                <Droplet className="w-3 h-3 fill-blue-500" /> {log.water_cups} Cups
                                            </span>
                                        )}
                                        {log.symptoms && log.symptoms.split(', ').map((sym, idx) => (
                                            <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
                                                {sym}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* --- SETTINGS VIEW --- */}
                {view === 'settings' && (
                    <div className="space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                            <h3 className="font-bold text-lg mb-4 text-slate-800">Connection Settings</h3>

                            <div className="space-y-4">
                                {/* Google Sheet Section */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-600">Live Dashboard Source</label>
                                    <input
                                        type="url"
                                        value={sheetUrl}
                                        onChange={(e) => setSheetUrl(e.target.value)}
                                        placeholder="https://docs.google.com/.../pub?output=csv"
                                        className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    {/* Smart Helper Tip */}
                                    {sheetUrl && sheetUrl.includes('edit') && (
                                        <div className="bg-amber-50 text-amber-800 p-2 rounded text-xs flex items-start gap-2 border border-amber-100">
                                            <HelpCircle className="w-4 h-4 shrink-0" />
                                            <span>
                                                <strong>Tip:</strong> This looks like an Edit link. If the dashboard fails to load, go to <em>File &gt; Share &gt; Publish to Web</em> in your Sheet, choose "CSV", and paste that link here instead.
                                            </span>
                                        </div>
                                    )}

                                    <div className="text-xs text-slate-400 space-y-1">
                                        <p className="flex items-center gap-1"><LinkIcon className="w-3 h-3" /> <strong>Current Link:</strong> Your "Publish to Web" link is active.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setView('track')}
                            className="w-full py-3 bg-slate-800 text-white rounded-xl font-medium shadow-lg shadow-slate-200"
                        >
                            Done
                        </button>
                    </div>
                )}

            </main>
        </div>
    );
}
