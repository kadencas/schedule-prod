"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Employee } from "@/types/types";
import MyScheduleTab from "./MyScheduleTab";
import ViewDayTab from "./ViewDayTab";
import ViewPeopleTab from "./ViewPeopleTab"
import ViewEntitiesTab from "./ViewEntitiesTab"
import ViewEntitiesScheduleTab from "./ViewEntitiesScheduleTab";
import { localizer } from "./helpers/calendar";


interface ClientDashboardProps {
  companyName: string;
  userName: string;
}

/**
 * ClientDashboard is a client-side component responsible for rendering the main dashboard UI.
 * 
 * It handles the following:
 * - Displays the company name and user-facing navigation
 * - Fetches the logged-in user's shift data using their userName
 * - Manages tab state (main and sub tabs) to control which section of the dashboard is shown
 * - Displays the appropriate content component based on the selected tab
 * 
 * Props:
 * @param {string} companyName - The name of the company the user belongs to (passed from server)
 * @param {string} userName - The logged-in user's name (used to match and display their shifts)
 * 
 * @returns {JSX.Element} The main interactive dashboard UI
 */

export default function ClientDashboard({ companyName, userName }: ClientDashboardProps) {
  const [activeMainTab, setActiveMainTab] = useState<"me" | "peopleSchedule" | "tagSchedule" | "management">("me");
  const [activeSubTab, setActiveSubTab] = useState<"mySchedule" | "viewDay" | "tagsSchedule" | "people" | "tags">("mySchedule");
  const { status } = useSession();
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);


  useEffect(() => {
    async function fetchEmployeeShifts() {
      try {
        const res = await fetch("/api/shifts");
        const data = await res.json();
        const employee = data.employees.find(
          (e: { name: string }) => e.name === userName
        );
        setEmployeeData(employee);
      } catch (error) {
        console.error("Error fetching shifts:", error);
      }
    }
    if (userName !== "Employee") {
      fetchEmployeeShifts();
    }
  }, [userName]);


  useEffect(() => {
    switch (activeMainTab) {
      case "me":
        setActiveSubTab("mySchedule");
        break;
      case "peopleSchedule":
        setActiveSubTab("viewDay");
        break;
      case "tagSchedule":
        setActiveSubTab("tagsSchedule");
        break;
      case "management":
        setActiveSubTab("people");
        break;
    }
  }, [activeMainTab]);

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity }}>
          <p className="text-gray-500 text-lg">Loading dashboard...</p>
        </motion.div>
      </main>
    );
  }

  return (
    <div className="relative bg-[#F9F7F4] min-h-screen">
      <motion.div
        className="absolute w-64 h-64 bg-blue-200 rounded-full filter blur-3xl opacity-50"
        style={{ top: "-100px", left: "-100px" }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-48 h-48 bg-green-200 rounded-full filter blur-3xl opacity-50"
        style={{ bottom: "-50px", right: "-50px" }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-800 mr-8">
              {companyName || "Loading Company..."}
            </h1>
            <nav className="flex space-x-1">
              <button
                onClick={() => setActiveMainTab("me")}
                className={`px-4 py-2 rounded-md font-medium text-sm focus:outline-none transition-all duration-200 ${activeMainTab === "me"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                Me
              </button>
              <button
                onClick={() => setActiveMainTab("peopleSchedule")}
                className={`px-4 py-2 rounded-md font-medium text-sm focus:outline-none transition-all duration-200 ${activeMainTab === "peopleSchedule"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                Employees Schedule
              </button>
              <button
                onClick={() => setActiveMainTab("tagSchedule")}
                className={`px-4 py-2 rounded-md font-medium text-sm focus:outline-none transition-all duration-200 ${activeMainTab === "tagSchedule"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                Tags Schedule
              </button>
              <button
                onClick={() => setActiveMainTab("management")}
                className={`px-4 py-2 rounded-md font-medium text-sm focus:outline-none transition-all duration-200 ${activeMainTab === "management"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                People & Tags
              </button>
            </nav>
          </div>

          <button
            onClick={() => signOut({ redirect: true, callbackUrl: "/" })}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            Sign Out
          </button>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 border-t border-gray-100">
          <div className="flex space-x-1 h-12">
            {activeMainTab === "me" && (
              <>
                <button
                  onClick={() => setActiveSubTab("mySchedule")}
                  className={`px-4 py-1.5 rounded-md font-medium text-sm focus:outline-none transition-all duration-200 ${activeSubTab === "mySchedule"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-blue-500"
                    }`}
                >
                  My Schedule
                </button>
              </>
            )}
            {activeMainTab === "peopleSchedule" && (
              <>
                <button
                  onClick={() => setActiveSubTab("viewDay")}
                  className={`px-4 py-1.5 rounded-md font-medium text-sm focus:outline-none transition-all duration-200 ${activeSubTab === "viewDay"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-blue-500"
                    }`}
                >
                  Daily View
                </button>
              </>
            )}
            {activeMainTab === "tagSchedule" && (
              <button
                onClick={() => setActiveSubTab("tagsSchedule")}
                className={`px-4 py-1.5 rounded-md font-medium text-sm focus:outline-none transition-all duration-200 ${activeSubTab === "tagsSchedule"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-blue-500"
                  }`}
              >
                Tags Schedule
              </button>
            )}
            {activeMainTab === "management" && (
              <>
                <button
                  onClick={() => setActiveSubTab("people")}
                  className={`px-4 py-1.5 rounded-md font-medium text-sm focus:outline-none transition-all duration-200 ${activeSubTab === "people"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-blue-500"
                    }`}
                >
                  People
                </button>
                <button
                  onClick={() => setActiveSubTab("tags")}
                  className={`px-4 py-1.5 rounded-md font-medium text-sm focus:outline-none transition-all duration-200 ${activeSubTab === "tags"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-blue-500"
                    }`}
                >
                  Tags
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto p-6 z-10 relative">
        {/* Tab Content */}
        <div className="p-6 w-full">
          {activeSubTab === "mySchedule" && (<MyScheduleTab employeeData={employeeData} userName={userName} localizer={localizer} />)}
          {activeSubTab === "viewDay" && <ViewDayTab />}
          {activeSubTab === "tagsSchedule" && <ViewEntitiesScheduleTab />}
          {activeSubTab === "people" && <ViewPeopleTab />}
          {activeSubTab === "tags" && <ViewEntitiesTab />}
        </div>
      </main>
    </div>
  );
}