"use client";
import React, { useState, useRef, useEffect } from "react";
import Draggable, { DraggableEvent, DraggableData } from "react-draggable";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import SegmentBox from "./segmentBox";
import { FaCheck, FaPlus, FaUser } from "react-icons/fa";
import { MdDragIndicator } from "react-icons/md";
import { v4 as uuidv4 } from 'uuid';
import { Entity, Segment, Shift } from "@/types/types";
import ShiftBoxMenu from "./shiftBoxMenu";
import ReactDOM from "react-dom";
import { TbRepeat, TbRepeatOff } from "react-icons/tb";
import { RRule } from "rrule";


interface ShiftBoxProps {
  snapToGrid: boolean;
  segments?: Segment[];
  initialX?: number;
  initialWidth?: number;
  startTime: Date;
  endTime: Date;
  shiftId: string;
  readOnly: boolean;
  entities: Entity[],
  isRecurring: boolean;
  recurrenceRule: string;
  user: string,
  onSaveShiftChanges?: (shiftId: string, updatedData: Partial<Shift>) => void;
  height?: number;
  onHeightChange?: (shiftId: string, newHeight: number) => void;
}

interface ShiftUpdatePayload {
  shiftId: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  recurrenceRule: string;
  segments: {
    id: string;
    startTime: string;
    endTime: string;
    segmentType: string;
    location: string;
    notes: string;
    color: string;
    entities: any;
    entityId: any;
  }[];
}

const SHIFT_HEIGHT = 100;
const SEGMENT_HEIGHT = 70;
const MINUTES_PER_PIXEL = 0.6; 

const ShiftBox: React.FC<ShiftBoxProps> = ({
  snapToGrid,
  segments = [],
  initialX = 0,
  initialWidth = 200,
  startTime,
  endTime,
  shiftId,
  entities,
  isRecurring,
  recurrenceRule,
  user,
  readOnly = false,
  onSaveShiftChanges,
  height = SHIFT_HEIGHT,
  onHeightChange,
}) => {
  const nodeRef = useRef<HTMLDivElement>(null!);
  const [width, setWidth] = useState(initialWidth);
  const [position, setPosition] = useState({ x: initialX, y: 0 });
  const [localSegments, setLocalSegments] = useState<Segment[]>(segments);
  const [segmentRows, setSegmentRows] = useState(1);
  const [segmentYPositions, setSegmentYPositions] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [localIsRecurring, setLocalIsRecurring] = useState(isRecurring);
  const [localRecurrenceRule, setLocalRecurrenceRule] = useState(recurrenceRule);
  const [isRecurrenceMenuOpen, setIsRecurrenceMenuOpen] = useState(false);

  const grid: [number, number] | undefined = snapToGrid ? [25, 25] : undefined;

  console.log("localSegments in shiftBox", localSegments);

  const handleRecurrenceChange = (newRule: string | null, recurring: boolean) => {
    setLocalIsRecurring(recurring);
    setLocalRecurrenceRule(newRule || "");
  };

  const handleLabelUpdate = (id: string, newLabel: string) => {
    setLocalSegments((prev) =>
      prev.map((seg) => (seg.id === id ? { ...seg, label: newLabel } : seg))
    );
    setHasChanges(true);
  };

  const handleDeleteSegment = (segmentId: string) => {
    setLocalSegments(prev => prev.filter(seg => seg.id !== segmentId));
    setHasChanges(true);
  };

  const handleDrag = (_: DraggableEvent, data: DraggableData) => {
    setPosition({ x: data.x, y: 0 });
    setHasChanges(true);
  };

  const handleResize = (_: React.SyntheticEvent, data: { size: { width: number } }) => {
    setWidth(data.size.width);
    setHasChanges(true);
  };

  const handleResizeStop = (_: React.SyntheticEvent, data: { size: { width: number } }) => {
    let newWidth = data.size.width;
    if (snapToGrid) {
      newWidth = Math.round(newWidth / 25) * 25;
    }
    setWidth(newWidth);
    setHasChanges(true);
  };

  const handleAddSegment = () => {
    const existingSegments = localSegments.sort((a, b) => a.start - b.start);
    let newStart = 0;
    for (const seg of existingSegments) {
      if (seg.start >= newStart + 60) break;
      newStart = seg.end;
    }
    const newSeg: Segment = {
      id: uuidv4(),
      label: " ",
      start: newStart,
      end: newStart + 100,
      color: "#ffffff",
      location: "",
    };
    setLocalSegments((prev) => [...prev, newSeg]);
    setHasChanges(true);
  };

  const handleSegmentUpdate = (id: string, newStart: number, newEnd: number) => {
    setLocalSegments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, start: newStart, end: newEnd } : s))
    );
    setHasChanges(true);
  };

  const dynamicStartTime = new Date(
    startTime.getTime() + (position.x - initialX) * MINUTES_PER_PIXEL * 60000
  );
  const dynamicEndTime = new Date(
    dynamicStartTime.getTime() + width * MINUTES_PER_PIXEL * 60000
  );

  const handleColorUpdate = (id: string, newColor: string) => {
    setLocalSegments((prev) => {
      const updated = prev.map((seg) =>
        seg.id === id ? { ...seg, color: newColor } : seg
      );
      return updated;
    });
    setHasChanges(true);
  };

  const handleEntityUpdate = (id: string, newEntity: Entity) => {
    setLocalSegments((prev) =>
      prev.map((seg) =>
        seg.id === id ? { ...seg, entity: newEntity } : seg
      )
    );
    setHasChanges(true);
  };

  const getHumanReadableRRule = (ruleString: string) => {
    if (!ruleString) return "No recurrence rule specified";
    try {
      return RRule.fromString(ruleString).toText();
    } catch (error) {
      console.error("Failed to parse RRule string:", ruleString, error);
      return ruleString || "N/A";
    }
  };

  const handleSaveChanges = async () => {
    console.log("local segs to save", localSegments);
    const payload: ShiftUpdatePayload = {
      shiftId,
      startTime: dynamicStartTime.toISOString(),
      endTime: dynamicEndTime.toISOString(),
      isRecurring: localIsRecurring,
      recurrenceRule: localRecurrenceRule,
      segments: localSegments.map((seg) => ({
        id: seg.id,
        startTime: new Date(dynamicStartTime.getTime() + seg.start * 60000).toISOString(),
        endTime: new Date(dynamicStartTime.getTime() + seg.end * 60000).toISOString(),
        segmentType: seg.label || " ",
        location: seg.location || "default",
        notes: "",
        color: seg.color,
        entities: seg.entity || null,
        entityId: seg.entity?.id ?? null,
      })),
    };

    console.log("payload", payload);

    try {
      const response = await fetch("/api/updateshiftwithsegments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      console.log("API response:", data);

      if (onSaveShiftChanges) {
        onSaveShiftChanges(shiftId, payload);
      }

      // Update local state with the processed segments
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving shift:", error);
    }
  };

  const maxSegmentEndPx =
    localSegments.length > 0 ? Math.max(...localSegments.map((seg) => seg.end)) / 0.6 : 0;

  const repeatIconRef = useRef<HTMLSpanElement>(null);

  let menuStyle: React.CSSProperties = {};
  if (repeatIconRef.current) {
    const rect = repeatIconRef.current.getBoundingClientRect();
    menuStyle = {
      position: "absolute",
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      zIndex: 9999, 
    };
  }

  const calculateSegmentLayout = () => {
    if (localSegments.length === 0) return { rows: 1, segmentPositions: {} };

    const sortedSegments = [...localSegments].sort((a, b) => a.start - b.start);
    const segmentPositions: Record<string, number> = {};
    
    const rowEndPositions: number[] = [];
    
    sortedSegments.forEach(segment => {
      let rowIndex = 0;
      while (rowIndex < rowEndPositions.length) {
        if (segment.start >= rowEndPositions[rowIndex]) {
          break;
        }
        rowIndex++;
      }
      segmentPositions[segment.id] = rowIndex;
      rowEndPositions[rowIndex] = segment.end;
    });
    const rows = Math.max(1, rowEndPositions.length);
    
    return { rows, segmentPositions };
  };

  useEffect(() => {
    const { rows, segmentPositions } = calculateSegmentLayout();
    setSegmentRows(rows);
    setSegmentYPositions(segmentPositions);
  }, [localSegments]);

  const dynamicHeight = 30 + (segmentRows * SEGMENT_HEIGHT);

  useEffect(() => {
    if (onHeightChange) {
      onHeightChange(shiftId, dynamicHeight);
    }
  }, [dynamicHeight, shiftId, onHeightChange]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      axis="x"
      grid={grid}
      position={position}
      onDrag={!readOnly ? handleDrag : undefined}
      onStop={!readOnly ? handleDrag : undefined}
      handle=".shift-drag-handle"
      cancel=".react-resizable-handle, .segment-container"
      disabled={readOnly}
    >
      <div ref={nodeRef} className="absolute" style={{ width }}>
        <ResizableBox
          width={width}
          height={dynamicHeight}
          axis="x"
          resizeHandles={readOnly ? [] : ["e"]}
          minConstraints={[150, dynamicHeight]}
          maxConstraints={[1000, dynamicHeight]}
          onResize={!readOnly ? handleResize : undefined}
          onResizeStop={!readOnly ? handleResizeStop : undefined}
        >
          <div className="w-full h-full backdrop-blur-sm rounded-lg shadow-md overflow-hidden relative border border-gray-200">
            <div className="shift-drag-handle h-[30px] bg-gradient-to-r from-blue-600 to-blue-500 flex items-center px-3 cursor-move relative">
              <div className="flex items-center flex-1">
                <span className="text-white"><FaUser size={12} className="mr-2" /></span>
                <span className="text-white text-sm font-medium">
                  {formatTime(dynamicStartTime)} - {formatTime(dynamicEndTime)}
                </span>
                
                <span ref={repeatIconRef} className="ml-2">
                  {localIsRecurring ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsRecurrenceMenuOpen(true);
                      }}
                      className="bg-green-600 hover:bg-green-700 rounded-full p-1 transition-colors duration-200 focus:outline-none"
                      title={`Repeats: ${getHumanReadableRRule(localRecurrenceRule)}`}
                    >
                      <TbRepeat className="text-white" size={12} />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsRecurrenceMenuOpen(true);
                      }}
                      className="bg-gray-400 hover:bg-gray-500 rounded-full p-1 transition-colors duration-200 focus:outline-none"
                    >
                      <TbRepeatOff className="text-white" size={12} />
                    </button>
                  )}
                </span>
                
                {!readOnly && (
                  <div className="absolute right-3 flex gap-1 items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddSegment();
                      }}
                      className="bg-blue-700 hover:bg-blue-800 text-white rounded-full p-1 transition-colors duration-200 focus:outline-none mr-1"
                      title="Add segment"
                    >
                      <FaPlus size={10} />
                    </button>
                    {hasChanges && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveChanges();
                        }}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md transform hover:scale-105 font-medium text-xs"
                        title="Save changes"
                      >
                        Save Changes <FaCheck size={10} />
                      </button>
                    )}
                    <MdDragIndicator className="text-white/60" size={16} />
                  </div>
                )}
              </div>

              {!readOnly && isRecurrenceMenuOpen && ReactDOM.createPortal(
                <ShiftBoxMenu
                  isRecurring={localIsRecurring}
                  recurrenceRule={localRecurrenceRule}
                  onRecurrenceChange={handleRecurrenceChange}
                  onClose={() => setIsRecurrenceMenuOpen(false)}
                  style={menuStyle}
                />,
                document.body
              )}
            </div>
            <div className="relative pt-1 px-1" style={{ height: dynamicHeight - 30 }}>
              {localSegments.map((seg) => (
                <SegmentBox
                  key={seg.id}
                  segment={seg}
                  snapToGrid={snapToGrid}
                  onUpdate={handleSegmentUpdate}
                  onColorUpdate={handleColorUpdate}
                  className="segment-container"
                  onLabelUpdate={handleLabelUpdate}
                  shiftStartTime={dynamicStartTime}
                  minutesPerPixel={MINUTES_PER_PIXEL}
                  onDelete={handleDeleteSegment}
                  readOnly={readOnly}
                  entities={entities}
                  onEntityUpdate={handleEntityUpdate}
                  user={(seg as any).user || user}
                  style={{
                    top: `${segmentYPositions[seg.id] * SEGMENT_HEIGHT}px`
                  }}
                />
              ))}
            </div>
          </div>
        </ResizableBox>
      </div>
    </Draggable>
  );
};

export default ShiftBox;
