"use client"

import React, { useState, useEffect, useMemo } from 'react';

// --- Helper Functions ---

/**
 * Converts a Date object to a percentage of a 24-hour day.
 */
const dateToDayPercentage = date => {
  if (!date) return 0;
  const hours = new Date(date).getHours();
  const minutes = new Date(date).getMinutes();
  const totalMinutes = hours * 60 + minutes;
  return (totalMinutes / (24 * 60)) * 100;
};

/**
 * Merges overlapping or adjacent time segments into continuous blocks.
 * This is used by the CoverageBar to show a consolidated view of shifts.
 */
const mergeShifts = shifts => {
  if (!shifts || !shifts.length) return [];
  // Sort shifts by start time
  const sorted = [...shifts].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  const merged = [{ ...sorted[0] }];
  
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    // If the current shift starts before or at the same time the last one ends, merge them
    if (new Date(current.startTime) <= new Date(last.endTime)) {
      last.endTime = new Date(
        Math.max(new Date(last.endTime), new Date(current.endTime))
      );
    } else {
      merged.push({ ...current });
    }
  }
  return merged;
};

/**
 * Renders a coverage bar for a 24h period.
 */
const CoverageBar = ({ shifts, height = 'h-6' }) => {
  const nineAm = (9 / 24) * 100;
  const ninePm = (21 / 24) * 100;
  const formatTime = dt => new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const merged = mergeShifts(shifts || []);

  return (
    <div className="relative w-full">
      <div className={`${height} bg-gray-200 rounded-md relative`}>        
        {/* Time markers for 9 AM and 9 PM */}
        <div className="absolute top-0 bottom-0 w-px bg-gray-400/75" style={{ left: `${nineAm}%` }} title="9:00 AM" />
        <div className="absolute top-0 bottom-0 w-px bg-gray-400/75" style={{ left: `${ninePm}%` }} title="9:00 PM" />
        
        {merged.map(shift => {
          const start = dateToDayPercentage(shift.startTime);
          const end = dateToDayPercentage(shift.endTime);
          const width = end - start;
          if (width <= 0) return null;
          return (
            <div
              key={shift.id}
              className={`${height} absolute rounded-md`}
              style={{ left: `${start}%`, width: `${width}%`, backgroundColor: shift.color || '#3B82F6' }}
              title={`${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`}
            />
          );
        })}
      </div>
    </div>
  );
};

/**
 * Compute the start of the Monday of the week containing the given date.
 */
const getWeekStart = date => {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day; // Adjust to make Monday the first day
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Given any date, returns the four consecutive week-start dates that roughly cover its month.
 */
const getFourWeekStarts = date => {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const w1 = getWeekStart(firstDayOfMonth);
  return [
    w1,
    new Date(w1.getTime() + 7 * 24 * 60 * 60 * 1000),
    new Date(w1.getTime() + 14 * 24 * 60 * 60 * 1000),
    new Date(w1.getTime() + 21 * 24 * 60 * 60 * 1000)
  ];
};

export default function MonthlyUserSchedule() {
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const weeks = getFourWeekStarts(currentMonth);

  useEffect(() => {
    const fetchScheduleData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/shifts'); // Using the same endpoint
        if (!res.ok) throw new Error('Failed to fetch schedule data');
        
        const data = await res.json();
        const employees = data.employees || [];

        const extractedUsers = employees.map(emp => ({ id: emp.id, name: emp.name }));
        const allShifts = employees.flatMap(emp => 
            emp.shifts.map(shift => ({ ...shift, userId: emp.id }))
        );

        setUsers(extractedUsers);
        setShifts(allShifts);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchScheduleData();
  }, []); // Fetch data only once on component mount

  const changeMonth = offset => {
    setCurrentMonth(d => {
      const newDate = new Date(d);
      newDate.setMonth(newDate.getMonth() + offset, 1); // Set to day 1 to avoid month-end issues
      return newDate;
    });
  };

  const getShiftsForUserAndDate = (userId, date) => {
    return shifts.filter(shift => {
      if (shift.userId !== userId) return false;
      const shiftDate = new Date(shift.startTime);
      return shiftDate.getFullYear() === date.getFullYear() &&
             shiftDate.getMonth() === date.getMonth() &&
             shiftDate.getDate() === date.getDate();
    });
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const colWidth = `${100 / (daysOfWeek.length + 1)}%`;

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto bg-white p-4 sm:p-6 rounded-xl shadow-sm">
        {/* Header and Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{monthName}</h1>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-sky-500 focus:border-sky-500 w-full sm:w-auto"
            />
            <button onClick={() => changeMonth(-1)} className="px-3 py-1.5 border rounded-md text-gray-600 hover:bg-gray-100">◀</button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1.5 border rounded-md text-gray-600 hover:bg-gray-100">Today</button>
            <button onClick={() => changeMonth(1)} className="px-3 py-1.5 border rounded-md text-gray-600 hover:bg-gray-100">▶</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center p-8 text-gray-500">Loading schedule...</div>
        ) : error ? (
          <div className="text-center p-8 text-red-500">Error: {error}</div>
        ) : (
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr>
                <th style={{ width: colWidth }} className="border p-2 text-left text-sm font-semibold text-gray-600">User</th>
                {daysOfWeek.map(d => (
                  <th key={d} style={{ width: colWidth }} className="border p-2 text-center text-sm font-semibold text-gray-600">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? filteredUsers.map(user => (
                <React.Fragment key={user.id}>
                  {weeks.map((weekStartDate, weekIndex) => (
                    <tr key={weekIndex}>
                      {/* Show user name only in the first row of the month block */}
                      {weekIndex === 0 && (
                        <td rowSpan={4} style={{ width: colWidth }} className="border p-2 font-medium text-gray-700 align-top">
                          {user.name}
                        </td>
                      )}
                      {daysOfWeek.map((_, dayIndex) => {
                        const cellDate = new Date(weekStartDate);
                        cellDate.setDate(weekStartDate.getDate() + dayIndex);
                        const isCurrentMonth = cellDate.getMonth() === currentMonth.getMonth();
                        
                        return (
                          <td key={dayIndex} style={{ width: colWidth }} className={`border p-1 align-top ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}`}>
                            {/* Show date number only for days in the current month */}
                            <div className={`text-xs mb-1 ${isCurrentMonth ? 'text-gray-500' : 'text-gray-400'}`}>
                              {cellDate.getDate()}
                            </div>
                            {isCurrentMonth && (
                              <CoverageBar shifts={getShiftsForUserAndDate(user.id, cellDate)} height="h-5" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              )) : (
                <tr>
                    <td colSpan={daysOfWeek.length + 1} className="text-center text-gray-500 py-8">No users match your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}