"use client";

import { useState } from "react";
import MarketInfo from "./dashboard/MarketInfo";
import TokenManagement from "./dashboard/TokenManagement";
import OrderPlacement from "./dashboard/OrderPlacement";
import OrderMatching from "./dashboard/OrderMatching";
import OrderSettlement from "./dashboard/OrderSettlement";
import UserOrders from "./dashboard/UserOrders";
import EventLog from "./dashboard/EventLog";
import AutoTrader from "./dashboard/AutoTrader";
import { users } from "@/lib/premarket";

interface DashboardProps {
  activeUser: string;
}

export default function Dashboard({ activeUser }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("orders");
  const currentUser = users[activeUser as keyof typeof users];
  const isOwner = activeUser === "Owner";

  const tabs = [
    { id: "orders", label: "My Orders", access: "all" },
    { id: "place-order", label: "Place Order", access: "all" },
    { id: "match-orders", label: "Match Orders", access: "owner" },
    { id: "settlement", label: "Settlement", access: "all" },
    { id: "auto-trader", label: "Auto Trader", access: "owner" },
    { id: "tokens", label: "Token Management", access: "owner" },
    { id: "market", label: "Market Settings", access: "owner" },
    { id: "events", label: "Event Log", access: "all" },
  ];

  // Filter tabs based on user access
  const availableTabs = tabs.filter(
    (tab) => tab.access === "all" || (tab.access === "owner" && isOwner)
  );

  return (
    <div className="h-full">
      {/* Header with user info */}
      <div className="bg-dark-100 shadow-md p-5 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-200 flex items-center">
              <svg
                className="h-6 w-6 mr-3 text-blue-400"
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
              Welcome, {currentUser.name}
            </h2>
            <p className="text-sm text-gray-400 ml-9">{currentUser.address}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-dark-300 px-5 border-b border-gray-700">
        <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-dark-100">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-5 py-4 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.id
                  ? "border-b-2 border-blue-500 text-blue-400"
                  : "text-gray-300 hover:text-gray-100"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-8 bg-dark-200">
        {activeTab === "orders" && (
          <UserOrders userAddress={currentUser.address} />
        )}
        {activeTab === "place-order" && (
          <OrderPlacement userAddress={currentUser.address} />
        )}
        {activeTab === "match-orders" && (
          <OrderMatching userAddress={currentUser.address} />
        )}
        {activeTab === "settlement" && (
          <OrderSettlement userAddress={currentUser.address} />
        )}
        {activeTab === "auto-trader" && (
          <AutoTrader userAddress={currentUser.address} />
        )}
        {activeTab === "tokens" && (
          <TokenManagement userAddress={currentUser.address} />
        )}
        {activeTab === "market" && (
          <MarketInfo userAddress={currentUser.address} />
        )}
        {activeTab === "events" && <EventLog />}
      </div>
    </div>
  );
}
