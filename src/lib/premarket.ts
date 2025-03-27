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

// Export các types cần thiết
export { OpenOrderType, OpenOrderStatus, OrderType };
