"use client";

import { useState } from "react";
import MarketInfo from "./dashboard/MarketInfo";
import TokenManagement from "./dashboard/TokenManagement";
import OrderPlacement from "./dashboard/OrderPlacement";
import OrderMatching from "./dashboard/OrderMatching";
import OrderSettlement from "./dashboard/OrderSettlement";
import UserOrders from "./dashboard/UserOrders";
import EventLog from "./dashboard/EventLog";
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
      <div className="bg-white dark:bg-gray-800 shadow-md p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">
              Welcome, {currentUser.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentUser.address}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-200 dark:bg-gray-700 px-4">
        <div className="flex overflow-x-auto">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-3 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
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
