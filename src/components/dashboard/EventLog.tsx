"use client";

import { useState, useEffect } from "react";
import { simulator } from "@/lib/premarket";

interface Event {
  id: number;
  timestamp: number;
  type: string;
  details: string;
}

export default function EventLog() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventCounter, setEventCounter] = useState(0);

  useEffect(() => {
    // Set up event listeners for all event types

    simulator.onOpenOrderCreated((event) => {
      addEvent(
        "OpenOrderCreated",
        `Order #${event.openOrderId} created by ${event.trader}`
      );
    });

    simulator.onOpenOrderMatched((event) => {
      addEvent(
        "OpenOrderMatched",
        `Buy #${event.buyOpenOrderId} and Sell #${event.sellOpenOrderId} matched`
      );
    });

    simulator.onOpenOrderCancelled((event) => {
      addEvent("OpenOrderCancelled", `Order #${event.openOrderId} cancelled`);
    });

    simulator.onOpenOrderSettled((event) => {
      addEvent(
        "OpenOrderSettled",
        `Order #${event.openOrderId} settled by ${event.settler}`
      );
    });

    simulator.onSettlementFailed((event) => {
      addEvent(
        "SettlementFailed",
        `Settlement for Order #${event.openOrderId} failed`
      );
    });

    simulator.onOrderCreated((event) => {
      addEvent(
        "OrderCreated",
        `Order #${event.orderId} created between ${event.buyer} (buyer) and ${event.seller} (seller)`
      );
    });

    simulator.onOrderExited((event) => {
      addEvent(
        "OrderExited",
        `Order #${event.orderId} exited to Order #${event.newOrderId}`
      );
    });

    simulator.onMarketStatusChanged((event) => {
      addEvent(
        "MarketStatusChanged",
        `Market is now ${event.isActive ? "active" : "inactive"}`
      );
    });

    simulator.onTokenRegistered((event) => {
      addEvent(
        "TokenRegistered",
        `Token "${event.name}" (ID: ${event.tokenId}) registered`
      );
    });

    // Add a few initial example events for display
    addEvent("SystemInitialized", "PreMarket simulator initialized");
    addEvent("MarketStatusChanged", "Market is now active");
  }, []);

  const addEvent = (type: string, details: string) => {
    setEventCounter((prev) => prev + 1);
    setEvents((prevEvents) =>
      [
        {
          id: eventCounter,
          timestamp: Math.floor(Date.now() / 1000),
          type,
          details,
        },
        ...prevEvents,
      ].slice(0, 100)
    ); // Limit to 100 most recent events
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "OpenOrderCreated":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "OpenOrderMatched":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "OpenOrderCancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "OpenOrderSettled":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "SettlementFailed":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "OrderCreated":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "OrderExited":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "MarketStatusChanged":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
      case "TokenRegistered":
        return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Event Log</h2>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Recent Events</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Showing {events.length} events
          </span>
        </div>

        <div className="overflow-auto max-h-[600px]">
          {events.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${getEventTypeColor(
                        event.type
                      )}`}
                    >
                      {event.type}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(event.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {event.details}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No events recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
