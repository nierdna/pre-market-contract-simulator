"use client";

import { useState, useEffect } from "react";
import { simulator, OpenOrderType, OpenOrderStatus } from "@/lib/premarket";

interface OrderMatchingProps {
  userAddress: string;
}

// Định nghĩa kiểu dữ liệu cho OpenOrder đơn giản hóa
interface OpenOrderDisplay {
  id: number;
  orderType: OpenOrderType;
  amount: number;
  price: number;
  tokenId: number;
  trader: string;
  status: OpenOrderStatus;
  matchedAmount: number;
}

export default function OrderMatching({ userAddress }: OrderMatchingProps) {
  const [buyOrders, setBuyOrders] = useState<OpenOrderDisplay[]>([]);
  const [sellOrders, setSellOrders] = useState<OpenOrderDisplay[]>([]);
  const [selectedBuyOrder, setSelectedBuyOrder] =
    useState<OpenOrderDisplay | null>(null);
  const [selectedSellOrder, setSelectedSellOrder] =
    useState<OpenOrderDisplay | null>(null);
  const [matchAmount, setMatchAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedTokenId, setSelectedTokenId] = useState<number>(0);
  const [availableTokens, setAvailableTokens] = useState<
    { id: number; name: string }[]
  >([]);

  // Fetch open orders
  useEffect(() => {
    fetchOpenOrders();
    fetchAvailableTokens();

    // Listen for events
    simulator.onOpenOrderCreated(() => fetchOpenOrders());
    simulator.onOpenOrderMatched(() => fetchOpenOrders());
    simulator.onOpenOrderCancelled(() => fetchOpenOrders());
  }, []);

  // Re-fetch when tokenId changes
  useEffect(() => {
    fetchOpenOrders();
  }, [selectedTokenId]);

  const fetchAvailableTokens = () => {
    // For simplicity, hardcode to check tokens 1-10
    const tokens = [{ id: 0, name: "All Tokens" }];
    for (let i = 1; i <= 10; i++) {
      try {
        const token = simulator.getTokenById(i);
        if (token) {
          tokens.push({ id: token.id, name: token.name });
        }
      } catch {
        // Token doesn't exist
      }
    }
    setAvailableTokens(tokens);
  };

  const fetchOpenOrders = () => {
    setIsLoading(true);
    try {
      // In a real app, we would query for active open orders from the blockchain
      // Here we'll loop through all orders up to the current counter
      const buyOrdersFiltered: OpenOrderDisplay[] = [];
      const sellOrdersFiltered: OpenOrderDisplay[] = [];

      const totalOrders = simulator.getOpenOrderIdCounter();

      for (let i = 1; i <= totalOrders; i++) {
        try {
          const order = simulator.getOpenOrder(i);

          // Skip if not active or wrong token (if filter applied)
          if (order.status !== OpenOrderStatus.Active) continue;
          if (selectedTokenId > 0 && order.tokenId !== selectedTokenId)
            continue;

          const displayOrder: OpenOrderDisplay = {
            id: order.id,
            orderType: order.orderType,
            amount: order.amount,
            price: order.price,
            tokenId: order.tokenId,
            trader: order.trader,
            status: order.status,
            matchedAmount: order.matchedAmount,
          };

          // Add to appropriate list
          if (order.orderType === OpenOrderType.Buy) {
            buyOrdersFiltered.push(displayOrder);
          } else {
            sellOrdersFiltered.push(displayOrder);
          }
        } catch {
          // Skip orders that cannot be retrieved
        }
      }

      // Sort buy orders by price (descending) and time (ascending)
      buyOrdersFiltered.sort((a, b) => {
        if (a.price !== b.price) return b.price - a.price;
        return a.id - b.id; // Lower ID means earlier order
      });

      // Sort sell orders by price (ascending) and time (ascending)
      sellOrdersFiltered.sort((a, b) => {
        if (a.price !== b.price) return a.price - b.price;
        return a.id - b.id; // Lower ID means earlier order
      });

      setBuyOrders(buyOrdersFiltered);
      setSellOrders(sellOrdersFiltered);
    } catch (err) {
      console.error("Error fetching open orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMatchOrders = () => {
    if (!selectedBuyOrder || !selectedSellOrder || matchAmount <= 0) {
      setErrorMessage(
        "Please select both buy and sell orders and enter a valid match amount"
      );
      return;
    }

    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      simulator.matchOpenOrders(
        selectedBuyOrder.id,
        selectedSellOrder.id,
        matchAmount,
        userAddress
      );

      setSuccessMessage(
        `Successfully matched orders: Buy #${selectedBuyOrder.id} and Sell #${selectedSellOrder.id}`
      );

      // Reset selections
      setSelectedBuyOrder(null);
      setSelectedSellOrder(null);
      setMatchAmount(0);

      // Refresh orders
      fetchOpenOrders();
    } catch (error) {
      console.error("Error matching orders:", error);
      setErrorMessage(
        `Failed to match orders: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoMatch = () => {
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const tokenIdToUse = selectedTokenId > 0 ? selectedTokenId : 0;
      const matchCount = simulator.autoMatchOrders(
        tokenIdToUse,
        "price", // strategy - prioritize by best price
        10, // max 10 matches per run
        userAddress
      );

      setSuccessMessage(
        `Auto-matching complete. Successfully matched ${matchCount} pairs of orders.`
      );

      // Refresh orders
      fetchOpenOrders();
    } catch (error) {
      console.error("Error auto-matching orders:", error);
      setErrorMessage(
        `Failed to auto-match orders: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate max possible match amount between selected orders
  const calculateMaxMatchAmount = () => {
    try {
      if (!selectedBuyOrder || !selectedSellOrder) return 0;

      // Get the remaining (unfilled) amount for each order
      const buyOrder = simulator.getOpenOrder(selectedBuyOrder.id);
      const sellOrder = simulator.getOpenOrder(selectedSellOrder.id);

      const buyRemainingAmount = buyOrder.amount - buyOrder.matchedAmount;
      const sellRemainingAmount = sellOrder.amount - sellOrder.matchedAmount;

      // Can't match more than either remaining amount
      return Math.min(buyRemainingAmount, sellRemainingAmount);
    } catch {
      return 0;
    }
  };

  // Set max match amount when both orders are selected
  useEffect(() => {
    if (selectedBuyOrder && selectedSellOrder) {
      const maxAmount = calculateMaxMatchAmount();
      setMatchAmount(maxAmount);
    } else {
      setMatchAmount(0);
    }
  }, [selectedBuyOrder, selectedSellOrder]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Order Matching</h2>

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

      <div className="mb-4">
        <label
          className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
          htmlFor="tokenFilter"
        >
          Filter by Token
        </label>
        <select
          id="tokenFilter"
          value={selectedTokenId}
          onChange={(e) => setSelectedTokenId(Number(e.target.value))}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          {availableTokens.map((token) => (
            <option key={token.id} value={token.id}>
              {token.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={fetchOpenOrders}
          disabled={isLoading}
          className="mr-2 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Refresh
        </button>
        <button
          onClick={handleAutoMatch}
          disabled={isLoading}
          className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Auto-Match
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Buy Orders */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Buy Orders</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left">Select</th>
                  <th className="py-3 px-4 text-left">ID</th>
                  <th className="py-3 px-4 text-left">Token</th>
                  <th className="py-3 px-4 text-left">Price</th>
                  <th className="py-3 px-4 text-left">Available</th>
                  <th className="py-3 px-4 text-left">Trader</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {buyOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-4 px-4 text-center text-gray-500"
                    >
                      No buy orders available
                    </td>
                  </tr>
                ) : (
                  buyOrders.map((order) => {
                    const remainingAmount = order.amount - order.matchedAmount;
                    return (
                      <tr
                        key={order.id}
                        className={`hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          selectedBuyOrder === order
                            ? "bg-blue-50 dark:bg-blue-900"
                            : ""
                        }`}
                        onClick={() => setSelectedBuyOrder(order)}
                      >
                        <td className="py-3 px-4">
                          <input
                            type="radio"
                            name="buyOrder"
                            checked={selectedBuyOrder === order}
                            onChange={() => setSelectedBuyOrder(order)}
                            className="form-radio h-4 w-4 text-blue-600"
                          />
                        </td>
                        <td className="py-3 px-4">{order.id}</td>
                        <td className="py-3 px-4">{order.tokenId}</td>
                        <td className="py-3 px-4 text-green-600 font-medium">
                          {order.price}
                        </td>
                        <td className="py-3 px-4">
                          {remainingAmount} / {order.amount}
                        </td>
                        <td className="py-3 px-4 truncate max-w-[100px]">
                          {order.trader}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sell Orders */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Sell Orders</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left">Select</th>
                  <th className="py-3 px-4 text-left">ID</th>
                  <th className="py-3 px-4 text-left">Token</th>
                  <th className="py-3 px-4 text-left">Price</th>
                  <th className="py-3 px-4 text-left">Available</th>
                  <th className="py-3 px-4 text-left">Trader</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sellOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-4 px-4 text-center text-gray-500"
                    >
                      No sell orders available
                    </td>
                  </tr>
                ) : (
                  sellOrders.map((order) => {
                    const remainingAmount = order.amount - order.matchedAmount;
                    return (
                      <tr
                        key={order.id}
                        className={`hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          selectedSellOrder === order
                            ? "bg-blue-50 dark:bg-blue-900"
                            : ""
                        }`}
                        onClick={() => setSelectedSellOrder(order)}
                      >
                        <td className="py-3 px-4">
                          <input
                            type="radio"
                            name="sellOrder"
                            checked={selectedSellOrder === order}
                            onChange={() => setSelectedSellOrder(order)}
                            className="form-radio h-4 w-4 text-blue-600"
                          />
                        </td>
                        <td className="py-3 px-4">{order.id}</td>
                        <td className="py-3 px-4">{order.tokenId}</td>
                        <td className="py-3 px-4 text-red-600 font-medium">
                          {order.price}
                        </td>
                        <td className="py-3 px-4">
                          {remainingAmount} / {order.amount}
                        </td>
                        <td className="py-3 px-4 truncate max-w-[100px]">
                          {order.trader}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manual Match Controls */}
      <div className="mt-8 bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Match Selected Orders</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Buy Order
            </label>
            <div className="bg-white dark:bg-gray-700 rounded p-2 border border-gray-300 dark:border-gray-600">
              {selectedBuyOrder ? `#${selectedBuyOrder.id}` : "None Selected"}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Sell Order
            </label>
            <div className="bg-white dark:bg-gray-700 rounded p-2 border border-gray-300 dark:border-gray-600">
              {selectedSellOrder ? `#${selectedSellOrder.id}` : "None Selected"}
            </div>
          </div>

          <div>
            <label
              className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
              htmlFor="matchAmount"
            >
              Match Amount
            </label>
            <input
              id="matchAmount"
              type="number"
              value={matchAmount}
              onChange={(e) => setMatchAmount(Number(e.target.value))}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              min="1"
              max={calculateMaxMatchAmount()}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={handleMatchOrders}
            disabled={
              isLoading ||
              !selectedBuyOrder ||
              !selectedSellOrder ||
              matchAmount <= 0
            }
            className={`${
              isLoading ||
              !selectedBuyOrder ||
              !selectedSellOrder ||
              matchAmount <= 0
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-700"
            } text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline`}
          >
            {isLoading ? "Processing..." : "Match Orders"}
          </button>
        </div>
      </div>
    </div>
  );
}
