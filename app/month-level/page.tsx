"use client"

import React, { useState, useEffect } from 'react';

// --- Helper Functions ---

/**
 * Converts a Date object to a percentage of a 24-hour day.
 */
const dateToDayPercentage = date => {
  if (!date) return 0;
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  return (totalMinutes / (24 * 60)) * 100;
};

/**
 * Merges overlapping or adjacent time segments into continuous blocks.
 */
const mergeSegments = segments => {
  if (!segments || !segments.length) return [];
  const sorted = [...segments].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  const merged = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const curr = sorted[i];
    const last = merged[merged.length - 1];
    if (new Date(curr.startTime) <= new Date(last.endTime)) {
      last.endTime = new Date(
        Math.max(new Date(last.endTime), new Date(curr.endTime))
      );
    } else {
      merged.push({ ...curr });
    }
  }
  return merged;
};

/**
 * Renders a coverage bar for a 24h period.
 */
const CoverageBar = ({ segments, height = 'h-6' }) => {
  const nineAm = (9 / 24) * 100;
  const ninePm = (21 / 24) * 100;
  const fmt = dt => new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const merged = mergeSegments(segments || []);

  return (
    <div className="relative w-full">
      <div className={`${height} bg-gray-200 rounded-md relative`}>        
        <div
          className="absolute top-0 bottom-0 w-px bg-gray-400/75"
          style={{ left: `${nineAm}%` }}
          title="9:00 AM"
        />
        <div
          className="absolute top-0 bottom-0 w-px bg-gray-400/75"
          style={{ left: `${ninePm}%` }}
          title="9:00 PM"
        />
        {merged.map(seg => {
          const start = dateToDayPercentage(new Date(seg.startTime));
          const end = dateToDayPercentage(new Date(seg.endTime));
          const width = end - start;
          if (width <= 0) return null;
          return (
            <div
              key={seg.id}
              className={`${height} absolute rounded-md`}
              style={{ left: `${start}%`, width: `${width}%`, backgroundColor: seg.color || '#3B82F6' }}
              title={`${fmt(seg.startTime)} - ${fmt(seg.endTime)}`}
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
  const day = d.getDay(); // 0=Sun,1=Mon...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Given any date, returns the four consecutive week-start dates that cover its month.
 */
const getFourWeekStarts = date => {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const w1 = getWeekStart(first);
  return [
    w1,
    new Date(w1.getTime() + 7 * 24 * 60 * 60 * 1000),
    new Date(w1.getTime() + 14 * 24 * 60 * 60 * 1000),
    new Date(w1.getTime() + 21 * 24 * 60 * 60 * 1000)
  ];
};

export default function MonthlySchedule() {
  const [entities, setEntities] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const monthName = currentMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  const weeks = getFourWeekStarts(currentMonth);
  const fetchStart = weeks[0];
  const fetchEnd = new Date(weeks[3].getTime() + 6 * 24 * 60 * 60 * 1000);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      const startStr = fetchStart.toISOString().split('T')[0];
      const endStr = fetchEnd.toISOString().split('T')[0];
      try {
        const [eRes, sRes] = await Promise.all([
          fetch('/api/entitiesAPI/entities'),
          fetch(
            `/api/entitiesAPI/segments?startDate=${startStr}&endDate=${endStr}`
          )
        ]);
        if (!eRes.ok || !sRes.ok) throw new Error('Error fetching');
        setEntities(await eRes.json());
        setSegments(await sRes.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentMonth]);

  const changeMonth = offset =>
    setCurrentMonth(d => {
      const m = new Date(d);
      m.setMonth(m.getMonth() + offset);
      return m;
    });

  const getSegs = (eid, date) =>
    segments.filter(
      seg =>
        seg.entityId === eid &&
        new Date(seg.startTime).toDateString() === date.toDateString()
    );

  // filter entities by search term
  const filteredEntities = entities.filter(ent =>
    ent.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const colWidth = `${100 / (daysOfWeek.length + 1)}%`;

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-xl shadow-sm">
        {/* Header and Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0">
          <h1 className="text-2xl font-bold text-gray-800">{monthName} Schedule</h1>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search entities..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring"
            />
            <button
              onClick={() => changeMonth(-1)}
              className="px-3 py-1.5 border rounded"
            >
              ◀
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1.5 border rounded"
            >
              Today
            </button>
            <button
              onClick={() => changeMonth(1)}
              className="px-3 py-1.5 border rounded"
            >
              ▶
            </button>
          </div>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr>
                <th style={{ width: colWidth }} className="border p-2">Entity</th>
                {daysOfWeek.map(d => (
                  <th
                    key={d}
                    style={{ width: colWidth }}
                    className="border p-2 text-center text-gray-600"
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEntities.map(ent => (
                <React.Fragment key={ent.id}>
                  {weeks.map((ws, i) => (
                    <tr key={i}>
                      {i === 0 && (
                        <td
                          rowSpan={4}
                          style={{ width: colWidth }}
                          className="border p-2 font-medium text-gray-700 align-top"
                        >
                          {ent.name}
                        </td>
                      )}
                      {daysOfWeek.map((_, di) => {
                        const cellDate = new Date(ws);
                        cellDate.setDate(ws.getDate() + di);
                        return (
                          <td key={di} style={{ width: colWidth }} className="border p-1">
                            <div className="text-xs text-gray-500 mb-1">
                              {cellDate.getDate()}
                            </div>
                            {cellDate.getMonth() ===
                            currentMonth.getMonth() ? (
                              <CoverageBar segments={getSegs(ent.id, cellDate)} />
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
