"use client";
import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "react-big-calendar";
import { format, addMonths } from "date-fns";
import { Employee } from "@/types/types";
import dynamic from "next/dynamic";
import { RRule } from "rrule";
import "@/app/styles/calendar.css"

const ScheduleBuilderComponent = dynamic(() => import("../individual-schedule-builder/page"), { ssr: false });

interface MyScheduleTabProps {
  employeeData: Employee | null;
  userName: string;
  localizer: any;
}

/**
 * MyScheduleTab is a client-side component that displays the logged-in user's schedule.
 *
 * It handles the following responsibilities:
 * - Parses the `employeeData` prop to extract and prioritize user shifts (recurring and non-recurring).
 * - Generates calendar events for use in `react-big-calendar`, showing up to 3 months ahead.
 * - Dynamically loads a secondary "ScheduleBuilder" component, which is heavier & more interactive.
 * - Applies custom styling from an external CSS file to improve calendar and layout aesthetics.
 *
 * Props:
 * @param {Employee | null} employeeData - The logged-in user's full shift data and segment info.
 * @param {string} userName - The name of the current user (used for greeting and schedule matching).
 * @param {any} localizer - A `dateFns` localizer instance used by `react-big-calendar`.
 *
 * @returns {JSX.Element} A styled dashboard tab showing the user's upcoming shifts and calendar.
 */

export default function MyScheduleTab({ employeeData, userName, localizer }: MyScheduleTabProps) {

  const today = new Date();

  /* ---------- calendarEvents: prefer individual over recurring ---------- */
  const calendarEvents = useMemo(() => {
    if (!employeeData?.shifts) return [];

    interface CalendarEvent {
      title: string;
      start: Date;
      end: Date;
      resource: string;
    }

    /* 1. sort so non‑recurring first (they get priority) */
    const sortedShifts = [...employeeData.shifts].sort((a, b) => {
      if (a.isRecurring === b.isRecurring) return 0;
      return a.isRecurring ? 1 : -1; // non‑recurring first
    });

    const events: CalendarEvent[] = [];
    const takenDays = new Set<string>();          // yyyy‑mm‑dd → already has an event

    const calendarStart = new Date();             // first of this month → +3 months
    calendarStart.setDate(1);
    const calendarEnd = addMonths(calendarStart, 3);

    /* helper to add an event only if that day is still free */
    const pushIfFree = (start: Date, end: Date, segCount = 0) => {
      const dayKey = start.toISOString().slice(0, 10); // yyyy‑mm‑dd
      if (takenDays.has(dayKey)) return;               // skip, individual already there
      takenDays.add(dayKey);

      events.push({
        title: `Shift: ${format(start, "h:mm a")} - ${format(end, "h:mm a")}`,
        start,
        end,
        resource: segCount ? `${segCount} activities` : "No activities",
      });
    };

    sortedShifts.forEach(shift => {
      /* ----- 2a.  Non‑recurring shift ----- */
      if (!shift.isRecurring || !shift.recurrenceRule) {
        const s = new Date(shift.startTime);
        const e = new Date(shift.endTime);
        pushIfFree(s, e, shift.segments?.length ?? 0);
        return;
      }

      /* ----- 2b.  Recurring shift ----- */
      try {
        const startTmpl = new Date(shift.startTime);
        const duration = new Date(shift.endTime).getTime() - startTmpl.getTime();
        const rule = RRule.fromString(shift.recurrenceRule);
        const occurrences = rule.between(calendarStart, calendarEnd, true);

        occurrences.forEach(date => {
          const eventStart = new Date(date);
          eventStart.setHours(
            startTmpl.getHours(),
            startTmpl.getMinutes(),
            startTmpl.getSeconds()
          );
          const eventEnd = new Date(eventStart.getTime() + duration);
          pushIfFree(eventStart, eventEnd, shift.segments?.length ?? 0);
        });
      } catch (err) {
        console.error("Error processing recurring shift:", err);
      }
    });

    return events;
  }, [employeeData?.shifts]);

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
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-6 p-6 text-white relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 w-64 h-64 opacity-10">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M45.7,-77.8C58.9,-69.3,69.3,-56.3,76.7,-42.1C84.1,-27.9,88.6,-13.9,87.4,-0.7C86.2,12.6,79.3,25.1,71.2,37.1C63.1,49.1,53.8,60.6,41.9,68.9C30,77.2,15,82.4,0.2,82.1C-14.7,81.8,-29.4,76,-42.5,67.4C-55.6,58.8,-67.1,47.4,-74.3,33.7C-81.6,20,-84.7,4,-82.4,-11.1C-80.1,-26.2,-72.4,-40.5,-61.6,-50.2C-50.8,-59.9,-37,-65,-24,-70.6C-11,-76.2,1.1,-82.3,14.4,-83C27.7,-83.6,41.1,-78.9,45.7,-77.8Z" transform="translate(100 100)" />
          </svg>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Hello, {userName.split(' ')[0]}
            </h1>
            <p className="opacity-90 text-sm">
              {format(today, "EEEE, MMMM d, yyyy")}
            </p>
          </div>
        </div>
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.div
          key="schedule"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6"
          >
            <div className="schedule-builder-container">
              <ScheduleBuilderComponent />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Calendar</h2>
            <div className="calendar-container" style={{ height: 500 }}>
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                views={["month", "week", "day"]}
                popup
                className="modern-calendar"
              />
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
