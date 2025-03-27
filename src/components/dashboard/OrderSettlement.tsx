"use client";

import { useState, useEffect } from "react";
import { simulator, OpenOrderStatus } from "@/lib/premarket";

interface OrderSettlementProps {
  userAddress: string;
}

interface SettlementOrder {
  id: number;
  status: OpenOrderStatus;
  tokenId: number;
  tokenName: string;
  settlementDeadline: number;
  amount: number;
  price: number;
  matchedOrderIds: number[];
  trader: string;
}

export default function OrderSettlement({ userAddress }: OrderSettlementProps) {
  const [settlementOrders, setSettlementOrders] = useState<SettlementOrder[]>(
    []
  );
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [txProof, setTxProof] = useState("");
  const [tgeTimestamp, setTgeTimestamp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch settlement orders on component mount
  useEffect(() => {
    fetchSettlementOrders();

    // Listen for relevant events
    simulator.onOrderCreated(() => fetchSettlementOrders());
    simulator.onOpenOrderSettled(() => fetchSettlementOrders());
    simulator.onSettlementFailed(() => fetchSettlementOrders());
  }, [userAddress]);

  const fetchSettlementOrders = () => {
    setIsLoading(true);
    try {
      const userOrders = simulator.getUserOpenOrders(userAddress);
      const filteredOrders: SettlementOrder[] = [];

      // Loop through all of user's open orders
      for (const id of userOrders) {
        try {
          const order = simulator.getOpenOrder(id);

          // Only include matched orders that are ready for settlement
          if (
            (order.status === OpenOrderStatus.Matched ||
              order.matchedAmount > 0) &&
            order.trader === userAddress
          ) {
            // Get token name if available
            let tokenName = `Token ${order.tokenId}`;
            try {
              const token = simulator.getTokenById(order.tokenId);
              if (token) {
                tokenName = token.name;
              }
            } catch {
              // Token not found
            }

            filteredOrders.push({
              id: order.id,
              status: order.status,
              tokenId: order.tokenId,
              tokenName,
              settlementDeadline: order.settlementDeadline,
              amount: order.amount,
              price: order.price,
              matchedOrderIds: order.matchedOrderIds,
              trader: order.trader,
            });
          }
        } catch {
          // Skip orders that cannot be retrieved
        }
      }

      setSettlementOrders(filteredOrders);
    } catch (error) {
      console.error("Error fetching settlement orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format timestamp for display
  const formatDateTime = (timestamp: number) => {
    if (timestamp === 0) return "Not set";
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Handle setting TGE time for an order
  const handleSetTGE = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) {
      setErrorMessage("Please select an order");
      return;
    }

    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const tgeTime = new Date(tgeTimestamp).getTime() / 1000;

      if (isNaN(tgeTime)) {
        throw new Error("Invalid date/time format");
      }

      simulator.setTGEAndSettlementDeadline(
        selectedOrderId,
        Math.floor(tgeTime),
        userAddress
      );

      setSuccessMessage(
        `TGE time set successfully for order #${selectedOrderId}`
      );
      setTgeTimestamp("");

      // Refresh orders to show updated deadline
      fetchSettlementOrders();
    } catch (error) {
      console.error("Error setting TGE time:", error);
      setErrorMessage(
        `Failed to set TGE time: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle settlement completion
  const handleCompleteSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) {
      setErrorMessage("Please select an order");
      return;
    }

    if (!txProof.trim()) {
      setErrorMessage("Please provide settlement transaction proof");
      return;
    }

    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      simulator.completeSettlement(selectedOrderId, txProof, userAddress);

      setSuccessMessage(
        `Settlement completed successfully for order #${selectedOrderId}`
      );
      setTxProof("");
      setSelectedOrderId(null);

      // Refresh orders
      fetchSettlementOrders();
    } catch (error) {
      console.error("Error completing settlement:", error);
      setErrorMessage(
        `Failed to complete settlement: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Settlement Management</h2>

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

      <div className="mb-6 flex justify-end">
        <button
          onClick={fetchSettlementOrders}
          disabled={isLoading}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Refresh Orders
        </button>
      </div>

      {/* Orders List */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden mb-6">
        <h3 className="text-xl font-semibold p-6 border-b border-gray-200 dark:border-gray-700">
          Orders Awaiting Settlement
        </h3>

        {settlementOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Select
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Token
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Amount
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Price
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Settlement Deadline
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {settlementOrders.map((order) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      selectedOrderId === order.id
                        ? "bg-blue-50 dark:bg-blue-900"
                        : ""
                    }`}
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="radio"
                        name="orderSelect"
                        checked={selectedOrderId === order.id}
                        onChange={() => setSelectedOrderId(order.id)}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {order.tokenName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {order.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {order.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {OpenOrderStatus[order.status]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {formatDateTime(order.settlementDeadline)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No orders awaiting settlement.
          </div>
        )}
      </div>

      {/* Settlement Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Set TGE Time Form */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8">
          <h3 className="text-lg font-semibold mb-4">Set TGE Time</h3>

          <form onSubmit={handleSetTGE}>
            <div className="mb-4">
              <label
                className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                htmlFor="selectedOrderTGE"
              >
                Selected Order
              </label>
              <div className="py-2 px-3 bg-gray-100 dark:bg-gray-700 rounded">
                {selectedOrderId ? `#${selectedOrderId}` : "None selected"}
              </div>
            </div>

            <div className="mb-4">
              <label
                className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                htmlFor="tgeTimestamp"
              >
                TGE Date and Time
              </label>
              <input
                id="tgeTimestamp"
                type="datetime-local"
                value={tgeTimestamp}
                onChange={(e) => setTgeTimestamp(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !selectedOrderId}
              className={`${
                isLoading || !selectedOrderId
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-700"
              } text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full`}
            >
              {isLoading ? "Processing..." : "Set TGE Time"}
            </button>
          </form>
        </div>

        {/* Complete Settlement Form */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8">
          <h3 className="text-lg font-semibold mb-4">Complete Settlement</h3>

          <form onSubmit={handleCompleteSettlement}>
            <div className="mb-4">
              <label
                className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                htmlFor="selectedOrderSettle"
              >
                Selected Order
              </label>
              <div className="py-2 px-3 bg-gray-100 dark:bg-gray-700 rounded">
                {selectedOrderId ? `#${selectedOrderId}` : "None selected"}
              </div>
            </div>

            <div className="mb-4">
              <label
                className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                htmlFor="txProof"
              >
                Transaction Proof
              </label>
              <textarea
                id="txProof"
                value={txProof}
                onChange={(e) => setTxProof(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows={3}
                placeholder="Enter transaction ID or proof of token transfer"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !selectedOrderId}
              className={`${
                isLoading || !selectedOrderId
                  ? "bg-green-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-700"
              } text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full`}
            >
              {isLoading ? "Processing..." : "Complete Settlement"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
