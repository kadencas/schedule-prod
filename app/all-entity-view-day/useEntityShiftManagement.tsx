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

/* ---------- helpers ---------- */

function buildRuleForInfinitePast(shift: Shift): RRule {
  const parsed = RRule.fromString(shift.recurrenceRule!);
  const first = new Date(shift.startTime);
  const ancient = new Date(
    Date.UTC(
      2020, 0, 1,
      first.getUTCHours(),
      first.getUTCMinutes(),
      first.getUTCSeconds()
    )
  );
  parsed.options.dtstart = ancient;
  return new RRule(parsed.options);
}

function doesShiftOccurOn(shift: Shift, date: Date): boolean {
  if (!shift.isRecurring || !shift.recurrenceRule) {
    return new Date(shift.shiftDate).toDateString() === date.toDateString();
  }
  try {
    const rule = buildRuleForInfinitePast(shift);
    const rangeStart = new Date(date);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(date);
    rangeEnd.setHours(23, 59, 59, 999);
    return rule.between(rangeStart, rangeEnd, true).some(
      occ => occ.toDateString() === date.toDateString()
    );
  } catch {
    return false;
  }
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
    /* ---------- 1.  figure out selected date ---------- */
    const dayIndex = days.indexOf(selectedDay);
    const selectedDate = new Date(currentMonday);
    selectedDate.setDate(currentMonday.getDate() + dayIndex);

    /* ---------- 2.  find all shifts that occur today ---------- */
    const matchingUserShifts = userShifts.filter(s =>
      doesShiftOccurOn(s, selectedDate)
    );

    const matchingEntityShifts = entityShifts
      .filter(s => doesShiftOccurOn(s, selectedDate))
      // sort so individual (non‑recurring) shifts come first
      .sort((a, b) => {
        if (a.isRecurring === b.isRecurring) return 0;
        return a.isRecurring ? 1 : -1;
      });

    /* ---------- 3.  if an individual shift exists, drop recurring ---------- */
    const hasIndividualUserShift = matchingUserShifts.some(s => !s.isRecurring);
    const filteredUserShifts = hasIndividualUserShift
      ? matchingUserShifts.filter(s => !s.isRecurring)
      : matchingUserShifts;

    /* ---------- 4.  build UI data ---------- */
    if (matchingEntityShifts.length === 0) {
      setShiftSegments([]);
      setShiftTimes({
        matchingShift: null,
        shiftStartTime: null,
        shiftEndTime: null,
        initialX: 0,
        initialWidth: 100,
      });
      return;
    }

    const primaryEntityShift = matchingEntityShifts[0]; // already favours individual
    const entityId = primaryEntityShift.entityId;

    /* ---- utilities for segment/entity matching ---- */
    const entityIdStr = String(entityId);
    const entityIdNum = Number(entityId);

    function matchesEntityId(value: any): boolean {
      if (!value) return false;
      if (value === entityId) return true;
      if (String(value).trim() === entityIdStr) return true;
      const num = Number(value);
      return !isNaN(num) && num === entityIdNum;
    }

    function deepSearchForEntityId(obj: any): string | null {
      if (!obj || typeof obj !== "object") return null;
      if (obj.id && matchesEntityId(obj.id)) return obj.id;
      if (obj.entityId && matchesEntityId(obj.entityId)) return obj.entityId;
      if (obj.entity?.id && matchesEntityId(obj.entity.id)) return obj.entity.id;
      if (obj.entities?.id && matchesEntityId(obj.entities.id)) return obj.entities.id;
      for (const key in obj) {
        const res = deepSearchForEntityId(obj[key]);
        if (res) return res;
      }
      return null;
    }

    /* ---- collect all user segments that match this entity ---- */
    const collectAllSegments: any[] = [];

    filteredUserShifts.forEach(userShift => {
      const userName = (userShift as any).userName ?? "Unknown User";
      userShift.segments?.forEach(segment => {
        const matches =
          matchesEntityId(segment.entityId) ||
          (segment.entity && matchesEntityId(segment.entity.id)) ||
          (segment.entities && matchesEntityId(segment.entities.id)) ||
          (!!deepSearchForEntityId(segment));

        if (matches) {
          collectAllSegments.push({ ...segment, user: userName });
        }
      });
    });

    /* ---- merge segments into one combined shift ---- */
    const combinedShift = { ...primaryEntityShift, segments: collectAllSegments };

    /* ---- map segments for the UI ---- */
    const shiftStart = new Date(combinedShift.startTime);
    const mappedSegments = combinedShift.segments.map((seg: any) => {
      const segStart = new Date(seg.startTime);
      const segEnd = new Date(seg.endTime);

      const normShiftStart = new Date(2000, 0, 1, shiftStart.getHours(), shiftStart.getMinutes());
      const normSegStart = new Date(2000, 0, 1, segStart.getHours(), segStart.getMinutes());
      const normSegEnd = new Date(2000, 0, 1, segEnd.getHours(), segEnd.getMinutes());

      const startMinutes = (normSegStart.getTime() - normShiftStart.getTime()) / 60000;
      const endMinutes = (normSegEnd.getTime() - normShiftStart.getTime()) / 60000;

      return {
        id: seg.id,
        label: seg.segmentType,
        start: Math.round(startMinutes),
        end: Math.round(endMinutes),
        color: seg.color,
        location: seg.location,
        entity: seg.entities || seg.entity,
        user: seg.user,
      } as Segment;
    });

    setShiftSegments(mappedSegments);

    /* ---- compute timeline offsets ---- */
    const shiftEnd = new Date(combinedShift.endTime);
    const baseline = new Date(shiftStart);
    baseline.setHours(9, 0, 0, 0);

    const diffStartMinutes = (shiftStart.getTime() - baseline.getTime()) / 60000;
    const initialX = diffStartMinutes / 0.6;

    const diffShiftMinutes = (shiftEnd.getTime() - shiftStart.getTime()) / 60000;
    const initialWidth = diffShiftMinutes / 0.6;

    setShiftTimes({
      matchingShift: combinedShift,
      shiftStartTime: new Date(baseline.getTime() + initialX * 0.6 * 60000),
      shiftEndTime: new Date(baseline.getTime() + (initialX + initialWidth) * 0.6 * 60000),
      initialX,
      initialWidth,
    });
  }, [userShifts, entityShifts, currentMonday, selectedDay]);

  /* ---------- public API ---------- */
  return {
    shiftSegments,
    matchingShift: shiftTimes.matchingShift,
    shiftStartTime: shiftTimes.shiftStartTime,
    shiftEndTime: shiftTimes.shiftEndTime,
    initialX: shiftTimes.initialX,
    initialWidth: shiftTimes.initialWidth,
  };
}

