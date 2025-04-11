"use client";
import React, { useEffect, useState, useRef } from "react";
import WeekDayToggle from "./components/weekDayToggle";
import Timeline from "./components/timeline";
import { useShiftManagement } from "./hooks/useShiftManagement";
import { useUserShifts } from "./hooks/useUserShift";
import {
  defaultSelectedDay,
  formatMondayDate,
  getMostRecentMonday,
  getNextWeekMonday,
  getPreviousWeekMonday,
} from "./helper/helper";
import { useSession } from "next-auth/react";
import { Shift } from "@/types/types";
import { useEntities } from "./hooks/useEntities";
import { motion } from "framer-motion";
import { FiCalendar, FiGrid, FiInfo, FiPlus } from "react-icons/fi";

const TimelineHeader = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    
    window.addEventListener('resize', updateWidth);
    
    return () => {
      window.removeEventListener('resize', updateWidth);
    };
  }, []);
  
  const numTicks = Math.floor(containerWidth / 25) + 2;
  
  return (
    <div className="relative overflow-visible flex items-stretch h-6">
      <div className="w-[75px] flex-shrink-0 pr-1"></div>
      
      <div 
        ref={containerRef} 
        className="flex-1 relative h-6 overflow-visible"
      >
        {Array.from({ length: numTicks }).map((_, i) => {
          const leftPos = i * 25;
          const isMajorTick = i % 4 === 0;
          
          if (isMajorTick) {
            const hour = Math.floor(i / 4) + 9; 
            const displayHour = hour > 12 ? hour - 12 : hour;
            const amPm = hour >= 12 ? 'PM' : 'AM';
            const hourLabel = `${displayHour}${amPm}`;
            
            return (
              <div key={i}>
                <div
                  className="absolute w-[1px] h-2 bg-blue-400/40 bottom-0"
                  style={{ left: leftPos - 75 }}
                />
                <div
                  className="absolute transform -translate-x-1/2 text-[10px] text-gray-500 font-medium"
                  style={{ 
                    left: leftPos - 75,
                    top: '0px',
                  }}
                >
                  {hourLabel}
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default function Page() {
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [currentMonday, setCurrentMonday] = useState<Date>(getMostRecentMonday(new Date()));
  const [selectedDay, setSelectedDay] = useState<string>(defaultSelectedDay);
  const grid_height = 100;
  const [userShifts, setUserShifts] = useState<Shift[]>([]);
  const readOnly = false;
  const { data: session } = useSession();
  const { entities: entities } = useEntities();
  const [isMounted, setIsMounted] = useState(false);

  // returns an object and renames userShifts fetchedUser shifts to indicate they were pulled from backend
  const { userShifts: fetchedUserShifts } = useUserShifts(); 

  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * anytime fetchedUserShifts changes (backend changes), update the array
   */
  useEffect(() => {
    if (fetchedUserShifts) {
      setUserShifts(fetchedUserShifts);
    }
  }, [fetchedUserShifts]);

  /**
   * takes shift ID for shift to update, and some updated data,
   * looks at userShifts array and updates the corresponding data
   */
  function handleShiftChangesSaved(shiftId: string, updatedData: Partial<Shift>) {
    setUserShifts((prevShifts) =>
      prevShifts.map((shift) =>
        shift.id === shiftId
          ? { ...shift, ...updatedData }
          : shift
      )
    );
  }

  /**
   * Handles user clicking previous week button
   * Sets currentMonday to previous week's monday
   */
  const handlePreviousWeek = () => {
    setCurrentMonday(getPreviousWeekMonday(currentMonday));
  };

  /**
   * Handles user clicking next week button
   * Sets currentMonday to next week's monday
   */
  const handleNextWeek = () => {
    setCurrentMonday(getNextWeekMonday(currentMonday));
  };

  const formattedMondayDate = formatMondayDate(currentMonday);

  /**
   * Creates a new shift using the API endpoint.
   * The new shift uses the selected day (e.g., "Friday") added to the currentMonday date.
   * Default times: Start at 9:00 AM, End at 5:00 PM.
   * The userId is retrieved from the session.
   */
  const handleAddShift = async () => {
    if (!session || !session.user) {
      console.error("User not authenticated");
      return;
    }

    // Map weekday names to their offset from Monday (0 = Monday, 1 = Tuesday, etc.)
    const dayOffsets: { [key: string]: number } = {
      Monday: 0,
      Tuesday: 1,
      Wednesday: 2,
      Thursday: 3,
      Friday: 4,
      Saturday: 5,
      Sunday: 6,
    };

    const offset = dayOffsets[selectedDay];
    if (offset === undefined) {
      console.error("Invalid selected day:", selectedDay);
      return;
    }

    // Compute the correct shift date by adding the offset to currentMonday.
    const shiftDateObj = new Date(currentMonday);
    shiftDateObj.setDate(shiftDateObj.getDate() + offset);

    // Set default start time at 9:00 AM.
    const startTime = new Date(shiftDateObj);
    startTime.setHours(9, 0, 0, 0);

    // Set default end time at 5:00 PM.
    const endTime = new Date(shiftDateObj);
    endTime.setHours(17, 0, 0, 0);

    // Use the authenticated user's id from the session.
    const userId = session.user.id;

    // Convert Date objects to ISO strings for the API
    const shiftData = {
      userId,
      shiftDate: shiftDateObj.toISOString(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      isRecurring: false,
      recurrenceRule: null,
      recurrenceEndDate: null,
      notes: "",
      entity: null,
    };

    try {
      const response = await fetch("/api/shifts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shiftData),
      });

      if (!response.ok) {
        throw new Error("Failed to create shift");
      }
      const data = await response.json();

      const createdShift = data.shift;
      const newShift: Shift = {
        id: createdShift.id,
        userId: createdShift.userId,
        shiftDate: new Date(createdShift.shiftDate).toISOString(),
        startTime: new Date(createdShift.startTime),
        endTime: new Date(createdShift.endTime),
        isRecurring: createdShift.isRecurring,
        recurrenceRule: createdShift.recurrenceRule,
        segments: createdShift.segments || [],
      };

      setUserShifts((prevShifts) => [...prevShifts, newShift]);

    } catch (error) {
      console.error("Error creating shift:", error);
    }
  };

  console.log("shifts for processing", userShifts)
  /**
   * Process shifts and segments for the Timeline component.
   */
  const {
    shiftSegments,
    matchingShift,
    shiftStartTime,
    shiftEndTime,
    initialX,
    initialWidth,
    selectedDate,
    newSegmentLabel,
    setNewSegmentLabel,
    newSegmentStart,
    setNewSegmentStart,
    newSegmentEnd,
    setNewSegmentEnd,
    newSegmentColor,
    setNewSegmentColor,
    handleCreateSegment,
  } = useShiftManagement(userShifts, currentMonday, selectedDay);

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.3 } }
  };

  return (
    <motion.div 
      className="w-full h-screen bg-gray-50 overflow-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Simplified Header */}
      <motion.div 
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 shadow-sm"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-lg font-medium flex items-center">
            <FiCalendar className="mr-2" />
            Schedule Builder
          </h1>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 py-3">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate={isMounted ? "visible" : "hidden"}
          className="flex flex-col"
        >
          {/* Week Navigation */}
          <motion.div variants={itemVariants} className="bg-white rounded-lg rounded-b-none shadow-sm p-3 border border-b-0 border-gray-100">
            <h2 className="text-lg font-bold mb-3">Day Selector & Editor</h2>
            <WeekDayToggle
              currentMonday={currentMonday}
              formattedMondayDate={formattedMondayDate}
              handlePreviousWeek={handlePreviousWeek}
              handleNextWeek={handleNextWeek}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
            />
          </motion.div>

          {/* Main Layout with Timeline and Shift Menu */}
          <div className="flex flex-col md:flex-row">
            {/* Timeline Section - Minimalistic */}
            <motion.div 
              variants={itemVariants}
              className="flex-grow bg-white rounded-lg rounded-t-none shadow-sm p-3 border border-t-0 border-gray-100 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {!matchingShift && (
                    <motion.button
                      onClick={handleAddShift}
                      whileHover={{ backgroundColor: '#3b82f6', y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-center px-3 py-1.5 rounded-md 
                        bg-blue-500 text-white font-medium text-sm transition-all"
                    >
                      <FiPlus className="mr-1.5" size={14} />
                      Add Shift
                    </motion.button>
                  )}
                </div>
              </div>
              
              <div className="relative">
                <div className="ml-2">
                  <TimelineHeader />
                </div>
                <div className="ml-2">
                  <Timeline
                    snapToGrid={snapToGrid}
                    shiftSegments={shiftSegments}
                    matchingShift={matchingShift}
                    initialX={initialX}
                    initialWidth={initialWidth}
                    shiftStartTime={shiftStartTime}
                    shiftEndTime={shiftEndTime}
                    gridHeight={grid_height}
                    readOnly={readOnly}
                    onShiftSave={handleShiftChangesSaved}
                    entities={entities}
                    selectedDay={selectedDay}
                    user={session?.user?.name || "Anonymous User"}
                    selectedDate={selectedDate}
                  />
                </div>
                
                {!matchingShift && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="absolute inset-0 flex items-center justify-center text-center"
                  >
                    <div className="max-w-md p-4">
                      <div className="bg-blue-50 rounded-full w-10 h-10 mx-auto flex items-center justify-center mb-2">
                        <FiInfo className="text-blue-400" size={18} />
                      </div>
                      <h3 className="font-medium text-gray-600 text-sm">No shift on {selectedDay}</h3>
                      <p className="text-gray-400 text-xs mt-1">
                        Use the "Add Shift" button to create one
                      </p>
                    </div>
                  </motion.div>
                )}
                
                <div className="flex justify-end mt-3">
                  <div 
                    onClick={() => setSnapToGrid(!snapToGrid)}
                    className="flex items-center cursor-pointer gap-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded-full transition-colors"
                  >
                    <div className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                      snapToGrid ? 'bg-blue-500' : 'bg-gray-200'
                    }`}>
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          snapToGrid ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </div>
                    <span>{snapToGrid ? "Snap" : "Free"}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
