"use client";

import { useState, useEffect } from "react";
import {
  simulator,
  autoOpenOrder,
  startAutoOpenOrderLoop,
  stopAllAutoOpenOrders,
  autoOrderStopFunctions,
} from "@/lib/premarket";

interface AutoTraderProps {
  userAddress: string;
}

export default function AutoTrader({ userAddress }: AutoTraderProps) {
  const [singleBatchSize, setSingleBatchSize] = useState("5");
  const [loopBatchSize, setLoopBatchSize] = useState("2");
  const [interval, setInterval] = useState("10");
  const [maxBatches, setMaxBatches] = useState("0");
  const [selectedToken, setSelectedToken] = useState("0");
  const [minAmount, setMinAmount] = useState("1");
  const [maxAmount, setMaxAmount] = useState("100");

  const [isLoading, setIsLoading] = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [activeProcessCount, setActiveProcessCount] = useState(0);
  const [stopAutoFn, setStopAutoFn] = useState<(() => void) | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [tokens, setTokens] = useState<{ id: number; name: string }[]>([]);

  // Lấy danh sách tokens
  useEffect(() => {
    const fetchTokens = () => {
      try {
        const tokensList: { id: number; name: string }[] = [];

        // Lấy số lượng token đã đăng ký
        const tokenIdCounter = simulator.getTokenIdCounter();

        for (let i = 1; i <= tokenIdCounter; i++) {
          try {
            const token = simulator.getTokenById(i);
            if (token) {
              tokensList.push({ id: token.id, name: token.name });
            }
          } catch (error) {
            console.error(`Error fetching token ${i}:`, error);
          }
        }

        setTokens(tokensList);
      } catch (error) {
        console.error("Error fetching tokens:", error);
      }
    };

    fetchTokens();
  }, []);

  // Cập nhật số lượng tiến trình đang chạy
  useEffect(() => {
    const updateProcessCount = () => {
      setActiveProcessCount(autoOrderStopFunctions.length);
      setIsAutoRunning(autoOrderStopFunctions.length > 0);
    };

    // Cập nhật lần đầu
    updateProcessCount();

    // Cập nhật mỗi giây để theo dõi số lượng tiến trình
    const intervalId = window.setInterval(updateProcessCount, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const handleSingleBatch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const batchSize = parseInt(singleBatchSize);
      const tokenId = parseInt(selectedToken);
      const min = parseInt(minAmount);
      const max = parseInt(maxAmount);

      // Input validation
      if (isNaN(batchSize) || batchSize <= 0) {
        throw new Error("Batch size must be a positive number");
      }

      if (isNaN(min) || min <= 0) {
        throw new Error("Minimum amount must be a positive number");
      }

      if (isNaN(max) || max <= min) {
        throw new Error("Maximum amount must be greater than minimum amount");
      }

      // Gọi hàm tạo lệnh tự động
      const orderIds = autoOpenOrder(batchSize, tokenId, min, max);

      if (orderIds.length > 0) {
        // Tự động match sau khi tạo
        try {
          const matchedCount = simulator.autoMatchOrders(
            tokenId > 0 ? tokenId : 0,
            "price",
            10,
            userAddress
          );
          setSuccessMessage(
            `Đã tạo ${orderIds.length} lệnh và tự động khớp ${matchedCount} lệnh`
          );
        } catch (error) {
          setSuccessMessage(`Đã tạo ${orderIds.length} lệnh`);
          console.error("Error matching orders:", error);
        }
      } else {
        setErrorMessage("Không thể tạo lệnh");
      }
    } catch (error) {
      console.error("Error creating orders:", error);
      setErrorMessage(
        `Lỗi khi tạo lệnh: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartAutoLoop = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const intervalSeconds = parseInt(interval);
      const batchSize = parseInt(loopBatchSize);
      const tokenId = parseInt(selectedToken);
      const batches = parseInt(maxBatches);
      const min = parseInt(minAmount);
      const max = parseInt(maxAmount);

      // Input validation
      if (isNaN(intervalSeconds) || intervalSeconds <= 0) {
        throw new Error("Interval must be a positive number");
      }

      if (isNaN(batchSize) || batchSize <= 0) {
        throw new Error("Batch size must be a positive number");
      }

      if (isNaN(min) || min <= 0) {
        throw new Error("Minimum amount must be a positive number");
      }

      if (isNaN(max) || max <= min) {
        throw new Error("Maximum amount must be greater than minimum amount");
      }

      if (isNaN(batches) || batches < 0) {
        throw new Error("Max batches must be a non-negative number");
      }

      // Dừng auto loop hiện tại nếu có
      if (stopAutoFn) {
        stopAutoFn();
        setStopAutoFn(null);
      }

      // Bắt đầu auto loop mới
      const stopFn = startAutoOpenOrderLoop(
        intervalSeconds,
        batchSize,
        tokenId,
        batches
      );

      setStopAutoFn(() => stopFn);
      setIsAutoRunning(true);
      setSuccessMessage(
        `Bắt đầu tạo lệnh tự động: ${batchSize} lệnh mỗi ${intervalSeconds} giây` +
          (batches > 0 ? `, tối đa ${batches} đợt` : "")
      );
    } catch (error) {
      console.error("Error starting auto loop:", error);
      setErrorMessage(
        `Lỗi khi bắt đầu tạo lệnh tự động: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopAutoLoop = () => {
    if (stopAutoFn) {
      stopAutoFn();
      setStopAutoFn(null);
      setIsAutoRunning(autoOrderStopFunctions.length > 0);
      setSuccessMessage("Đã dừng tạo lệnh tự động");
    }
  };

  const handleStopAllAutoLoops = () => {
    const stoppedCount = stopAllAutoOpenOrders();
    setStopAutoFn(null);
    setIsAutoRunning(false);
    setSuccessMessage(
      `Đã dừng tất cả ${stoppedCount} tiến trình tạo lệnh tự động`
    );
  };

  return (
    <div className="space-y-6 mb-8 p-4 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-200 border-b pb-2 border-gray-700">
        Tạo Lệnh Tự Động
      </h2>

      {/* Thông báo */}
      {successMessage && (
        <div className="bg-green-900 border-l-4 border-green-500 text-green-200 px-4 py-3 rounded shadow-md mb-4 animate-fadeIn transform transition-all hover:scale-[1.01]">
          <div className="flex">
            <div className="py-1 mr-2">
              <svg
                className="h-6 w-6 text-green-400 mr-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p className="font-bold">Thành công</p>
              <p className="text-sm text-green-300">{successMessage}</p>
            </div>
          </div>
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-900 border-l-4 border-red-500 text-red-200 px-4 py-3 rounded shadow-md mb-4 animate-fadeIn transform transition-all hover:scale-[1.01]">
          <div className="flex">
            <div className="py-1 mr-2">
              <svg
                className="h-6 w-6 text-red-400 mr-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div>
              <p className="font-bold">Lỗi</p>
              <p className="text-sm text-red-300">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Phần hướng dẫn sử dụng */}
      <div className="bg-gradient-to-r from-dark-300 to-dark-200 p-5 rounded-xl border border-gray-700 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-gray-900/30">
        <h3 className="text-xl font-semibold mb-3 text-blue-300 flex items-center">
          <svg
            className="h-5 w-5 mr-2 text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Hướng dẫn sử dụng
        </h3>
        <p className="mb-3 text-gray-300">
          Chức năng này cho phép tạo tự động các lệnh mua/bán ngẫu nhiên với giá
          từ 0.8 đến 1.2 để mô phỏng thị trường hoạt động.
        </p>
        <h4 className="font-medium text-blue-300 mt-4 mb-2 flex items-center">
          <svg
            className="h-4 w-4 mr-2 transform transition-transform group-hover:rotate-180"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
          Các tùy chọn:
        </h4>
        <ul className="list-none text-sm space-y-2 ml-2 text-gray-300">
          <li className="flex items-start transform transition-all duration-200 hover:translate-x-1">
            <svg
              className="h-4 w-4 mr-2 text-blue-400 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4"
              />
            </svg>
            <span>Có thể tạo một đợt lệnh hoặc tự động tạo theo chu kỳ</span>
          </li>
          <li className="flex items-start transform transition-all duration-200 hover:translate-x-1">
            <svg
              className="h-4 w-4 mr-2 text-blue-400 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4"
              />
            </svg>
            <span>Có thể chọn token cụ thể hoặc tất cả token</span>
          </li>
          <li className="flex items-start transform transition-all duration-200 hover:translate-x-1">
            <svg
              className="h-4 w-4 mr-2 text-blue-400 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4"
              />
            </svg>
            <span>
              Có thể tùy chỉnh số lượng, giới hạn đợt, và khoảng thời gian
            </span>
          </li>
          <li className="flex items-start transform transition-all duration-200 hover:translate-x-1">
            <svg
              className="h-4 w-4 mr-2 text-blue-400 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4"
              />
            </svg>
            <span>Có thể chạy nhiều tiến trình tạo lệnh tự động cùng lúc</span>
          </li>
          <li className="flex items-start transform transition-all duration-200 hover:translate-x-1">
            <svg
              className="h-4 w-4 mr-2 text-blue-400 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4"
              />
            </svg>
            <span>Có thể dừng riêng từng tiến trình hoặc dừng tất cả</span>
          </li>
        </ul>
      </div>

      {/* Phần cấu hình chung */}
      <div className="bg-dark-300 p-6 rounded-xl shadow-md border border-gray-700 transition-all duration-300 hover:shadow-lg hover:shadow-gray-900/30">
        <h3 className="text-xl font-semibold mb-4 text-gray-200 flex items-center">
          <svg
            className="h-5 w-5 mr-2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Cấu Hình Chung
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="transition-all duration-200 hover:bg-dark-200 p-2 rounded-lg">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Token
            </label>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="w-full px-4 py-2.5 bg-dark-100 border border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-200"
            >
              <option value="0">Tất cả các token</option>
              {tokens.map((token) => (
                <option key={token.id} value={token.id.toString()}>
                  {token.name} (#{token.id})
                </option>
              ))}
            </select>
          </div>
          <div className="transition-all duration-200 hover:bg-dark-200 p-2 rounded-lg">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Số lượng lệnh
            </label>
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Min</label>
                <input
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  min="1"
                  className="w-full px-4 py-2.5 bg-dark-100 border border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors focus:bg-dark-200 text-gray-200"
                  placeholder="Tối thiểu"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Max</label>
                <input
                  type="number"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  min={parseInt(minAmount) + 1}
                  className="w-full px-4 py-2.5 bg-dark-100 border border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors focus:bg-dark-200 text-gray-200"
                  placeholder="Tối đa"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 bg-dark-100 p-1.5 rounded italic">
              Giá sẽ được random từ 0.8 đến 1.2
            </p>
          </div>
        </div>
      </div>

      {/* Form tạo lệnh đơn */}
      <div className="bg-dark-300 p-6 rounded-xl shadow-md border border-gray-700 transition-all duration-300 hover:shadow-lg hover:shadow-gray-900/30">
        <h3 className="text-xl font-semibold mb-4 text-gray-200 flex items-center">
          <svg
            className="h-5 w-5 mr-2 text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          Tạo Một Đợt Lệnh
        </h3>
        <form onSubmit={handleSingleBatch} className="space-y-4">
          <div className="transition-all duration-200 hover:bg-dark-200 p-2 rounded-lg">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Số lượng lệnh trong đợt
            </label>
            <input
              type="number"
              value={singleBatchSize}
              onChange={(e) => setSingleBatchSize(e.target.value)}
              min="1"
              className="w-full px-4 py-2.5 bg-dark-100 border border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors focus:bg-dark-200 text-gray-200"
              placeholder="Số lượng lệnh"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 active:translate-y-0"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <svg
                  className="mr-2 h-5 w-5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>Tạo Lệnh</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Form tạo lệnh tự động */}
      <div className="bg-dark-300 p-6 rounded-xl shadow-md border border-gray-700 transition-all duration-300 hover:shadow-lg hover:shadow-gray-900/30">
        <h3 className="text-xl font-semibold mb-4 text-gray-200 flex items-center">
          <svg
            className="h-5 w-5 mr-2 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Tự Động Tạo Lệnh
        </h3>

        {/* Hiển thị số lượng tiến trình đang chạy */}
        {activeProcessCount > 0 && (
          <div className="mb-5 p-4 bg-dark-100 rounded-lg border border-blue-900 shadow-sm animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="relative flex h-3 w-3 mr-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
                <span className="font-medium text-blue-300">
                  Có {activeProcessCount} tiến trình đang chạy
                </span>
              </div>
              <button
                onClick={handleStopAllAutoLoops}
                className="bg-red-600 text-white py-1.5 px-4 text-sm rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-300 shadow-sm hover:shadow-md flex items-center transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <svg
                  className="mr-1.5 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
                Dừng Tất Cả
              </button>
            </div>
          </div>
        )}

        {isAutoRunning && stopAutoFn ? (
          <>
            <div className="mb-5 p-4 bg-dark-100 rounded-lg border border-green-900 flex items-center shadow-sm animate-pulse">
              <span className="relative flex h-3 w-3 mr-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="font-medium text-green-300">
                Tiến trình hiện tại đang chạy
              </span>
            </div>
            <button
              onClick={handleStopAutoLoop}
              className="w-full flex items-center justify-center bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 active:translate-y-0"
            >
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Dừng Tiến Trình Hiện Tại
            </button>
          </>
        ) : (
          <form onSubmit={handleStartAutoLoop} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="transition-all duration-200 hover:bg-dark-200 p-2 rounded-lg">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Số lượng lệnh mỗi đợt
                </label>
                <input
                  type="number"
                  value={loopBatchSize}
                  onChange={(e) => setLoopBatchSize(e.target.value)}
                  min="1"
                  className="w-full px-4 py-2.5 bg-dark-100 border border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors focus:bg-dark-200 text-gray-200"
                  placeholder="Số lượng lệnh mỗi đợt"
                />
              </div>
              <div className="transition-all duration-200 hover:bg-dark-200 p-2 rounded-lg">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Thời gian giữa các đợt (giây)
                </label>
                <input
                  type="number"
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  min="1"
                  className="w-full px-4 py-2.5 bg-dark-100 border border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors focus:bg-dark-200 text-gray-200"
                  placeholder="Giây"
                />
              </div>
            </div>

            <div className="transition-all duration-200 hover:bg-dark-200 p-2 rounded-lg">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Số đợt tối đa (0 = vô hạn)
              </label>
              <input
                type="number"
                value={maxBatches}
                onChange={(e) => setMaxBatches(e.target.value)}
                min="0"
                className="w-full px-4 py-2.5 bg-dark-100 border border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors focus:bg-dark-200 text-gray-200"
                placeholder="Số đợt tối đa"
              />
              <p className="text-xs text-gray-400 mt-2 bg-dark-100 p-1.5 rounded italic">
                Để 0 nếu muốn chạy vô hạn đến khi dừng thủ công
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 active:translate-y-0"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <svg
                    className="mr-2 h-5 w-5 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span>Bắt Đầu Tự Động</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
