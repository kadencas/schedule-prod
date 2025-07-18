"use client";

import React, { useState } from 'react';
import { Allotment } from "allotment";
import "allotment/dist/style.css";

import ShiftScheduler from "../shift-builder2/page";
import EmployeeTimelinePage from "../all-schedule-view-day/page2";
import App from '../high-level2/page';
import UserSchedule from '../high-level-user-3/page';
import EntityShiftsPage from "../all-entity-view-day/page";

// A smaller, sleeker, self-contained calendar component with week selection state
const MiniCalendar = ({ selectedDate, onDateSelect }) => {
  // This state controls the month/year being displayed
  const [displayDate, setDisplayDate] = useState(selectedDate || new Date());

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const currentMonth = displayDate.getMonth();
  const currentYear = displayDate.getFullYear();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    setDisplayDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setDisplayDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleDayClick = (day) => {
    // Call the parent's state update function
    onDateSelect(new Date(currentYear, currentMonth, day));
  };

  // Calculate the start and end of the week for the selected date
  let startOfWeek = null;
  let endOfWeek = null;
  if (selectedDate) {
    startOfWeek = new Date(selectedDate);
    const dayOfWeek = startOfWeek.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    // Adjust to make Monday the first day of the week
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
  }

  return (
    <div className="p-3 flex flex-col w-60">
      <div className="flex items-center justify-between mb-2">
        <button onClick={handlePrevMonth} className="p-1 rounded-full hover:bg-zinc-100 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h3 className="font-semibold text-zinc-700 text-sm">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <button onClick={handleNextMonth} className="p-1 rounded-full hover:bg-zinc-100 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 mt-1 text-center text-xs flex-grow">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`}></div>)}
        {Array.from({ length: daysInMonth }).map((_, day) => {
          const dayNumber = day + 1;
          const today = new Date();
          const currentDate = new Date(currentYear, currentMonth, dayNumber);
          
          const isToday = today.toDateString() === currentDate.toDateString();
          const isSelected = selectedDate && selectedDate.toDateString() === currentDate.toDateString();
          const isInSelectedWeek = selectedDate && currentDate >= startOfWeek && currentDate <= endOfWeek;

          // Determine the styling for the day
          let dayClasses = 'w-6 h-6 flex items-center justify-center rounded-full transition-colors cursor-pointer';
          if (isSelected) {
            dayClasses += ' bg-blue-600 text-white font-semibold';
          } else if (isInSelectedWeek) {
            dayClasses += ' bg-blue-100 text-blue-800';
            if (isToday) {
              dayClasses += ' ring-1 ring-blue-500'; // Highlight today within the selected week
            }
          } else if (isToday) {
            dayClasses += ' bg-zinc-200 text-zinc-800'; // Today, when its week is not selected
          } else {
            dayClasses += ' text-zinc-600 hover:bg-zinc-100'; // Default
          }

          return (
            <div key={dayNumber} className="flex justify-center items-center" onClick={() => handleDayClick(dayNumber)}>
              <div className={dayClasses}>
                {dayNumber}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


export default function CombinedPage() {
  const [viewMode, setViewMode] = useState('employee');
  // State for the selected date, managed by the parent component
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="h-screen bg-zinc-100 p-2">
      <Allotment vertical defaultSizes={[30, 70]}>
        <Allotment.Pane>
          <Allotment defaultSizes={[15, 42.5, 42.5]}>
            <Allotment.Pane minSize={100}>
               <div className="h-full w-full flex items-center justify-center bg-white rounded-lg shadow-sm border border-zinc-200 m-2">
                {/* Pass state and handler to the calendar */}
                <MiniCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
              </div>
            </Allotment.Pane>
            <Allotment.Pane minSize={100}>
              <div className="h-full overflow-auto bg-white rounded-lg shadow-sm border border-zinc-200 m-2">
                <App date = {selectedDate}/>
              </div>
            </Allotment.Pane>
            <Allotment.Pane minSize={100}>
              <div className="h-full overflow-auto bg-white rounded-lg shadow-sm border border-zinc-200 m-2">
                <UserSchedule date = {selectedDate}/>
              </div>
            </Allotment.Pane>
          </Allotment>
        </Allotment.Pane>
        <Allotment.Pane>
          <Allotment vertical defaultSizes={[75, 25]}>
            <Allotment.Pane minSize={100}>
              <div className="h-full overflow-auto bg-white rounded-lg shadow-sm border border-zinc-200 m-2">
                <ShiftScheduler />
              </div>
            </Allotment.Pane>
            <Allotment.Pane minSize={100}>
              <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-zinc-200 m-2">
                <div className="p-2 flex justify-center items-center bg-zinc-50 border-b border-zinc-200">
                   <div className="bg-zinc-200 p-1 rounded-lg flex space-x-1">
                      <button
                        onClick={() => setViewMode('employee')}
                        className={`px-4 py-1 text-sm font-medium rounded-md transition-all duration-200 ease-in-out ${
                          viewMode === 'employee' 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'bg-transparent text-zinc-600 hover:bg-zinc-300/50'
                        }`}
                      >
                        Employee View
                      </button>
                      <button
                        onClick={() => setViewMode('entity')}
                        className={`px-4 py-1 text-sm font-medium rounded-md transition-all duration-200 ease-in-out ${
                          viewMode === 'entity' 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'bg-transparent text-zinc-600 hover:bg-zinc-300/50'
                        }`}
                      >
                        Entity View
                      </button>
                   </div>
                </div>
                <div className="flex-grow overflow-auto">
                  {viewMode === 'employee' ? <EmployeeTimelinePage selectedDate = {selectedDate}/> : <EntityShiftsPage />}
                </div>
              </div>
            </Allotment.Pane>
          </Allotment>
        </Allotment.Pane>
      </Allotment>
    </div>
  );
}