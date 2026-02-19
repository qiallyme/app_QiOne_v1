import React, { useState } from 'react';
import {
  Shield,
  FileText,
  Phone,
  AlertTriangle,
  Wind,
  Activity,
  UserCheck,
  Files,
  Info,
  ChevronRight
} from 'lucide-react';
import { Card } from './App'; // Assuming Card is exported or I will need to redefine/import it. 
// Note: In App.jsx Card was defined locally. I should probably just redefine a simple Card here or ask to export it. 
// For now, I'll redefine a simple version to avoid breaking if App.jsx doesn't export it.

const SimpleCard = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`bg-slate-800 rounded-2xl border border-slate-700 p-4 shadow-sm ${onClick ? 'cursor-pointer active:bg-slate-750' : ''} ${className}`}
  >
    {children}
  </div>
);

const SectionButton = ({ active, icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 p-3 rounded-xl transition-all w-full text-left whitespace-nowrap ${active
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
      }`}
  >
    <Icon className="w-5 h-5 shrink-0" />
    <span className="font-medium text-sm">{label}</span>
  </button>
);

export default function BinderScreen() {
  const [section, setSection] = useState('quick_start'); // quick_start, medical, legal, advance, logs, contacts, signs, zones

  return (
    <div className="pb-24 space-y-6">
      <div className="px-1 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Emergency Binder</h1>
          <p className="text-slate-400 text-sm mt-1">Master Medical, Legal & Care Authority</p>
        </div>
        <a
          href="/kb/binder/index.html"
          target="_blank"
          className="bg-slate-800 text-blue-400 text-xs px-3 py-2 rounded-lg font-bold uppercase tracking-wider border border-slate-700 hover:bg-slate-700 flex items-center gap-1"
        >
          <FileText className="w-4 h-4" /> Print Full Manual
        </a>
      </div>

      {/* Navigation Tabs (Scrollable) */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1 -mx-1 snap-x">
        <div className="min-w-[140px] snap-start">
          <SectionButton
            active={section === 'quick_start'}
            onClick={() => setSection('quick_start')}
            icon={AlertTriangle}
            label="Quick Start"
          />
        </div>
        <div className="min-w-[140px] snap-start">
          <SectionButton
            active={section === 'zones'}
            onClick={() => setSection('zones')}
            icon={Files}
            label="Inventory Zones"
          />
        </div>
        <div className="min-w-[140px] snap-start">
          <SectionButton
            active={false}
            onClick={() => window.open('/kb/index.html', '_blank')}
            icon={FileText}
            label="Care Plan Wiki"
          />
        </div>
        <div className="min-w-[140px] snap-start">
          <SectionButton
            active={section === 'medical'}
            onClick={() => setSection('medical')}
            icon={Activity}
            label="Medical Protocol"
          />
        </div>
        <div className="min-w-[140px] snap-start">
          <SectionButton
            active={section === 'legal'}
            onClick={() => setSection('legal')}
            icon={Shield}
            label="Legal Authority"
          />
        </div>
        <div className="min-w-[140px] snap-start">
          <SectionButton
            active={section === 'advance'}
            onClick={() => setSection('advance')}
            icon={FileText}
            label="Advance Directives"
          />
        </div>
        <div className="min-w-[140px] snap-start">
          <SectionButton
            active={section === 'signs'}
            onClick={() => setSection('signs')}
            icon={Info}
            label="Signage"
          />
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">

        {/* === QUICK START === */}
        {section === 'quick_start' && (
          <div className="space-y-4">
            <div className="bg-red-900/20 border border-red-500/50 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-8 h-8 text-red-500 shrink-0" />
                <div>
                  <h2 className="text-xl font-bold text-red-100 uppercase tracking-wider mb-2">Critical Medical Alert</h2>
                  <p className="text-white text-lg font-bold mb-4">THIS PATIENT IS OXYGEN-DEPENDENT</p>
                  <p className="text-red-200 mb-4">Failure to administer oxygen may result in loss of consciousness or death.</p>
                  <div className="bg-red-500/20 p-4 rounded-xl border border-red-500/30">
                    <p className="font-bold text-red-100 uppercase mb-1">Immediate Action</p>
                    <p className="text-white">Administer oxygen IMMEDIATELY. Do not remove during transport.</p>
                  </div>
                </div>
              </div>
            </div>

            <SimpleCard>
              <h3 className="text-slate-300 font-medium mb-3 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-400" />
                Primary Decision Maker
              </h3>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                <p className="text-white font-bold text-lg">Cody Rice-Velasquez</p>
                <p className="text-slate-400">Authorized Medical Decision Maker</p>
                <p className="text-slate-400 text-sm mt-1">Phone: 317-205-4383</p>
              </div>
            </SimpleCard>
          </div>
        )}

        {/* === MEDICAL PROTOCOL === */}
        {section === 'medical' && (
          <div className="space-y-4">
            <SimpleCard>
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Emergency Respiratory Protocol
              </h3>

              <div className="space-y-6 relative">
                <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-700"></div>

                <div className="relative pl-10">
                  <div className="absolute left-0 top-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center font-bold text-white">1</div>
                  <h4 className="text-white font-bold">Oxygen First</h4>
                  <p className="text-slate-400 text-sm mt-1">Administer oxygen immediately. Do not delay for vitals or history.</p>
                </div>

                <div className="relative pl-10">
                  <div className="absolute left-0 top-0 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center font-bold text-white">2</div>
                  <h4 className="text-white font-bold">Maintain Oxygen</h4>
                  <p className="text-slate-400 text-sm mt-1">Keep oxygen ON during assessment, movement, and transfer.</p>
                </div>

                <div className="relative pl-10">
                  <div className="absolute left-0 top-0 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center font-bold text-white">3</div>
                  <h4 className="text-white font-bold">Unresponsive?</h4>
                  <p className="text-slate-400 text-sm mt-1">Treat hypoxia as primary cause. Oxygen → Airway → Circulation.</p>
                </div>
              </div>
            </SimpleCard>

            <SimpleCard>
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Wind className="w-5 h-5 text-blue-400" />
                Equipment Map
              </h3>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 space-y-2">
                <p className="text-slate-300"><span className="text-blue-400">•</span> Oxygen Tanks (Labeled)</p>
                <p className="text-slate-300"><span className="text-blue-400">•</span> CPAP Machine</p>
                <p className="text-slate-300"><span className="text-blue-400">•</span> Nebulizer / Treatments</p>
                <div className="pt-2 border-t border-slate-700 mt-2">
                  <p className="text-slate-400 italic text-sm">All equipment is stored in the visible "Go Zone" in the main care area.</p>
                </div>
              </div>
            </SimpleCard>
          </div>
        )}

        {/* === LEGAL AUTHORITY === */}
        {section === 'legal' && (
          <div className="space-y-4">
            <SimpleCard>
              <h3 className="text-lg font-bold text-white mb-2">Legal Authority Summary</h3>
              <p className="text-slate-400 text-sm mb-4">
                This document packet establishes Cody Rice-Velasquez as the authorized legal and medical decision maker.
              </p>

              <div className="space-y-2">
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                  <p className="text-white font-medium">Healthcare Power of Attorney</p>
                  <p className="text-xs text-green-400 mt-1"> ACTIVE • DURABLE • SURVIVES INCAPACITY</p>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                  <p className="text-white font-medium">HIPAA Authorization</p>
                  <p className="text-xs text-green-400 mt-1"> ACTIVE • FULL ACCESS</p>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                  <p className="text-white font-medium">Durable Power of Attorney (Property)</p>
                  <p className="text-xs text-green-400 mt-1"> ACTIVE • INCLUDES HOUSING ACCESS</p>
                </div>
              </div>
            </SimpleCard>

            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl">
              <h4 className="text-blue-100 font-bold mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" /> Third Party Notice
              </h4>
              <p className="text-blue-200/80 text-sm">
                Any refusal to recognize these authorities may constitute unlawful interference with medical care and personal property access.
              </p>
            </div>
          </div>
        )}

        {/* === ADVANCE DIRECTIVES === */}
        {section === 'advance' && (
          <div className="space-y-4">
            <SimpleCard>
              <h3 className="text-lg font-bold text-white mb-4">Living Will & Directives</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 text-xs uppercase font-bold">Resuscitation</p>
                  <p className="text-white font-medium">See DNR Order (if applicable) or default to Full Code unless stated otherwise.</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase font-bold">Artificial Ventilation</p>
                  <p className="text-white font-medium">Standard for reversible conditions. Prioritize non-invasive support.</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase font-bold">Pain Management</p>
                  <p className="text-white font-medium">Prioritize comfort and symptom relief.</p>
                </div>
              </div>
            </SimpleCard>
          </div>
        )}

        {/* === INVENTORY ZONES === */}
        {section === 'zones' && (
          <div className="space-y-4">
            <SimpleCard>
              <h3 className="text-lg font-bold text-white mb-2">Zone 1 – Daily Care Zone</h3>
              <p className="text-slate-400 text-sm mb-2 italic">Coffee table + TV dinner table</p>
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <p className="text-white text-sm">Daily meds, inhalers, pulse ox, tissues, wipes, water, grabber.</p>
              </div>
            </SimpleCard>

            <SimpleCard>
              <h3 className="text-lg font-bold text-white mb-2">Zone 2 – Medication Core Zone</h3>
              <p className="text-slate-400 text-sm mb-2 italic">Main shelving unit</p>
              <ul className="space-y-2 text-sm text-slate-300 list-disc list-inside">
                <li>Shelf 1: Active meds (FIFO)</li>
                <li>Shelf 2: PRN / as-needed meds</li>
                <li>Shelf 3: Backup meds</li>
                <li>Drawers: Prep tools (cups, syringes)</li>
              </ul>
            </SimpleCard>

            <SimpleCard>
              <h3 className="text-lg font-bold text-white mb-2">Zone 3 – Medical Supplies Zone</h3>
              <p className="text-slate-400 text-sm mb-2 italic">Side table or shelving</p>
              <p className="text-white text-sm">Oxygen supplies, CPAP supplies, wound care, cleaning supplies.</p>
            </SimpleCard>

            <div className="grid grid-cols-2 gap-4">
              <SimpleCard>
                <h4 className="font-bold text-white text-sm">Zone 4: Admin</h4>
                <p className="text-slate-500 text-xs">Dining Room Table</p>
                <p className="text-slate-400 text-xs mt-1">Paperwork, mail, care notes</p>
              </SimpleCard>
              <SimpleCard>
                <h4 className="font-bold text-white text-sm">Zone 5: Caregiver Only</h4>
                <p className="text-slate-500 text-xs">Cabinet (Hard to Open)</p>
                <p className="text-slate-400 text-xs mt-1">Bulk refills, hospital extras</p>
              </SimpleCard>
            </div>
          </div>
        )}

        {/* === SIGNAGE === */}
        {section === 'signs' && (
          <div className="space-y-4">
            <h3 className="text-slate-400 text-sm font-bold uppercase px-1">Posted Visual Commands</h3>

            <div className="bg-white p-6 rounded-lg text-center shadow-xl">
              <p className="text-black font-bold text-xl uppercase border-b-4 border-black pb-2 mb-2">Front Door</p>
              <h2 className="text-4xl font-extrabold text-red-600 leading-tight">OXYGEN DEPENDENT<br />PATIENT INSIDE</h2>
            </div>

            <div className="bg-white p-6 rounded-lg text-center shadow-xl">
              <p className="text-black font-bold text-xl uppercase border-b-4 border-black pb-2 mb-2">Bedside</p>
              <h2 className="text-3xl font-extrabold text-black leading-tight">DO NOT REMOVE FROM OXYGEN</h2>
              <p className="text-red-600 font-bold mt-2">DURING MOVEMENT OR TRANSPORT</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
