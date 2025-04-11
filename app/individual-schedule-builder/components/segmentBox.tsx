"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import Draggable, { DraggableEvent, DraggableData } from "react-draggable";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import { FaEdit, FaUser } from "react-icons/fa";
import { MdDragIndicator, MdToys } from "react-icons/md";
import { Entity, Segment } from "@/types/types";
import { LuBookOpen, LuClock, LuLampDesk } from "react-icons/lu";
import { TbBeach } from "react-icons/tb";
import { PiBooksFill } from "react-icons/pi";
import SegmentEditorMenu from "./segmentMenu";
import { BiSortZA } from "react-icons/bi";
import { IconType } from "react-icons";
import { FaTrash } from "react-icons/fa";

const iconMap: Record<string, IconType> = {
  LuLampDesk: LuLampDesk,
  LuBookOpen: LuBookOpen,
  LuClock: LuClock,
  TbBeach: TbBeach,
  PiBooksFill: PiBooksFill,
  BiSortZA: BiSortZA,
  MdToys: MdToys,
};

interface SegmentBoxProps {
  segment: Segment;
  snapToGrid: boolean;
  readOnly: boolean;
  entities: Entity[],
  onUpdate: (id: string, newStart: number, newEnd: number) => void;
  onLabelUpdate?: (id: string, newLabel: string) => void;
  onColorUpdate?: (id: string, newColor: string) => void;
  onEntityUpdate?: (id: string, newEntity: Entity) => void;
  onDelete?: (id: string) => void;
  className?: string;
  shiftStartTime?: Date;
  minutesPerPixel?: number;
  user: string;
  style?: React.CSSProperties;
}

const SNAP_PX = 25;

const SegmentBox: React.FC<SegmentBoxProps> = ({
  segment,
  snapToGrid,
  entities,
  onUpdate,
  onLabelUpdate,
  onColorUpdate,
  onEntityUpdate,
  onDelete,
  className = "",
  shiftStartTime,
  minutesPerPixel,
  readOnly,
  user = "",
  style,
}) => {
  const nodeRef = useRef<HTMLDivElement>(null!);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 4 });
  const [isDragging, setIsDragging] = useState(false);
  const [leftPx, setLeftPx] = useState(segment.start);
  const [widthPx, setWidthPx] = useState(segment.end - segment.start);
  const [showEditor, setShowEditor] = useState(false);
  const [localLabel, setLocalLabel] = useState(segment.label);
  const [localColor, setLocalColor] = useState(segment.color);
  const [localEntity, setLocalEntity] = useState(segment.entity);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [showPopup, setShowPopup] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const colorOptions = [
    "#6BA0E5",
    "#7ACF8F",
    "#FFA1A1",
    "#FFD27F",
    "#BAA1E0",
    "#77D3D3",
  ];

  useEffect(() => {
    if (!isDragging) {
      const newX = Math.round(segment.start / 0.6);
      setLeftPx(newX);
      setPosition({ x: newX, y: 4 });
      setWidthPx(Math.round((segment.end - segment.start) / 0.6));
    }
    setLocalLabel(segment.label);
  }, [segment.start, segment.end, segment.label, isDragging]);

  useEffect(() => {
    setLocalColor(segment.color);
  }, [segment.color]);

  const handleDragStart = (_: DraggableEvent, data: DraggableData) => {
    setIsDragging(true);
    dragOffsetRef.current = { x: data.x, y: data.y };
  };

  const handleDrag = (_: DraggableEvent, data: DraggableData) => {
    setPosition({ x: data.x, y: 4 });

    let snappedX = data.x;
    if (snapToGrid) {
      snappedX = Math.round(data.x / SNAP_PX) * SNAP_PX;
    }

    setLeftPx(snappedX);
  };

  const handleDragStop = (_: DraggableEvent, data: DraggableData) => {
    setIsDragging(false);

    let finalX = data.x;
    if (snapToGrid) {
      finalX = Math.round(finalX / SNAP_PX) * SNAP_PX;
    }

    setPosition({ x: finalX, y: 4 });
    setLeftPx(finalX);

    onUpdate(
      segment.id,
      Math.round(finalX * 0.6),
      Math.round((finalX + widthPx) * 0.6)
    );
  };

  const handleResize = (_: React.SyntheticEvent, data: { size: { width: number } }) => {
    setWidthPx(data.size.width);

    onUpdate(
      segment.id,
      Math.round(leftPx * 0.6),
      Math.round((leftPx + data.size.width) * 0.6)
    );
  };

  const handleResizeStop = (_: React.SyntheticEvent, data: { size: { width: number } }) => {
    let newWidth = data.size.width;
    if (snapToGrid) {
      newWidth = Math.round(newWidth / SNAP_PX) * SNAP_PX;
    }
    setWidthPx(newWidth);
    onUpdate(
      segment.id,
      Math.round(leftPx * 0.6),
      Math.round((leftPx + newWidth) * 0.6)
    );
  };

  const toggleEditor = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditor((prev) => !prev);
  };

  const commitChanges = () => {
    if (onLabelUpdate) onLabelUpdate(segment.id, localLabel);
    if (onColorUpdate) onColorUpdate(segment.id, localColor);
    if (onEntityUpdate && localEntity) onEntityUpdate(segment.id, localEntity);
    setShowEditor(false);
  };

  const cancelChanges = () => {
    setLocalLabel(segment.label);
    setLocalColor(segment.color);
    setLocalEntity(segment.entity);
    setShowEditor(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(segment.id);
    }
  };

  const updateMenuPosition = useCallback(() => {
    if (!editButtonRef.current || !menuRef.current) return;

    const rect = editButtonRef.current.getBoundingClientRect();
    menuRef.current.style.top = `${rect.bottom + window.scrollY}px`;
    menuRef.current.style.left = `${rect.left + window.scrollX}px`;
  }, []);

  useEffect(() => {
    if (showEditor) {
      setTimeout(updateMenuPosition, 0);

      window.addEventListener('scroll', updateMenuPosition, true);

      return () => {
        window.removeEventListener('scroll', updateMenuPosition, true);
      };
    }
  }, [showEditor, updateMenuPosition]);

  let segmentStartTimeStr: string | undefined;
  let segmentEndTimeStr: string | undefined;
  if (shiftStartTime && minutesPerPixel) {
    const segStart = new Date(
      shiftStartTime.getTime() + leftPx * minutesPerPixel * 60000
    );
    segmentStartTimeStr = segStart.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).replace(/\s*(AM|PM)/i, '');
    const segEnd = new Date(
      shiftStartTime.getTime() + (leftPx + widthPx) * minutesPerPixel * 60000
    );
    segmentEndTimeStr = segEnd.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).replace(/\s*(AM|PM)/i, '');
  }


  const EntityIcon = localEntity?.icon && iconMap[localEntity.icon] ? iconMap[localEntity.icon] : null;
  const segmentDuration = minutesPerPixel ? widthPx * minutesPerPixel : 0;

  const canShowEntityName = () => {
    return EntityIcon && localEntity?.name && segmentDuration >= 50;
  };

  const getEntityNameDisplay = () => {
    if (!localEntity?.name) return "";
    
    if (segmentDuration < 60) return localEntity.name.substring(0, 6) + (localEntity.name.length > 6 ? "..." : "");
    if (segmentDuration < 75) return localEntity.name.substring(0, 10) + (localEntity.name.length > 10 ? "..." : "");
    return localEntity.name;
  };

  const getTimeDisplay = () => {
    if (!segmentStartTimeStr || !segmentEndTimeStr) return "";
    
    if (segmentDuration < 45) return segmentStartTimeStr;
    
    if (segmentDuration < 60) {
      const startHour = segmentStartTimeStr.split(':')[0];
      const endTime = segmentEndTimeStr;
      return `${startHour}-${endTime}`;
    }
    
    return `${segmentStartTimeStr} - ${segmentEndTimeStr}`;
  };

  const getUserDisplay = () => {
    if (!user) return "";
    
    if (segmentDuration < 45 && segmentStartTimeStr) {
      return user.charAt(0);
    }
    
    if (segmentDuration < 65 && segmentStartTimeStr) {
      const maxLength = Math.min(Math.floor(segmentDuration / 10), user.length);
      return user.substring(0, maxLength) + (user.length > maxLength ? "..." : "");
    }
    
    return user;
  };

  const getDurationDisplay = () => {
    if (!minutesPerPixel) return "";
    
    const durationMinutes = widthPx * minutesPerPixel;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = Math.round(durationMinutes % 60);
    
    if (hours === 0) {
      return `${minutes} min`;
    } else if (minutes === 0) {
      return `${hours} hr`;
    } else {
      return `${hours} hr ${minutes} min`;
    }
  };

  const handleMouseEnter = () => {
    if (isDragging) return;
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPopup(true);
      updatePopupPosition();
    }, 1000); // 1000 delay before showing popup
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setShowPopup(false);
  };

  const updatePopupPosition = useCallback(() => {
    if (!nodeRef.current || !popupRef.current) return;
    
    const rect = nodeRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupWidth = 250;
    const popupHeight = 180;
    
    const offsetX = 10;
    const offsetY = 0;
    
    let top = rect.top - popupHeight - offsetY;
    let left = rect.left + (rect.width / 2) - (popupWidth / 2) + offsetX;
    
    if (left < 10) left = 10;
    if (left + popupWidth > viewportWidth - 10) {
      left = viewportWidth - popupWidth - 10;
    }
    
    if (top < 10) top = 10;
    if (top + popupHeight > viewportHeight - 10) {
      top = viewportHeight - popupHeight - 10;
    }
    
    popupRef.current.style.top = `${top}px`;
    popupRef.current.style.left = `${left}px`;
  }, []);

  useEffect(() => {
    if (showPopup) {
      updatePopupPosition();
      window.addEventListener('resize', updatePopupPosition);
      return () => {
        window.removeEventListener('resize', updatePopupPosition);
      };
    }
  }, [showPopup, updatePopupPosition]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const getBackgroundColor = () => {
    if (!localColor || localColor === '#ffffff' || localColor === 'white') {
      return 'rgba(255, 255, 255, 1.0)';
    }

    const r = parseInt(localColor.substring(1, 3), 16);
    const g = parseInt(localColor.substring(3, 5), 16);
    const b = parseInt(localColor.substring(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, 1.0)`;
  };

  const getBorderColor = () => {
    if (!localColor || localColor === '#ffffff' || localColor === 'white') {
      return '#e2e8f0';
    }

    const r = Math.max(0, parseInt(localColor.substring(1, 3), 16) - 40);
    const g = Math.max(0, parseInt(localColor.substring(3, 5), 16) - 40);
    const b = Math.max(0, parseInt(localColor.substring(5, 7), 16) - 40);

    return `rgb(${r}, ${g}, ${b})`;
  };

  const dragStyles = isDragging ? {
    opacity: 0.9,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 100,
  } : {};

  return (
    <Draggable
      nodeRef={nodeRef}
      axis="x"
      position={position}
      bounds="parent"
      onStart={!readOnly ? handleDragStart : undefined}
      onDrag={!readOnly ? handleDrag : undefined}
      onStop={!readOnly ? handleDragStop : undefined}
      cancel=".react-resizable-handle, button"
      disabled={readOnly}
      grid={snapToGrid ? [SNAP_PX, SNAP_PX] : undefined}
    >
      <div
        ref={nodeRef}
        className={`${className} absolute h-full select-none`}
        style={style}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <ResizableBox
          width={widthPx}
          height={60}
          axis="x"
          resizeHandles={readOnly ? [] : ["e"]}
          minConstraints={[30, 40]}
          onResize={!readOnly ? handleResize : undefined}
          onResizeStop={!readOnly ? handleResizeStop : undefined}
          handleSize={[8, 8]}
          draggableOpts={{ disabled: isDragging }}
        >
          <div
            className="w-full h-full rounded-md shadow-sm border flex flex-col justify-between p-1 relative cursor-move transition-all duration-150"
            style={{
              backgroundColor: getBackgroundColor(),
              borderColor: getBorderColor(),
              borderLeftWidth: '3px',
              borderRightWidth: '1px',
              borderTopWidth: '1px',
              borderBottomWidth: '1px',
              marginLeft: '-5px',
              ...dragStyles
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center overflow-hidden">
                {EntityIcon ? (
                  <div className="flex items-center bg-white/80 px-1.5 py-0.5 rounded-md shadow-sm">
                    <EntityIcon size={13} className="text-gray-700 flex-shrink-0" />
                    {canShowEntityName() && (
                      <span className="ml-1 text-xs font-medium text-gray-700 truncate max-w-[90px]">
                        {getEntityNameDisplay()}
                      </span>
                    )}
                  </div>
                ) : localLabel && localLabel.trim() !== "" ? (
                  <div className="flex items-center bg-white/80 px-1.5 py-0.5 rounded-md shadow-sm">
                    <span className="text-xs font-medium text-gray-700 truncate max-w-[90px]">
                      {localLabel}
                    </span>
                  </div>
                ) : null}
              </div>
              {!readOnly && (
                <div className="flex-shrink-0 flex">
                  {segmentDuration >= 25 && (
                    <button
                      ref={editButtonRef}
                      onClick={toggleEditor}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="rounded-full p-1 hover:bg-white/50 transition-colors duration-200 focus:outline-none"
                    >
                      <FaEdit size={12} className="text-gray-600" />
                    </button>
                  )}

                  {segmentDuration >= 40 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="ml-1 rounded-full p-1 hover:bg-white/50 transition-colors duration-200 focus:outline-none"
                      title="Delete segment"
                    >
                      <FaTrash size={12} className="text-grey-600" />
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {segmentStartTimeStr && segmentEndTimeStr && segmentDuration >= 30 && (
              <div className="flex justify-center items-center">
                <span className={`text-center font-medium text-gray-600 ${segmentDuration < 45 ? 'text-[9px]' : 'text-[10px]'}`}>
                  {getTimeDisplay()}
                </span>
              </div>
            )}
            
            {readOnly && user && segmentDuration >= 30 && (
              <div className="flex items-center justify-center w-full text-[10px] font-medium text-gray-600">
                <div className="flex items-center flex-shrink-0 overflow-hidden">
                  <FaUser size={10} className="text-gray-600 mr-0.5 flex-shrink-0" />
                  <span className="truncate">
                    {getUserDisplay()}
                  </span>
                </div>
              </div>
            )}
            
            {!readOnly && segmentDuration > 60 && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
                <MdDragIndicator size={16} className="text-gray-700" />
              </div>
            )}
          </div>
        </ResizableBox>

        {showPopup && !isDragging && 
          ReactDOM.createPortal(
            <div 
              ref={popupRef}
              className="fixed z-50 w-[250px] bg-white rounded-md shadow-lg border border-gray-200 p-3 text-sm"
              style={{ pointerEvents: 'none' }}
              onMouseEnter={() => setShowPopup(false)}
            >
              <div className="space-y-2">
                <div className="border-b pb-1.5 mb-1">
                
                  <div className="text-gray-800">
                    <span className="font-semibold text-gray-600">Notes:</span> {localLabel || "Untitled Segment"}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Duration: {getDurationDisplay()}
                  </div>
                </div>

                {localEntity && (
                  <div className="flex items-start">
                    <div className="w-20 text-xs text-gray-500">Entity:</div>
                    <div className="flex items-center flex-1">
                      {EntityIcon && (
                        <EntityIcon size={14} className="text-gray-700 mr-1.5" />
                      )}
                      <span className="text-sm text-gray-700">
                        {localEntity.name || "Unnamed"}
                      </span>
                    </div>
                  </div>
                )}

                {segmentStartTimeStr && segmentEndTimeStr && (
                  <div className="flex items-start">
                    <div className="w-20 text-xs text-gray-500">Time:</div>
                    <div className="text-sm text-gray-700">
                      {`${segmentStartTimeStr} - ${segmentEndTimeStr}`}
                    </div>
                  </div>
                )}

                {user && (
                  <div className="flex items-start">
                    <div className="w-20 text-xs text-gray-500">User:</div>
                    <div className="flex items-center">
                      <FaUser size={12} className="text-gray-600 mr-1.5" />
                      <span className="text-sm text-gray-700">{user}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div 
                className="absolute w-4 h-4 bg-white border-b border-r border-gray-200 transform rotate-45"
                style={{ 
                  bottom: '-8px', 
                  left: '50%', 
                  marginLeft: '-8px',
                  boxShadow: '2px 2px 2px rgba(0, 0, 0, 0.03)'
                }}
              />
            </div>,
            document.body
          )
        }

        {showEditor && !readOnly &&
          ReactDOM.createPortal(
            <SegmentEditorMenu
              ref={menuRef}
              initialPopupStyle={{ position: "absolute", zIndex: 1000 }}
              localLabel={localLabel}
              onLabelChange={setLocalLabel}
              localColor={localColor}
              onColorChange={setLocalColor}
              onEntityChange={setLocalEntity}
              colorOptions={colorOptions}
              onCommit={commitChanges}
              onCancel={cancelChanges}
              entities={entities}
            />,
            document.body
          )
        }
      </div>
    </Draggable>
  );
};

export default SegmentBox;
