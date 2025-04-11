import React, { useState, useEffect } from "react";
import ShiftBox from "./shiftBox";
import { useContainerWidth } from "../hooks/useContainerWidth";
import styles from "../styles/Timeline.module.css";
import { Entity, Shift } from "@/types/types";

interface TimelineProps {
  snapToGrid: boolean;
  shiftSegments: any[];
  matchingShift: any;
  initialX: number;
  initialWidth: number;
  shiftStartTime: Date | null;
  shiftEndTime: Date | null;
  gridHeight: number;
  readOnly: boolean;
  onShiftSave: (shiftId: string, updatedData: Partial<Shift>) => void;
  entities?: Entity[],
  selectedDay: string;
  user: string,
  selectedDate: any,
}

export default function Timeline({
  snapToGrid,
  shiftSegments,
  matchingShift,
  initialX,
  initialWidth,
  shiftStartTime,
  shiftEndTime,
  gridHeight,
  entities,
  readOnly = false,
  selectedDay,
  user,
  selectedDate,
  onShiftSave,
}: TimelineProps) {
  const { containerRef, width: containerWidth } = useContainerWidth();
  const numTicks = Math.floor(containerWidth / 25) + 1;
  const [shiftHeights, setShiftHeights] = useState<Record<string, number>>({});
  const [currentTime, setCurrentTime] = useState(new Date());


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);


  const getCurrentTimePosition = () => {
    if (!shiftStartTime) return null;
    
    const startHour = 9; // Assuming timeline starts at 9 AM
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    
    if (currentHour < startHour || currentHour > 22) return null;
    
    const hourOffset = (currentHour - startHour) * 100; 
    const minuteOffset = (currentMinute / 60) * 100;
    
    return hourOffset + minuteOffset;
  };

  const containerHeight = Math.max(gridHeight, ...Object.values(shiftHeights));

  const handleShiftHeightChange = (shiftId: string, newHeight: number) => {
    setShiftHeights(prev => {
      if (prev[shiftId] === newHeight) {
        return prev;
      }
      return {
        ...prev,
        [shiftId]: newHeight
      };
    });
  };

  console.log("shiftSegments in timeline", shiftSegments);

  const currentTimePosition = getCurrentTimePosition();

  return (
    <div
      ref={containerRef}
      className={styles.timelineContainer}
      style={{ height: containerHeight }}
    >
      {Array.from({ length: numTicks }).map((_, i) => {
        const leftPos = i * 25;
        const isMajorTick = i % 4 === 0;
        
        return (
          <div key={i}>
            <div
              className={isMajorTick ? styles.gridLineMajor : styles.gridLineMinor}
              style={{ left: leftPos }}
            />
          </div>
        );
      })}
      
      {currentTimePosition !== null && (
        <div 
          className={styles.currentTimeIndicator} 
          style={{ left: currentTimePosition }}
        >
          <div className={styles.currentTimeIndicatorDot} />
        </div>
      )}

      {matchingShift && (
        <div key={`${matchingShift.id}-${selectedDay}`} className={styles.shiftAnimation}>
          <ShiftBox
            key={matchingShift.id}
            shiftId={matchingShift.id}
            snapToGrid={snapToGrid}
            segments={shiftSegments}
            initialX={initialX}
            initialWidth={initialWidth}
            startTime={shiftStartTime!}
            endTime={shiftEndTime!}
            readOnly={readOnly}
            user={user}
            onSaveShiftChanges={onShiftSave}
            entities={entities || []}
            isRecurring={matchingShift.isRecurring}
            recurrenceRule={matchingShift.recurrenceRule}
            onHeightChange={handleShiftHeightChange}
            selectedDate={selectedDate}
          />
        </div>
      )}
    </div>
  );
}
