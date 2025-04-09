"use client";
import React, { useState, forwardRef } from "react";
import { FaCheck, FaTimes, FaTag } from "react-icons/fa";
import { LuClock, LuLampDesk, LuBookOpen, LuX, LuCheck } from "react-icons/lu";
import { TbBeach, TbSettings } from "react-icons/tb";
import { PiBooksFill } from "react-icons/pi";
import { Entity } from "@/types/types";
import { BiSortZA } from "react-icons/bi";
import { MdToys, MdFormatColorFill, MdOutlineCategory } from "react-icons/md";
import { IconType } from "react-icons";
import { motion } from "framer-motion";

type IconKey = 'LuLampDesk' | 'LuBookOpen' | 'LuClock' | 'TbBeach' | 'PiBooksFill' | 'BiSortZA' | 'MdToys';

interface SegmentEditorMenuProps {
  initialPopupStyle: React.CSSProperties;
  localLabel: string;
  entities: Entity[];
  onLabelChange: (value: string) => void;
  localColor: string;
  onColorChange: (color: string) => void;
  onEntityChange: (entity: Entity) => void;
  colorOptions: string[];
  onCommit: () => void;
  onCancel: () => void;
}

const iconMap: Record<IconKey, IconType> = {
  LuLampDesk,
  LuBookOpen,
  LuClock,
  TbBeach,
  PiBooksFill,
  BiSortZA,
  MdToys,
};

const SegmentEditorMenu = forwardRef<HTMLDivElement, SegmentEditorMenuProps>(({
  initialPopupStyle,
  localLabel,
  entities,
  onLabelChange,
  localColor,
  onColorChange,
  onEntityChange,
  colorOptions,
  onCommit,
  onCancel,
}, ref) => {
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");

  const listItemVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: (i: number) => ({ 
      opacity: 1, 
      y: 0,
      transition: { 
        delay: i * 0.05,
        duration: 0.2
      }
    })
  };

  return (
    <motion.div
      ref={ref}
      onMouseDown={(e) => e.stopPropagation()}
      style={initialPopupStyle}
      className="fixed bg-white rounded-lg shadow-xl border border-gray-200 z-[1000] overflow-hidden w-64"
      initial={{ opacity: 0, scale: 0.9, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="bg-gradient-to-r from-indigo-500 to-blue-500 py-2.5 px-3.5 flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-white/20 p-1 rounded-md mr-2">
            <TbSettings className="text-white" size={14} />
          </div>
          <h3 className="text-white font-medium text-sm tracking-wide">Segment Settings</h3>
        </div>
        <button
          onClick={onCancel}
          className="text-white/70 hover:text-white p-1.5 rounded-md hover:bg-white/10 transition-colors"
        >
          <LuX size={14} />
        </button>
      </div>

      <div className="p-3.5 space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center text-xs font-medium text-gray-500 mb-2">
            <MdOutlineCategory className="mr-1.5" size={14} />
            <span>Choose Category</span>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-md max-h-36 overflow-y-auto">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 1 },
                visible: { opacity: 1, transition: { staggerChildren: 0.03 } }
              }}
            >
              {entities.map((entity, index) => {
                let EntityIcon: IconType | null = null;
                
                if (entity.icon && typeof entity.icon === 'string') {
                  const iconKey = entity.icon as string;
                  
                  if (iconKey in iconMap) {
                    EntityIcon = iconMap[iconKey as IconKey];
                  }
                }
                
                const isSelected = selectedEntityId === entity.id;

                return (
                  <motion.div
                    key={entity.id}
                    custom={index}
                    variants={listItemVariants}
                    onClick={() => {
                      setSelectedEntityId(entity.id);
                      onEntityChange(entity);
                      if (entity.color) {
                        onColorChange(entity.color);
                      }
                    }}
                    className={`flex items-center px-2.5 py-1.5 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-100 transition-colors ${
                      isSelected ? "bg-indigo-50" : ""
                    }`}
                  >
                    <div className={`w-6 h-6 flex items-center justify-center rounded-md mr-2 ${isSelected ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-500"}`}>
                      {EntityIcon && <EntityIcon size={14} />}
                    </div>
                    <span className={`text-sm ${isSelected ? "font-medium text-indigo-700" : "text-gray-700"}`}>
                      {entity.name}
                    </span>
                    {isSelected && (
                      <div className="ml-auto">
                        <LuCheck className="text-indigo-500" size={14} />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="flex items-center text-xs font-medium text-gray-500">
            <FaTag className="mr-1.5" size={12} />
            <span>Notes (optional)</span>
          </label>
          <input
            type="text"
            value={localLabel}
            onChange={(e) => onLabelChange(e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
            placeholder="Enter segment name"
          />
        </div>
        
        <div className="flex justify-end pt-2 border-t border-gray-100 mt-3">
          <button
            onClick={onCancel}
            className="inline-flex items-center rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 mr-2 transition-colors"
          >
            <LuX className="mr-1.5" size={14} />
            Cancel
          </button>
          <button
            onClick={onCommit}
            className="inline-flex items-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600 transition-colors"
          >
            <LuCheck className="mr-1.5" size={14} />
            Apply
          </button>
        </div>
      </div>
    </motion.div>
  );
});

SegmentEditorMenu.displayName = "SegmentEditorMenu";

export default SegmentEditorMenu;
