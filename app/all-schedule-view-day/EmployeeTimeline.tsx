import React, { useMemo } from "react";
import Timeline from "@/app/individual-schedule-builder/components/timeline";
import { useShiftManagement } from "@/app/individual-schedule-builder/hooks/useShiftManagement";
import { Employee, Shift, Segment, Entity } from "@/types/types";
import { FiCalendar, FiMapPin, FiBriefcase, FiPlus } from "react-icons/fi";

interface EmployeeTimelineProps {
  employee: Employee;
  currentMonday: Date;
  selectedDay: string;
  readOnly?: boolean;
  entities: Entity[];
}

export default function EmployeeTimeline({
  employee,
  currentMonday,
  selectedDay,
  readOnly = true,
  entities,
}: EmployeeTimelineProps) {
  const snapToGrid = true;
  const grid_height = 40;

  const employeeShifts = useMemo(() => {
    if (!employee.shifts || !Array.isArray(employee.shifts)) return [];

    return employee.shifts.map((shift) => ({
      ...shift,
      startTime: new Date(shift.startTime as string | number | Date),
      endTime: new Date(shift.endTime as string | number | Date),
      segments: (shift.segments || []).map((segment) => ({
        ...segment,
        startTime: new Date(segment.startTime as string | number | Date),
        endTime: new Date(segment.endTime as string | number | Date),
      })),
    }));
  }, [employee.shifts]);

  const {
    shiftSegments,
    matchingShift,
    shiftStartTime,
    shiftEndTime,
    initialX,
    initialWidth,
  } = useShiftManagement(employeeShifts, currentMonday, selectedDay);

  const handleAddShift = async () => {
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

    // Compute the correct shift date by adding the offset to currentMonday
    const shiftDateObj = new Date(currentMonday);
    shiftDateObj.setDate(shiftDateObj.getDate() + offset);

    // Set default start time at 9:00 AM
    const startTime = new Date(shiftDateObj);
    startTime.setHours(9, 0, 0, 0);

    // Set default end time at 5:00 PM
    const endTime = new Date(shiftDateObj);
    endTime.setHours(17, 0, 0, 0);

    const shiftData = {
      userId: employee.id,
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

      // Refresh the page to show the new shift
      window.location.reload();
    } catch (error) {
      console.error("Error creating shift:", error);
    }
  };

  return (
    <div className="relative overflow-visible flex items-stretch">
      <div className="w-[70px] flex-shrink-0 pr-2">
        <div className="flex flex-col">
          <div className="flex items-center">
            <div
              className="w-2 h-2 rounded-full mr-1.5 flex-shrink-0"
              style={{ backgroundColor: '#60a5fa' }}
            />
            <span
              className="
                font-medium text-gray-700 text-xs
                whitespace-normal    /* allow wrapping */
                break-words          /* break very‑long words if needed        */
                line-clamp-2
              "
            >
              {employee.name}
            </span>
          </div>

          <div className="ml-3.5 mt-0.5">
            {employee.department && (
              <div className="text-[9px] text-gray-500 flex items-center">
                <FiBriefcase className="text-gray-400 mr-1" size={7} />
                <span className="truncate max-w-[55px]">{employee.department}</span>
              </div>
            )}

            {employee.location && (
              <div className="text-[9px] text-gray-500 flex items-center">
                <FiMapPin className="text-gray-400 mr-1" size={7} />
                <span className="truncate max-w-[55px]">{employee.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-visible relative">
        <Timeline
          user={employee.name}
          snapToGrid={snapToGrid}
          shiftSegments={shiftSegments}
          matchingShift={matchingShift}
          initialX={initialX}
          initialWidth={initialWidth}
          shiftStartTime={shiftStartTime}
          shiftEndTime={shiftEndTime}
          gridHeight={grid_height}
          readOnly={readOnly}
          selectedDay={selectedDay}
          onShiftSave={(shiftId, updatedData) => console.log('Shift save', shiftId, updatedData)}
          entities={entities}
        />

        {!matchingShift && !readOnly && (
          <button
            onClick={handleAddShift}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
              flex items-center justify-center px-3 py-1.5 rounded-md 
              bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm transition-colors"
          >
            <FiPlus className="mr-1.5" size={14} />
            Add Shift
          </button>
        )}
      </div>
    </div>
  );
}
