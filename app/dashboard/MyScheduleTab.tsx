"use client";
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "react-big-calendar";
import { format, addDays, isToday, isTomorrow, differenceInMinutes, isAfter, isBefore, addMonths } from "date-fns";
import { Employee } from "@/types/types";
import dynamic from "next/dynamic";
import { 
  FiClock, 
} from "react-icons/fi";
import { RRule } from "rrule";

const ScheduleBuilderComponent = dynamic(() => import("../individual-schedule-builder/page"), { ssr: false });

interface MyScheduleTabProps {
  employeeData: Employee | null;
  userName: string;
  localizer: any;
}

export default function MyScheduleTab({ employeeData, userName, localizer }: MyScheduleTabProps) {
  const [showNextShifts, setShowNextShifts] = useState(true);

  const today = new Date();
  
  const todaysShift = employeeData?.shifts?.find((shift) => {
    const shiftStart = new Date(shift.startTime);
    return shiftStart.toDateString() === today.toDateString();
  });

  const nextShift = useMemo(() => {
    if (!employeeData?.shifts) return null;
    
    return employeeData.shifts
      .filter(shift => {
        const shiftStart = new Date(shift.startTime);
        return (isToday(shiftStart) && isAfter(shiftStart, today)) || isAfter(shiftStart, today);
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
  }, [employeeData?.shifts, today]);

  const isCurrentlyWorking = useMemo(() => {
    if (!todaysShift) return false;
    const shiftStart = new Date(todaysShift.startTime);
    const shiftEnd = new Date(todaysShift.endTime);
    return isBefore(shiftStart, today) && isAfter(shiftEnd, today);
  }, [todaysShift, today]);

  const currentShiftTime = todaysShift
    ? `${format(new Date(todaysShift.startTime), "h:mm a")} - ${format(
        new Date(todaysShift.endTime),
        "h:mm a"
      )}`
    : "Off today";
  
  const timeRemainingInShift = useMemo(() => {
    if (!isCurrentlyWorking || !todaysShift) return null;
    const shiftEnd = new Date(todaysShift.endTime);
    const minutesRemaining = differenceInMinutes(shiftEnd, today);
    const hours = Math.floor(minutesRemaining / 60);
    const minutes = minutesRemaining % 60;
    return { hours, minutes };
  }, [isCurrentlyWorking, todaysShift, today]);

  const formatNextShiftDate = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE, MMM d");
  };

  const upcomingShifts = useMemo(() => {
    if (!employeeData?.shifts) return [];
    
    return employeeData.shifts
    .filter((shift) => {
      const shiftDate = new Date(shift.startTime);
      return (
          ((isToday(shiftDate) && !isCurrentlyWorking) || isAfter(shiftDate, today)) &&
          isBefore(shiftDate, addDays(today, 7))
        );
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 5) 
    .map((shift) => ({
        date: formatNextShiftDate(new Date(shift.startTime)),
        day: format(new Date(shift.startTime), "EEE"),
        fullDate: new Date(shift.startTime),
      shift: `${format(new Date(shift.startTime), "h:mm a")} - ${format(
        new Date(shift.endTime),
        "h:mm a"
      )}`,
        segments: shift.segments || [],
        duration: differenceInMinutes(new Date(shift.endTime), new Date(shift.startTime)) / 60
      }));
  }, [employeeData?.shifts, today, isCurrentlyWorking]);

  const calendarEvents = useMemo(() => {
    if (!employeeData?.shifts) return [];
    
    interface CalendarEvent {
      title: string;
      start: Date;
      end: Date;
      resource: string;
    }
    
    let events: CalendarEvent[] = [];
    
    const calendarStart = new Date();
    calendarStart.setDate(1); 
    const calendarEnd = addMonths(calendarStart, 3); 
    
    employeeData.shifts.forEach((shift) => {
      if (!shift.isRecurring || !shift.recurrenceRule) {
        events.push({
          title: `Shift: ${format(new Date(shift.startTime), "h:mm a")} - ${format(
            new Date(shift.endTime),
            "h:mm a"
          )}`,
          start: new Date(shift.startTime),
          end: new Date(shift.endTime),
          resource: shift.segments && shift.segments.length > 0 
            ? `${shift.segments.length} activities` 
            : "No activities"
        });
        return;
      }
      
      try {
        const shiftStartTime = new Date(shift.startTime);
        const shiftEndTime = new Date(shift.endTime);
        
        const shiftDuration = shiftEndTime.getTime() - shiftStartTime.getTime();
        
        const rule = RRule.fromString(shift.recurrenceRule);
        
        const occurrences = rule.between(calendarStart, calendarEnd, true);
        
        occurrences.forEach(date => {
          const eventStart = new Date(date);
          eventStart.setHours(
            shiftStartTime.getHours(),
            shiftStartTime.getMinutes(),
            shiftStartTime.getSeconds()
          );
          
          const eventEnd = new Date(eventStart.getTime() + shiftDuration);
          
          events.push({
            title: `Shift: ${format(eventStart, "h:mm a")} - ${format(eventEnd, "h:mm a")}`,
            start: eventStart,
            end: eventEnd,
            resource: shift.segments && shift.segments.length > 0 
              ? `${shift.segments.length} activities` 
              : "No activities"
          });
        });
      } catch (error) {
        console.error("Error processing recurring shift:", error);
        events.push({
          title: `Shift: ${format(new Date(shift.startTime), "h:mm a")} - ${format(
            new Date(shift.endTime),
            "h:mm a"
          )}`,
          start: new Date(shift.startTime),
          end: new Date(shift.endTime),
          resource: shift.segments && shift.segments.length > 0 
            ? `${shift.segments.length} activities` 
            : "No activities"
        });
      }
    });
    
    return events;
  }, [employeeData?.shifts]);

  const thisWeekHours = useMemo(() => {
    if (!employeeData?.shifts) return 0;
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); 
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); 
    endOfWeek.setHours(23, 59, 59, 999);
    
    return employeeData.shifts
      .filter(shift => {
        const shiftStart = new Date(shift.startTime);
        return shiftStart >= startOfWeek && shiftStart <= endOfWeek;
      })
      .reduce((total, shift) => {
        const start = new Date(shift.startTime);
        const end = new Date(shift.endTime);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return total + hours;
      }, 0);
  }, [employeeData?.shifts, today]);
  
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
          
          <div className="mt-4 md:mt-0 flex items-center bg-white/10 rounded-lg px-4 py-2 backdrop-blur-sm">
            <FiClock className="mr-2 text-white/80" />
            <div>
              <p className="text-sm font-medium">This Week's Hours</p>
              <p className="text-lg font-bold">{thisWeekHours.toFixed(1)}h</p>
            </div>
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
      
      <style jsx global>{`
        .modern-calendar {
          font-family: inherit;
          border: none !important;
        }
        .modern-calendar .rbc-header {
          padding: 10px 3px;
          font-weight: 500;
          font-size: 0.85rem;
          color: #4B5563;
        }
        .modern-calendar .rbc-date-cell {
          padding: 4px 5px 0;
          font-size: 0.85rem;
          color: #4B5563;
        }
        .modern-calendar .rbc-today {
          background-color: rgba(59, 130, 246, 0.05);
        }
        .modern-calendar .rbc-month-view {
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          overflow: hidden;
        }
        .modern-calendar .rbc-event {
          background-color: #3B82F6;
          border-radius: 4px;
          border: none;
          padding: 2px 5px;
          font-size: 0.75rem;
        }
        .modern-calendar .rbc-event.rbc-selected {
          background-color: #2563EB;
        }
        .modern-calendar .rbc-toolbar button {
          color: #4B5563;
          border-color: #E5E7EB;
          border-radius: 6px;
        }
        .modern-calendar .rbc-toolbar button.rbc-active {
          background-color: #3B82F6;
          color: white;
          border-color: #3B82F6;
        }
        
        /* Schedule Builder Styling */
        .schedule-builder-container {
          overflow: hidden;
          border-top: 0;
          max-height: 600px;
        }
        
        .schedule-builder-container > div {
          height: auto !important;
          padding: 0;
          overflow: auto;
        }
        
        /* Hide the original header from the schedule builder */
        .schedule-builder-container :global(.bg-gradient-to-r.from-blue-600.to-blue-700) {
          display: none;
        }
        
        /* Adjust padding and spacing for the builder content */
        .schedule-builder-container :global(.max-w-7xl) {
          padding: 0;
          margin: 0;
        }
        
        /* Remove padding from the schedule builder */
        .schedule-builder-container :global(.py-6) {
          padding-top: 0;
          padding-bottom: 0;
        }
        
        /* Remove space between elements */
        .schedule-builder-container :global(.flex.flex-col.space-y-6) {
          margin-bottom: 0;
          gap: 1rem;
          margin-top: 0;
        }
        
        /* Remove extra padding from the week toggle component */
        .schedule-builder-container :global(.bg-white.rounded-xl.shadow-sm.p-4.border.border-gray-100) {
          padding-top: 0.75rem;
          padding-bottom: 0.75rem;
        }
      `}</style>
    </div>
  );
}
