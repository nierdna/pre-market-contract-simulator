"use client";

import { users } from "@/lib/premarket";

interface SidebarProps {
  activeUser: string;
  setActiveUser: (user: string) => void;
}

export default function Sidebar({ activeUser, setActiveUser }: SidebarProps) {
  return (
    <div className="w-64 bg-gray-800 text-white min-h-screen overflow-y-auto">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">PreMarket Simulator</h1>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Current User</h2>
          <div className="space-y-2">
            {Object.entries(users).map(([key, user]) => (
              <button
                key={key}
                className={`w-full text-left px-3 py-2 rounded-md ${
                  activeUser === key
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-700"
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

        <div className="pt-4 border-t border-gray-700">
          <h2 className="text-lg font-semibold mb-2">Market Status</h2>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Market Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
