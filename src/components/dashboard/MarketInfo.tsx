"use client";

import { useState, useEffect } from "react";
import { simulator } from "@/lib/premarket";

interface MarketInfoProps {
  userAddress: string;
}

export default function MarketInfo({ userAddress }: MarketInfoProps) {
  const [isMarketActive, setIsMarketActive] = useState(false);
  const [marketOpenTime, setMarketOpenTime] = useState(0);
  const [marketCloseTime, setMarketCloseTime] = useState(0);
  const [settlementPeriod, setSettlementPeriod] = useState(0);
  const [newOpenTime, setNewOpenTime] = useState("");
  const [newCloseTime, setNewCloseTime] = useState("");
  const [newSettlementPeriod, setNewSettlementPeriod] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch market info on component mount
  useEffect(() => {
    fetchMarketInfo();
  }, []);

  const fetchMarketInfo = () => {
    try {
      setIsMarketActive(simulator.getIsActive());
      setMarketOpenTime(simulator.getMarketOpenTime());
      setMarketCloseTime(simulator.getMarketCloseTime());
      setSettlementPeriod(simulator.getSettlementPeriod());

      // Initialize form fields with current values
      setNewOpenTime(formatDateTimeLocal(simulator.getMarketOpenTime() * 1000));
      setNewCloseTime(
        formatDateTimeLocal(simulator.getMarketCloseTime() * 1000)
      );
      setNewSettlementPeriod(
        String(simulator.getSettlementPeriod() / (24 * 60 * 60))
      ); // Convert seconds to days
    } catch (error) {
      console.error("Error fetching market info:", error);
    }
  };

  // Convert Unix timestamp to yyyy-MM-ddThh:mm format for datetime-local input
  const formatDateTimeLocal = (timestamp: number) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Format Unix timestamp for display
  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Handle market status toggle
  const handleToggleMarketStatus = async () => {
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      simulator.setMarketStatus(!isMarketActive, userAddress);
      setIsMarketActive(!isMarketActive);
      setSuccessMessage(
        `Market status changed to ${!isMarketActive ? "active" : "inactive"}`
      );
    } catch (error) {
      console.error("Error toggling market status:", error);
      setErrorMessage(
        `Failed to toggle market status: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle market hours form submission
  const handleUpdateMarketHours = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const openTimestamp = Math.floor(new Date(newOpenTime).getTime() / 1000);
      const closeTimestamp = Math.floor(
        new Date(newCloseTime).getTime() / 1000
      );

      if (openTimestamp >= closeTimestamp) {
        throw new Error("Open time must be before close time");
      }

      simulator.setMarketHours(openTimestamp, closeTimestamp, userAddress);
      setMarketOpenTime(openTimestamp);
      setMarketCloseTime(closeTimestamp);
      setSuccessMessage("Market hours updated successfully");
    } catch (error) {
      console.error("Error updating market hours:", error);
      setErrorMessage(
        `Failed to update market hours: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle settlement period form submission
  const handleUpdateSettlementPeriod = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const periodInDays = parseFloat(newSettlementPeriod);
      if (isNaN(periodInDays) || periodInDays <= 0) {
        throw new Error("Settlement period must be a positive number");
      }

      const periodInSeconds = Math.floor(periodInDays * 24 * 60 * 60); // Convert days to seconds
      simulator.setSettlementPeriod(periodInSeconds, userAddress);
      setSettlementPeriod(periodInSeconds);
      setSuccessMessage("Settlement period updated successfully");
    } catch (error) {
      console.error("Error updating settlement period:", error);
      setErrorMessage(
        `Failed to update settlement period: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Market Settings</h2>

      {successMessage && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline"> {successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {errorMessage}</span>
        </div>
      )}

      {/* Market Status */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-6">
        <h3 className="text-xl font-semibold mb-4">Market Status</h3>

        <div className="flex items-center mb-4">
          <div
            className={`w-4 h-4 rounded-full mr-2 ${
              isMarketActive ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <span className="text-lg">
            Market is currently {isMarketActive ? "Active" : "Inactive"}
          </span>
        </div>

        <button
          onClick={handleToggleMarketStatus}
          disabled={isLoading}
          className={`${
            isLoading
              ? "bg-blue-400 cursor-not-allowed"
              : isMarketActive
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-500 hover:bg-green-600"
          } text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
        >
          {isLoading
            ? "Processing..."
            : isMarketActive
            ? "Deactivate Market"
            : "Activate Market"}
        </button>
      </div>

      {/* Market Hours */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-6">
        <h3 className="text-xl font-semibold mb-4">Market Hours</h3>

        <div className="mb-4">
          <p className="mb-2">
            <strong>Current Open Time:</strong> {formatDateTime(marketOpenTime)}
          </p>
          <p>
            <strong>Current Close Time:</strong>{" "}
            {formatDateTime(marketCloseTime)}
          </p>
        </div>

        <form onSubmit={handleUpdateMarketHours}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label
                className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                htmlFor="newOpenTime"
              >
                New Open Time
              </label>
              <input
                id="newOpenTime"
                type="datetime-local"
                value={newOpenTime}
                onChange={(e) => setNewOpenTime(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>

            <div className="mb-4">
              <label
                className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                htmlFor="newCloseTime"
              >
                New Close Time
              </label>
              <input
                id="newCloseTime"
                type="datetime-local"
                value={newCloseTime}
                onChange={(e) => setNewCloseTime(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`${
              isLoading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-700"
            } text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
          >
            {isLoading ? "Processing..." : "Update Market Hours"}
          </button>
        </form>
      </div>

      {/* Settlement Period */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-6">
        <h3 className="text-xl font-semibold mb-4">
          Default Settlement Period
        </h3>

        <div className="mb-4">
          <p>
            <strong>Current Settlement Period:</strong>{" "}
            {settlementPeriod / (24 * 60 * 60)} days ({settlementPeriod}{" "}
            seconds)
          </p>
        </div>

        <form onSubmit={handleUpdateSettlementPeriod}>
          <div className="mb-4">
            <label
              className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
              htmlFor="newSettlementPeriod"
            >
              New Settlement Period (days)
            </label>
            <input
              id="newSettlementPeriod"
              type="number"
              value={newSettlementPeriod}
              onChange={(e) => setNewSettlementPeriod(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              min="0.1"
              step="0.1"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`${
              isLoading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-700"
            } text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
          >
            {isLoading ? "Processing..." : "Update Settlement Period"}
          </button>
        </form>
      </div>
    </div>
  );
}
