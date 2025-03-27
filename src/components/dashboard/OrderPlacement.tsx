"use client";

import { useState, useEffect } from "react";
import { simulator, OpenOrderType } from "@/lib/premarket";

interface OrderPlacementProps {
  userAddress: string;
}

export default function OrderPlacement({ userAddress }: OrderPlacementProps) {
  const [orderType, setOrderType] = useState<OpenOrderType>(OpenOrderType.Buy);
  const [amount, setAmount] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [tokenId, setTokenId] = useState<number>(1);
  const [availableTokens, setAvailableTokens] = useState<
    { id: number; name: string }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch available tokens
  const fetchAvailableTokens = () => {
    // For simplicity, we're hardcoding to check tokens 1-10
    // In a real app, you'd query the blockchain for registered tokens
    const tokens = [];
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

  useEffect(() => {
    fetchAvailableTokens();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      // Validate inputs
      if (amount <= 0) throw new Error("Amount must be greater than zero");
      if (price <= 0) throw new Error("Price must be greater than zero");

      // Place the order using the simulator
      const exchangeToken = "0x0000000000000000000000000000000000000000"; // ETH by default
      const orderId = simulator.placeOpenOrder(
        orderType,
        amount,
        price,
        tokenId,
        exchangeToken,
        userAddress
      );

      setSuccessMessage(`Order placed successfully! Order ID: ${orderId}`);

      // Reset form
      setAmount(0);
      setPrice(0);
    } catch (error) {
      console.error("Error placing order:", error);
      setErrorMessage(
        `Failed to place order: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Place New Order</h2>

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

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="mb-4">
            <label
              className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
              htmlFor="orderType"
            >
              Order Type
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="orderType"
                  value={OpenOrderType.Buy}
                  checked={orderType === OpenOrderType.Buy}
                  onChange={() => setOrderType(OpenOrderType.Buy)}
                  className="form-radio h-5 w-5 text-blue-600"
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">
                  Buy
                </span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="orderType"
                  value={OpenOrderType.Sell}
                  checked={orderType === OpenOrderType.Sell}
                  onChange={() => setOrderType(OpenOrderType.Sell)}
                  className="form-radio h-5 w-5 text-blue-600"
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">
                  Sell
                </span>
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
              htmlFor="tokenId"
            >
              Token
            </label>
            <select
              id="tokenId"
              value={tokenId}
              onChange={(e) => setTokenId(Number(e.target.value))}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              {availableTokens.map((token) => (
                <option key={token.id} value={token.id}>
                  {token.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
              htmlFor="amount"
            >
              Amount
            </label>
            <input
              id="amount"
              type="number"
              value={amount === 0 ? "" : amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter amount"
              min="0"
              step="1"
            />
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
              htmlFor="price"
            >
              Price
            </label>
            <input
              id="price"
              type="number"
              value={price === 0 ? "" : price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter price"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="flex items-center justify-center mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${
              isSubmitting
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-700"
            } text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
          >
            {isSubmitting ? "Processing..." : "Place Order"}
          </button>
        </div>
      </form>
    </div>
  );
}
