import { useState, useEffect } from "react";
import { days } from "../helper/helper";
import { Segment, Shift } from "@/types/types";
import { RRule } from "rrule";

// Helper function to correctly parse DB date strings as UTC
const parseUtcDate = (dateString?: string | Date): Date | null => {
  if (!dateString) return null;
  if (dateString instanceof Date) return dateString;
  if (dateString.includes('Z')) return new Date(dateString);
  return new Date(dateString.replace(' ', 'T') + 'Z');
};

interface ShiftTimesState {
  matchingShift: any;           
  shiftStartTime: Date | null;
  shiftEndTime: Date | null;
  initialX: number;
  initialWidth: number;
  selectedDate: Date | null;
}

export function useShiftManagement(
  userShifts: any,
  currentMonday: Date,
  selectedDay: string
) {
  const [shiftSegments, setShiftSegments] = useState<Segment[]>([]);
  const [newSegmentLabel, setNewSegmentLabel] = useState("");
  const [newSegmentStart, setNewSegmentStart] = useState(30);
  const [newSegmentEnd, setNewSegmentEnd] = useState(60);
  const [newSegmentColor, setNewSegmentColor] = useState("#ffc4d6");
  const [shiftTimes, setShiftTimes] = useState<ShiftTimesState>({
    matchingShift: null,
    shiftStartTime: null,
    shiftEndTime: null,
    initialX: 0,
    initialWidth: 100,
    selectedDate: null,
  });

  useEffect(() => {
    // Correctly parse the rule's start time as UTC
    function buildRuleForInfinitePast(shift: Shift) {
      const parsed = RRule.fromString(shift.recurrenceRule);
      const first = parseUtcDate(shift.startTime);
      if (!first) throw new Error("Invalid start time for recurring shift.");
      
      const ancientStart = new Date(
        Date.UTC(2020, 0, 1, 
          first.getUTCHours(),
          first.getUTCMinutes(),
          first.getUTCSeconds())
      );
      parsed.options.dtstart = ancientStart;
      return new RRule(parsed.options);
    }

    // Compute the selected date from currentMonday and selectedDay
    const dayIndex = days.indexOf(selectedDay);
    const selectedDate = new Date(currentMonday);
    selectedDate.setDate(currentMonday.getDate() + dayIndex);

    // This function now correctly compares dates in UTC
    function doesShiftOccurOn(shift: Shift, date: Date) {
      // 1. Handle non-recurring shifts
      if (!shift.isRecurring || !shift.recurrenceRule) {
        const shiftDate = parseUtcDate(shift.shiftDate);
        if (!shiftDate) return false;
        
        // Compare year, month, and day in UTC
        return shiftDate.getUTCFullYear() === date.getUTCFullYear() &&
               shiftDate.getUTCMonth() === date.getUTCMonth() &&
               shiftDate.getUTCDate() === date.getUTCDate();
      }
    
      // 2. Handle recurring shifts
      try {
        const rule = buildRuleForInfinitePast(shift);
        const startOfCheck = new Date(date);
        startOfCheck.setUTCHours(0, 0, 0, 0);
        const endOfCheck = new Date(date);
        endOfCheck.setUTCHours(23, 59, 59, 999);
        
        const occurrences = rule.between(startOfCheck, endOfCheck, true);
        
        // Check if any occurrence falls on the target date in UTC
        return occurrences.some(occurrence => {
            return occurrence.getUTCFullYear() === date.getUTCFullYear() &&
                   occurrence.getUTCMonth() === date.getUTCMonth() &&
                   occurrence.getUTCDate() === date.getUTCDate();
        });
      } catch (err) {
        console.error("Invalid Recurrence Rule:", shift.recurrenceRule, err);
        return false;
      }
    }

    const shiftsForDay = userShifts.filter((shift: Shift) => 
      doesShiftOccurOn(shift, selectedDate)
    );
    
    const individualShift = shiftsForDay.find((shift: Shift) => !shift.isRecurring);
    const matchingShift = individualShift || shiftsForDay[0] || null;

    if (matchingShift) {
      const shiftStart = parseUtcDate(matchingShift.startTime);
      if (!shiftStart) {
        console.error("Could not parse matching shift start time");
        return;
      }

      const mappedSegments = matchingShift.segments.map((seg: any) => {
        const segStart = parseUtcDate(seg.startTime);
        const segEnd = parseUtcDate(seg.endTime);
        if (!segStart || !segEnd) return null;

        const startMinutes = Math.round((segStart.getTime() - shiftStart.getTime()) / 60000);
        const endMinutes = Math.round((segEnd.getTime() - shiftStart.getTime()) / 60000);
        
        return {
          id: seg.id,
          label: seg.segmentType,
          start: startMinutes,
          end: endMinutes,
          color: seg.color,
          location: seg.location,
          entity: seg.entities,
        };
      }).filter(Boolean); // Filter out any null segments from failed parsing
      
      setShiftSegments(mappedSegments as Segment[]);
    } else {
      setShiftSegments([]);
    }

    let shiftStartTime: Date | null = null;
    let shiftEndTime: Date | null = null;
    let initialX = 0;
    let initialWidth = 100;

    if (matchingShift) {
      const shiftStart = parseUtcDate(matchingShift.startTime);
      const shiftEnd = parseUtcDate(matchingShift.endTime);

      if (shiftStart && shiftEnd) {
        const baseline = new Date(shiftStart);
        baseline.setHours(9, 0, 0, 0);

        const diffStartMinutes = (shiftStart.getTime() - baseline.getTime()) / 60000;
        initialX = diffStartMinutes / 0.6;

        const diffShiftMinutes = (shiftEnd.getTime() - shiftStart.getTime()) / 60000;
        initialWidth = diffShiftMinutes / 0.6;

        shiftStartTime = shiftStart;
        shiftEndTime = shiftEnd;
      }
    }

    setShiftTimes({
      matchingShift,
      shiftStartTime,
      shiftEndTime,
      initialX,
      initialWidth,
      selectedDate,
    });
  }, [userShifts, currentMonday, selectedDay]);

  const handleAddSegment = (
    label: string,
    start: number,
    end: number,
    color: string
  ) => {
    const newSegment: Segment = {
      id: `seg-${Date.now()}`,
      label,
      start,
      end,
      color,
      location: "", // provide a default or a proper value if needed
    };
    setShiftSegments((prev) => [...prev, newSegment]);
  };

  const handleCreateSegment = () => {
    if (!newSegmentLabel.trim()) {
      alert("Please enter a label for the segment.");
      return;
    }
    if (newSegmentStart >= newSegmentEnd) {
      alert("Start time must be less than end time.");
      return;
    }
    handleAddSegment(newSegmentLabel, newSegmentStart, newSegmentEnd, newSegmentColor);
    setNewSegmentLabel("");
    setNewSegmentStart(30);
    setNewSegmentEnd(60);
    setNewSegmentColor("#ffc4d6");
  };

  console.log(shiftSegments);

  return {
    shiftSegments,
    newSegmentLabel,
    setNewSegmentLabel,
    newSegmentStart,
    setNewSegmentStart,
    newSegmentEnd,
    setNewSegmentEnd,
    newSegmentColor,
    setNewSegmentColor,
    handleCreateSegment,
    matchingShift: shiftTimes.matchingShift,
    shiftStartTime: shiftTimes.shiftStartTime,
    shiftEndTime: shiftTimes.shiftEndTime,
    initialX: shiftTimes.initialX,
    initialWidth: shiftTimes.initialWidth,
    selectedDate: shiftTimes.selectedDate, // return the computed selected date
  };
}

