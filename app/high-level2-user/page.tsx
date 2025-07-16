"use client"

import React, { useState, useEffect, useMemo } from 'react';

// --- Helper Functions ---
const dateToDayPercentage = (date) => {
    if (!date) return 0;
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    return (totalMinutes / (24 * 60)) * 100;
};

const formatDate = (date) => date.toISOString().split('T')[0];

// --- Icon Components ---
const CalendarIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);const ChevronLeft = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6" /></svg>);
const ChevronRight = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6" /></svg>);
// New refresh icon
const RefreshIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0114.13-3.36L23 10" />
    <path d="M20.49 15a9 9 0 01-14.13 3.36L1 14" />
  </svg>
);

// --- Child Components ---

const ShiftBar = ({ shifts }) => {
    const sortedShifts = useMemo(() => {
        if (!shifts) return [];
        return [...shifts].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }, [shifts]);

    const nineAmPos = (9 / 24) * 100;
    const ninePmPos = (21 / 24) * 100;
    const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="relative w-full">
            <div className="relative w-full h-4 bg-gray-200 rounded-md">
                <div className="absolute top-0 bottom-0 w-px bg-gray-400/75" style={{ left: `${nineAmPos}%` }} title="9:00 AM" />
                <div className="absolute top-0 bottom-0 w-px bg-gray-400/75" style={{ left: `${ninePmPos}%` }} title="9:00 PM" />
                {sortedShifts.map((shift) => {
                    const startPercent = dateToDayPercentage(new Date(shift.startTime));
                    const endPercent = dateToDayPercentage(new Date(shift.endTime));
                    const widthPercent = endPercent - startPercent;
                    if (widthPercent <= 0) return null;
                    return (
                        <div
                            key={shift.id}
                            className="absolute h-4 rounded-md"
                            style={{ left: `${startPercent}%`, width: `${widthPercent}%`, backgroundColor: shift.color || '#3B82F6' }}
                            title={`Shift: ${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`}
                        />
                    );
                })}
            </div>
            <div className="relative w-full h-3">
                <div className="absolute top-0 transform -translate-x-1/2 text-[9px] text-gray-500" style={{ left: `${nineAmPos}%` }}>9a</div>
                <div className="absolute top-0 transform -translate-x-1/2 text-[9px] text-gray-500" style={{ left: `${ninePmPos}%` }}>9p</div>
            </div>
        </div>
    );
};


const ScheduleHeader = ({ currentDate, onPrevWeek, onNextWeek, onToday, onToggleCalendar, onRefresh }) => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    const dateRange = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', }).formatRange(startOfWeek, endOfWeek) + `, ${endOfWeek.getFullYear()}`;
    return (
        <div className="mb-3 flex justify-between items-center">
            <h1 className="text-base font-semibold text-gray-800 whitespace-nowrap">Schedule: <span className="font-normal text-gray-600">{dateRange}</span></h1>
            <div className="flex items-center space-x-1">
                       <button onClick={onRefresh} className="p-1.5 border rounded-md text-gray-500 hover:bg-gray-100" title="Refresh">
          <RefreshIcon className="w-4 h-4" />
        </button>
                <button onClick={onToggleCalendar} className="p-1.5 border rounded-md text-gray-500 hover:bg-gray-100" title="Toggle Calendar"><CalendarIcon className="w-4 h-4" /></button>
                <button onClick={onPrevWeek} className="px-1.5 py-0.5 border rounded text-gray-500 hover:bg-gray-100">&lt;</button>
                <button onClick={onToday} className="px-2 py-0.5 border rounded text-sm text-gray-600 hover:bg-gray-100">Today</button>
                <button onClick={onNextWeek} className="px-1.5 py-0.5 border rounded text-gray-500 hover:bg-gray-100">&gt;</button>
                
            </div>
        </div>
    );
};

const MiniCalendar = ({ selectedDate, onDateChange, onMonthChange, startOfWeek, endOfWeek }) => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const calendarDays = Array.from({ length: firstDayOfMonth }, (_, i) => <div key={`empty-${i}`} />);
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = formatDate(date);
        const isSelected = formatDate(selectedDate) === dateStr;
        const isInWeek = date >= startOfWeek && date <= endOfWeek;

        calendarDays.push(
            <div key={day} className="flex items-center justify-center">
                <button
                    onClick={() => onDateChange(date)}
                    className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-small transition-all ${isSelected ? 'bg-sky-500 text-white' : ''} ${!isSelected && isInWeek ? 'bg-sky-100 text-sky-800' : ''} ${!isSelected && !isInWeek ? 'text-zinc-700 hover:bg-zinc-100' : ''}`}>
                    {day}
                </button>
            </div>
        );
    }

    return (
        <div className="p-2 bg-white rounded-lg border border-zinc-200 shadow-md max-w-xs mx-auto mb-2">
            <div className="flex items-center justify-between mb-2">
                <button onClick={() => onMonthChange(-1)} className="p-1 rounded-md hover:bg-zinc-100 text-zinc-500"><ChevronLeft className="w-4 h-4" /></button>
                <h3 className="text-sm font-semibold text-zinc-800">{monthNames[month]} {year}</h3>
                <button onClick={() => onMonthChange(1)} className="p-1 rounded-md hover:bg-zinc-100 text-zinc-500"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-500 font-semibold">{daysOfWeek.map((d, index) => <div key={index}>{d}</div>)}</div>
            <div className="grid grid-cols-7 gap-y-1 mt-2">{calendarDays}</div>
        </div>
    );
};


// --- Main Component for User Schedule ---
export default function UserSchedule() {
    const [users, setUsers] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDayIndex, setSelectedDayIndex] = useState(null); // 👈 New state for selected day

    const fetchScheduleData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/shifts');
            if (!res.ok) throw new Error('Failed to fetch schedule data');
            const data = await res.json();
            const employees = data.employees || [];
            setUsers(employees.map(emp => ({ id: emp.id, name: emp.name })));
            setShifts(employees.flatMap(emp => emp.shifts.map(s => ({ ...s, userId: emp.id }))));
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchScheduleData();
    }, []);

    const getShiftsForUserAndDay = (userId, dayIndex) => {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1));
        startOfWeek.setHours(0, 0, 0, 0);

        const targetDate = new Date(startOfWeek);
        targetDate.setDate(targetDate.getDate() + dayIndex);

        return shifts.filter(shift => {
            if (shift.userId !== userId) return false;
            const shiftDate = new Date(shift.startTime);
            return shiftDate.getFullYear() === targetDate.getFullYear() &&
                shiftDate.getMonth() === targetDate.getMonth() &&
                shiftDate.getDate() === targetDate.getDate();
        });
    };

    // --- Event Handlers ---
    const handleDaySelect = (index) => { // 👈 New handler to toggle day selection
        setSelectedDayIndex(prevIndex => (prevIndex === index ? null : index));
    };
    const handleMonthChange = (offset) => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + offset, 1));
    const handlePrevWeek = () => setCurrentDate(d => { d.setDate(d.getDate() - 7); return new Date(d); });
    const handleNextWeek = () => setCurrentDate(d => { d.setDate(d.getDate() + 7); return new Date(d); });
    const handleToday = () => setCurrentDate(new Date());
    const handleDateChange = (date) => {
        setCurrentDate(date);
        setShowCalendar(false);
    };

    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const filteredUsers = users.filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="bg-gray-50 min-h-screen p-2 sm:p-3 lg:p-4 font-sans">
            <div className="max-w-7xl mx-auto">
                <ScheduleHeader currentDate={currentDate} onPrevWeek={handlePrevWeek} onNextWeek={handleNextWeek} onToday={handleToday} onToggleCalendar={() => setShowCalendar(!showCalendar)} onRefresh={fetchScheduleData} />

                {showCalendar && <MiniCalendar selectedDate={currentDate} onDateChange={handleDateChange} onMonthChange={handleMonthChange} startOfWeek={startOfWeek} endOfWeek={endOfWeek} />}

                <div className="bg-white p-3 rounded-xl shadow-sm">
                    <div className="mb-3">
                        <input type="text" placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-sky-500 focus:border-sky-500" />
                    </div>

                    {/* 👇 SCHEDULE GRID HEADER (MODIFIED) */}
                    <div className="grid grid-cols-9 gap-x-2 mb-2 border-b pb-2">
                        <div className="col-span-2 font-semibold text-gray-600 text-sm pl-2">User</div>
                        {weekDays.map((day, idx) => (
                            <button
                                key={day}
                                onClick={() => handleDaySelect(idx)}
                                className={`col-span-1 text-center font-semibold text-sm rounded-md p-1 transition-all duration-200 ease-in-out ${selectedDayIndex === idx
                                        ? 'bg-sky-100 text-sky-700 shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>

                    {isLoading ? (<div className="text-center p-8 text-gray-500">Loading schedule...</div>) : error ? (<div className="text-center p-8 text-red-500">Error: {error}</div>) : (
                        // 👇 SCHEDULE GRID BODY (MODIFIED)
                        <div className="space-y-1">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <div key={user.id} className="grid grid-cols-9 gap-x-2 items-center">
                                        <div className="col-span-2 text-sm font-medium text-gray-700 pl-2">{user.name}</div>
                                        {weekDays.map((day, idx) => (
                                            <div
                                                key={`${user.id}-${day}`}
                                                className={`col-span-1 w-full h-full flex items-center p-1.5 rounded-lg transition-all duration-200 ease-in-out ${selectedDayIndex === idx ? 'bg-sky-50/75 shadow-md' : ''
                                                    }`}
                                            >
                                                <ShiftBar shifts={getShiftsForUserAndDay(user.id, idx)} />
                                            </div>
                                        ))}
                                    </div>
                                ))
                            ) : (<div className="text-center text-gray-500 py-8">No users found.</div>)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}