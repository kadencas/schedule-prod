import { useState, useEffect } from "react";
import { days } from "../helper/helper";
import { Segment, Shift } from "@/types/types";
import { RRule } from "rrule";

interface ShiftTimesState {
  matchingShift: any;           
  shiftStartTime: Date | null;
  shiftEndTime: Date | null;
  initialX: number;
  initialWidth: number;
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
  });

  function buildRuleForInfinitePast(shift: Shift) {
    const parsed = RRule.fromString(shift.recurrenceRule);
  
    // Copy the correct time‑of‑day from the real shift
    const first = new Date(shift.startTime);   // or shift.shiftDate
    const ancientStart = new Date(
      Date.UTC(2020, 0, 1,                 // 2020‑01‑01
               first.getUTCHours(),
               first.getUTCMinutes(),
               first.getUTCSeconds())
    );
  
    parsed.options.dtstart = ancientStart;
    return new RRule(parsed.options);          // rebuild so the change sticks
  }

  useEffect(() => {

    const dayIndex = days.indexOf(selectedDay);
    const selectedDate = new Date(currentMonday);
    selectedDate.setDate(currentMonday.getDate() + dayIndex);


    function doesShiftOccurOn(shift: Shift, selectedDate: Date) {
      if (!shift.isRecurring || !shift.recurrenceRule) {
        const shiftDate = new Date(shift.shiftDate);
        return shiftDate.toDateString() === selectedDate.toDateString();
      }
    
      try {
        const rule = buildRuleForInfinitePast(shift);
    
        const startOfWeek = new Date(selectedDate);
        startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay()); // or your custom logic
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
    
        const occurrences = rule.between(startOfWeek, endOfWeek, true);
    
        return occurrences.some(
          (occurrence) => occurrence.toDateString() === selectedDate.toDateString()
        );
      } catch (err) {
        console.error("Invalid Recurrence Rule:", shift.recurrenceRule, err);
        return false;
      }
    }


    const matchingShift = userShifts.find((shift: Shift) =>
      doesShiftOccurOn(shift, selectedDate)
    );
    console.log("matching:", matchingShift)

    if (matchingShift) {
      const shiftStart = new Date(matchingShift.startTime);

      const mappedSegments = matchingShift.segments.map((seg: any) => {
        const segStart = new Date(seg.startTime);
        const segEnd = new Date(seg.endTime);
        const startMinutes = Math.round(
          (segStart.getTime() - shiftStart.getTime()) / 60000
        );
        const endMinutes = Math.round(
          (segEnd.getTime() - shiftStart.getTime()) / 60000
        );
        return {
          id: seg.id,
          label: seg.segmentType,
          start: startMinutes,
          end: endMinutes,
          color: seg.color,
          location: seg.location,
          entity: seg.entities,
        };
      });

      setShiftSegments(mappedSegments);
    } else {
      setShiftSegments([]);
    }

    let shiftStartTime: Date | null = null;
    let shiftEndTime: Date | null = null;
    let initialX = 0;
    let initialWidth = 100;

    if (matchingShift) {
      const shiftStart = new Date(matchingShift.startTime);
      const shiftEnd = new Date(matchingShift.endTime);

      const baseline = new Date(shiftStart);
      baseline.setHours(9, 0, 0, 0);

      const diffStartMinutes =
        (shiftStart.getTime() - baseline.getTime()) / 60000;
      initialX = diffStartMinutes / 0.6;

      const diffShiftMinutes =
        (shiftEnd.getTime() - shiftStart.getTime()) / 60000;
      initialWidth = diffShiftMinutes / 0.6;

      shiftStartTime = new Date(
        baseline.getTime() + initialX * 0.6 * 60000
      );
      shiftEndTime = new Date(
        baseline.getTime() + (initialX + initialWidth) * 0.6 * 60000
      );
    }

    setShiftTimes({
      matchingShift,
      shiftStartTime,
      shiftEndTime,
      initialX,
      initialWidth,
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
      location,
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
    handleAddSegment(
      newSegmentLabel,
      newSegmentStart,
      newSegmentEnd,
      newSegmentColor
    );
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
  };
}
