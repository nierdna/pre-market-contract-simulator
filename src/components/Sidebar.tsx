"use client";

import { users } from "@/lib/premarket";

interface SidebarProps {
  activeUser: string;
  setActiveUser: (user: string) => void;
}

export default function Sidebar({ activeUser, setActiveUser }: SidebarProps) {
  return (
    <div className="w-80 bg-dark-200 text-gray-200 min-h-screen overflow-y-auto border-r border-gray-700">
      <div className="p-8 space-y-8">
        <h1 className="text-2xl font-bold mb-8 text-blue-400 flex items-center">
          <svg
            className="h-7 w-7 mr-3 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          PreMarket Simulator
        </h1>

        <div className="component-card">
          <h2 className="subsection-title">
            <svg
              className="h-5 w-5 mr-3 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Current User
          </h2>
          <div className="space-y-3 mt-4">
            {Object.entries(users).map(([key, user]) => (
              <button
                key={key}
                className={`w-full text-left px-4 py-3 rounded-md transition-all duration-200 ${
                  activeUser === key
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-dark-100 hover:bg-dark-300 text-gray-300"
                }`}
                onClick={() => setActiveUser(key)}
              >
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-gray-300 truncate">
                  {user.address}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="component-card mt-8">
          <h2 className="subsection-title">
            <svg
              className="h-5 w-5 mr-3 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Market Status
          </h2>
          <div className="flex items-center space-x-3 mt-4 bg-dark-100 p-4 rounded-lg">
            <span className="relative flex h-4 w-4 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
            </span>
            <span className="font-medium">Market Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
