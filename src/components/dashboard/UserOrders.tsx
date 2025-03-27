"use client";

import { useEffect, useState } from "react";
import { simulator, OpenOrderStatus, OpenOrderType } from "@/lib/premarket";
import type { Order, OpenOrder } from "@/lib/simulator/PreMarketSimulator";

interface UserOrdersProps {
  userAddress: string;
}

export default function UserOrders({ userAddress }: UserOrdersProps) {
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [matchedOrders, setMatchedOrders] = useState<Order[]>([]);
  const [exitOrderModalOpen, setExitOrderModalOpen] = useState(false);
  const [selectedOrderForExit, setSelectedOrderForExit] =
    useState<Order | null>(null);
  const [exitAmount, setExitAmount] = useState("");
  const [exitPrice, setExitPrice] = useState("");

  // Fetch user orders on component mount or when user changes
  useEffect(() => {
    fetchUserOrders();

    // Set up event listeners for real-time updates
    const onOrderCreated = () => fetchUserOrders();
    const onOrderMatched = () => fetchUserOrders();
    const onOrderCancelled = () => fetchUserOrders();

    simulator.onOrderCreated(onOrderCreated);
    simulator.onOpenOrderMatched(onOrderMatched);
    simulator.onOpenOrderCancelled(onOrderCancelled);

    return () => {
      // Clean up would happen here if we had a way to remove event listeners
    };
  }, [userAddress]);

  // Function to fetch user's orders
  const fetchUserOrders = () => {
    try {
      // Get open orders
      const userOpenOrderIds = simulator.getUserOpenOrders(userAddress);
      const fetchedOpenOrders = userOpenOrderIds.map((id) => {
        const order = simulator.getOpenOrder(id);
        return order;
      });

      // Get matched orders
      const userOrderIds = simulator.getUserOrders(userAddress);
      const fetchedMatchedOrders = userOrderIds.map((id) => {
        const order = simulator.getOrder(id);
        return order;
      });

      setOpenOrders(fetchedOpenOrders);
      setMatchedOrders(fetchedMatchedOrders);
    } catch (error) {
      console.error("Error fetching user orders:", error);
    }
  };

  // Function to cancel an open order
  const handleCancelOrder = (orderId: number) => {
    try {
      simulator.cancelOpenOrder(orderId, userAddress);
      fetchUserOrders(); // Refresh the list
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert(
        `Failed to cancel order: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  // Function to open exit order modal
  const openExitOrderModal = (order: Order) => {
    setSelectedOrderForExit(order);
    setExitAmount(order.amount.toString());
    setExitPrice("");
    setExitOrderModalOpen(true);
  };

  // Function to submit exit order
  const handleExitOrder = () => {
    if (!selectedOrderForExit || !exitAmount || !exitPrice) return;

    try {
      const exitAmountNum = parseFloat(exitAmount);
      const exitPriceNum = parseFloat(exitPrice);

      if (isNaN(exitAmountNum) || isNaN(exitPriceNum)) {
        throw new Error("Amount and price must be valid numbers");
      }

      simulator.exitOrderWithNewOpenOrder(
        selectedOrderForExit.id,
        exitAmountNum,
        exitPriceNum,
        userAddress
      );

      setExitOrderModalOpen(false);
      fetchUserOrders(); // Refresh the list
    } catch (error) {
      console.error("Error creating exit order:", error);
      alert(
        `Failed to create exit order: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  // Helper function to get order type as string
  const getOrderTypeString = (type: OpenOrderType) => {
    return type === OpenOrderType.Buy ? "Buy" : "Sell";
  };

  // Helper function to get order status as string
  const getOrderStatusString = (status: OpenOrderStatus) => {
    switch (status) {
      case OpenOrderStatus.Active:
        return "Active";
      case OpenOrderStatus.Matched:
        return "Matched";
      case OpenOrderStatus.Cancelled:
        return "Cancelled";
      case OpenOrderStatus.Settled:
        return "Settled";
      case OpenOrderStatus.SettlementFailed:
        return "Settlement Failed";
      default:
        return "Unknown";
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">My Orders</h2>

      {/* Open Orders Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Open Orders</h3>
        {openOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left">ID</th>
                  <th className="py-3 px-4 text-left">Type</th>
                  <th className="py-3 px-4 text-left">Amount</th>
                  <th className="py-3 px-4 text-left">Price</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Collateral</th>
                  <th className="py-3 px-4 text-left">Token</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {openOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <td className="py-3 px-4">{order.id}</td>
                    <td
                      className={`py-3 px-4 ${
                        order.orderType === OpenOrderType.Buy
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {getOrderTypeString(order.orderType)}
                    </td>
                    <td className="py-3 px-4">{order.amount}</td>
                    <td className="py-3 px-4">{order.price}</td>
                    <td className="py-3 px-4">
                      {getOrderStatusString(order.status)}
                    </td>
                    <td className="py-3 px-4">{order.collateral}</td>
                    <td className="py-3 px-4">{order.tokenId}</td>
                    <td className="py-3 px-4">
                      {order.status === OpenOrderStatus.Active && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-sm"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No open orders found.</p>
        )}
      </div>

      {/* Matched Orders Section */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Matched Orders</h3>
        {matchedOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left">ID</th>
                  <th className="py-3 px-4 text-left">Role</th>
                  <th className="py-3 px-4 text-left">Amount</th>
                  <th className="py-3 px-4 text-left">Buy Price</th>
                  <th className="py-3 px-4 text-left">Sell Price</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Counterparty</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {matchedOrders.map((order) => {
                  const isBuyer = order.buyer === userAddress;
                  const counterparty = isBuyer ? order.seller : order.buyer;
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <td className="py-3 px-4">{order.id}</td>
                      <td
                        className={`py-3 px-4 ${
                          isBuyer ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isBuyer ? "Buyer" : "Seller"}
                      </td>
                      <td className="py-3 px-4">{order.amount}</td>
                      <td className="py-3 px-4">{order.buyPrice}</td>
                      <td className="py-3 px-4">{order.sellPrice}</td>
                      <td className="py-3 px-4">
                        {order.isActive
                          ? "Active"
                          : order.settlementStatus === 1
                          ? "Settled"
                          : "Failed"}
                      </td>
                      <td className="py-3 px-4 truncate max-w-[200px]">
                        {counterparty}
                      </td>
                      <td className="py-3 px-4">
                        {order.isActive && (
                          <button
                            onClick={() => openExitOrderModal(order)}
                            className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-sm"
                          >
                            Exit Position
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No matched orders found.</p>
        )}
      </div>

      {/* Exit Order Modal */}
      {exitOrderModalOpen && selectedOrderForExit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Exit Position</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Order ID: {selectedOrderForExit.id}
              </label>
              <p className="text-sm mb-2">
                Role:{" "}
                {selectedOrderForExit.buyer === userAddress
                  ? "Buyer"
                  : "Seller"}
              </p>
              <p className="text-sm mb-4">
                Available Amount:{" "}
                {selectedOrderForExit.amount -
                  (selectedOrderForExit.exitedAmount || 0)}
              </p>

              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">
                  Exit Amount
                </label>
                <input
                  type="number"
                  value={exitAmount}
                  onChange={(e) => setExitAmount(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
                  max={
                    selectedOrderForExit.amount -
                    (selectedOrderForExit.exitedAmount || 0)
                  }
                  min="0.01"
                  step="0.01"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">
                  Exit Price
                </label>
                <input
                  type="number"
                  value={exitPrice}
                  onChange={(e) => setExitPrice(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
                  min="0.01"
                  step="0.01"
                  placeholder="Enter new price"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setExitOrderModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleExitOrder}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={!exitAmount || !exitPrice}
              >
                Create Exit Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
