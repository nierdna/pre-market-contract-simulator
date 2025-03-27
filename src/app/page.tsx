"use client";

import { useState } from "react";
import Dashboard from "@/components/Dashboard";
import Sidebar from "@/components/Sidebar";

export default function Home() {
  const [activeUser, setActiveUser] = useState<string>("Owner");

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar activeUser={activeUser} setActiveUser={setActiveUser} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Dashboard activeUser={activeUser} />
      </div>
    </div>
  );
}
