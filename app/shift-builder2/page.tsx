"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { DuplicateShiftModal, DuplicateParams } from '../individual-schedule-builder/components/duplicateShiftModal'; // Adjust path as needed

// --- Helper Functions & Mock Data ---
const formatDate = (date: Date): string => date.toISOString().split('T')[0];
const formatTime = (date: Date): string => date.toTimeString().slice(0, 5);

// --- SVG Icon Components ---
const PlusCircle = ({ className }: { className: string }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>);
const Copy = ({ className }: { className: string }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>);
const XCircle = ({ className }: { className:string }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>);


// --- Types (based on your schema) ---
interface Segment {
  id: string;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  segmentType: string;
  location: string;
  notes: string;
  color: string;
  entityId: string;
}

interface Shift {
  id: string;
  userId: string;
  companyId: string; // Assume a default or context-provided companyId
  shiftDate: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  notes: string;
  segments: Segment[];
}

interface User { id: string; name: string; }
interface Entity { id: string; name: string; }


// --- Sub-Component: SegmentForm ---
const SegmentForm = ({ segment, onSegmentChange, onRemoveSegment, entities }: { segment: Segment; onSegmentChange: (id: string, field: keyof Segment, value: any) => void; onRemoveSegment: (id: string) => void; entities: Entity[] }) => {
  return (
    <div className="grid grid-cols-12 gap-x-2 items-end p-2 bg-white border border-zinc-200 rounded-md">
      <div className="col-span-12 sm:col-span-2">
        <label className="text-xs font-medium text-zinc-600">Start</label>
        <input type="time" value={segment.startTime} onChange={e => onSegmentChange(segment.id, 'startTime', e.target.value)} className="mt-0.5 w-full px-2 py-1 border border-zinc-300 rounded-md text-sm" />
      </div>
      <div className="col-span-12 sm:col-span-2">
        <label className="text-xs font-medium text-zinc-600">End</label>
        <input type="time" value={segment.endTime} onChange={e => onSegmentChange(segment.id, 'endTime', e.target.value)} className="mt-0.5 w-full px-2 py-1 border border-zinc-300 rounded-md text-sm" />
      </div>
      <div className="col-span-12 sm:col-span-3">
        <label className="text-xs font-medium text-zinc-600">Type</label>
        <input type="text" placeholder="e.g., Work, Break" value={segment.segmentType} onChange={e => onSegmentChange(segment.id, 'segmentType', e.target.value)} className="mt-0.5 w-full px-2 py-1 border border-zinc-300 rounded-md text-sm" />
      </div>
      <div className="col-span-12 sm:col-span-4">
        <label className="text-xs font-medium text-zinc-600">Entity</label>
        <select value={segment.entityId} onChange={e => onSegmentChange(segment.id, 'entityId', e.target.value)} className="mt-0.5 w-full px-2 py-1 border border-zinc-300 rounded-md text-sm">
          <option value="" disabled>Select...</option>
          {entities.map(ent => <option key={ent.id} value={ent.id}>{ent.name}</option>)}
        </select>
      </div>
      <div className="col-span-12 sm:col-span-1 flex items-end justify-end">
        <button onClick={() => onRemoveSegment(segment.id)} className="h-8 w-8 flex-shrink-0 flex items-center justify-center text-zinc-400 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors" title="Remove Segment">
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};


// --- Sub-Component: ShiftCard ---
const ShiftCard = ({ shift, index, onShiftChange, onDuplicate, onRemove, onAddSegment, onSegmentChange, onRemoveSegment, users, entities }: { shift: Shift; index: number; onShiftChange: (id: string, field: keyof Shift, value: any) => void; onDuplicate: (id: string) => void; onRemove: (id: string) => void; onAddSegment: (id: string) => void; onSegmentChange: (shiftId: string, segId: string, field: keyof Segment, value: any) => void; onRemoveSegment: (shiftId: string, segId: string) => void; users: User[]; entities: Entity[] }) => {
  return (
    <div className="bg-zinc-50 border border-zinc-200/80 rounded-lg shadow-sm">
      <div className="p-4 border-b border-zinc-200/80 bg-white rounded-t-lg">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-zinc-800 text-base">Shift #{index + 1}</h3>
          <div className="flex items-center space-x-1">
            <button onClick={() => onDuplicate(shift.id)} className="flex items-center justify-center w-8 h-8 text-sm bg-white border border-zinc-300 text-zinc-600 hover:bg-zinc-100 rounded-md" title="Duplicate Shift">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={() => onRemove(shift.id)} className="flex items-center justify-center w-8 h-8 text-sm bg-white border border-zinc-300 text-zinc-600 hover:bg-red-500 hover:text-white rounded-md" title="Remove Shift">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="text-sm font-medium text-zinc-700">Employee</label>
            <select value={shift.userId} onChange={e => onShiftChange(shift.id, 'userId', e.target.value)} className="mt-1 block w-full p-2 text-zinc-900 bg-white border border-zinc-300 rounded-md shadow-sm">
              <option value="" disabled>Select User...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Date</label>
            <input type="date" value={shift.shiftDate} onChange={e => onShiftChange(shift.id, 'shiftDate', e.target.value)} className="mt-1 block w-full p-2 text-zinc-900 bg-white border border-zinc-300 rounded-md shadow-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium text-zinc-700">Start Time</label>
              <input type="time" value={shift.startTime} onChange={e => onShiftChange(shift.id, 'startTime', e.target.value)} className="mt-1 block w-full p-2 text-zinc-900 bg-white border border-zinc-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700">End Time</label>
              <input type="time" value={shift.endTime} onChange={e => onShiftChange(shift.id, 'endTime', e.target.value)} className="mt-1 block w-full p-2 text-zinc-900 bg-white border border-zinc-300 rounded-md shadow-sm" />
            </div>
          </div>
        </div>
      </div>
      <div className="p-4">
        <h4 className="text-sm font-semibold text-zinc-700 mb-2">Segments</h4>
        <div className="space-y-2">
          {shift.segments.map(seg => (
            <SegmentForm
              key={seg.id}
              segment={seg}
              entities={entities}
              onSegmentChange={(id, field, value) => onSegmentChange(shift.id, id, field, value)}
              onRemoveSegment={(id) => onRemoveSegment(shift.id, id)}
            />
          ))}
        </div>
        <button onClick={() => onAddSegment(shift.id)} className="mt-3 flex items-center text-sm font-medium text-sky-600 hover:text-sky-800">
          <PlusCircle className="w-4 h-4 mr-1" />Add Segment
        </button>
      </div>
    </div>
  );
};


// --- Main Page Component: ShiftBuilder ---
export default function ShiftBuilderPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);

  // State for the duplicate modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shiftToDuplicateId, setShiftToDuplicateId] = useState<string | null>(null);

  // Function to create a new, empty shift
  const createNewShift = useCallback((): Shift => ({
    id: crypto.randomUUID(),
    userId: '',
    companyId: 'default-company-id', // Replace with actual company ID from context/session
    shiftDate: formatDate(new Date()),
    startTime: '09:00',
    endTime: '17:00',
    notes: '',
    segments: [],
  }), []);

  // Fetch initial data and set up first shift
  useEffect(() => {
    // Set an initial empty shift card on load
    setShifts([createNewShift()]);

    // Fetch users and entities from your API
    const fetchData = async () => {
      // In a real app, you'd fetch these concurrently with Promise.all
      const userRes = await fetch('/api/users');
      const entRes = await fetch('/api/entities');
      const userData = await userRes.json();
      const entityData = await entRes.json();
      setUsers(userData.users || []);
      setEntities(entityData.entities || []);
    };
    fetchData().catch(console.error);
  }, [createNewShift]);


  // --- CRUD Handlers for Shifts & Segments ---
  const handleAddShift = () => setShifts(prev => [...prev, createNewShift()]);
  const handleRemoveShift = (id: string) => setShifts(prev => prev.length > 1 ? prev.filter(s => s.id !== id) : prev);
  const handleShiftChange = (id: string, field: keyof Shift, value: any) => {
    setShifts(prev => prev.map(s => (s.id === id ? { ...s, [field]: value } : s)));
  };
  const handleAddSegment = (shiftId: string) => {
    const newSegment: Segment = { id: crypto.randomUUID(), startTime: '09:00', endTime: '10:00', segmentType: 'Work', location: '', notes: '', color: '#3b82f6', entityId: '' };
    setShifts(prev => prev.map(s => (s.id === shiftId ? { ...s, segments: [...s.segments, newSegment] } : s)));
  };
  const handleRemoveSegment = (shiftId: string, segmentId: string) => {
    setShifts(prev => prev.map(s => (s.id === shiftId ? { ...s, segments: s.segments.filter(seg => seg.id !== segmentId) } : s)));
  };
  const handleSegmentChange = (shiftId: string, segmentId: string, field: keyof Segment, value: any) => {
    setShifts(prev => prev.map(s => s.id === shiftId ? { ...s, segments: s.segments.map(seg => seg.id === segmentId ? { ...seg, [field]: value } : seg) } : s));
  };
  
  // --- Duplicate Modal Logic ---
  const handleOpenDuplicateModal = (shiftId: string) => {
    setShiftToDuplicateId(shiftId);
    setIsModalOpen(true);
  };
  
  const handleDuplicateSubmit = async (params: DuplicateParams) => {
    if (!shiftToDuplicateId) return;

    console.log(`Duplicating shift ${shiftToDuplicateId} with params:`, params);
    try {
      const response = await fetch(`/api/shifts/${shiftToDuplicateId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) throw new Error(await response.text());
      
      const result = await response.json();
      alert(`Successfully created ${result.createdCount} new shifts!`);
      setIsModalOpen(false);
      // Optionally, you could refresh the shift list here
    } catch (err: any) {
      console.error('Error duplicating shift:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const shiftToDuplicate = shifts.find(s => s.id === shiftToDuplicateId);

  return (
    <div className="bg-zinc-100 font-sans min-h-screen">
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-800">Shift Builder</h1>
          <p className="text-zinc-500">Create and manage individual shifts below.</p>
        </header>

        <main className="space-y-4">
          {shifts.map((shift, index) => (
            <ShiftCard
              key={shift.id}
              shift={shift}
              index={index}
              users={users}
              entities={entities}
              onShiftChange={handleShiftChange}
              onDuplicate={handleOpenDuplicateModal}
              onRemove={handleRemoveShift}
              onAddSegment={handleAddSegment}
              onSegmentChange={handleSegmentChange}
              onRemoveSegment={handleRemoveSegment}
            />
          ))}
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
            <button onClick={handleAddShift} className="w-full text-center p-2 border-2 border-zinc-300 border-dashed text-zinc-600 font-medium rounded-lg hover:bg-zinc-200/50">
              Add Another Shift
            </button>
            <button className="w-full p-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-800">
              Save All Shifts
            </button>
          </div>
        </main>
      </div>

      {/* The Duplicate Modal, controlled by this page's state */}
      {shiftToDuplicate && (
        <DuplicateShiftModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleDuplicateSubmit}
            shiftDate={new Date(shiftToDuplicate.shiftDate)}
        />
      )}
    </div>
  );
}