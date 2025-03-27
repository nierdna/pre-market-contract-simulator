"use client";

import { useState, useEffect } from "react";
import { simulator } from "@/lib/premarket";

interface TokenManagementProps {
  userAddress: string;
}

interface TokenInfo {
  id: number;
  name: string;
  settleDuration: number;
  collateralPercentage: number;
}

export default function TokenManagement({ userAddress }: TokenManagementProps) {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [tokenIdCounter, setTokenIdCounter] = useState(0);
  const [newTokenId, setNewTokenId] = useState("");
  const [newTokenName, setNewTokenName] = useState("");
  const [newSettleDuration, setNewSettleDuration] = useState("7"); // Default 7 days
  const [newCollateralPercentage, setNewCollateralPercentage] = useState("10"); // Default 10%
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch tokens on component mount
  useEffect(() => {
    fetchTokens();

    // Listen for token registered events
    simulator.onTokenRegistered(() => {
      fetchTokens();
    });
  }, []);

  const fetchTokens = () => {
    try {
      // Get the current token counter
      const counter = simulator.getTokenIdCounter();
      setTokenIdCounter(counter);

      // For simplicity, we'll check each token ID up to the counter
      const tokenList: TokenInfo[] = [];
      for (let i = 1; i <= counter; i++) {
        try {
          const token = simulator.getTokenById(i);
          if (token) {
            tokenList.push(token);
          }
        } catch {
          // Token with this ID may not exist
        }
      }

      setTokens(tokenList);

      // Default next ID to counter + 1
      setNewTokenId(String(counter + 1));
    } catch (error) {
      console.error("Error fetching tokens:", error);
    }
  };

  const handleRegisterToken = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const tokenId = parseInt(newTokenId);
      const settleDurationDays = parseFloat(newSettleDuration);
      const collateralPercentage = parseFloat(newCollateralPercentage);

      // Input validation
      if (isNaN(tokenId) || tokenId <= 0) {
        throw new Error("Token ID must be a positive number");
      }

      if (!newTokenName || newTokenName.trim() === "") {
        throw new Error("Token name cannot be empty");
      }

      if (isNaN(settleDurationDays) || settleDurationDays <= 0) {
        throw new Error("Settlement duration must be a positive number");
      }

      if (
        isNaN(collateralPercentage) ||
        collateralPercentage <= 0 ||
        collateralPercentage > 100
      ) {
        throw new Error("Collateral percentage must be between 1-100");
      }

      // Convert settlement duration from days to seconds
      const settleDurationSeconds = Math.floor(
        settleDurationDays * 24 * 60 * 60
      );

      // Register the token
      simulator.registerToken(
        tokenId,
        newTokenName,
        settleDurationSeconds,
        collateralPercentage,
        userAddress
      );

      setSuccessMessage(
        `Token "${newTokenName}" registered successfully with ID ${tokenId}`
      );

      // Reset form
      setNewTokenId(String(Math.max(tokenId, tokenIdCounter) + 1));
      setNewTokenName("");
      setNewSettleDuration("7");
      setNewCollateralPercentage("10");

      // Refresh token list
      fetchTokens();
    } catch (error) {
      console.error("Error registering token:", error);
      setErrorMessage(
        `Failed to register token: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Token Management</h2>

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

      {/* Register New Token Form */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-6">
        <h3 className="text-xl font-semibold mb-4">Register New Token</h3>

        <form onSubmit={handleRegisterToken}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label
                className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                htmlFor="tokenId"
              >
                Token ID
              </label>
              <input
                id="tokenId"
                type="number"
                value={newTokenId}
                onChange={(e) => setNewTokenId(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                min="1"
                step="1"
                required
              />
            </div>

            <div className="mb-4">
              <label
                className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                htmlFor="tokenName"
              >
                Token Name
              </label>
              <input
                id="tokenName"
                type="text"
                value={newTokenName}
                onChange={(e) => setNewTokenName(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="e.g. BTC, ETH, XYZ"
                required
              />
            </div>

            <div className="mb-4">
              <label
                className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                htmlFor="settleDuration"
              >
                Settlement Duration (days)
              </label>
              <input
                id="settleDuration"
                type="number"
                value={newSettleDuration}
                onChange={(e) => setNewSettleDuration(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                min="0.1"
                step="0.1"
                required
              />
            </div>

            <div className="mb-4">
              <label
                className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                htmlFor="collateralPercentage"
              >
                Collateral Percentage (%)
              </label>
              <input
                id="collateralPercentage"
                type="number"
                value={newCollateralPercentage}
                onChange={(e) => setNewCollateralPercentage(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                min="1"
                max="100"
                step="1"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-center mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className={`${
                isLoading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-700"
              } text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
            >
              {isLoading ? "Processing..." : "Register Token"}
            </button>
          </div>
        </form>
      </div>

      {/* Token List */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <h3 className="text-xl font-semibold p-6 border-b border-gray-200 dark:border-gray-700">
          Registered Tokens
        </h3>

        {tokens.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
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
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Settlement Duration
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Collateral %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {tokens.map((token) => (
                  <tr key={token.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {token.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {token.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {(token.settleDuration / (24 * 60 * 60)).toFixed(1)} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {token.collateralPercentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No tokens registered yet.
          </div>
        )}
      </div>
    </div>
  );
}
