"use client";
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "react-big-calendar";
import { format, addMonths, subMonths } from "date-fns";
import { Employee } from "@/types/types";
import dynamic from "next/dynamic";
import { RRule } from "rrule";

import "@/app/styles/calendar.css";

const ScheduleBuilderComponent = dynamic(() => import("../individual-schedule-builder/page"), { ssr: false });

interface MyScheduleTabProps {
  employeeData: Employee | null;
  userName: string;
  localizer: any;
}

// Helper to check if two dates are the same day (ignoring time)
const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
};

const CustomDateHeader = ({ label, date, isOffRange, selectedDate }: { label: string; date: Date; isOffRange: boolean; selectedDate: Date }) => {
  if (isOffRange) return <div className="rbc-date-cell-content-off-range">{label}</div>;

  const isSelected = isSameDay(date, selectedDate);

  return (
    <div className="relative w-full h-full flex items-center justify-center group mb-1">
      <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 ${isSelected ? 'bg-blue-500 text-white font-bold' : 'group-hover:bg-gray-100'}`}>
        <span>{label}</span>
      </div>

      {/* 1. Changed opacity-20 to opacity-40 to make it less faint */}
      <div className={`absolute top-1 left-1 opacity-40 group-hover:opacity-100 transition-opacity duration-200 z-10 ${isSelected ? 'hidden' : ''}`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          // 2. Changed text-gray-400 to a darker text-gray-500
          className="h-3.5 w-3.5 text-gray-500 group-hover:text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />
        </svg>
      </div>
    </div>
  );
};

export default function MyScheduleTab({ employeeData, userName, localizer }: MyScheduleTabProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const today = new Date();

  const [viewDate, setViewDate] = useState(new Date());
  const handleSelectSlot = (slotInfo: { start: Date }) => {
    setSelectedDate(slotInfo.start);
  };

  const calendarEvents = useMemo(() => {
    if (!employeeData?.shifts) return [];

    interface CalendarEvent {
      title: string;
      start: Date;
      end: Date;
      resource: string;
    }

    const sortedShifts = [...employeeData.shifts].sort((a, b) => {
      if (a.isRecurring === b.isRecurring) return 0;
      return a.isRecurring ? 1 : -1;
    });

    const events: CalendarEvent[] = [];
    const takenDays = new Set<string>();
    const calendarStart = new Date();
    calendarStart.setDate(1);
    const calendarEnd = addMonths(calendarStart, 3);

    const pushIfFree = (start: Date, end: Date, segCount = 0) => {
      const dayKey = start.toISOString().slice(0, 10);
      if (takenDays.has(dayKey)) return;
      takenDays.add(dayKey);
      events.push({
        title: `Shift: ${format(start, "h:mm a")} - ${format(end, "h:mm a")}`,
        start,
        end,
        resource: segCount ? `${segCount} activities` : "No activities",
      });
    };

    sortedShifts.forEach(shift => {
      if (!shift.isRecurring || !shift.recurrenceRule) {
        pushIfFree(new Date(shift.startTime), new Date(shift.endTime), shift.segments?.length ?? 0);
        return;
      }
      try {
        const startTmpl = new Date(shift.startTime);
        const duration = new Date(shift.endTime).getTime() - startTmpl.getTime();
        const rule = RRule.fromString(shift.recurrenceRule);
        const occurrences = rule.between(calendarStart, calendarEnd, true);
        occurrences.forEach(date => {
          const eventStart = new Date(date);
          eventStart.setHours(startTmpl.getHours(), startTmpl.getMinutes(), startTmpl.getSeconds());
          const eventEnd = new Date(eventStart.getTime() + duration);
          pushIfFree(eventStart, eventEnd, shift.segments?.length ?? 0);
        });
      } catch (err) {
        console.error("Error processing recurring shift:", err);
      }
    });

    return events;
  }, [employeeData?.shifts]);

  // --- NEW: A memoized components object that has access to the selectedDate state ---
  // This is passed to the Calendar to customize rendering of the date headers.
  const components = useMemo(() => ({
    month: {
      dateHeader: (headerProps: { label: string; date: Date; isOffRange: boolean; }) => (
        <CustomDateHeader
          {...headerProps}
          selectedDate={selectedDate}
        />
      ),
    },
  }), [selectedDate]); // This hook re-runs only when selectedDate changes.

  if (!employeeData) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-md p-4 text-white mb-4"
      >
        <h1 className="text-2xl font-semibold">Hi, {userName.split(' ')[0]}</h1>
        <p className="opacity-80 text-sm">{format(today, "EEEE, MMM d")}</p>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key="calendar"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-sm border p-2"
        >

          <div className="flex items-center justify-between mb-2">
            <button onClick={() => setViewDate(d => subMonths(d, 1))}>‹</button>
            <h2 className="text-lg font-semibold">
              {format(viewDate, "MMMM yyyy")}
            </h2>
            <button onClick={() => setViewDate(d => addMonths(d, 1))}>›</button>
          </div>

          <div className="calendar-container" style={{ height: 400 }}>
            <Calendar
              localizer={localizer}
              date={viewDate} // 1. FIX: Control the calendar's view with `viewDate`
              onNavigate={setViewDate} // 2. FIX: Update `viewDate` on calendar navigation events
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              views={["month"]}
              popup
              selectable
              onSelectSlot={handleSelectSlot}
              className="modern-calendar"
              components={components}
              toolbar={false}
            />
          </div>
        </motion.div>

        <motion.div
          key="builder"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <ScheduleBuilderComponent selectedDate={selectedDate} showHeader={false} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}