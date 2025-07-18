"use client"

import React, { useState, useEffect, useMemo } from 'react';

// --- Helper Functions ---
const dateToDayPercentage = (date) => {
  if (!date) return 0;
  // FIX: Ensure this uses local hours to match the local-time tooltip
  const hours = date.getHours() + date.getMinutes() / 60;
  const startHour = 7;
  const endHour = 22;
  const clamped = Math.min(Math.max(hours, startHour), endHour);
  return ((clamped - startHour) / (endHour - startHour)) * 100;
};

const mergeSegments = (segments) => {
  if (!segments || segments.length === 0) return [];
  const sorted = [...segments].sort(
    (a, b) => new Date(a.startTime) - new Date(b.startTime)
  );
  const merged = [JSON.parse(JSON.stringify(sorted[0]))];
  for (let i = 1; i < sorted.length; i++) {
    const curr = sorted[i];
    const last = merged[merged.length - 1];
    if (new Date(curr.startTime) <= new Date(last.endTime)) {
      last.endTime = new Date(
        Math.max(new Date(last.endTime), new Date(curr.endTime))
      );
    } else {
      merged.push(JSON.parse(JSON.stringify(curr)));
    }
  }
  return merged;
};

const formatDate = (date) => date.toISOString().split('T')[0];

// --- Icon Components ---
const CalendarIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
       viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
       className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const ChevronLeft = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
       viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
       className={className}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);
const ChevronRight = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
       viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
       className={className}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);
const RefreshIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
       viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
       className={className}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0114.13-3.36L23 10" />
    <path d="M20.49 15a9 9 0 01-14.13 3.36L1 14" />
  </svg>
);

// --- CoverageBar Component ---
const CoverageBar = ({ segments }) => {
  const sorted = useMemo(() => {
    if (!segments) return [];
    return [...segments].sort(
      (a, b) => new Date(a.startTime) - new Date(b.startTime)
    );
  }, [segments]);

  // Positions for 9 AM and 9 PM in 7–22 scale
  const nineAmPos = ((9 - 7) / (22 - 7)) * 100;    // ~13.33%
  const ninePmPos = ((21 - 7) / (22 - 7)) * 100;   // ~93.33%
  const fmtTime = (d) =>
    new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="relative w-full">
      <div className="relative w-full h-2 bg-gray-200 rounded-md">
        <div
          className="absolute top-0 bottom-0 w-px bg-gray-400/75"
          style={{ left: `${nineAmPos}%` }}
          title="9:00 AM"
        />
        <div
          className="absolute top-0 bottom-0 w-px bg-gray-400/75"
          style={{ left: `${ninePmPos}%` }}
          title="9:00 PM"
        />
        {sorted.map(seg => {
          const start = dateToDayPercentage(new Date(seg.startTime));
          const end = dateToDayPercentage(new Date(seg.endTime));
          const width = end - start;
          if (width <= 0) return null;
          return (
            <div
              key={seg.id}
              className="absolute h-2 rounded-md"
              style={{
                left: `${start}%`,
                width: `${width}%`,
                backgroundColor: seg.color || '#3B82F6'
              }}
              title={`Time: ${fmtTime(seg.startTime)} – ${fmtTime(seg.endTime)}`}
            />
          );
        })}
      </div>
      <div className="relative w-full h-3">
        <div
          className="absolute top-0 transform -translate-x-1/2 text-[9px] text-gray-500"
          style={{ left: `${nineAmPos}%` }}
        >
          9a
        </div>
        <div
          className="absolute top-0 transform -translate-x-1/2 text-[9px] text-gray-500"
          style={{ left: `${ninePmPos}%` }}
        >
          9p
        </div>
      </div>
    </div>
  );
};

// --- Header Component ---
const ScheduleHeader = ({
  currentDate,
  onPrevWeek,
  onNextWeek,
  onToday,
  onToggleCalendar,
  onRefresh
}) => {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(
    startOfWeek.getDate() - (startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1)
  );
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  const dateRange =
    new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
      .formatRange(startOfWeek, endOfWeek)
    + `, ${endOfWeek.getFullYear()}`;

  return (
    <div className="mb-1 flex justify-between items-center">
      <h1 className="text-sm font-semibold text-gray-800 whitespace-nowrap">
        Schedule: <span className="font-normal text-gray-600">{dateRange}</span>
      </h1>
      <div className="flex items-center space-x-1">
        <button onClick={onRefresh} className="p-1 border rounded-md text-gray-500 hover:bg-gray-100" title="Refresh">
          <RefreshIcon className="w-3 h-3" />
        </button>
        <button onClick={onToggleCalendar} className="p-1 border rounded-md text-gray-500 hover:bg-gray-100" title="Calendar">
          <CalendarIcon className="w-3 h-3" />
        </button>
        <button onClick={onPrevWeek} className="px-1 py-0.5 border rounded text-xs text-gray-500 hover:bg-gray-100">&lt;</button>
        <button onClick={onToday} className="px-2 py-0.5 border rounded text-xs text-gray-600 hover:bg-gray-100">Today</button>
        <button onClick={onNextWeek} className="px-1 py-0.5 border rounded text-xs text-gray-500 hover:bg-gray-100">&gt;</button>
      </div>
    </div>
  );
};

// --- Mini Calendar ---
const MiniCalendar = ({
  selectedDate,
  onDateChange,
  onMonthChange,
  startOfWeek,
  endOfWeek
}) => {
  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  const daysOfWeek = ["S","M","T","W","T","F","S"];
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const days = Array.from({ length: firstDay }, (_, i) => <div key={`e-${i}`}/>);
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    const ds = formatDate(dt);
    const isSel = ds === formatDate(selectedDate);
    const inWeek = dt >= startOfWeek && dt <= endOfWeek;

    days.push(
      <div key={d} className="flex items-center justify-center">
        <button
          onClick={() => onDateChange(dt)}
          className={`w-5 h-5 flex items-center justify-center rounded-full text-xs transition-all
            ${isSel ? 'bg-sky-500 text-white' : ''}
            ${!isSel && inWeek ? 'bg-sky-100 text-sky-800' : ''}
            ${!isSel && !inWeek ? 'text-zinc-700 hover:bg-zinc-100' : ''}
          `}
        >
          {d}
        </button>
      </div>
    );
  }

  return (
    <div className="p-1 bg-white rounded-lg border border-zinc-200 shadow-md max-w-xs mx-auto mb-1">
      <div className="flex items-center justify-between mb-1">
        <button onClick={() => onMonthChange(-1)} className="p-1 rounded-md hover:bg-zinc-100 text-zinc-500">
          <ChevronLeft className="w-3 h-3" />
        </button>
        <h3 className="text-xs font-semibold text-zinc-800">
          {monthNames[month]} {year}
        </h3>
        <button onClick={() => onMonthChange(1)} className="p-1 rounded-md hover:bg-zinc-100 text-zinc-500">
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-500 font-semibold">
        {daysOfWeek.map((d,i) => <div key={i}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1 mt-1">{days}</div>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [entities, setEntities] = useState([]);
  const [segments, setSegments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  const fetchScheduleData = async () => {
    setIsLoading(true);
    setError(null);
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1));
    startOfWeek.setHours(0,0,0,0);

    // Widen the fetch range to get a buffer for timezone differences
    const fetchStart = new Date(startOfWeek);
    fetchStart.setDate(startOfWeek.getDate() - 1); // Start one day earlier
    const fetchEnd = new Date(startOfWeek);
    fetchEnd.setDate(startOfWeek.getDate() + 8);   // End one day later

    const sStr = formatDate(fetchStart);
    const eStr = formatDate(fetchEnd);

    try {
      const [entRes, segRes] = await Promise.all([
        fetch('/api/entitiesAPI/entities'),
        fetch(`/api/entitiesAPI/segments?startDate=${sStr}&endDate=${eStr}`)
      ]);
      if (!entRes.ok || !segRes.ok)
        throw new Error('Failed to fetch schedule data');
      setEntities(await entRes.json());
      setSegments(await segRes.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleData();
  }, [currentDate]);

  const getSegmentsForEntityAndDay = (eid, dayIdx) => {
    const jsIdx = (dayIdx + 1) % 7;
    return segments.filter(
      // Use getDay() for local timezone day matching
      s => s.entityId === eid && new Date(s.startTime).getDay() === jsIdx
    );
  };

  const handleMonthChange = (offs) =>
    setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + offs, 1));
  const handlePrevWeek = () =>
    setCurrentDate(d => { d.setDate(d.getDate() - 7); return new Date(d); });
  const handleNextWeek = () =>
    setCurrentDate(d => { d.setDate(d.getDate() + 7); return new Date(d); });
  const handleToday = () => setCurrentDate(new Date());
  const handleDateChange = (dt) => { setCurrentDate(dt); setShowCalendar(false); };

  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(
    startOfWeek.getDate() - (startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1)
  );
  startOfWeek.setHours(0,0,0,0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23,59,59,999);

  const weekDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const filtered = entities.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen p-1 sm:p-1 lg:p-2 font-sans">
      <div className="max-w-7xl mx-auto">
        <ScheduleHeader
          currentDate={currentDate}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          onToday={handleToday}
          onToggleCalendar={() => setShowCalendar(!showCalendar)}
          onRefresh={fetchScheduleData}
        />

        {showCalendar && (
          <MiniCalendar
            selectedDate={currentDate}
            onDateChange={handleDateChange}
            onMonthChange={handleMonthChange}
            startOfWeek={startOfWeek}
            endOfWeek={endOfWeek}
          />
        )}

        <div className="bg-white p-3 rounded-xl shadow-sm">
          <div className="mb-2">
            <input
              type="text"
              placeholder="Search entities..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring"
            />
          </div>

          <div className="grid grid-cols-9 gap-1 mb-1 border-b pb-1">
            <div className="col-span-2 font-semibold text-gray-600 text-xs">Entity</div>
            {weekDays.map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 col-span-1 text-xs">{day}</div>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center p-4 text-gray-500 text-xs">Loading schedule...</div>
          ) : error ? (
            <div className="text-center p-4 text-red-500 text-xs">Error: {error}</div>
          ) : (
            <div className="space-y-1">
              {filtered.length > 0 ? (
                filtered.map(ent => (
                  <div key={ent.id} className="grid grid-cols-9 gap-1 items-center">
                    <div className="col-span-2 text-xs font-medium text-gray-700">{ent.name}</div>
                    {weekDays.map((_, idx) => (
                      <div key={idx} className="col-span-1 w-full">
                        <CoverageBar segments={getSegmentsForEntityAndDay(ent.id, idx)} />
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4 text-xs">No entities match your search.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}