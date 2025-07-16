"use client"

import React, { useState, useMemo, useEffect } from 'react'; // 👈 1. Import useEffect

// --- Mock Data (User mock removed) ---
// const mockUsers = [...] // 👈 2. REMOVED: No longer using mock user data
const mockSegmentTypes = ['Break', 'Work', 'Meeting'];
const mockEntities = [
  { id: 'ent_1', name: 'Front Desk' },
  { id: 'ent_2', name: 'Kitchen' },
  { id: 'ent_3', name: 'Warehouse' },
];

// --- Icon Components (No Changes) ---
const PlusCircle = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>);
const Copy = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>);
const XCircle = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>);
const ChevronLeft = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6"/></svg>);
const ChevronRight = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>);

// --- Helper Functions (No Changes) ---
const formatDate = (date) => date.toISOString().split('T')[0];

// --- Sub-components (No Changes) ---
const PageHeader = () => (
    <div className="p-6 border-b border-zinc-200">
        <h1 className="text-2xl font-bold text-zinc-800">Manual Shift Scheduler</h1>
        <p className="text-zinc-500 mt-1">A modernized and intuitive shift management interface.</p>
    </div>
);

const ScheduleVisualizer = ({ calendarDate, highlightedDates, onPrevMonth, onNextMonth, selectedDate, onSelectDate }) => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const calendarDays = Array.from({ length: firstDayOfMonth }, (_, i) => <div key={`empty-${i}`} />);
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = formatDate(date);
        const isHighlighted = highlightedDates.has(dateStr);
        const isSelected = selectedDate === dateStr;
        calendarDays.push(
            <div key={day} className="flex items-center justify-center">
                <button
                    onClick={() => onSelectDate(dateStr)}
                    className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200
                        ${isSelected ? 'bg-sky-500 text-white ring-2 ring-offset-2 ring-sky-500' : ''}
                        ${!isSelected && isHighlighted ? 'bg-sky-100 text-sky-700' : ''}
                        ${!isSelected && !isHighlighted ? 'text-zinc-700 hover:bg-zinc-100' : ''}
                    `}>
                    {day}
                </button>
            </div>
        );
    }
    return (
        <div className="p-4 bg-white rounded-lg border border-zinc-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-zinc-800">{monthNames[month]} {year}</h3>
                <div className="flex items-center space-x-1">
                    <button onClick={onPrevMonth} className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                    <button onClick={onNextMonth} className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-xs text-zinc-500 font-semibold">
                {daysOfWeek.map((d, index) => <div key={index}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-y-2 mt-3">{calendarDays}</div>
        </div>
    );
};

const SegmentForm = ({ segment, shiftId, onSegmentChange, onRemoveSegment }) => (
    <div className="grid grid-cols-12 gap-x-3 gap-y-2 items-end p-3 bg-white border border-zinc-200 rounded-md">
        <div className="col-span-1 flex items-center">
             <span style={{ backgroundColor: segment.color }} className="w-2 h-8 rounded-full" />
        </div>
        <div className="col-span-5 sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600">Start</label>
            <input type="time" value={segment.startTime} onChange={e => onSegmentChange(shiftId, segment.id, 'startTime', e.target.value)} className="mt-1 w-full px-2 py-1.5 border border-zinc-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500" />
        </div>
        <div className="col-span-5 sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600">End</label>
            <input type="time" value={segment.endTime} onChange={e => onSegmentChange(shiftId, segment.id, 'endTime', e.target.value)} className="mt-1 w-full px-2 py-1.5 border border-zinc-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500" />
        </div>
        <div className="col-span-6 sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600">Type</label>
            <select value={segment.segmentType} onChange={e => onSegmentChange(shiftId, segment.id, 'segmentType', e.target.value)} className="mt-1 w-full px-2 py-1.5 border border-zinc-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500">
                <option value="" disabled>Select...</option>
                {mockSegmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
        </div>
        <div className="col-span-6 sm:col-span-3">
            <label className="text-xs font-medium text-zinc-600">Entity</label>
            <select value={segment.entityId} onChange={e => onSegmentChange(shiftId, segment.id, 'entityId', e.target.value)} className="mt-1 w-full px-2 py-1.5 border border-zinc-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500">
                <option value="" disabled>Select...</option>
                {mockEntities.map(ent => <option key={ent.id} value={ent.id}>{ent.name}</option>)}
            </select>
        </div>
        <div className="col-span-12 sm:col-span-2 flex items-end space-x-2">
             <div className="flex-grow">
                <label className="text-xs font-medium text-zinc-600">Color</label>
                <input type="color" value={segment.color} onChange={e => onSegmentChange(shiftId, segment.id, 'color', e.target.value)} className="mt-1 w-full h-9 p-0 border-none rounded-md cursor-pointer" />
            </div>
            <button onClick={() => onRemoveSegment(shiftId, segment.id)} className="h-9 w-9 flex-shrink-0 flex items-center justify-center text-zinc-400 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors">
                <XCircle className="w-5 h-5" />
            </button>
        </div>
    </div>
);

// 👇 6. Accept `users` prop and `isLoading` state
const ShiftCard = ({ shift, index, isOnlyShift, onShiftChange, onDuplicateShift, onRemoveShift, onAddSegment, onSegmentChange, onRemoveSegment, users, isLoadingUsers }) => (
    <div className="bg-zinc-50 border border-zinc-200/80 rounded-lg overflow-hidden">
        {/* Shift Header */}
        <div className="p-4 border-b border-zinc-200/80 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                     <h3 className="font-semibold text-zinc-800">Shift #{index + 1}</h3>
                     <p className="text-sm text-zinc-500">Assign an employee and date for this shift.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => onDuplicateShift(shift.id)} className="flex items-center px-3 py-1.5 text-sm bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors font-medium">
                        <Copy className="w-4 h-4 mr-2" /> Duplicate
                    </button>
                    <button onClick={() => onRemoveShift(shift.id)} disabled={isOnlyShift} className="flex items-center px-3 py-1.5 text-sm bg-white border border-zinc-300 text-zinc-700 hover:bg-red-500 hover:text-white hover:border-red-500 rounded-md transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-zinc-700 disabled:hover:border-zinc-300">
                        <XCircle className="w-4 h-4 mr-2" /> Remove
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                    <label className="text-sm font-medium text-zinc-700">Employee</label>
                    <select
                        value={shift.userId}
                        onChange={e => onShiftChange(shift.id, 'userId', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 text-zinc-900 bg-white border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                        disabled={isLoadingUsers} // Disable while loading
                    >
                        {/* 👇 7. Update select options to use real data */}
                        {isLoadingUsers ? (
                            <option>Loading users...</option>
                        ) : (
                            <>
                                <option value="" disabled>Select user...</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </>
                        )}
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium text-zinc-700">Date</label>
                    <input type="date" value={shift.date} onChange={e => onShiftChange(shift.id, 'date', e.target.value)} className="mt-1 block w-full px-3 py-2 text-zinc-900 bg-white border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500" />
                </div>
            </div>
        </div>

        {/* Segments Section */}
        <div className="p-4">
             <h4 className="font-medium text-zinc-600 mb-2">Segments</h4>
            <div className="space-y-2">
                {shift.segments.map(seg => (
                    <SegmentForm 
                        key={seg.id} 
                        segment={seg} 
                        shiftId={shift.id} 
                        onSegmentChange={onSegmentChange} 
                        onRemoveSegment={onRemoveSegment}
                    />
                ))}
            </div>
            <button onClick={() => onAddSegment(shift.id)} className="mt-4 flex items-center text-sm font-medium text-sky-600 hover:text-sky-800 transition-colors">
                <PlusCircle className="w-5 h-5 mr-1.5" />Add Segment
            </button>
        </div>
    </div>
);


// --- Main App Component ---
export default function App() {
  // --- STATE ---
  const [shifts, setShifts] = useState([{
    id: crypto.randomUUID(), userId: '', date: '', segments: []
  }]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  
  // 👇 3. Add state for users list and loading status
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // --- API CALL ---
  // 👇 4. Fetch users from the API when the component mounts
  useEffect(() => {
    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users'); // Assumes your API is at this endpoint
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setUsers(data.users || []); // Handle case where 'users' might not exist
        } catch (error) {
            console.error("Could not fetch users:", error);
            // Optionally, set an error state here to show in the UI
        } finally {
            setIsLoadingUsers(false);
        }
    };

    fetchUsers();
  }, []); // The empty array ensures this effect runs only once

  // --- Derived State (No Changes) ---
  const highlightedDates = useMemo(() => new Set(shifts.map(s => s.date).filter(Boolean)), [shifts]);

  // --- Handlers (No Changes) ---
  const handleShiftChange = (id, field, value) => setShifts(cur => cur.map(s => s.id === id ? { ...s, [field]: value } : s));
  const addShift = () => setShifts(cur => [...cur, { id: crypto.randomUUID(), userId: '', date: selectedDate || formatDate(new Date()), segments: [] }]);
  const duplicateShift = id => setShifts(cur => { const idx = cur.findIndex(s => s.id === id); if (idx < 0) return cur; const dup = { ...cur[idx], id: crypto.randomUUID(), segments: cur[idx].segments.map(seg => ({ ...seg, id: crypto.randomUUID() })) }; const arr = [...cur]; arr.splice(idx + 1, 0, dup); return arr; });
  const removeShift = id => setShifts(cur => cur.length > 1 ? cur.filter(s => s.id !== id) : cur);
  const addSegment = shiftId => setShifts(cur => cur.map(s => s.id === shiftId ? { ...s, segments: [...s.segments, { id: crypto.randomUUID(), startTime: '09:00', endTime: '17:00', segmentType: 'Work', location: '', notes: '', color: '#38bdf8', entityId: '' }] } : s));
  const handleSegmentChange = (shiftId, segId, field, value) => setShifts(cur => cur.map(s => s.id === shiftId ? { ...s, segments: s.segments.map(seg => seg.id === segId ? { ...seg, [field]: value } : seg) } : s));
  const removeSegment = (shiftId, segId) => setShifts(cur => cur.map(s => s.id === shiftId ? { ...s, segments: s.segments.filter(seg => seg.id !== segId) } : s));
  const handleSubmit = () => { console.log('Shifts payload:', shifts.map(({ id, ...rest }) => rest)); alert('Shift data saved! Check the console.'); };
  const handlePrevMonth = () => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const handleNextMonth = () => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <div className="bg-zinc-100 font-sans min-h-screen">
      <div className="w-full max-w-7xl mx-auto">
        <PageHeader />

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 sm:p-6 lg:p-8">
            <aside className="lg:col-span-1 lg:sticky top-8 self-start">
                 <h2 className="text-lg font-semibold text-zinc-700 mb-4">Schedule Visualizer</h2>
                 <ScheduleVisualizer
                    calendarDate={calendarDate}
                    highlightedDates={highlightedDates}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                />
            </aside>

            <div className="lg:col-span-2 space-y-6">
                {shifts.map((shift, index) => (
                    // 👇 5. Pass the new state and props down to the card
                    <ShiftCard
                        key={shift.id}
                        shift={shift}
                        index={index}
                        isOnlyShift={shifts.length <= 1}
                        onShiftChange={handleShiftChange}
                        onDuplicateShift={duplicateShift}
                        onRemoveShift={removeShift}
                        onAddSegment={addSegment}
                        onSegmentChange={handleSegmentChange}
                        onRemoveSegment={removeSegment}
                        users={users}
                        isLoadingUsers={isLoadingUsers}
                    />
                ))}
                
                <button onClick={addShift} className="w-full flex justify-center items-center px-4 py-3 border-2 border-zinc-300 border-dashed text-zinc-600 font-medium rounded-lg hover:bg-zinc-200/50 hover:border-zinc-400 transition-all">
                    <PlusCircle className="mr-2 h-5 w-5" />Add Another Shift
                </button>
            </div>
        </main>
        
        <footer className="p-6 mt-4 bg-white/50 backdrop-blur-sm border-t border-zinc-200 sticky bottom-0 text-right">
             <button onClick={handleSubmit} className="px-8 py-3 bg-sky-600 text-white font-semibold rounded-lg shadow-sm hover:bg-sky-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">
                Save All Shifts
            </button>
        </footer>
      </div>
    </div>
  );
}