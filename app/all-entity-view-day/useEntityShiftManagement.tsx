import { useState, useEffect } from "react";
import { days } from "../individual-schedule-builder/helper/helper";
import { Segment, Shift } from "@/types/types";
import { RRule } from "rrule";

interface ShiftTimesState {
  matchingShift: Shift | null;
  shiftStartTime: Date | null;
  shiftEndTime: Date | null;
  initialX: number;
  initialWidth: number;
}

export function useEntityShiftManagement(
  userShifts: Shift[],
  entityShifts: Shift[],
  currentMonday: Date,
  selectedDay: string
) {
  const [shiftSegments, setShiftSegments] = useState<Segment[]>([]);
  const [shiftTimes, setShiftTimes] = useState<ShiftTimesState>({
    matchingShift: null,
    shiftStartTime: null,
    shiftEndTime: null,
    initialX: 0,
    initialWidth: 100,
  });

  useEffect(() => {
    const dayIndex = days.indexOf(selectedDay);
    const selectedDate = new Date(currentMonday);
    selectedDate.setDate(currentMonday.getDate() + dayIndex);

    function doesShiftOccurOn(shift: Shift, date: Date): boolean {
      if (!shift.isRecurring || !shift.recurrenceRule) {
        const shiftDate = new Date(shift.shiftDate);
        const matches = shiftDate.toDateString() === date.toDateString();
        console.log(`  NON-RECURRING SHIFT ${shift.id} on ${shiftDate.toDateString()} matches ${date.toDateString()}? ${matches}`);
        return matches;
      }

      try {
        const rule = RRule.fromString(shift.recurrenceRule);
        const rangeStart = new Date(date);
        rangeStart.setDate(date.getDate() - 1);
        rangeStart.setHours(0, 0, 0, 0);
        const rangeEnd = new Date(date);
        rangeEnd.setDate(date.getDate() + 1);
        rangeEnd.setHours(23, 59, 59, 999);
        const occurrences = rule.between(rangeStart, rangeEnd, true);
        const matches = occurrences.some(occurrence => {
          const occurrenceMatches = occurrence.toDateString() === date.toDateString();
          return occurrenceMatches;
        });
        return matches;
      } catch (err) {
        return false;
      }
    }

    const matchingUserShifts = userShifts.filter(shift => {
      const matches = doesShiftOccurOn(shift, selectedDate);
      return matches;
    });

    const matchingEntityShifts = entityShifts.filter(shift => {
      const matches = doesShiftOccurOn(shift, selectedDate);
      return matches;
    });

    if (matchingEntityShifts.length > 0) {
      const primaryEntityShift = matchingEntityShifts[0];
      const entityId = primaryEntityShift.entityId;
      const entityIdStr = String(entityId);
      const entityIdNum = Number(entityId);

      function deepSearchForEntityId(obj: any): string | null {
        if (!obj) return null;
        if (obj.id) return obj.id;
        if (obj.entityId) return obj.entityId;
        if (obj.entity && obj.entity.id) return obj.entity.id;
        if (obj.entities && obj.entities.id) return obj.entities.id;

        for (const key in obj) {
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            const result = deepSearchForEntityId(obj[key]);
            if (result) return result;
          }
        }

        return null;
      }

      function matchesEntityId(value: any): boolean {
        if (!value) return false;
        if (value === entityId) return true;
        const valueStr = String(value).trim();
        if (valueStr === entityIdStr) return true;
        const valueNum = Number(value);
        if (!isNaN(valueNum) && valueNum === entityIdNum) return true;
        return false;
      }

      const collectAllSegments: any[] = [];

      matchingUserShifts.forEach(userShift => {
        const userName = (userShift as any).userName || 'Unknown User';
        if (!userShift.segments || userShift.segments.length === 0) {
          return;
        }

        userShift.segments.forEach(segment => {
          const entityProperties = {
            directEntityId: segment.entityId,
            entityIdFromEntity: segment.entity?.id,
            entityIdFromEntities: segment.entities?.id,
            deepSearchResult: deepSearchForEntityId(segment)
          };

          let found = false;

          if (matchesEntityId(segment.entityId)) {
            collectAllSegments.push({
              ...segment,
              user: userName
            });
            found = true;
          }

          else if (segment.entity && matchesEntityId(segment.entity.id)) {
            collectAllSegments.push({
              ...segment,
              user: userName
            });
            found = true;
          }

          else if (segment.entities && matchesEntityId(segment.entities.id)) {
            collectAllSegments.push({
              ...segment,
              user: userName
            });
            found = true;
          }

          else {
            const deepResult = deepSearchForEntityId(segment);
            if (deepResult && matchesEntityId(deepResult)) {
              collectAllSegments.push({
                ...segment,
                user: userName
              });
              found = true;
            }
          }
        });
      });

      const combinedShift = {
        ...primaryEntityShift,
        segments: collectAllSegments,
      };

      if (combinedShift.segments.length > 0) {
        const shiftStart = new Date(combinedShift.startTime);
        const mappedSegments = combinedShift.segments.map((seg: any) => {
          const segStart = new Date(seg.startTime);
          const segEnd = new Date(seg.endTime);
          const normalizedSegStart = new Date(segStart);
          const normalizedSegEnd = new Date(segEnd);
          const normalizedShiftStart = new Date(shiftStart);
          normalizedSegStart.setFullYear(2000, 0, 1);
          normalizedSegEnd.setFullYear(2000, 0, 1);
          normalizedShiftStart.setFullYear(2000, 0, 1);

          const startMinutes = Math.round(
            (normalizedSegStart.getTime() - normalizedShiftStart.getTime()) / 60000
          );
          const endMinutes = Math.round(
            (normalizedSegEnd.getTime() - normalizedShiftStart.getTime()) / 60000
          );

          return {
            id: seg.id,
            label: seg.segmentType,
            start: startMinutes,
            end: endMinutes,
            color: seg.color,
            location: seg.location,
            entity: seg.entities || seg.entity,
            user: seg.user  
          } as Segment;
        });

        setShiftSegments(mappedSegments);

        const shiftEnd = new Date(combinedShift.endTime);
        const baseline = new Date(shiftStart);
        baseline.setHours(9, 0, 0, 0);
        const diffStartMinutes = (shiftStart.getTime() - baseline.getTime()) / 60000;
        const initialX = diffStartMinutes / 0.6;
        const diffShiftMinutes = (shiftEnd.getTime() - shiftStart.getTime()) / 60000;
        const initialWidth = diffShiftMinutes / 0.6;
        const computedShiftStartTime = new Date(baseline.getTime() + initialX * 0.6 * 60000);
        const computedShiftEndTime = new Date(baseline.getTime() + (initialX + initialWidth) * 0.6 * 60000);

        setShiftTimes({
          matchingShift: combinedShift,
          shiftStartTime: computedShiftStartTime,
          shiftEndTime: computedShiftEndTime,
          initialX,
          initialWidth,
        });
      } else {
        const shiftStart = new Date(primaryEntityShift.startTime);
        const shiftEnd = new Date(primaryEntityShift.endTime);
        const baseline = new Date(shiftStart);
        baseline.setHours(9, 0, 0, 0);
        const diffStartMinutes = (shiftStart.getTime() - baseline.getTime()) / 60000;
        const initialX = diffStartMinutes / 0.6;
        const diffShiftMinutes = (shiftEnd.getTime() - shiftStart.getTime()) / 60000;
        const initialWidth = diffShiftMinutes / 0.6;
        const computedShiftStartTime = new Date(baseline.getTime() + initialX * 0.6 * 60000);
        const computedShiftEndTime = new Date(baseline.getTime() + (initialX + initialWidth) * 0.6 * 60000);

        setShiftTimes({
          matchingShift: {
            ...primaryEntityShift,
            segments: [],
          },
          shiftStartTime: computedShiftStartTime,
          shiftEndTime: computedShiftEndTime,
          initialX,
          initialWidth,
        });

        setShiftSegments([]);
      }
    } else {
      setShiftSegments([]);
      setShiftTimes({
        matchingShift: null,
        shiftStartTime: null,
        shiftEndTime: null,
        initialX: 0,
        initialWidth: 100,
      });
    }
  }, [userShifts, entityShifts, currentMonday, selectedDay]);

  return {
    shiftSegments,
    matchingShift: shiftTimes.matchingShift,
    shiftStartTime: shiftTimes.shiftStartTime,
    shiftEndTime: shiftTimes.shiftEndTime,
    initialX: shiftTimes.initialX,
    initialWidth: shiftTimes.initialWidth,
  };
}
