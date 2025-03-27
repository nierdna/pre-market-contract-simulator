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
    <div className="space-y-8 mb-8">
      <h2 className="text-2xl font-bold mb-4">Tạo Lệnh Tự Động</h2>

      {/* Thông báo */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {errorMessage}
        </div>
      )}

      {/* Phần hướng dẫn sử dụng */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold mb-2 text-blue-800">
          Hướng dẫn sử dụng
        </h3>
        <p className="mb-2">
          Chức năng này cho phép tạo tự động các lệnh mua/bán ngẫu nhiên với giá
          từ 0.8 đến 1.2 để mô phỏng thị trường hoạt động.
        </p>
        <h4 className="font-medium text-blue-700 mt-3 mb-1">Các tùy chọn:</h4>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>Có thể tạo một đợt lệnh hoặc tự động tạo theo chu kỳ</li>
          <li>Có thể chọn token cụ thể hoặc tất cả token</li>
          <li>Có thể tùy chỉnh số lượng, giới hạn đợt, và khoảng thời gian</li>
          <li>Có thể chạy nhiều tiến trình tạo lệnh tự động cùng lúc</li>
          <li>Có thể dừng riêng từng tiến trình hoặc dừng tất cả</li>
        </ul>
      </div>

      {/* Phần cấu hình chung */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Cấu Hình Chung</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Token
            </label>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="0">Tất cả các token</option>
              {tokens.map((token) => (
                <option key={token.id} value={token.id.toString()}>
                  {token.name} (#{token.id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số lượng lệnh
            </label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-500">Min</label>
                <input
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Tối thiểu"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500">Max</label>
                <input
                  type="number"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  min={parseInt(minAmount) + 1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Tối đa"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Giá sẽ được random từ 0.8 đến 1.2
            </p>
          </div>
        </div>
      </div>

      {/* Form tạo lệnh đơn */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Tạo Một Đợt Lệnh</h3>
        <form onSubmit={handleSingleBatch}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số lượng lệnh trong đợt
            </label>
            <input
              type="number"
              value={singleBatchSize}
              onChange={(e) => setSingleBatchSize(e.target.value)}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Số lượng lệnh"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? "Đang xử lý..." : "Tạo Lệnh"}
          </button>
        </form>
      </div>

      {/* Form tạo lệnh tự động */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Tự Động Tạo Lệnh</h3>

        {/* Hiển thị số lượng tiến trình đang chạy */}
        {activeProcessCount > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="relative flex h-3 w-3 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
                <span>Có {activeProcessCount} tiến trình đang chạy</span>
              </div>
              <button
                onClick={handleStopAllAutoLoops}
                className="bg-red-600 text-white py-1 px-3 text-sm rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Dừng Tất Cả
              </button>
            </div>
          </div>
        )}

        {isAutoRunning && stopAutoFn ? (
          <>
            <div className="mb-4 flex items-center">
              <span className="relative flex h-3 w-3 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span>Tiến trình hiện tại đang chạy</span>
            </div>
            <button
              onClick={handleStopAutoLoop}
              className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Dừng Tiến Trình Hiện Tại
            </button>
          </>
        ) : (
          <form onSubmit={handleStartAutoLoop}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số lượng lệnh mỗi đợt
                </label>
                <input
                  type="number"
                  value={loopBatchSize}
                  onChange={(e) => setLoopBatchSize(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Số lượng lệnh mỗi đợt"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thời gian giữa các đợt (giây)
                </label>
                <input
                  type="number"
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Giây"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số đợt tối đa (0 = vô hạn)
              </label>
              <input
                type="number"
                value={maxBatches}
                onChange={(e) => setMaxBatches(e.target.value)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Số đợt tối đa"
              />
              <p className="text-xs text-gray-500 mt-1">
                Để 0 nếu muốn chạy vô hạn đến khi dừng thủ công
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? "Đang xử lý..." : "Bắt Đầu Tự Động"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
