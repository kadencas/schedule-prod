"use client";

import React, { useState, useEffect, useCallback } from 'react';

// --- Types & Interfaces ---
interface DuplicateParams {
  startDate: string;
  endDate: string;
  daysOfWeek: string[];
  includeWeekends: boolean;
}
const DuplicateShiftModal = ({
  isOpen,
  onClose,
  onSubmit,
  shiftDate
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: DuplicateParams) => void;
  shiftDate: Date;
}) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        padding: '1rem',
        borderRadius: '8px',
        maxWidth: '90%',
        width: '300px'
      }}>
        <h2 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '1.125rem' }}>Duplicate Shift</h2>
        <p style={{ margin: 0, marginBottom: '0.75rem', fontSize: '0.875rem' }}>
          Based on: {shiftDate.toLocaleDateString()}
        </p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => onSubmit({
              startDate: '2025-07-18',
              endDate: '2025-07-25',
              daysOfWeek: ['Monday'],
              includeWeekends: false
            })}
            style={{
              flex: 1,
              padding: '0.5rem',
              fontSize: '0.875rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            Submit
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.5rem',
              fontSize: '0.875rem',
              background: '#e5e7eb',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface Segment {
  id: string;
  startTime: string;
  endTime: string;
  segmentType: string;
  location: string;
  notes: string;
  color: string;
  entityId: string;
}
interface Shift {
  id: string;
  userId: string;
  companyId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  notes: string;
  segments: Segment[];
}
interface User { id: string; name: string; }
interface Entity { id: string; name: string; }

const formatDate = (date: Date): string =>
  date.toISOString().split('T')[0];



// --- SVG Icon Components ---
const PlusCircle = ({ className }: { className: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
       viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
       className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);
const Copy = ({ className }: { className: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
       viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
       className={className}>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);
const XCircle = ({ className }: { className: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
       viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
       className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

// --- SegmentForm ---
const SegmentForm = ({
  segment,
  onSegmentChange,
  onRemoveSegment,
  entities
}: {
  segment: Segment;
  onSegmentChange: (id: string, f: keyof Segment, v: any) => void;
  onRemoveSegment: (id: string) => void;
  entities: Entity[];
}) => {
  const cls = "bg-zinc-100/50 border-zinc-200 rounded px-2 py-1 text-xs placeholder-zinc-400 focus:ring-1 focus:ring-sky-500";
  return (
    <div className="flex items-center gap-1">
      <input type="time"        value={segment.startTime} onChange={e=>onSegmentChange(segment.id,'startTime',e.target.value)} className={cls} style={{flexBasis:'80px'}}/>
      <input type="time"        value={segment.endTime  } onChange={e=>onSegmentChange(segment.id,'endTime',e.target.value)}   className={cls} style={{flexBasis:'80px'}}/>
      <input type="text" placeholder="Type"   value={segment.segmentType} onChange={e=>onSegmentChange(segment.id,'segmentType',e.target.value)} className={cls} style={{flexBasis:'120px'}}/>
      <select value={segment.entityId} onChange={e=>onSegmentChange(segment.id,'entityId',e.target.value)} className={`${cls} flex-grow`}>
        <option value="" disabled>Entity…</option>
        {entities.map(ent=> <option key={ent.id} value={ent.id}>{ent.name}</option>)}
      </select>
      <button onClick={()=>onRemoveSegment(segment.id)} className="h-6 w-6 flex items-center justify-center text-zinc-400 hover:text-red-600 rounded">
        <XCircle className="w-3 h-3" />
      </button>
    </div>
  );
};

// --- ShiftCard ---
const ShiftCard = ({
  shift,
  onShiftChange,
  onDuplicate,
  onRemove,
  onAddSegment,
  onSegmentChange,
  onRemoveSegment,
  users,
  entities
}: {
  shift: Shift;
  onShiftChange: (id: string, f: keyof Shift, v: any) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onAddSegment: (id: string) => void;
  onSegmentChange: (sid: string, segId: string, f: keyof Segment, v: any) => void;
  onRemoveSegment: (sid: string, segId: string) => void;
  users: User[];
  entities: Entity[];
}) => {
  const cls = "block bg-white border border-zinc-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-sky-500";
  return (
    <div className="bg-white border border-zinc-200 rounded p-2 space-y-2">
      <div className="flex flex-wrap items-center gap-1">
        <select value={shift.userId} onChange={e=>onShiftChange(shift.id,'userId',e.target.value)} className={`${cls} font-medium`} style={{flexBasis:'160px'}}>
          <option value="" disabled>User…</option>
          {users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <input type="date"  value={shift.shiftDate} onChange={e=>onShiftChange(shift.id,'shiftDate',e.target.value)} className={cls} style={{flexBasis:'120px'}}/>
        <input type="time"  value={shift.startTime} onChange={e=>onShiftChange(shift.id,'startTime',e.target.value)} className={cls} style={{flexBasis:'80px'}}/>
        <span className="text-zinc-400 text-xs">–</span>
        <input type="time"  value={shift.endTime  } onChange={e=>onShiftChange(shift.id,'endTime',e.target.value)}   className={cls} style={{flexBasis:'80px'}}/>
        <div className="flex-grow" />
        <div className="flex items-center space-x-1">
          <button onClick={()=>onDuplicate(shift.id)} className="h-6 w-6 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 rounded">
            <Copy className="w-3 h-3"/>
          </button>
          <button onClick={()=>onRemove(shift.id)} className="h-6 w-6 flex items-center justify-center text-zinc-500 hover:bg-red-50 rounded">
            <XCircle className="w-3 h-3"/>
          </button>
        </div>
      </div>

      {shift.segments.length>0 && (
        <div className="space-y-1 pt-1 border-t border-zinc-200">
          {shift.segments.map(seg=>(
            <SegmentForm
              key={seg.id}
              segment={seg}
              entities={entities}
              onSegmentChange={(segId,f,v)=>onSegmentChange(shift.id,segId,f,v)}
              onRemoveSegment={segId=>onRemoveSegment(shift.id,segId)}
            />
          ))}
        </div>
      )}

      <button onClick={()=>onAddSegment(shift.id)} className="flex items-center text-xs font-medium text-sky-600 hover:text-sky-800 pt-0.5">
        <PlusCircle className="w-3 h-3 mr-1"/>Add Segment
      </button>
    </div>
  );
};

// --- Main Page Component ---
export default function ShiftBuilderPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shiftToDuplicateId, setShiftToDuplicateId] = useState<string|null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const createNewShift = useCallback((): Shift => ({
    id: crypto.randomUUID(),
    userId: '',
    companyId: 'default-company-id',
    shiftDate: formatDate(new Date()),
    startTime: '09:00',
    endTime: '17:00',
    notes: '',
    segments: []
  }), []);

  useEffect(() => {
    setShifts([createNewShift()]);
    (async () => {
      try {
        const res = await fetch('/api/users');
        const entRes = await fetch('/api/entities');
        const usersData = await res.json();
        const entitiesData = await entRes.json();
        setUsers(usersData.users || []);
        setEntities(entitiesData || []);
      } catch {
        setUsers([]);
        setEntities([]);
      }
    })();
  }, [createNewShift]);

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/sendListShifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shifts)
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Save failed');
      }
      const { count } = await res.json();
      alert(`Saved ${count} shifts!`);
      // Reset to default state after saving
      setShifts([createNewShift()]);
    } catch (e) {
      alert(`Error: ${e instanceof Error ? e.message : 'Unknown'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddShift = ()=>setShifts(prev=>[...prev,createNewShift()]);
  const handleRemoveShift = (id:string)=>setShifts(prev=>prev.length>1?prev.filter(s=>s.id!==id):prev);
  const handleShiftChange = (id:string,f:keyof Shift,v:any)=>
    setShifts(prev=>prev.map(s=>s.id===id?{...s,[f]:v}:s));
  const handleAddSegment = (sid:string)=>{
    const seg:Segment={id:crypto.randomUUID(),startTime:'09:00',endTime:'10:00',segmentType:'Work',location:'',notes:'',color:'#3b82f6',entityId:''};
    setShifts(prev=>prev.map(s=>s.id===sid?{...s,segments:[...s.segments,seg]}:s));
  };
  const handleRemoveSegment=(sid:string,segId:string)=>
    setShifts(prev=>prev.map(s=>s.id===sid?{...s,segments:s.segments.filter(x=>x.id!==segId)}:s));
  const handleSegmentChange=(sid:string,segId:string,f:keyof Segment,v:any)=>
    setShifts(prev=>prev.map(s=>s.id===sid?{...s,segments:s.segments.map(seg=>seg.id===segId?{...seg,[f]:v}:seg)}:s));
  const openDup=(sid:string)=>{setShiftToDuplicateId(sid);setIsModalOpen(true);}
  const dupSubmit=(p:DuplicateParams)=>{console.log(`Dup ${shiftToDuplicateId}`,p);setIsModalOpen(false);}

  const toDup = shifts.find(s=>s.id===shiftToDuplicateId);

  return (
    <div className="bg-zinc-100 font-sans min-h-screen">
      <div className="max-w-full mx-auto p-2 sm:p-4">
        <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {shifts.map(s=>(
            <ShiftCard
              key={s.id}
              shift={s}
              users={users}
              entities={entities}
              onShiftChange={handleShiftChange}
              onDuplicate={openDup}
              onRemove={handleRemoveShift}
              onAddSegment={handleAddSegment}
              onSegmentChange={handleSegmentChange}
              onRemoveSegment={handleRemoveSegment}
            />
          ))}
        </main>

        <div className="mt-2 flex flex-col sm:flex-row items-center gap-2">
          <button
            onClick={handleAddShift}
            className="w-full px-2 py-1 border-2 border-zinc-300 border-dashed text-xs text-zinc-600 rounded hover:bg-zinc-200/50 transition"
          >
            Add Another Shift
          </button>
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="w-full px-2 py-1 bg-slate-700 text-white text-xs rounded hover:bg-slate-800 transition disabled:bg-slate-500 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving…' : 'Save All Shifts'}
          </button>
        </div>
      </div>

      {toDup && (
        <DuplicateShiftModal
          isOpen={isModalOpen}
          onClose={()=>setIsModalOpen(false)}
          onSubmit={dupSubmit}
          shiftDate={new Date(toDup.shiftDate)}
        />
      )}
    </div>
  );
}