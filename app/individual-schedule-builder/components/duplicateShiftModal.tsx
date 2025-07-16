"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { FaTimes } from 'react-icons/fa';
import ReactDOM from 'react-dom';
import { RRule, RRuleSet, rrulestr } from 'rrule'

interface DuplicateShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: DuplicateParams) => void;
  shiftDate: Date;
}

export interface DuplicateParams {
  startDate: string;
  endDate: string;
  pattern: {
    type: 'daily' | 'weekly';
    days?: string[];
  };
  conflictPolicy: 'overwrite' | 'skip';
}

const toInputDate = (date: Date) => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
};

const WEEK_DAYS = { MO: 'Mon', TU: 'Tue', WE: 'Wed', TH: 'Thu', FR: 'Fri', SA: 'Sat', SU: 'Sun' };
const RRuleWeekdays = { MO: RRule.MO, TU: RRule.TU, WE: RRule.WE, TH: RRule.TH, FR: RRule.FR, SA: RRule.SA, SU: RRule.SU };


export const DuplicateShiftModal: React.FC<DuplicateShiftModalProps> = ({ isOpen, onClose, onSubmit, shiftDate }) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  
  const [startDate, setStartDate] = useState(toInputDate(shiftDate));
  const [endDate, setEndDate] = useState('');
  const [patternType, setPatternType] = useState<'daily' | 'weekly'>('weekly');
  const [weeklyDays, setWeeklyDays] = useState<Record<string, boolean>>({ MO: true, TU: false, WE: false, TH: false, FR: false, SA: false, SU: false });
  const [conflictPolicy, setConflictPolicy] = useState<'overwrite' | 'skip'>('skip');
  const [error, setError] = useState('');

  const summary = useMemo(() => {
    if (!startDate || !endDate || new Date(endDate) <= new Date(startDate)) {
      return null;
    }

    try {
      const selectedDays = Object.keys(RRuleWeekdays)
                                .filter(day => weeklyDays[day as keyof typeof weeklyDays])
                                .map(day => RRuleWeekdays[day as keyof typeof RRuleWeekdays]);

      if (patternType === 'weekly' && selectedDays.length === 0) {
        return null;
      }
      
      const rule = new RRule({
        freq: patternType === 'daily' ? RRule.DAILY : RRule.WEEKLY,
        dtstart: new Date(`${startDate}T00:00:00Z`),
        until: new Date(`${endDate}T23:59:59Z`),
        byweekday: patternType === 'weekly' ? selectedDays : undefined,
      });

      const allDates = rule.all();
      const count = allDates.length;

      if (count === 0) return null;

      const formatDate = (dateStr: string) => new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

      return {
        count,
        formattedStart: formatDate(startDate),
        formattedEnd: formatDate(endDate),
      };
    } catch (e) {
      console.error("Error calculating RRule:", e);
      return null;
    }
  }, [startDate, endDate, patternType, weeklyDays]);

  const handleDayToggle = (day: string) => {
    setWeeklyDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const handleSubmit = () => {
    setError('');
    // Validation
    if (!startDate || !endDate) {
      setError('Please select both a start and end date.');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
        setError('End date must be after the start date.');
        return;
    }
    const selectedDays = Object.keys(weeklyDays).filter(day => weeklyDays[day]);
    if (patternType === 'weekly' && selectedDays.length === 0) {
      setError('Please select at least one day for the weekly pattern.');
      return;
    }
    
    // Submit data
    onSubmit({
      startDate,
      endDate,
      pattern: {
        type: patternType,
        ...(patternType === 'weekly' && { days: selectedDays }),
      },
      conflictPolicy,
    });
  };
  
  if (!isOpen || !isClient) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Duplicate Shift</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Repeat</label>
            <div className="flex gap-2 mb-3">
                <button onClick={() => setPatternType('daily')} className={`px-4 py-2 text-sm rounded-md transition ${patternType === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Daily</button>
                <button onClick={() => setPatternType('weekly')} className={`px-4 py-2 text-sm rounded-md transition ${patternType === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Weekly</button>
            </div>
            {patternType === 'weekly' && (
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                    {Object.entries(WEEK_DAYS).map(([key, label]) => (
                        <button key={key} onClick={() => handleDayToggle(key)} className={`flex-1 text-center text-xs font-bold py-2 rounded-md transition ${weeklyDays[key] ? 'bg-blue-500 text-white shadow' : 'hover:bg-gray-200'}`}>{label}</button>
                    ))}
                </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">If a shift already exists:</label>
            <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="conflictPolicy" value="skip" checked={conflictPolicy === 'skip'} onChange={() => setConflictPolicy('skip')} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"/>
                    <span>Skip that day</span>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="conflictPolicy" value="overwrite" checked={conflictPolicy === 'overwrite'} onChange={() => setConflictPolicy('overwrite')} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"/>
                    <span>Overwrite the existing shift</span>
                </label>
            </div>
          </div>
        </div>
        
        {summary && (
            <div className="px-6 pb-4">
                <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm text-center">
                    This will create approximately <strong>{summary.count} shifts</strong> between <br/> {summary.formattedStart} and {summary.formattedEnd}.
                </div>
            </div>
        )}

        <div className="px-6 pb-4">
            {error && <p className="text-red-600 text-sm text-center mb-3">{error}</p>}
            <div className="flex gap-3 justify-end">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">Cancel</button>
              <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">Duplicate</button>
            </div>
        </div>
      </div>
    </div>,
    document.body
  );
};