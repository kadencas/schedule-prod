"use client"

import React, { useState, useEffect, useMemo } from 'react';

// --- Helper Functions ---

/**
 * Converts a Date object to a percentage of a 24-hour day.
 */
const dateToDayPercentage = (date) => {
  if (!date) return 0;
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  return (totalMinutes / (24 * 60)) * 100;
};

/**
 * Merges overlapping or adjacent time segments into continuous blocks.
 */
const mergeSegments = (segments) => {
  if (!segments || segments.length === 0) {
    return [];
  }
  const sortedSegments = [...segments].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  const merged = [JSON.parse(JSON.stringify(sortedSegments[0]))]; // Deep copy
  for (let i = 1; i < sortedSegments.length; i++) {
    const current = sortedSegments[i];
    const lastMerged = merged[merged.length - 1];
    if (new Date(current.startTime) <= new Date(lastMerged.endTime)) {
      lastMerged.endTime = new Date(Math.max(new Date(lastMerged.endTime), new Date(current.endTime)));
    } else {
      merged.push(JSON.parse(JSON.stringify(current)));
    }
  }
  return merged;
};

/**
 * CoverageBar renders segments as ovals with markers.
 */
const CoverageBar = ({ segments, barColor = 'bg-gray-200', height = 'h-6' }) => {
  const sortedSegments = useMemo(() => {
    if (!segments) return [];
    return [...segments].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [segments]);

  const nineAmPos = (9 / 24) * 100;
  const ninePmPos = (21 / 24) * 100;

  const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="relative w-full">
      <div className={`relative w-full ${height} ${barColor} rounded-md`}>
        <div
          className="absolute top-0 bottom-0 w-px bg-gray-400/75"
          style={{ left: `${nineAmPos}%` }}
          title="9:00 AM"
        />
        <div
          className="absolute top-0 bottom-0 w-px bg-gray-400/75"
          style={{ left: `${ninePmPos}%` }}
          title="9:00 PM"
        />

        {sortedSegments.map((segment) => {
          const startPercent = dateToDayPercentage(new Date(segment.startTime));
          const endPercent = dateToDayPercentage(new Date(segment.endTime));
          const widthPercent = endPercent - startPercent;
          if (widthPercent <= 0) return null;
          return (
            <div
              key={segment.id}
              className={`absolute ${height} rounded-md`}
              style={{ left: `${startPercent}%`, width: `${widthPercent}%`, backgroundColor: segment.color || '#3B82F6' }}
              title={`Time: ${formatTime(segment.startTime)} - ${formatTime(segment.endTime)}`}
            />
          );
        })}
      </div>
      <div className="relative w-full h-4 mt-1">
        <div className="absolute top-0 transform -translate-x-1/2 text-[10px] text-gray-500" style={{ left: `${nineAmPos}%` }}>9am</div>
        <div className="absolute top-0 transform -translate-x-1/2 text-[10px] text-gray-500" style={{ left: `${ninePmPos}%` }}>9pm</div>
      </div>
    </div>
  );
};

/**
 * ScheduleHeader with week navigation
 */
const ScheduleHeader = ({ currentDate, onPrevWeek, onNextWeek, onToday }) => {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  const options = { month: 'long', day: 'numeric' };
  const dateRange = `${startOfWeek.toLocaleDateString(undefined, options)} - ${endOfWeek.toLocaleDateString(undefined, options)}, ${endOfWeek.getFullYear()}`;

  return (
    <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Weekly Coverage Schedule</h1>
        <p className="text-gray-500">{dateRange}</p>
      </div>
      <div className="mt-4 sm:mt-0 flex items-center space-x-2">
        <button onClick={onPrevWeek} className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100">&lt;</button>
        <button onClick={onToday} className="px-4 py-1.5 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100">Today</button>
        <button onClick={onNextWeek} className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100">&gt;</button>
      </div>
    </div>
  );
};

export default function App() {
  const [entities, setEntities] = useState([]);
  const [segments, setSegments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchScheduleData = async () => {
      setIsLoading(true);
      setError(null);
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1));
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      const startDateString = startOfWeek.toISOString().split('T')[0];
      const endDateString = endOfWeek.toISOString().split('T')[0];

      try {
        const [entitiesRes, segmentsRes] = await Promise.all([
          fetch('/api/entitiesAPI/entities'),
          fetch(`/api/entitiesAPI/segments?startDate=${startDateString}&endDate=${endDateString}`)
        ]);
        if (!entitiesRes.ok || !segmentsRes.ok) throw new Error('Failed to fetch schedule data');
        setEntities(await entitiesRes.json());
        setSegments(await segmentsRes.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchScheduleData();
  }, [currentDate]);

  const getSegmentsForEntityAndDay = (entityId, dayIndex) => {
    const jsDayIndex = (dayIndex + 1) % 7;
    return segments.filter(seg => seg.entityId === entityId && new Date(seg.startTime).getDay() === jsDayIndex);
  };

  const handlePrevWeek = () => setCurrentDate(d => new Date(d.setDate(d.getDate() - 7)));
  const handleNextWeek = () => setCurrentDate(d => new Date(d.setDate(d.getDate() + 7)));
  const handleToday = () => setCurrentDate(new Date());

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Filter entities by search term
  const filteredEntities = entities.filter(entity =>
    entity.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <ScheduleHeader
          currentDate={currentDate}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          onToday={handleToday}
        />

        <div className="bg-white p-6 rounded-xl shadow-sm">
          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search entities..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring"
            />
          </div>

          <div className="grid grid-cols-9 gap-4 mb-4 border-b pb-4">
            <div className="col-span-2 font-semibold text-gray-600">Entity</div>
            {weekDays.map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 col-span-1">{day}</div>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center p-12 text-gray-500">Loading schedule...</div>
          ) : error ? (
            <div className="text-center p-12 text-red-500">Error: {error}</div>
          ) : (
            <div className="space-y-6">
              {filteredEntities.length > 0 ? (
                filteredEntities.map(entity => (
                  <div key={entity.id} className="grid grid-cols-9 gap-4 items-center">
                    <div className="col-span-2 text-sm font-medium text-gray-700">{entity.name}</div>
                    {weekDays.map((day, idx) => (
                      <div key={day} className="col-span-1 w-full">
                        <CoverageBar segments={getSegmentsForEntityAndDay(entity.id, idx)} />
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-12">No entities match your search.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
