"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from "framer-motion";

// --- Helper Functions ---
const dateToDayPercentage = (date) => {
  if (!date) return 0;
  const hours = date.getHours() + date.getMinutes() / 60;
  const startHour = 7;
  const endHour = 22;
  const clamped = Math.min(Math.max(hours, startHour), endHour);
  return ((clamped - startHour) / (endHour - startHour)) * 100;
};

const formatDate = (date) => date.toISOString().split('T')[0];
const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// --- Icon Components ---
const CalendarIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const ChevronLeft = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={className}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);
const ChevronRight = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={className}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);
const RefreshIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={className}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0114.13-3.36L23 10" />
    <path d="M20.49 15a9 9 0 01-14.13 3.36L1 14" />
  </svg>
);

// --- NEW: AddShiftModal Component ---
const AddShiftModal = ({ date, onSubmit, onClose }) => {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  const handleSubmit = (e) => {
    e.preventDefault();
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startDate = new Date(date);
    startDate.setHours(startHour, startMinute, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(endHour, endMinute, 0, 0);

    if (endDate <= startDate) {
      alert("End time must be after start time.");
      return;
    }
    onSubmit({ startTime: startDate, endTime: endDate });
  };

  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
  const dateString = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-xl max-w-sm w-full">
        <h3 className="text-sm font-semibold mb-2 text-gray-800">Add Shift for {dayName}, {dateString}</h3>
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between space-x-2 mb-4">
            <div className="w-1/2">
              <label htmlFor="start-time" className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
              <input
                id="start-time"
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="w-1/2">
              <label htmlFor="end-time" className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
              <input
                id="end-time"
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-3 py-1 text-xs text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
              Cancel
            </button>
            <button type="submit" className="px-3 py-1 text-xs text-white bg-sky-600 rounded-md hover:bg-sky-700">
              Add Shift
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- ShiftBar Component ---
const ShiftBar = ({ shifts }) => {
  const sortedShifts = useMemo(() => {
    if (!shifts) return [];
    return [...shifts].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [shifts]);

  // markers at 9am and 9pm
  const nineAmPos = ((9 - 7) / (22 - 7)) * 100;
  const ninePmPos = ((21 - 7) / (22 - 7)) * 100;

  return (
    <div className="relative w-full">
      <div className="relative w-full h-2 bg-gray-200 rounded-md">
        <div className="absolute top-0 bottom-0 w-px bg-gray-400/75" style={{ left: `${nineAmPos}%` }} title="9:00 AM" />
        <div className="absolute top-0 bottom-0 w-px bg-gray-400/75" style={{ left: `${ninePmPos}%` }} title="9:00 PM" />
        {sortedShifts.map(shift => {
          const startPercent = dateToDayPercentage(new Date(shift.startTime));
          const endPercent = dateToDayPercentage(new Date(shift.endTime));
          const widthPercent = endPercent - startPercent;
          if (widthPercent <= 0) return null;
          return (
            <div
              key={shift.id}
              className="absolute h-2 rounded-md"
              style={{
                left: `${startPercent}%`,
                width: `${widthPercent}%`,
                backgroundColor: shift.color || '#3B82F6'
              }}
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

// --- Header Component ---
const ScheduleHeader = ({ currentDate, onPrevWeek, onNextWeek, onToday, onToggleCalendar, onRefresh }) => {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1));
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  const dateRange = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).formatRange(startOfWeek, endOfWeek) + `, ${endOfWeek.getFullYear()}`;

  return (
    <div className="mb-1 flex justify-between items-center">
      <h1 className="text-sm font-semibold text-gray-800 whitespace-nowrap">
        Schedule: <span className="font-normal text-gray-600">{dateRange}</span>
      </h1>
      <div className="flex items-center space-x-1">
        <button onClick={onRefresh} className="p-1 border rounded-md text-gray-500 hover:bg-gray-100" title="Refresh"><RefreshIcon className="w-3 h-3" /></button>
        <button onClick={onToggleCalendar} className="p-1 border rounded-md text-gray-500 hover:bg-gray-100" title="Toggle Calendar"><CalendarIcon className="w-3 h-3" /></button>
        <button onClick={onPrevWeek} className="px-1 py-0.5 border rounded text-xs text-gray-500 hover:bg-gray-100">&lt;</button>
        <button onClick={onToday} className="px-2 py-0.5 border rounded text-xs text-gray-600 hover:bg-gray-100">Today</button>
        <button onClick={onNextWeek} className="px-1 py-0.5 border rounded text-xs text-gray-500 hover:bg-gray-100">&gt;</button>
      </div>
    </div>
  );
};

// --- Mini Calendar ---
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
    const isSelected = formatDate(date) === formatDate(selectedDate);
    const isInWeek = date >= startOfWeek && date <= endOfWeek;
    calendarDays.push(
      <div key={day} className="flex items-center justify-center">
        <button
          onClick={() => onDateChange(date)}
          className={`w-5 h-5 flex items-center justify-center rounded-full text-xs transition-all ${isSelected ? 'bg-sky-500 text-white' : ''} ${!isSelected && isInWeek ? 'bg-sky-100 text-sky-800' : ''} ${!isSelected && !isInWeek ? 'text-zinc-700 hover:bg-zinc-100' : ''}`}
        >{day}</button>
      </div>
    );
  }
  return (
    <div className="p-1 bg-white rounded-lg border border-zinc-200 shadow-md max-w-xs mx-auto mb-1">
      <div className="flex items-center justify-between mb-1">
        <button onClick={() => onMonthChange(-1)} className="p-1 rounded-md hover:bg-zinc-100 text-zinc-500"><ChevronLeft className="w-3 h-3" /></button>
        <h3 className="text-xs font-semibold text-zinc-800">{monthNames[month]} {year}</h3>
        <button onClick={() => onMonthChange(1)} className="p-1 rounded-md hover:bg-zinc-100 text-zinc-500"><ChevronRight className="w-3 h-3" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-500 font-semibold">{daysOfWeek.map((d, idx) => <div key={idx}>{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-y-1 mt-1">{calendarDays}</div>
    </div>
  );
};

// --- Main UserSchedule Component ---
export default function UserSchedule({ date }) {
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  // whenever the parent gives us a new date, we render that week
  const [currentDate, setCurrentDate] = useState(date || new Date());

  // if parent ever changes the `date` prop, update our local copy too
  useEffect(() => {
    setCurrentDate(date);
  }, [date]);

  const selectedDayIndex = useMemo(() => {
    const jsDay = currentDate.getDay();        // 0=Sun,1=Mon…6=Sat
    return jsDay === 0 ? 6 : jsDay - 1;       // map Sun→6, Mon→0, … Sat→5
  }, [currentDate]);

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  // --- NEW: State for managing the add shift modal ---
  const [modalInfo, setModalInfo] = useState(null); // e.g., { userId: 1, date: Date_object }

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

  useEffect(() => { fetchScheduleData(); }, []);

  const getShiftsForUserAndDay = (userId, dayIndex) => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1));
    startOfWeek.setHours(0, 0, 0, 0);
    const targetDate = new Date(startOfWeek);
    targetDate.setDate(targetDate.getDate() + dayIndex);

    return shifts.filter(shift => {
      if (shift.userId !== userId) return false;
      const shiftDate = new Date(shift.startTime);
      return shiftDate.getFullYear() === targetDate.getFullYear() && shiftDate.getMonth() === targetDate.getMonth() && shiftDate.getDate() === targetDate.getDate();
    });
  };

  const handleDaySelect = (idx) => setSelectedDayIndex(prev => (prev === idx ? null : idx));
  const handleMonthChange = (offset) => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + offset, 1));
  const handlePrevWeek = () => setCurrentDate(d => { d.setDate(d.getDate() - 7); return new Date(d); });
  const handleNextWeek = () => setCurrentDate(d => { d.setDate(d.getDate() + 7); return new Date(d); });
  const handleToday = () => setCurrentDate(new Date());
  const handleDateChange = (date) => { setCurrentDate(date); setShowCalendar(false); };

  // --- NEW: Handlers for the modal ---
  const handleOpenModal = (userId, dayIndex) => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1));
    startOfWeek.setHours(0, 0, 0, 0);
    const targetDate = new Date(startOfWeek);
    targetDate.setDate(targetDate.getDate() + dayIndex);
    setModalInfo({ userId, date: targetDate });
  };

  const handleAddShift = (newShiftTimes) => {
    if (!modalInfo) return;
    const newShift = {
      id: `shift-${Date.now()}-${Math.random()}`, // Simple unique ID
      userId: modalInfo.userId,
      startTime: newShiftTimes.startTime.toISOString(),
      endTime: newShiftTimes.endTime.toISOString(),
      color: '#22C55E', // Green for newly added shifts
    };
    setShifts(prevShifts => [...prevShifts, newShift]);
    setModalInfo(null); // Close modal on success
  };



  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1));
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <AnimatePresence exitBeforeEnter>
      <motion.div
        key={startOfWeek.toDateString()}         // ← this makes React unmount/remount
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={{ duration: 0.3 }}
        className="bg-gray-50 min-h-screen p-1 sm:p-1 lg:p-2 font-sans"
      >
        <div className="bg-gray-50 min-h-screen p-1 sm:p-1 lg:p-2 font-sans">
          <div className="max-w-7xl mx-auto">
            <ScheduleHeader currentDate={currentDate} onPrevWeek={handlePrevWeek} onNextWeek={handleNextWeek} onToday={handleToday} onToggleCalendar={() => setShowCalendar(!showCalendar)} onRefresh={fetchScheduleData} />

            {showCalendar && <MiniCalendar selectedDate={currentDate} onDateChange={handleDateChange} onMonthChange={handleMonthChange} startOfWeek={startOfWeek} endOfWeek={endOfWeek} />}

            {/* --- NEW: Render the modal when modalInfo is set --- */}
            {modalInfo && <AddShiftModal date={modalInfo.date} onSubmit={handleAddShift} onClose={() => setModalInfo(null)} />}

            <div className="bg-white p-3 rounded-xl shadow-sm">
              <div className="mb-2">
                <input type="text" placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring" />
              </div>

              <div className="grid grid-cols-9 gap-1 mb-1 border-b pb-1">
                <div className="col-span-2 font-semibold text-gray-600 text-xs">User</div>
                {weekDays.map((day, idx) => (
                  <button key={day} className={`col-span-1 text-center font-semibold text-xs rounded-md p-1 transition-all duration-200 ease-in-out ${selectedDayIndex === idx ? 'bg-sky-100 text-sky-700 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                    {day}
                  </button>
                ))}
              </div>

              {isLoading ? <div className="text-center p-4 text-gray-500 text-xs">Loading schedule...</div>
                : error ? <div className="text-center p-4 text-red-500 text-xs">Error: {error}</div>
                  : (
                    <div className="space-y-1">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map(user => (
                          <div key={user.id} className="grid grid-cols-9 gap-1 items-center">
                            <div className="col-span-2 text-xs font-medium text-gray-700">{user.name}</div>
                            {weekDays.map((_, idx) => (
                              <div
                                key={`${user.id}-${idx}`}
                                // --- NEW: onClick handler to open the modal ---
                                onClick={() => handleOpenModal(user.id, idx)}
                                className={`col-span-1 w-full h-full flex items-center p-1 rounded-md transition-all duration-200 ease-in-out cursor-pointer hover:bg-gray-100 ${selectedDayIndex === idx ? 'bg-sky-50/75 shadow-md' : ''}`}
                              >
                                <ShiftBar shifts={getShiftsForUserAndDay(user.id, idx)} />
                              </div>
                            ))}
                          </div>
                        ))
                      ) : <div className="text-center text-gray-500 py-4 text-xs">No users found.</div>}
                    </div>
                  )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}