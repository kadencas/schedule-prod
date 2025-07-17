"use client";

import React from 'react';
import { Allotment } from "allotment";
import "allotment/dist/style.css";

import ShiftScheduler from "../shift-builder2/page";
import EmployeeTimelinePage from "../all-schedule-view-day/page";
import App from '../high-level2/page';
import UserSchedule from '../high-level-user-3/page';

export default function CombinedPage() {
  return (
    <div className="h-screen bg-zinc-50">
      {/* Outer vertical split: top 50%, bottom 50% */}
      <Allotment vertical defaultSizes={[30, 70]}>

        {/* Top half: 2 panes @ 50/50 */}
        <Allotment.Pane>
          <Allotment defaultSizes={[50, 50]}>
            <Allotment.Pane minSize={100}>
              <div className="h-full overflow-auto">
                <App />
              </div>
            </Allotment.Pane>
            <Allotment.Pane minSize={100}>
              <div className="h-full overflow-auto">
                <UserSchedule />
              </div>
            </Allotment.Pane>
          </Allotment>
        </Allotment.Pane>

        {/* Bottom half: 2 panes split vertically @ 50/50 */}
        <Allotment.Pane>
          <Allotment vertical defaultSizes={[80, 30]}>
            <Allotment.Pane minSize={100}>
              <div className="h-full overflow-auto">
                <ShiftScheduler />

              </div>
            </Allotment.Pane>
            <Allotment.Pane minSize={100}>
              <div className="h-full overflow-auto">
                <EmployeeTimelinePage />
              </div>
            </Allotment.Pane>
          </Allotment>
        </Allotment.Pane>

      </Allotment>
    </div>
  );
}