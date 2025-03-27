import {
  PreMarketSimulator,
  OpenOrderType,
  OpenOrderStatus,
  OrderType,
} from "./simulator/PreMarketSimulator";

// Khởi tạo simulator với thời gian settlement mặc định là 7 ngày
export const simulator = new PreMarketSimulator(7 * 24 * 60 * 60);

// Khởi tạo sẵn một số địa chỉ người dùng demo
export const users = {
  Owner: { address: simulator.getOwner(), name: "System Owner" },
  LP1: {
    address: "0xLP1000000000000000000000000000000000000001",
    name: "Liquidity Provider 1",
  },
  LP2: {
    address: "0xLP2000000000000000000000000000000000000002",
    name: "Liquidity Provider 2",
  },
  Trader1: {
    address: "0xTrader10000000000000000000000000000000001",
    name: "Trader 1",
  },
  Trader2: {
    address: "0xTrader20000000000000000000000000000000002",
    name: "Trader 2",
  },
};

// Khởi tạo thị trường
const currentTime = Math.floor(Date.now() / 1000);
simulator.setMarketHours(
  currentTime,
  currentTime + 30 * 24 * 60 * 60, // 30 ngày
  users.Owner.address
);
simulator.setMarketStatus(true, users.Owner.address);

// Đăng ký một số token mẫu
try {
  simulator.registerToken(
    1,
    "TOKEN A",
    7 * 24 * 60 * 60, // 7 ngày
    10, // 10% collateral
    users.Owner.address
  );

  simulator.registerToken(
    2,
    "TOKEN B",
    14 * 24 * 60 * 60, // 14 ngày
    20, // 20% collateral
    users.Owner.address
  );
} catch {
  // Ignore errors if tokens already registered
}

// Mock lưu trữ token balances
export const tokenBalances: Record<string, Record<number, number>> = {};

// Hàm giả lập mint token
export function mintToken(
  userId: string,
  tokenId: number,
  amount: number
): void {
  if (!tokenBalances[userId]) {
    tokenBalances[userId] = {};
  }

  tokenBalances[userId][tokenId] =
    (tokenBalances[userId][tokenId] || 0) + amount;
}

// Hàm giả lập chuyển token
export function transferToken(
  fromId: string,
  toId: string,
  tokenId: number,
  amount: number
): boolean {
  if (
    !tokenBalances[fromId] ||
    (tokenBalances[fromId][tokenId] || 0) < amount
  ) {
    return false;
  }

  if (!tokenBalances[toId]) {
    tokenBalances[toId] = {};
  }

  tokenBalances[fromId][tokenId] = tokenBalances[fromId][tokenId] - amount;
  tokenBalances[toId][tokenId] = (tokenBalances[toId][tokenId] || 0) + amount;
  return true;
}

// Hàm lấy token balance
export function getTokenBalance(userId: string, tokenId: number): number {
  return (tokenBalances[userId] && tokenBalances[userId][tokenId]) || 0;
}

// Hàm lấy tên người dùng từ địa chỉ
export function getUserName(address: string): string {
  for (const [, user] of Object.entries(users)) {
    if (user.address === address) {
      return user.name;
    }
  }
  return (
    address.substring(0, 6) + "..." + address.substring(address.length - 4)
  );
}

/**
 * Hàm tạo lệnh tự động với giá ngẫu nhiên và người dùng ngẫu nhiên
 * 
 * @param randomOrders Số lượng lệnh cần tạo (mặc định: 1)
 * @param tokenId ID token muốn tạo lệnh (mặc định: tất cả các token)
 * @param minAmount Số lượng tối thiểu mỗi lệnh (mặc định: 1)
 * @param maxAmount Số lượng tối đa mỗi lệnh (mặc định: 100)
 * @returns Mảng chứa ID của các lệnh đã tạo
 */
export function autoOpenOrder(
  randomOrders: number = 1,
  tokenId: number = 0,
  minAmount: number = 1,
  maxAmount: number = 100
): number[] {
  const createdOrderIds: number[] = [];
  const tokens = tokenId > 0 ? [tokenId] : [1, 2]; // Nếu không chỉ định token thì tạo lệnh cho tất cả token
  const traders = [users.Trader1, users.Trader2, users.LP1, users.LP2];
  
  for (let i = 0; i < randomOrders; i++) {
    // Random token nếu không chỉ định
    const selectedTokenId = tokens[Math.floor(Math.random() * tokens.length)];
    
    // Random người dùng
    const trader = traders[Math.floor(Math.random() * traders.length)];
    
    // Random loại lệnh (Buy/Sell)
    const orderType = Math.random() > 0.5 ? OpenOrderType.Buy : OpenOrderType.Sell;
    
    // Random số lượng
    const amount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;
    
    // Random giá từ 0.8 -> 1.2
    const price = Number((0.8 + Math.random() * 0.4).toFixed(2));
    
    // Địa chỉ token trao đổi (mặc định ETH)
    const exchangeToken = "0x0000000000000000000000000000000000000000";
    
    try {
      // Tạo lệnh
      const orderId = simulator.placeOpenOrder(
        orderType,
        amount,
        price,
        selectedTokenId,
        exchangeToken,
        trader.address
      );
      
      createdOrderIds.push(orderId);
    } catch (error) {
      console.error(`Failed to create random order: ${error}`);
    }
  }
  
  return createdOrderIds;
}

/**
 * Bắt đầu tạo lệnh tự động theo chu kỳ
 * 
 * @param intervalInSeconds Thời gian giữa các lần tạo lệnh (giây)
 * @param ordersPerBatch Số lượng lệnh mỗi lần tạo
 * @param tokenId ID token muốn tạo lệnh (mặc định: tất cả các token)
 * @param maxBatches Số lần tạo tối đa (0 = chạy vô hạn)
 * @returns Hàm dừng việc tạo lệnh tự động
 */

// Lưu trữ tất cả các hàm stop cho auto orders đang chạy
export const autoOrderStopFunctions: (() => void)[] = [];

export function startAutoOpenOrderLoop(
  intervalInSeconds: number = 10,
  ordersPerBatch: number = 1,
  tokenId: number = 0,
  maxBatches: number = 0
): () => void {
  let batchesRun = 0;

  const runBatch = () => {
    if (maxBatches > 0 && batchesRun >= maxBatches) {
      clearInterval(intervalId);
      // Xóa khỏi danh sách khi tự kết thúc
      const index = autoOrderStopFunctions.indexOf(stopFunction);
      if (index !== -1) {
        autoOrderStopFunctions.splice(index, 1);
      }
      console.log(`Auto order creation stopped after ${maxBatches} batches`);
      return;
    }

    const orderIds = autoOpenOrder(ordersPerBatch, tokenId);
    batchesRun++;

    console.log(
      `Batch ${batchesRun}: Created ${
        orderIds.length
      } orders. IDs: ${orderIds.join(", ")}`
    );

    // Tự động match orders sau khi tạo
    if (orderIds.length > 0) {
      try {
        const matchedCount = simulator.autoMatchOrders(
          tokenId,
          "price",
          10,
          users.Owner.address
        );
        console.log(`Auto-matched ${matchedCount} orders`);
      } catch (error) {
        console.error(`Failed to auto-match orders: ${error}`);
      }
    }
  };

  // Chạy lần đầu ngay lập tức
  runBatch();

  // Thiết lập chạy theo chu kỳ
  const intervalId = setInterval(runBatch, intervalInSeconds * 1000);

  // Tạo hàm stop
  const stopFunction = () => {
    clearInterval(intervalId);
    // Xóa khỏi danh sách khi dừng thủ công
    const index = autoOrderStopFunctions.indexOf(stopFunction);
    if (index !== -1) {
      autoOrderStopFunctions.splice(index, 1);
    }
    console.log(
      `Auto order creation manually stopped after ${batchesRun} batches`
    );
  };

  // Thêm vào danh sách các hàm stop đang chạy
  autoOrderStopFunctions.push(stopFunction);

  // Trả về hàm dừng interval
  return stopFunction;
}

/**
 * Dừng tất cả các lệnh tự động đang chạy
 *
 * @returns Số lượng tiến trình đã dừng
 */
export function stopAllAutoOpenOrders(): number {
  const count = autoOrderStopFunctions.length;

  // Gọi tất cả các hàm stop
  while (autoOrderStopFunctions.length > 0) {
    const stopFn = autoOrderStopFunctions.pop();
    if (stopFn) {
      stopFn();
    }
  }

  console.log(`Stopped all ${count} auto order processes`);
  return count;
}

// Export các types cần thiết
export { OpenOrderType, OpenOrderStatus, OrderType };
