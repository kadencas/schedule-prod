"use client";

import React from 'react';
import { Allotment } from "allotment";
import "allotment/dist/style.css";

import ShiftScheduler from "../shift-builder2/page";
import EmployeeTimelinePage from "../all-schedule-view-day/page";
import App from '../high-level2/page';
import UserSchedule from '../high-level2-user/page';

export default function CombinedPage() {
  return (
    <div className="h-screen bg-zinc-50">
      <Allotment vertical defaultSizes={[35, 65]}>
        
        {/* Top Pane */}
        <Allotment.Pane minSize={100}>
          {/* 👇 The flex container is replaced with a nested Allotment */}
          <Allotment>
            {/* Left Pane (in top section) */}
            <Allotment.Pane minSize={100}>
              <div className="h-full overflow-auto">
                <App />
              </div>
            </Allotment.Pane>

            {/* Right Pane (in top section) */}
            <Allotment.Pane minSize={100}>
              <div className="h-full overflow-auto">
                <UserSchedule />
              </div>
            </Allotment.Pane>
          </Allotment>
        </Allotment.Pane>

        {/* Bottom Pane */}
        <Allotment.Pane minSize={100}>
           <div className="h-full overflow-auto">
              <EmployeeTimelinePage />
           </div>
        </Allotment.Pane>

      </Allotment>
    </div>
  );
}