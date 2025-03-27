/**
 * PreMarketSimulator
 * Mô phỏng hoạt động của PreMarket smart contract trong memory
 */

// Enum mô phỏng các enum trong contract
export enum OpenOrderStatus {
  Active,
  Matched,
  Cancelled,
  Settled,
  SettlementFailed,
}

export enum OpenOrderType {
  Buy,
  Sell,
}

export enum OrderType {
  Buyer,
  Seller,
}

// Định nghĩa kiểu dữ liệu giống với struct trong contract
export interface Token {
  id: number;
  name: string;
  settleDuration: number;
  collateralPercentage: number;
}

export interface OpenOrder {
  id: number;
  trader: string; // address
  orderType: OpenOrderType;
  amount: number;
  price: number;
  timestamp: number;
  status: OpenOrderStatus;
  collateral: number;
  matchedOrderIds: number[];
  settlementDeadline: number;
  matchedAmount: number;
  tokenId: number;
  exchangeToken: string; // address, address(0) là ETH
  isExitOrder: boolean;
  orderIdToExit: number;
}

export interface Order {
  id: number;
  buyOpenOrderId: number;
  sellOpenOrderId: number;
  buyer: string; // address
  seller: string; // address
  amount: number;
  buyPrice: number;
  sellPrice: number;
  isActive: boolean;
  buyerParentOrderId: number;
  sellerParentOrderId: number;
  settlementStatus: number; // 0: chưa settlement, 1: đã settlement, 2: settlement thất bại
  tokenId: number;
  exitedAmount: number;
  exchangeToken: string; // address
}

// Định nghĩa event interfaces
export interface OpenOrderCreatedEvent {
  openOrderId: number;
  trader: string;
  orderType: OpenOrderType;
  amount: number;
  price: number;
  collateral: number;
  tokenId: number;
  exchangeToken: string;
  orderIdToExit: number;
}

export interface OpenOrderMatchedEvent {
  buyOpenOrderId: number;
  sellOpenOrderId: number;
  orderId: number;
}

export interface OrderCreatedEvent {
  orderId: number;
  buyOpenOrderId: number;
  sellOpenOrderId: number;
  buyer: string;
  seller: string;
  exchangeToken: string;
}

export interface OrderExitedEvent {
  orderId: number;
  newOrderId: number;
}

// Kiểu dữ liệu cho event callbacks
export type EventCallback<T> = (event: T) => void;

/**
 * Lớp chính mô phỏng hoạt động của PreMarket contract
 */
export class PreMarketSimulator {
  // State variables
  private isActive: boolean;
  private marketOpenTime: number;
  private marketCloseTime: number;
  private openOrderIdCounter: number;
  private orderIdCounter: number;
  private tokenIdCounter: number;
  private settlementPeriod: number;
  private owner: string;

  // Mappings
  private openOrders: Map<number, OpenOrder>;
  private orders: Map<number, Order>;
  private userOpenOrders: Map<string, number[]>;
  private userOrders: Map<string, number[]>;
  private tokens: Map<number, Token>;

  // Địa chỉ ETH đặc biệt (mô phỏng address(0))
  private readonly ETH_ADDRESS = "0x0000000000000000000000000000000000000000";

  // Event listeners
  private openOrderCreatedListeners: EventCallback<OpenOrderCreatedEvent>[] =
    [];
  private openOrderMatchedListeners: EventCallback<OpenOrderMatchedEvent>[] =
    [];
  private openOrderCancelledListeners: EventCallback<{
    openOrderId: number;
  }>[] = [];
  private openOrderSettledListeners: EventCallback<{
    openOrderId: number;
    settler: string;
  }>[] = [];
  private settlementFailedListeners: EventCallback<{ openOrderId: number }>[] =
    [];
  private orderCreatedListeners: EventCallback<OrderCreatedEvent>[] = [];
  private orderExitedListeners: EventCallback<OrderExitedEvent>[] = [];
  private orderTransferredListeners: EventCallback<{
    orderId: number;
    from: string;
    to: string;
  }>[] = [];
  private marketStatusChangedListeners: EventCallback<{ isActive: boolean }>[] =
    [];
  private collateralReceivedListeners: EventCallback<{
    user: string;
    amount: number;
    exchangeToken: string;
  }>[] = [];
  private collateralReturnedListeners: EventCallback<{
    user: string;
    amount: number;
  }>[] = [];
  private collateralForfeitedListeners: EventCallback<{
    user: string;
    amount: number;
    beneficiary: string;
  }>[] = [];
  private orderSettledListeners: EventCallback<{
    orderId: number;
    settler: string;
  }>[] = [];
  private tokenRegisteredListeners: EventCallback<{
    tokenId: number;
    name: string;
    settleDuration: number;
    collateralPercentage: number;
  }>[] = [];

  /**
   * Constructor
   * @param settlementPeriod Thời gian cho phép settlement sau TGE mặc định (giây)
   * @param owner Địa chỉ của người sở hữu contract (optional)
   */
  constructor(
    settlementPeriod: number,
    owner: string = "0x1234567890123456789012345678901234567890"
  ) {
    // Khởi tạo state
    this.isActive = false;
    this.openOrderIdCounter = 0;
    this.orderIdCounter = 0;
    this.tokenIdCounter = 0;
    this.settlementPeriod = settlementPeriod;
    this.owner = owner;

    // Khởi tạo các mapping
    this.openOrders = new Map<number, OpenOrder>();
    this.orders = new Map<number, Order>();
    this.userOpenOrders = new Map<string, number[]>();
    this.userOrders = new Map<string, number[]>();
    this.tokens = new Map<number, Token>();

    // Mặc định market hours
    this.marketOpenTime = Math.floor(Date.now() / 1000);
    this.marketCloseTime = this.marketOpenTime + 30 * 24 * 60 * 60; // 30 ngày từ bây giờ
  }

  /**
   * Các phương thức getter cơ bản
   */
  public getIsActive(): boolean {
    return this.isActive;
  }

  public getMarketOpenTime(): number {
    return this.marketOpenTime;
  }

  public getMarketCloseTime(): number {
    return this.marketCloseTime;
  }

  public getOpenOrderIdCounter(): number {
    return this.openOrderIdCounter;
  }

  public getOrderIdCounter(): number {
    return this.orderIdCounter;
  }

  public getTokenIdCounter(): number {
    return this.tokenIdCounter;
  }

  public getSettlementPeriod(): number {
    return this.settlementPeriod;
  }

  public getOwner(): string {
    return this.owner;
  }

  /**
   * Các phương thức đăng ký event listener
   */
  public onOpenOrderCreated(
    callback: EventCallback<OpenOrderCreatedEvent>
  ): void {
    this.openOrderCreatedListeners.push(callback);
  }

  public onOpenOrderMatched(
    callback: EventCallback<OpenOrderMatchedEvent>
  ): void {
    this.openOrderMatchedListeners.push(callback);
  }

  public onOpenOrderCancelled(
    callback: EventCallback<{ openOrderId: number }>
  ): void {
    this.openOrderCancelledListeners.push(callback);
  }

  public onOpenOrderSettled(
    callback: EventCallback<{ openOrderId: number; settler: string }>
  ): void {
    this.openOrderSettledListeners.push(callback);
  }

  public onSettlementFailed(
    callback: EventCallback<{ openOrderId: number }>
  ): void {
    this.settlementFailedListeners.push(callback);
  }

  public onOrderCreated(callback: EventCallback<OrderCreatedEvent>): void {
    this.orderCreatedListeners.push(callback);
  }

  public onOrderExited(callback: EventCallback<OrderExitedEvent>): void {
    this.orderExitedListeners.push(callback);
  }

  public onOrderTransferred(
    callback: EventCallback<{ orderId: number; from: string; to: string }>
  ): void {
    this.orderTransferredListeners.push(callback);
  }

  public onMarketStatusChanged(
    callback: EventCallback<{ isActive: boolean }>
  ): void {
    this.marketStatusChangedListeners.push(callback);
  }

  public onCollateralReceived(
    callback: EventCallback<{
      user: string;
      amount: number;
      exchangeToken: string;
    }>
  ): void {
    this.collateralReceivedListeners.push(callback);
  }

  public onCollateralReturned(
    callback: EventCallback<{ user: string; amount: number }>
  ): void {
    this.collateralReturnedListeners.push(callback);
  }

  public onCollateralForfeited(
    callback: EventCallback<{
      user: string;
      amount: number;
      beneficiary: string;
    }>
  ): void {
    this.collateralForfeitedListeners.push(callback);
  }

  public onOrderSettled(
    callback: EventCallback<{ orderId: number; settler: string }>
  ): void {
    this.orderSettledListeners.push(callback);
  }

  public onTokenRegistered(
    callback: EventCallback<{
      tokenId: number;
      name: string;
      settleDuration: number;
      collateralPercentage: number;
    }>
  ): void {
    this.tokenRegisteredListeners.push(callback);
  }

  /**
   * Các phương thức emit event
   */
  private emitOpenOrderCreated(event: OpenOrderCreatedEvent): void {
    this.openOrderCreatedListeners.forEach((listener) => listener(event));
  }

  private emitOpenOrderMatched(event: OpenOrderMatchedEvent): void {
    this.openOrderMatchedListeners.forEach((listener) => listener(event));
  }

  private emitOpenOrderCancelled(openOrderId: number): void {
    this.openOrderCancelledListeners.forEach((listener) =>
      listener({ openOrderId })
    );
  }

  private emitOpenOrderSettled(openOrderId: number, settler: string): void {
    this.openOrderSettledListeners.forEach((listener) =>
      listener({ openOrderId, settler })
    );
  }

  private emitSettlementFailed(openOrderId: number): void {
    this.settlementFailedListeners.forEach((listener) =>
      listener({ openOrderId })
    );
  }

  private emitOrderCreated(event: OrderCreatedEvent): void {
    this.orderCreatedListeners.forEach((listener) => listener(event));
  }

  private emitOrderExited(orderId: number, newOrderId: number): void {
    this.orderExitedListeners.forEach((listener) =>
      listener({ orderId, newOrderId })
    );
  }

  private emitOrderTransferred(
    orderId: number,
    from: string,
    to: string
  ): void {
    this.orderTransferredListeners.forEach((listener) =>
      listener({ orderId, from, to })
    );
  }

  private emitMarketStatusChanged(isActive: boolean): void {
    this.marketStatusChangedListeners.forEach((listener) =>
      listener({ isActive })
    );
  }

  private emitCollateralReceived(
    user: string,
    amount: number,
    exchangeToken: string
  ): void {
    this.collateralReceivedListeners.forEach((listener) =>
      listener({ user, amount, exchangeToken })
    );
  }

  private emitCollateralReturned(user: string, amount: number): void {
    this.collateralReturnedListeners.forEach((listener) =>
      listener({ user, amount })
    );
  }

  private emitCollateralForfeited(
    user: string,
    amount: number,
    beneficiary: string
  ): void {
    this.collateralForfeitedListeners.forEach((listener) =>
      listener({ user, amount, beneficiary })
    );
  }

  private emitOrderSettled(orderId: number, settler: string): void {
    this.orderSettledListeners.forEach((listener) =>
      listener({ orderId, settler })
    );
  }

  private emitTokenRegistered(
    tokenId: number,
    name: string,
    settleDuration: number,
    collateralPercentage: number
  ): void {
    this.tokenRegisteredListeners.forEach((listener) =>
      listener({ tokenId, name, settleDuration, collateralPercentage })
    );
  }

  /**
   * Các phương thức kiểm tra quyền
   */
  private onlyOwner(sender: string): boolean {
    if (sender !== this.owner) {
      throw new Error("Not the owner");
    }
    return true;
  }

  private marketIsActive(): boolean {
    const currentTime = Math.floor(Date.now() / 1000);
    if (!this.isActive) {
      throw new Error("Market is not active");
    }
    if (
      currentTime < this.marketOpenTime ||
      currentTime > this.marketCloseTime
    ) {
      throw new Error("Outside of market hours");
    }
    return true;
  }

  private validOpenOrderId(openOrderId: number): boolean {
    if (openOrderId <= 0 || openOrderId > this.openOrderIdCounter) {
      throw new Error("Invalid open order ID");
    }
    return true;
  }

  private validOrderId(orderId: number): boolean {
    if (orderId <= 0 || orderId > this.orderIdCounter) {
      throw new Error("Invalid order ID");
    }
    return true;
  }

  private validTokenId(tokenId: number): boolean {
    if (tokenId <= 0 || tokenId > this.tokenIdCounter) {
      throw new Error("Invalid token ID");
    }
    return true;
  }

  private onlyOrderHolder(orderId: number, sender: string): boolean {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error("Order not found");
    }
    if (order.buyer !== sender && order.seller !== sender) {
      throw new Error("Not order holder");
    }
    return true;
  }

  /**
   * Đăng ký token mới vào hệ thống
   * @param tokenId ID của token (cần phải là duy nhất)
   * @param name Tên đầy đủ của token
   * @param settleDuration Thời gian settlement sau TGE cho token này (giây)
   * @param collateralPercentage Phần trăm đặt cọc mặc định (1-100)
   * @param sender Địa chỉ người gọi hàm
   */
  public registerToken(
    tokenId: number,
    name: string,
    settleDuration: number,
    collateralPercentage: number,
    sender: string
  ): void {
    this.onlyOwner(sender);

    if (tokenId <= 0) {
      throw new Error("Token ID must be greater than zero");
    }
    if (tokenId <= this.tokenIdCounter) {
      throw new Error("Token ID must be greater than the last token ID");
    }
    if (!name || name.trim() === "") {
      throw new Error("Name cannot be empty");
    }
    if (collateralPercentage <= 0 || collateralPercentage > 100) {
      throw new Error("Collateral percentage must be between 1-100");
    }
    if (this.tokens.has(tokenId)) {
      throw new Error("Token with this ID already exists");
    }

    const token: Token = {
      id: tokenId,
      name,
      settleDuration:
        settleDuration > 0 ? settleDuration : this.settlementPeriod,
      collateralPercentage,
    };

    this.tokens.set(tokenId, token);

    if (tokenId > this.tokenIdCounter) {
      this.tokenIdCounter = tokenId;
    }

    this.emitTokenRegistered(
      tokenId,
      name,
      token.settleDuration,
      collateralPercentage
    );
  }

  /**
   * Thiết lập thời gian mở cửa và đóng cửa thị trường
   * @param openTime Thời điểm mở cửa thị trường (timestamp)
   * @param closeTime Thời điểm đóng cửa thị trường (timestamp)
   * @param sender Địa chỉ người gọi hàm
   */
  public setMarketHours(
    openTime: number,
    closeTime: number,
    sender: string
  ): void {
    this.onlyOwner(sender);

    if (openTime >= closeTime) {
      throw new Error("Open time must be before close time");
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (closeTime <= currentTime) {
      throw new Error("Close time must be in the future");
    }

    this.marketOpenTime = openTime;
    this.marketCloseTime = closeTime;
  }

  /**
   * Kích hoạt hoặc vô hiệu hóa thị trường
   * @param isActive Trạng thái mới của thị trường
   * @param sender Địa chỉ người gọi hàm
   */
  public setMarketStatus(isActive: boolean, sender: string): void {
    this.onlyOwner(sender);

    this.isActive = isActive;
    this.emitMarketStatusChanged(isActive);
  }

  /**
   * Cập nhật thời gian settlement mặc định
   * @param settlementPeriod Thời gian settlement mới (giây)
   * @param sender Địa chỉ người gọi hàm
   */
  public setSettlementPeriod(settlementPeriod: number, sender: string): void {
    this.onlyOwner(sender);

    this.settlementPeriod = settlementPeriod;
  }

  /**
   * Đặt lệnh mua/bán (open order)
   * @param orderType Loại lệnh (Buy/Sell)
   * @param amount Số lượng token
   * @param price Giá mỗi token
   * @param tokenId ID của token được giao dịch
   * @param exchangeToken Đồng exchange (address(0) là ETH)
   * @param sender Địa chỉ người gọi hàm
   * @returns ID của lệnh vừa tạo
   */
  public placeOpenOrder(
    orderType: OpenOrderType,
    amount: number,
    price: number,
    tokenId: number,
    exchangeToken: string,
    sender: string
  ): number {
    this.marketIsActive();

    if (amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }
    if (price <= 0) {
      throw new Error("Price must be greater than zero");
    }
    if (tokenId <= 0) {
      throw new Error("Token ID must be specified");
    }

    const token = this.tokens.get(tokenId);
    if (!token) {
      throw new Error("Token does not exist");
    }

    // Sử dụng thông tin từ token đã đăng ký
    const collateralPercentage = token.collateralPercentage;

    const totalValue = amount * price;
    const requiredCollateral = (totalValue * collateralPercentage) / 100;

    // Trong simulator, chúng ta giả định người dùng luôn có đủ tiền

    this.openOrderIdCounter++;
    const openOrderId = this.openOrderIdCounter;

    const openOrder: OpenOrder = {
      id: openOrderId,
      trader: sender,
      orderType,
      amount,
      price,
      timestamp: Math.floor(Date.now() / 1000),
      status: OpenOrderStatus.Active,
      collateral: requiredCollateral,
      matchedOrderIds: [],
      settlementDeadline: 0,
      matchedAmount: 0,
      tokenId,
      exchangeToken,
      isExitOrder: false,
      orderIdToExit: 0,
    };

    this.openOrders.set(openOrderId, openOrder);

    // Thêm open order vào danh sách của user
    if (!this.userOpenOrders.has(sender)) {
      this.userOpenOrders.set(sender, []);
    }
    this.userOpenOrders.get(sender)?.push(openOrderId);

    this.emitOpenOrderCreated({
      openOrderId,
      trader: sender,
      orderType,
      amount,
      price,
      collateral: requiredCollateral,
      tokenId,
      exchangeToken,
      orderIdToExit: 0,
    });

    this.emitCollateralReceived(sender, requiredCollateral, exchangeToken);

    return openOrderId;
  }

  /**
   * Hủy lệnh đang mở (chỉ hủy được lệnh chưa khớp hoặc khớp một phần)
   * @param openOrderId ID của lệnh cần hủy
   * @param sender Địa chỉ người gọi hàm
   */
  public cancelOpenOrder(openOrderId: number, sender: string): void {
    this.validOpenOrderId(openOrderId);

    const openOrder = this.openOrders.get(openOrderId);
    if (!openOrder) {
      throw new Error("Open order not found");
    }

    if (sender !== openOrder.trader && sender !== this.owner) {
      throw new Error("Not authorized to cancel this open order");
    }

    if (openOrder.status !== OpenOrderStatus.Active) {
      throw new Error("Open order is not active");
    }

    // Nếu là lệnh exit, chỉ cần đánh dấu đã hủy, không cần hoàn tiền
    if (openOrder.isExitOrder) {
      openOrder.status = OpenOrderStatus.Cancelled;
      this.openOrders.set(openOrderId, openOrder);
      this.emitOpenOrderCancelled(openOrderId);
      return;
    }

    // Nếu lệnh đã match một phần, chỉ hoàn lại tiền đặt cọc của phần chưa match
    let refundCollateral: number;
    if (openOrder.matchedAmount > 0) {
      refundCollateral =
        (openOrder.collateral * (openOrder.amount - openOrder.matchedAmount)) /
        openOrder.amount;
    } else {
      // Nếu chưa match, hoàn lại toàn bộ tiền đặt cọc
      refundCollateral = openOrder.collateral;
    }

    // Trong simulator, chúng ta chỉ phát event, không thực sự chuyển tiền

    openOrder.status = OpenOrderStatus.Cancelled;
    this.openOrders.set(openOrderId, openOrder);

    this.emitOpenOrderCancelled(openOrderId);
    this.emitCollateralReturned(openOrder.trader, refundCollateral);
  }

  /**
   * Thoát khỏi vị thế bằng cách tạo lệnh mới
   * @param orderId ID của vị thế muốn thoát
   * @param exitAmount Số lượng token muốn exit (phải nhỏ hơn hoặc bằng số lượng khả dụng)
   * @param exitPrice Giá token muốn exit
   * @param sender Địa chỉ người gọi hàm
   * @returns ID của lệnh mới
   */
  public exitOrderWithNewOpenOrder(
    orderId: number,
    exitAmount: number,
    exitPrice: number,
    sender: string
  ): number {
    this.marketIsActive();
    this.validOrderId(orderId);
    this.onlyOrderHolder(orderId, sender);

    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (!order.isActive) {
      throw new Error("Order is not active");
    }

    // Số lượng token còn lại trong order (chưa được exit)
    const remainingAmount = order.amount - order.exitedAmount;

    if (exitAmount <= 0) {
      throw new Error("Exit amount must be greater than zero");
    }
    if (exitAmount > remainingAmount) {
      throw new Error("Exit amount cannot exceed remaining order amount");
    }
    if (exitPrice <= 0) {
      throw new Error("Exit price must be greater than zero");
    }

    // Xác định user và loại lệnh
    const isBuyer = order.buyer === sender;

    // Tạo lệnh mới với loại ngược lại
    let newOpenOrderType: OpenOrderType;

    if (isBuyer) {
      // Nếu là buyer, tạo lệnh sell để exit
      newOpenOrderType = OpenOrderType.Sell;
    } else {
      // Nếu là seller, tạo lệnh buy để exit
      newOpenOrderType = OpenOrderType.Buy;
    }

    // Lấy thông tin token từ order
    const tokenId = order.tokenId;

    // Lấy exchangeToken từ order gốc
    const exchangeToken = order.exchangeToken;

    // Tokenid phải tồn tại
    if (tokenId <= 0) {
      throw new Error("Token ID must be specified");
    }

    const token = this.tokens.get(tokenId);
    if (!token) {
      throw new Error("Token does not exist");
    }

    // Sử dụng thông tin từ token
    const collateralPercentage = token.collateralPercentage;

    const totalValue = exitAmount * exitPrice;
    // Tính collateral cho lệnh exit, nhưng không yêu cầu thanh toán
    const requiredCollateral = (totalValue * collateralPercentage) / 100;

    this.openOrderIdCounter++;
    const newOpenOrderId = this.openOrderIdCounter;

    const newOpenOrder: OpenOrder = {
      id: newOpenOrderId,
      trader: sender,
      orderType: newOpenOrderType,
      amount: exitAmount,
      price: exitPrice,
      timestamp: Math.floor(Date.now() / 1000),
      status: OpenOrderStatus.Active,
      collateral: requiredCollateral, // Vẫn lưu giá trị collateral dù không yêu cầu thanh toán
      matchedOrderIds: [],
      settlementDeadline: 0,
      matchedAmount: 0,
      tokenId,
      exchangeToken,
      isExitOrder: true, // Đánh dấu là lệnh exit
      orderIdToExit: orderId,
    };

    this.openOrders.set(newOpenOrderId, newOpenOrder);

    // Thêm lệnh vào danh sách của user
    if (!this.userOpenOrders.has(sender)) {
      this.userOpenOrders.set(sender, []);
    }
    this.userOpenOrders.get(sender)?.push(newOpenOrderId);

    this.emitOpenOrderCreated({
      openOrderId: newOpenOrderId,
      trader: sender,
      orderType: newOpenOrderType,
      amount: exitAmount,
      price: exitPrice,
      collateral: requiredCollateral,
      tokenId,
      exchangeToken,
      orderIdToExit: orderId,
    });

    return newOpenOrderId;
  }

  /**
   * Khớp lệnh mua và bán
   * @param buyOpenOrderId ID của lệnh mua
   * @param sellOpenOrderId ID của lệnh bán
   * @param matchAmount Số lượng cần match (có thể nhỏ hơn hoặc bằng số lượng của các lệnh)
   * @param sender Địa chỉ người gọi hàm
   */
  public matchOpenOrders(
    buyOpenOrderId: number,
    sellOpenOrderId: number,
    matchAmount: number,
    sender: string
  ): void {
    this.onlyOwner(sender);
    this.validOpenOrderId(buyOpenOrderId);
    this.validOpenOrderId(sellOpenOrderId);

    const buyOpenOrder = this.openOrders.get(buyOpenOrderId);
    const sellOpenOrder = this.openOrders.get(sellOpenOrderId);

    if (!buyOpenOrder || !sellOpenOrder) {
      throw new Error("Open order not found");
    }

    if (buyOpenOrder.orderType !== OpenOrderType.Buy) {
      throw new Error("First open order must be a buy order");
    }
    if (sellOpenOrder.orderType !== OpenOrderType.Sell) {
      throw new Error("Second open order must be a sell order");
    }
    if (buyOpenOrder.status !== OpenOrderStatus.Active) {
      throw new Error("Buy open order is not active");
    }
    if (sellOpenOrder.status !== OpenOrderStatus.Active) {
      throw new Error("Sell open order is not active");
    }
    if (buyOpenOrder.tokenId !== sellOpenOrder.tokenId) {
      throw new Error("Token IDs do not match");
    }
    if (buyOpenOrder.price < sellOpenOrder.price) {
      throw new Error("Buy price must be greater than or equal to sell price");
    }
    if (buyOpenOrder.exchangeToken !== sellOpenOrder.exchangeToken) {
      throw new Error("Exchange tokens do not match");
    }

    // Xử lý logic cho exit orders
    const isBuyOrderExit = buyOpenOrder.isExitOrder; // Lệnh BUY là exit (seller đang exit)
    const isSellOrderExit = sellOpenOrder.isExitOrder; // Lệnh SELL là exit (buyer đang exit)

    let sellerExitSourceOrder: Order | undefined;
    let buyerExitSourceOrder: Order | undefined;
    let sellerExitSourceOrderId = 0;
    let buyerExitSourceOrderId = 0;

    // Kiểm tra buy order exit (seller đang exit)
    if (isBuyOrderExit && buyOpenOrder.orderIdToExit > 0) {
      sellerExitSourceOrder = this.orders.get(buyOpenOrder.orderIdToExit);
      if (!sellerExitSourceOrder) {
        throw new Error("Exit source order not found");
      }
      if (!sellerExitSourceOrder.isActive) {
        throw new Error("Exit source order is not active");
      }
      if (sellerExitSourceOrder.seller !== buyOpenOrder.trader) {
        throw new Error("Exit source order seller must match");
      }
      if (
        sellerExitSourceOrder.amount - sellerExitSourceOrder.exitedAmount <
        buyOpenOrder.amount
      ) {
        throw new Error(
          "Exit order amount must be less than or equal to remaining source order amount"
        );
      }
      sellerExitSourceOrderId = buyOpenOrder.orderIdToExit;
    }

    // Kiểm tra sell order exit (buyer đang exit)
    if (isSellOrderExit && sellOpenOrder.orderIdToExit > 0) {
      buyerExitSourceOrder = this.orders.get(sellOpenOrder.orderIdToExit);
      if (!buyerExitSourceOrder) {
        throw new Error("Exit source order not found");
      }
      if (!buyerExitSourceOrder.isActive) {
        throw new Error("Exit source order is not active");
      }
      if (buyerExitSourceOrder.buyer !== sellOpenOrder.trader) {
        throw new Error("Exit source order buyer must match");
      }
      if (
        buyerExitSourceOrder.amount - buyerExitSourceOrder.exitedAmount <
        sellOpenOrder.amount
      ) {
        throw new Error(
          "Exit order amount must be less than or equal to remaining source order amount"
        );
      }
      buyerExitSourceOrderId = sellOpenOrder.orderIdToExit;
    }

    // Kiểm tra số lượng match hợp lệ
    if (matchAmount <= 0) {
      throw new Error("Match amount must be greater than zero");
    }
    if (matchAmount > buyOpenOrder.amount - buyOpenOrder.matchedAmount) {
      throw new Error("Match amount cannot exceed remaining buy order amount");
    }
    if (matchAmount > sellOpenOrder.amount - sellOpenOrder.matchedAmount) {
      throw new Error("Match amount cannot exceed remaining sell order amount");
    }

    // Xử lý các trường hợp exit

    // Case 1: Seller exit (Buy order là exit)
    if (isBuyOrderExit && !isSellOrderExit && sellerExitSourceOrder) {
      this.handleSellerExit(
        buyOpenOrder,
        sellOpenOrder,
        sellerExitSourceOrder,
        matchAmount,
        sellerExitSourceOrderId
      );
    }
    // Case 2: Buyer exit (Sell order là exit)
    else if (!isBuyOrderExit && isSellOrderExit && buyerExitSourceOrder) {
      this.handleBuyerExit(
        buyOpenOrder,
        sellOpenOrder,
        buyerExitSourceOrder,
        matchAmount,
        buyerExitSourceOrderId
      );
    }
    // Case 3: Cả buyer và seller đều exit
    else if (
      isBuyOrderExit &&
      isSellOrderExit &&
      sellerExitSourceOrder &&
      buyerExitSourceOrder
    ) {
      this.handleBothExit(
        buyOpenOrder,
        sellOpenOrder,
        sellerExitSourceOrder,
        buyerExitSourceOrder,
        matchAmount,
        sellerExitSourceOrderId,
        buyerExitSourceOrderId
      );
    }
    // Case 4: Không có exit
    else {
      // Tạo một order duy nhất cho cả buyer và seller
      this.orderIdCounter++;
      const orderId = this.orderIdCounter;

      const order: Order = {
        id: orderId,
        buyOpenOrderId: buyOpenOrderId,
        sellOpenOrderId: sellOpenOrderId,
        buyer: buyOpenOrder.trader,
        seller: sellOpenOrder.trader,
        amount: matchAmount,
        buyPrice: buyOpenOrder.price,
        sellPrice: sellOpenOrder.price,
        isActive: true,
        buyerParentOrderId: 0,
        sellerParentOrderId: 0,
        settlementStatus: 0,
        tokenId: buyOpenOrder.tokenId,
        exitedAmount: 0,
        exchangeToken: buyOpenOrder.exchangeToken,
      };

      this.orders.set(orderId, order);

      // Thêm order vào danh sách của cả buyer và seller
      if (!this.userOrders.has(buyOpenOrder.trader)) {
        this.userOrders.set(buyOpenOrder.trader, []);
      }
      if (!this.userOrders.has(sellOpenOrder.trader)) {
        this.userOrders.set(sellOpenOrder.trader, []);
      }

      this.userOrders.get(buyOpenOrder.trader)?.push(orderId);
      this.userOrders.get(sellOpenOrder.trader)?.push(orderId);

      // Cập nhật lượng đã match
      buyOpenOrder.matchedAmount += matchAmount;
      sellOpenOrder.matchedAmount += matchAmount;

      // Xử lý các trường hợp match
      this.updateMatchStatusForOpenOrders(
        buyOpenOrder,
        sellOpenOrder,
        orderId,
        matchAmount
      );

      // Cập nhật lại các open orders trong state
      this.openOrders.set(buyOpenOrderId, buyOpenOrder);
      this.openOrders.set(sellOpenOrderId, sellOpenOrder);

      this.emitOpenOrderMatched({
        buyOpenOrderId,
        sellOpenOrderId,
        orderId,
      });

      this.emitOrderCreated({
        orderId,
        buyOpenOrderId,
        sellOpenOrderId,
        buyer: buyOpenOrder.trader,
        seller: sellOpenOrder.trader,
        exchangeToken: buyOpenOrder.exchangeToken,
      });
    }
  }

  /**
   * Xử lý trường hợp seller exit (Buy order là exit)
   */
  private handleSellerExit(
    buyOpenOrder: OpenOrder,
    sellOpenOrder: OpenOrder,
    sellerExitSourceOrder: Order,
    matchAmount: number,
    sellerExitSourceOrderId: number
  ): void {
    this.orderIdCounter++;
    const orderId = this.orderIdCounter;

    // Lấy reference đến order gốc
    const originalOrder = this.orders.get(sellerExitSourceOrderId);
    if (!originalOrder) {
      throw new Error("Original order not found");
    }

    // Cập nhật số lượng đã exit trong order gốc
    const isFullExit =
      matchAmount ===
      sellerExitSourceOrder.amount - sellerExitSourceOrder.exitedAmount;
    originalOrder.exitedAmount += matchAmount;

    // Tạo order mới cho người bán mới và người mua cũ
    const newOrder: Order = {
      id: orderId,
      buyOpenOrderId: buyOpenOrder.id,
      sellOpenOrderId: sellOpenOrder.id,
      buyer: sellerExitSourceOrder.buyer, // Vẫn giữ buyer cũ
      seller: sellOpenOrder.trader, // Seller mới
      amount: matchAmount,
      buyPrice: buyOpenOrder.price,
      sellPrice: sellOpenOrder.price,
      isActive: true,
      buyerParentOrderId: sellerExitSourceOrderId,
      sellerParentOrderId: 0,
      settlementStatus: 0,
      tokenId: buyOpenOrder.tokenId,
      exitedAmount: 0,
      exchangeToken: buyOpenOrder.exchangeToken,
    };

    this.orders.set(orderId, newOrder);
    this.orders.set(sellerExitSourceOrderId, originalOrder);

    // Nếu exit toàn bộ, đánh dấu original order không còn active
    if (isFullExit) {
      originalOrder.isActive = false;
      this.orders.set(sellerExitSourceOrderId, originalOrder);
      this.emitOrderExited(sellerExitSourceOrderId, orderId);
    }

    // Thêm order vào danh sách của các bên liên quan
    if (!this.userOrders.has(sellOpenOrder.trader)) {
      this.userOrders.set(sellOpenOrder.trader, []);
    }
    this.userOrders.get(sellOpenOrder.trader)?.push(orderId);

    // Cập nhật lượng đã match
    buyOpenOrder.matchedAmount += matchAmount;
    sellOpenOrder.matchedAmount += matchAmount;

    // Xử lý các trường hợp match
    this.updateMatchStatusForOpenOrders(
      buyOpenOrder,
      sellOpenOrder,
      orderId,
      matchAmount
    );

    // Cập nhật lại các open orders trong state
    this.openOrders.set(buyOpenOrder.id, buyOpenOrder);
    this.openOrders.set(sellOpenOrder.id, sellOpenOrder);

    // Chuyển collateral từ người bán cho người mua (exit) - chỉ phát event, không thực sự chuyển tiền
    const collateralToTransfer = this.calculateProportionalCollateral(
      sellOpenOrder.collateral,
      matchAmount,
      sellOpenOrder.amount
    );

    this.emitCollateralReturned(buyOpenOrder.trader, collateralToTransfer);

    this.emitOpenOrderMatched({
      buyOpenOrderId: buyOpenOrder.id,
      sellOpenOrderId: sellOpenOrder.id,
      orderId,
    });

    this.emitOrderCreated({
      orderId,
      buyOpenOrderId: buyOpenOrder.id,
      sellOpenOrderId: sellOpenOrder.id,
      buyer: sellerExitSourceOrder.buyer,
      seller: sellOpenOrder.trader,
      exchangeToken: buyOpenOrder.exchangeToken,
    });
  }

  /**
   * Xử lý trường hợp buyer exit (Sell order là exit)
   */
  private handleBuyerExit(
    buyOpenOrder: OpenOrder,
    sellOpenOrder: OpenOrder,
    buyerExitSourceOrder: Order,
    matchAmount: number,
    buyerExitSourceOrderId: number
  ): void {
    this.orderIdCounter++;
    const orderId = this.orderIdCounter;

    // Lấy reference đến order gốc
    const originalOrder = this.orders.get(buyerExitSourceOrderId);
    if (!originalOrder) {
      throw new Error("Original order not found");
    }

    // Cập nhật số lượng đã exit trong order gốc
    const isFullExit =
      matchAmount ===
      buyerExitSourceOrder.amount - buyerExitSourceOrder.exitedAmount;
    originalOrder.exitedAmount += matchAmount;

    // Tạo order mới cho người mua mới và người bán cũ
    const newOrder: Order = {
      id: orderId,
      buyOpenOrderId: buyOpenOrder.id,
      sellOpenOrderId: sellOpenOrder.id,
      buyer: buyOpenOrder.trader, // Buyer mới
      seller: buyerExitSourceOrder.seller, // Vẫn giữ seller cũ
      amount: matchAmount,
      buyPrice: buyOpenOrder.price,
      sellPrice: sellOpenOrder.price,
      isActive: true,
      buyerParentOrderId: 0,
      sellerParentOrderId: buyerExitSourceOrderId,
      settlementStatus: 0,
      tokenId: buyOpenOrder.tokenId,
      exitedAmount: 0,
      exchangeToken: buyOpenOrder.exchangeToken,
    };

    this.orders.set(orderId, newOrder);
    this.orders.set(buyerExitSourceOrderId, originalOrder);

    // Nếu exit toàn bộ, đánh dấu original order không còn active
    if (isFullExit) {
      originalOrder.isActive = false;
      this.orders.set(buyerExitSourceOrderId, originalOrder);
      this.emitOrderExited(buyerExitSourceOrderId, orderId);
    }

    // Thêm order vào danh sách của các bên liên quan
    if (!this.userOrders.has(buyOpenOrder.trader)) {
      this.userOrders.set(buyOpenOrder.trader, []);
    }
    this.userOrders.get(buyOpenOrder.trader)?.push(orderId);

    // Cập nhật lượng đã match
    buyOpenOrder.matchedAmount += matchAmount;
    sellOpenOrder.matchedAmount += matchAmount;

    // Xử lý các trường hợp match
    this.updateMatchStatusForOpenOrders(
      buyOpenOrder,
      sellOpenOrder,
      orderId,
      matchAmount
    );

    // Cập nhật lại các open orders trong state
    this.openOrders.set(buyOpenOrder.id, buyOpenOrder);
    this.openOrders.set(sellOpenOrder.id, sellOpenOrder);

    // Chuyển collateral từ người mua cho người bán (exit) - chỉ phát event, không thực sự chuyển tiền
    const collateralToTransfer = this.calculateProportionalCollateral(
      buyOpenOrder.collateral,
      matchAmount,
      buyOpenOrder.amount
    );

    this.emitCollateralReturned(sellOpenOrder.trader, collateralToTransfer);

    this.emitOpenOrderMatched({
      buyOpenOrderId: buyOpenOrder.id,
      sellOpenOrderId: sellOpenOrder.id,
      orderId,
    });

    this.emitOrderCreated({
      orderId,
      buyOpenOrderId: buyOpenOrder.id,
      sellOpenOrderId: sellOpenOrder.id,
      buyer: buyOpenOrder.trader,
      seller: buyerExitSourceOrder.seller,
      exchangeToken: buyOpenOrder.exchangeToken,
    });
  }

  /**
   * Xử lý trường hợp cả buyer và seller đều exit
   */
  private handleBothExit(
    buyOpenOrder: OpenOrder,
    sellOpenOrder: OpenOrder,
    sellerExitSourceOrder: Order,
    buyerExitSourceOrder: Order,
    matchAmount: number,
    sellerExitSourceOrderId: number,
    buyerExitSourceOrderId: number
  ): void {
    // Cập nhật số lượng đã exit từ cả hai order gốc
    const isSellerFullExit =
      matchAmount ===
      sellerExitSourceOrder.amount - sellerExitSourceOrder.exitedAmount;
    const isBuyerFullExit =
      matchAmount ===
      buyerExitSourceOrder.amount - buyerExitSourceOrder.exitedAmount;

    // Cập nhật seller và buyer source orders
    const sellerOriginalOrder = this.orders.get(sellerExitSourceOrderId);
    const buyerOriginalOrder = this.orders.get(buyerExitSourceOrderId);

    if (!sellerOriginalOrder || !buyerOriginalOrder) {
      throw new Error("Original order not found");
    }

    // Cập nhật số lượng đã exit
    sellerOriginalOrder.exitedAmount += matchAmount;
    buyerOriginalOrder.exitedAmount += matchAmount;

    // Lưu lại vào state
    this.orders.set(sellerExitSourceOrderId, sellerOriginalOrder);
    this.orders.set(buyerExitSourceOrderId, buyerOriginalOrder);

    // Nếu exit toàn bộ, đánh dấu order không còn active
    if (isSellerFullExit) {
      sellerOriginalOrder.isActive = false;
      this.orders.set(sellerExitSourceOrderId, sellerOriginalOrder);
      this.emitOrderExited(sellerExitSourceOrderId, 0);
    }

    if (isBuyerFullExit) {
      buyerOriginalOrder.isActive = false;
      this.orders.set(buyerExitSourceOrderId, buyerOriginalOrder);
      this.emitOrderExited(buyerExitSourceOrderId, 0);
    }

    // Cập nhật lượng đã match
    buyOpenOrder.matchedAmount += matchAmount;
    sellOpenOrder.matchedAmount += matchAmount;

    // Xử lý các trường hợp match
    this.updateMatchStatusForOpenOrders(
      buyOpenOrder,
      sellOpenOrder,
      0,
      matchAmount
    );

    // Cập nhật lại các open orders trong state
    this.openOrders.set(buyOpenOrder.id, buyOpenOrder);
    this.openOrders.set(sellOpenOrder.id, sellOpenOrder);

    // Tính toán số tiền collateral cần chuyển
    const token = this.tokens.get(buyOpenOrder.tokenId);
    if (!token) {
      throw new Error("Token not found");
    }

    const buyerCollateralValue =
      (matchAmount * buyOpenOrder.price * token.collateralPercentage) / 100;
    const sellerCollateralValue =
      (matchAmount * sellOpenOrder.price * token.collateralPercentage) / 100;

    // Chuyển tiền cho cả người mua và người bán từ contract - chỉ phát event, không thực sự chuyển tiền
    this.emitCollateralReturned(buyOpenOrder.trader, buyerCollateralValue);
    this.emitCollateralReturned(sellOpenOrder.trader, sellerCollateralValue);

    // Phát emit sự kiện
    this.emitOpenOrderMatched({
      buyOpenOrderId: buyOpenOrder.id,
      sellOpenOrderId: sellOpenOrder.id,
      orderId: 0,
    });
  }

  /**
   * Cập nhật trạng thái match cho open orders
   */
  private updateMatchStatusForOpenOrders(
    buyOpenOrder: OpenOrder,
    sellOpenOrder: OpenOrder,
    orderId: number,
    matchAmount: number
  ): void {
    // Xử lý các trường hợp match
    if (
      buyOpenOrder.matchedAmount === buyOpenOrder.amount &&
      sellOpenOrder.matchedAmount === sellOpenOrder.amount
    ) {
      // Cả hai lệnh đều match toàn phần
      buyOpenOrder.status = OpenOrderStatus.Matched;
      sellOpenOrder.status = OpenOrderStatus.Matched;

      buyOpenOrder.matchedOrderIds = [orderId];
      sellOpenOrder.matchedOrderIds = [orderId];
    } else if (buyOpenOrder.matchedAmount === buyOpenOrder.amount) {
      // Lệnh mua match toàn phần, lệnh bán match một phần
      buyOpenOrder.status = OpenOrderStatus.Matched;

      // Thêm ID vào danh sách matched orders
      buyOpenOrder.matchedOrderIds = [orderId];
      sellOpenOrder.matchedOrderIds.push(orderId);
    } else if (sellOpenOrder.matchedAmount === sellOpenOrder.amount) {
      // Lệnh bán match toàn phần, lệnh mua match một phần
      sellOpenOrder.status = OpenOrderStatus.Matched;

      // Thêm ID vào danh sách matched orders
      sellOpenOrder.matchedOrderIds = [orderId];
      buyOpenOrder.matchedOrderIds.push(orderId);
    } else {
      // Cả hai lệnh đều match một phần
      // Thêm các ID vào danh sách matched orders
      buyOpenOrder.matchedOrderIds.push(orderId);
      sellOpenOrder.matchedOrderIds.push(orderId);
    }
  }

  /**
   * Tính toán số tiền collateral tỷ lệ với số lượng match
   * @param totalCollateral Tổng số collateral
   * @param matchAmount Số lượng match
   * @param totalAmount Tổng số lượng
   * @returns Số tiền collateral tỷ lệ
   */
  private calculateProportionalCollateral(
    totalCollateral: number,
    matchAmount: number,
    totalAmount: number
  ): number {
    // Nếu match toàn bộ, trả lại toàn bộ collateral
    if (matchAmount === totalAmount) {
      return totalCollateral;
    }

    // Tính tỷ lệ
    return (totalCollateral * matchAmount) / totalAmount;
  }

  /**
   * Thiết lập thời gian settlement sau TGE
   * @param openOrderId ID của lệnh cần thiết lập
   * @param tgeTimestamp Thời điểm TGE diễn ra
   * @param sender Địa chỉ người gọi hàm
   */
  public setTGEAndSettlementDeadline(
    openOrderId: number,
    tgeTimestamp: number,
    sender: string
  ): void {
    this.onlyOwner(sender);
    this.validOpenOrderId(openOrderId);

    const openOrder = this.openOrders.get(openOrderId);
    if (!openOrder) {
      throw new Error("Open order not found");
    }

    if (
      openOrder.status !== OpenOrderStatus.Matched &&
      openOrder.matchedAmount === 0
    ) {
      throw new Error("Open order must be matched at least partially");
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (tgeTimestamp <= currentTime) {
      throw new Error("TGE time must be in the future");
    }

    // Xác định thời gian settlement dựa trên token
    let settleTime = this.settlementPeriod; // Mặc định

    // Nếu có token ID, sử dụng thông tin từ token đó
    if (openOrder.tokenId > 0) {
      const token = this.tokens.get(openOrder.tokenId);
      if (token) {
        settleTime = token.settleDuration;
      }
    }

    // Thiết lập thời hạn settlement = TGE time + settlement period
    openOrder.settlementDeadline = tgeTimestamp + settleTime;

    // Cập nhật lại open order trong state
    this.openOrders.set(openOrderId, openOrder);
  }

  /**
   * Hoàn thành settlement cho toàn bộ OpenOrder
   * @param openOrderId ID của OpenOrder cần settlement
   * @param txProof Bằng chứng giao dịch chuyển token
   * @param sender Địa chỉ người gọi hàm
   */
  public completeSettlement(
    openOrderId: number,
    txProof: string,
    sender: string
  ): void {
    this.validOpenOrderId(openOrderId);

    const openOrder = this.openOrders.get(openOrderId);
    if (!openOrder) {
      throw new Error("Open order not found");
    }

    if (
      openOrder.status !== OpenOrderStatus.Matched &&
      openOrder.matchedAmount === 0
    ) {
      throw new Error("Open order must be matched at least partially");
    }

    if (openOrder.settlementDeadline === 0) {
      throw new Error("Settlement deadline not set");
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime > openOrder.settlementDeadline) {
      throw new Error("Settlement deadline passed");
    }

    // Tìm tất cả các orders liên quan đến OpenOrder này
    const orderIds: number[] = [];

    // Xử lý tất cả matched orders
    for (const orderId of openOrder.matchedOrderIds) {
      const order = this.orders.get(orderId);
      if (order && order.isActive) {
        // Kiểm tra xem người gọi có phải là seller không
        if (sender !== order.seller) {
          throw new Error("Only seller can complete settlement");
        }
        orderIds.push(orderId);
      }
    }

    if (orderIds.length === 0) {
      throw new Error("No valid orders found");
    }

    // Hoàn thành settlement cho tất cả các orders
    for (const orderId of orderIds) {
      const order = this.orders.get(orderId);
      if (!order) continue;

      // Đánh dấu order đã settlement
      order.isActive = false;
      order.settlementStatus = 1; // Đã settlement

      // Cập nhật lại order trong state
      this.orders.set(orderId, order);

      // Trả lại tiền đặt cọc cho seller - chỉ phát event, không thực sự chuyển tiền
      const sellerCollateral = this.calculateOrderCollateral(order);
      const buyerCollateral = this.calculateOrderCollateral(order);

      this.emitCollateralReturned(order.seller, sellerCollateral);
      this.emitCollateralReturned(order.seller, buyerCollateral);

      this.emitOrderSettled(orderId, sender);
    }

    // Cập nhật trạng thái cho OpenOrder
    // Nếu đã xử lý tất cả các orders liên quan
    let allSettled = true;

    // Kiểm tra tất cả matched orders
    for (const matchedOrderId of openOrder.matchedOrderIds) {
      const matchedOrder = this.orders.get(matchedOrderId);
      if (matchedOrder && matchedOrder.isActive) {
        allSettled = false;
        break;
      }
    }

    if (allSettled) {
      openOrder.status = OpenOrderStatus.Settled;
      // Cập nhật lại open order trong state
      this.openOrders.set(openOrderId, openOrder);
      this.emitOpenOrderSettled(openOrderId, sender);
    }
  }

  /**
   * Xử lý settlement thất bại cho toàn bộ OpenOrder
   * @param openOrderId ID của OpenOrder cần xử lý
   * @param sender Địa chỉ người gọi hàm
   */
  public handleFailedSettlement(openOrderId: number, sender: string): void {
    this.onlyOwner(sender);
    this.validOpenOrderId(openOrderId);

    const openOrder = this.openOrders.get(openOrderId);
    if (!openOrder) {
      throw new Error("Open order not found");
    }

    if (
      openOrder.status !== OpenOrderStatus.Matched &&
      openOrder.matchedAmount === 0
    ) {
      throw new Error("Open order must be matched at least partially");
    }

    if (openOrder.settlementDeadline === 0) {
      throw new Error("Settlement deadline not set");
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime <= openOrder.settlementDeadline) {
      throw new Error("Settlement deadline not passed yet");
    }

    // Xử lý tất cả các orders liên quan
    for (const orderId of openOrder.matchedOrderIds) {
      const order = this.orders.get(orderId);
      if (order && order.isActive) {
        // Xử lý settlement thất bại
        this.processFailedSettlement(orderId);
      }
    }

    // Cập nhật trạng thái cho OpenOrder
    openOrder.status = OpenOrderStatus.SettlementFailed;
    // Cập nhật lại open order trong state
    this.openOrders.set(openOrderId, openOrder);
    this.emitSettlementFailed(openOrderId);
  }

  /**
   * Xử lý settlement thất bại cho một order
   * @param orderId ID của order cần xử lý
   */
  private processFailedSettlement(orderId: number): void {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    const seller = order.seller;
    const buyer = order.buyer;

    // Đánh dấu order không còn active
    order.isActive = false;
    order.settlementStatus = 2; // Settlement thất bại

    // Cập nhật lại order trong state
    this.orders.set(orderId, order);

    // Chuyển tiền đặt cọc của người bán cho người mua làm bồi thường - chỉ phát event, không thực sự chuyển tiền
    const sellerCollateral = this.calculateOrderCollateral(order);
    const buyerCollateral = this.calculateOrderCollateral(order);

    this.emitCollateralReturned(buyer, sellerCollateral);
    this.emitCollateralReturned(buyer, buyerCollateral);

    this.emitSettlementFailed(
      this.openOrders.get(order.sellOpenOrderId)?.id || 0
    );
    this.emitCollateralForfeited(seller, sellerCollateral, buyer);
  }

  /**
   * Chuyển vị thế cho người khác (khi khớp với lệnh mới)
   * @param orderId ID của vị thế cần chuyển
   * @param newOpenOrderId ID của lệnh mới sẽ thay thế vị thế hiện tại
   * @param sender Địa chỉ người gọi hàm
   */
  public transferOrder(
    orderId: number,
    newOpenOrderId: number,
    sender: string
  ): void {
    this.onlyOwner(sender);
    this.validOrderId(orderId);
    this.validOpenOrderId(newOpenOrderId);

    const order = this.orders.get(orderId);
    const newOpenOrder = this.openOrders.get(newOpenOrderId);

    if (!order || !newOpenOrder) {
      throw new Error("Order or OpenOrder not found");
    }

    if (!order.isActive) {
      throw new Error("Order is not active");
    }
    if (newOpenOrder.status !== OpenOrderStatus.Active) {
      throw new Error("New open order is not active");
    }

    // Kiểm tra nếu là lệnh exit, đảm bảo orderIdToExit phải trỏ đến order hiện tại
    if (newOpenOrder.isExitOrder) {
      if (newOpenOrder.orderIdToExit !== orderId) {
        throw new Error("Exit order must target the order being transferred");
      }
    }

    // Xác định user muốn exit (buyer hoặc seller) và kiểm tra loại lệnh phù hợp
    const isBuyerExit = newOpenOrder.trader === order.buyer;

    if (isBuyerExit) {
      // Buyer muốn exit, phải là lệnh Sell
      if (newOpenOrder.orderType !== OpenOrderType.Sell) {
        throw new Error("Buyer exit order must be sell type");
      }
    } else {
      // Seller muốn exit, phải là lệnh Buy
      if (newOpenOrder.orderType !== OpenOrderType.Buy) {
        throw new Error("Seller exit order must be buy type");
      }
    }

    // Kiểm tra số lượng phù hợp
    if (order.amount !== newOpenOrder.amount) {
      throw new Error("Amount mismatch");
    }

    // Tạo vị thế mới cho người đặt lệnh mới
    this.orderIdCounter++;
    const newOrderId = this.orderIdCounter;

    const oldBuyer = order.buyer;
    const oldSeller = order.seller;

    // Xác định buyer và seller mới
    let newBuyer: string;
    let newSeller: string;
    if (isBuyerExit) {
      // Buyer exit, thay buyer mới
      newBuyer = newOpenOrder.trader;
      newSeller = order.seller;
    } else {
      // Seller exit, thay seller mới
      newBuyer = order.buyer;
      newSeller = newOpenOrder.trader;
    }

    const newOrder: Order = {
      id: newOrderId,
      buyOpenOrderId: order.buyOpenOrderId,
      sellOpenOrderId: order.sellOpenOrderId,
      buyer: newBuyer,
      seller: newSeller,
      amount: order.amount,
      buyPrice: order.buyPrice,
      sellPrice: order.sellPrice,
      isActive: true,
      buyerParentOrderId: isBuyerExit ? orderId : order.buyerParentOrderId,
      sellerParentOrderId: isBuyerExit ? order.sellerParentOrderId : orderId,
      settlementStatus: 0,
      tokenId: order.tokenId,
      exitedAmount: 0,
      exchangeToken: order.exchangeToken,
    };

    this.orders.set(newOrderId, newOrder);

    // Thêm vị thế mới vào danh sách của user mới
    if (!this.userOrders.has(newOpenOrder.trader)) {
      this.userOrders.set(newOpenOrder.trader, []);
    }
    this.userOrders.get(newOpenOrder.trader)?.push(newOrderId);

    // Đánh dấu vị thế cũ là không còn active
    order.isActive = false;
    this.orders.set(orderId, order);

    // Cập nhật trạng thái của lệnh mới
    newOpenOrder.status = OpenOrderStatus.Matched;
    newOpenOrder.matchedAmount = newOpenOrder.amount; // Cập nhật matchedAmount bằng amount vì là match toàn phần
    newOpenOrder.matchedOrderIds = [newOrderId];

    // Cập nhật lại open order trong state
    this.openOrders.set(newOpenOrderId, newOpenOrder);

    // Nếu lệnh mới là lệnh exit thì không cần hoàn tiền vì người dùng không đặt cọc
    if (!newOpenOrder.isExitOrder) {
      let receiverAddress: string;

      if (isBuyerExit) {
        // Chuyển tiền đặt cọc cho buyer cũ (người exit)
        receiverAddress = oldBuyer;
      } else {
        // Chuyển tiền đặt cọc cho seller cũ (người exit)
        receiverAddress = oldSeller;
      }

      // Chuyển tiền đặt cọc cho người giữ vị thế cũ - chỉ phát event, không thực sự chuyển tiền
      this.emitCollateralReturned(receiverAddress, newOpenOrder.collateral);
    }

    this.emitOrderExited(orderId, newOrderId);
    this.emitOrderCreated({
      orderId: newOrderId,
      buyOpenOrderId: order.buyOpenOrderId,
      sellOpenOrderId: order.sellOpenOrderId,
      buyer: newBuyer,
      seller: newSeller,
      exchangeToken: order.exchangeToken,
    });

    if (isBuyerExit) {
      this.emitOrderTransferred(orderId, oldBuyer, newOpenOrder.trader);
    } else {
      this.emitOrderTransferred(orderId, oldSeller, newOpenOrder.trader);
    }
  }

  /**
   * Tính toán tiền đặt cọc cho một order
   * @param order Order cần tính toán
   * @returns Số tiền đặt cọc
   */
  private calculateOrderCollateral(order: Order): number {
    const openOrder = this.openOrders.get(order.buyOpenOrderId);
    if (!openOrder) {
      return 0;
    }

    let orderIndex = -1;

    // Tìm order trong danh sách matchedOrderIds
    for (let i = 0; i < openOrder.matchedOrderIds.length; i++) {
      if (openOrder.matchedOrderIds[i] === order.id) {
        orderIndex = i;
        break;
      }
    }

    if (orderIndex === -1) {
      return 0;
    }

    // Nếu là match toàn phần và chỉ có 1 matchedOrderId
    if (
      (openOrder.status === OpenOrderStatus.Matched ||
        openOrder.matchedAmount === openOrder.amount) &&
      openOrder.matchedOrderIds.length === 1
    ) {
      return openOrder.collateral;
    }

    // Tính toán tiền đặt cọc dựa trên tỷ lệ với số lượng ban đầu của openOrder
    const ratio = (order.amount * 1e18) / openOrder.amount; // Sử dụng 1e18 để tránh mất độ chính xác
    return Math.floor((openOrder.collateral * ratio) / 1e18);
  }

  /**
   * Lấy thông tin chi tiết về trạng thái match của một OpenOrder
   * @param openOrderId ID của OpenOrder
   * @returns Thông tin về trạng thái match
   */
  public getOpenOrderMatchStatus(openOrderId: number): {
    matchStatus: number;
    matchedOrderIds: number[];
    remainingAmount: number;
  } {
    this.validOpenOrderId(openOrderId);

    const openOrder = this.openOrders.get(openOrderId);
    if (!openOrder) {
      throw new Error("Open order not found");
    }

    if (
      openOrder.status === OpenOrderStatus.Active &&
      openOrder.matchedAmount === 0
    ) {
      // Chưa match
      return {
        matchStatus: 0,
        matchedOrderIds: [],
        remainingAmount: openOrder.amount,
      };
    } else if (
      openOrder.status === OpenOrderStatus.Matched ||
      openOrder.matchedAmount === openOrder.amount
    ) {
      // Match toàn phần
      return {
        matchStatus: 1,
        matchedOrderIds: openOrder.matchedOrderIds,
        remainingAmount: 0,
      };
    } else if (openOrder.matchedOrderIds.length > 0) {
      // Match một phần
      return {
        matchStatus: 2,
        matchedOrderIds: openOrder.matchedOrderIds,
        remainingAmount: openOrder.amount - openOrder.matchedAmount,
      };
    } else {
      // Trạng thái khác (đã hủy, đã settlement, settlement thất bại)
      return {
        matchStatus: 0,
        matchedOrderIds: [],
        remainingAmount: 0,
      };
    }
  }

  // View functions

  /**
   * Lấy thông tin lệnh mở
   * @param openOrderId ID của lệnh mở
   * @returns Thông tin lệnh mở
   */
  public getOpenOrder(openOrderId: number): OpenOrder {
    this.validOpenOrderId(openOrderId);

    const openOrder = this.openOrders.get(openOrderId);
    if (!openOrder) {
      throw new Error("Open order not found");
    }

    return openOrder;
  }

  /**
   * Lấy thông tin order
   * @param orderId ID của order
   * @returns Thông tin order
   */
  public getOrder(orderId: number): Order {
    this.validOrderId(orderId);

    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    return order;
  }

  /**
   * Lấy danh sách lệnh mở của một người dùng
   * @param user Địa chỉ người dùng
   * @returns Mảng ID của các lệnh mở
   */
  public getUserOpenOrders(user: string): number[] {
    return this.userOpenOrders.get(user) || [];
  }

  /**
   * Lấy danh sách order của một người dùng
   * @param user Địa chỉ người dùng
   * @returns Mảng ID của các order
   */
  public getUserOrders(user: string): number[] {
    return this.userOrders.get(user) || [];
  }

  /**
   * Kiểm tra xem thị trường có đang mở không
   * @returns Trạng thái mở của thị trường
   */
  public isMarketOpen(): boolean {
    const currentTime = Math.floor(Date.now() / 1000);
    return (
      this.isActive &&
      currentTime >= this.marketOpenTime &&
      currentTime <= this.marketCloseTime
    );
  }

  /**
   * Kiểm tra xem một buyer order và một seller order có là cặp đôi không
   * @param buyerOrderId ID của buyer order
   * @param sellerOrderId ID của seller order
   * @returns Kết quả kiểm tra
   */
  public isBuyerOfSellerOrder(
    buyerOrderId: number,
    sellerOrderId: number
  ): boolean {
    const buyerOrder = this.orders.get(buyerOrderId);
    const sellerOrder = this.orders.get(sellerOrderId);

    if (!buyerOrder || !sellerOrder) {
      return false;
    }

    // Trong cấu trúc Order mới, nếu cả buyerOrderId và sellerOrderId
    // cùng tồn tại trong một order, thì chúng thuộc cùng một cặp
    if (buyerOrder.id === sellerOrder.id) {
      return true;
    }

    return false;
  }

  /**
   * Lấy thông tin token từ ID
   * @param tokenId ID của token
   * @returns Thông tin token hoặc undefined nếu không tồn tại
   */
  public getTokenById(tokenId: number): Token | undefined {
    try {
      this.validTokenId(tokenId);
      return this.tokens.get(tokenId);
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Tự động quét và khớp các lệnh mua bán phù hợp
   * @param tokenId ID của token cần khớp lệnh (0 để quét tất cả các token)
   * @param matchStrategy Chiến lược khớp lệnh: "price" (ưu tiên giá tốt nhất), "time" (ưu tiên thời gian sớm nhất), "volume" (ưu tiên khối lượng lớn nhất)
   * @param maxMatchesPerRun Số lần khớp lệnh tối đa trong một lần chạy
   * @param sender Địa chỉ người gọi hàm
   * @returns Số lượng cặp lệnh đã khớp thành công
   */
  public autoMatchOrders(
    tokenId: number = 0,
    matchStrategy: "price" | "time" | "volume" = "price",
    maxMatchesPerRun: number = 10,
    sender: string
  ): number {
    this.onlyOwner(sender);
    this.marketIsActive();

    // Mảng lưu trữ tất cả các lệnh mua và bán đang active
    const activeBuyOrders: OpenOrder[] = [];
    const activeSellOrders: OpenOrder[] = [];

    // Quét qua tất cả các openOrders để tìm lệnh active
    for (const [id, order] of this.openOrders.entries()) {
      // Chỉ xét các lệnh active và chưa match hoặc match một phần
      if (order.status !== OpenOrderStatus.Active) {
        continue;
      }

      // Nếu có chỉ định tokenId, chỉ xử lý các lệnh của token đó
      if (tokenId > 0 && order.tokenId !== tokenId) {
        continue;
      }

      // Phân loại lệnh mua và bán
      if (order.orderType === OpenOrderType.Buy) {
        activeBuyOrders.push(order);
      } else {
        activeSellOrders.push(order);
      }
    }

    // Sắp xếp lệnh mua theo chiến lược phù hợp
    if (matchStrategy === "price") {
      // Sắp xếp lệnh mua theo giá giảm dần (giá cao nhất lên đầu)
      activeBuyOrders.sort((a, b) => b.price - a.price);
      // Sắp xếp lệnh bán theo giá tăng dần (giá thấp nhất lên đầu)
      activeSellOrders.sort((a, b) => a.price - b.price);
    } else if (matchStrategy === "time") {
      // Sắp xếp theo thời gian tăng dần (lệnh cũ lên đầu)
      activeBuyOrders.sort((a, b) => a.timestamp - b.timestamp);
      activeSellOrders.sort((a, b) => a.timestamp - b.timestamp);
    } else if (matchStrategy === "volume") {
      // Sắp xếp theo volume giảm dần (khối lượng lớn lên đầu)
      activeBuyOrders.sort((a, b) => {
        const aRemaining = a.amount - a.matchedAmount;
        const bRemaining = b.amount - b.matchedAmount;
        return bRemaining - aRemaining;
      });
      activeSellOrders.sort((a, b) => {
        const aRemaining = a.amount - a.matchedAmount;
        const bRemaining = b.amount - b.matchedAmount;
        return bRemaining - aRemaining;
      });
    }

    // Đếm số lần khớp lệnh thành công
    let matchCount = 0;

    // Duyệt qua các lệnh mua
    for (const buyOrder of activeBuyOrders) {
      // Nếu đã đạt giới hạn khớp lệnh, dừng lại
      if (matchCount >= maxMatchesPerRun) {
        break;
      }

      // Tính số lượng còn lại có thể match của lệnh mua
      const buyRemainingAmount = buyOrder.amount - buyOrder.matchedAmount;
      if (buyRemainingAmount <= 0) {
        continue; // Lệnh đã match hết, bỏ qua
      }

      // Tìm lệnh bán phù hợp
      for (let i = 0; i < activeSellOrders.length; i++) {
        const sellOrder = activeSellOrders[i];

        // Tính số lượng còn lại có thể match của lệnh bán
        const sellRemainingAmount = sellOrder.amount - sellOrder.matchedAmount;
        if (sellRemainingAmount <= 0) {
          continue; // Lệnh đã match hết, bỏ qua
        }

        // Kiểm tra điều kiện khớp lệnh
        if (
          buyOrder.tokenId === sellOrder.tokenId && // Cùng token
          buyOrder.price >= sellOrder.price && // Giá mua >= giá bán
          buyOrder.exchangeToken === sellOrder.exchangeToken // Cùng đồng tiền giao dịch
        ) {
          try {
            // Tính số lượng có thể match
            const matchAmount = Math.min(
              buyRemainingAmount,
              sellRemainingAmount
            );

            // Thực hiện khớp lệnh
            this.matchOpenOrders(
              buyOrder.id,
              sellOrder.id,
              matchAmount,
              sender
            );

            // Tăng số lần khớp lệnh thành công
            matchCount++;

            // Cập nhật lại lệnh từ storage vì có thể đã thay đổi trạng thái
            const updatedBuyOrder = this.openOrders.get(buyOrder.id);
            const updatedSellOrder = this.openOrders.get(sellOrder.id);

            // Nếu một trong hai lệnh đã match hết, chuyển sang lệnh mua tiếp theo
            if (
              !updatedBuyOrder ||
              updatedBuyOrder.status !== OpenOrderStatus.Active ||
              updatedBuyOrder.amount === updatedBuyOrder.matchedAmount
            ) {
              break;
            }

            // Nếu lệnh bán đã match hết, loại bỏ khỏi danh sách có thể match
            if (
              !updatedSellOrder ||
              updatedSellOrder.status !== OpenOrderStatus.Active ||
              updatedSellOrder.amount === updatedSellOrder.matchedAmount
            ) {
              activeSellOrders.splice(i, 1);
              i--; // Điều chỉnh chỉ số để tránh bỏ qua phần tử
            }

            // Nếu đã đạt giới hạn khớp lệnh, dừng lại
            if (matchCount >= maxMatchesPerRun) {
              break;
            }
          } catch (error) {
            console.error(
              `Lỗi khi khớp lệnh ${buyOrder.id} và ${sellOrder.id}:`,
              error
            );
            // Tiếp tục với cặp lệnh tiếp theo
            continue;
          }
        }
      }
    }

    return matchCount;
  }

  /**
   * Tự động khớp lệnh theo lô với khoảng thời gian chờ
   * @param tokenId ID của token cần khớp lệnh (0 để quét tất cả các token)
   * @param intervalInSeconds Khoảng thời gian giữa các lần khớp lệnh (giây)
   * @param matchStrategy Chiến lược khớp lệnh
   * @param batchSize Số lần khớp lệnh tối đa trong một lô
   * @param maxBatches Số lô tối đa sẽ chạy (0 để chạy vô hạn)
   * @param sender Địa chỉ người gọi hàm
   * @returns Một hàm để dừng quá trình khớp lệnh tự động
   */
  public startAutoMatchingLoop(
    tokenId: number = 0,
    intervalInSeconds: number = 60,
    matchStrategy: "price" | "time" | "volume" = "price",
    batchSize: number = 10,
    maxBatches: number = 0,
    sender: string
  ): () => void {
    this.onlyOwner(sender);

    let batchCount = 0;
    let isRunning = true;

    // Hàm thực hiện khớp lệnh trong một lô
    const runBatch = () => {
      if (!isRunning) return;

      // Nếu thị trường không hoạt động, bỏ qua lô này
      if (!this.isMarketOpen()) {
        console.log("Thị trường đang đóng, bỏ qua lô khớp lệnh này");

        // Nếu đã đạt số lô tối đa, dừng lại
        if (maxBatches > 0 && ++batchCount >= maxBatches) {
          console.log(
            `Đã đạt số lô tối đa (${maxBatches}), dừng khớp lệnh tự động`
          );
          isRunning = false;
          return;
        }

        // Lên lịch cho lô tiếp theo
        setTimeout(runBatch, intervalInSeconds * 1000);
        return;
      }

      try {
        // Thực hiện khớp lệnh tự động
        const matchCount = this.autoMatchOrders(
          tokenId,
          matchStrategy,
          batchSize,
          sender
        );

        console.log(
          `Lô khớp lệnh #${batchCount + 1}: Đã khớp ${matchCount} cặp lệnh`
        );

        // Nếu đã đạt số lô tối đa, dừng lại
        if (maxBatches > 0 && ++batchCount >= maxBatches) {
          console.log(
            `Đã đạt số lô tối đa (${maxBatches}), dừng khớp lệnh tự động`
          );
          isRunning = false;
          return;
        }

        // Lên lịch cho lô tiếp theo
        setTimeout(runBatch, intervalInSeconds * 1000);
      } catch (error) {
        console.error("Lỗi trong lô khớp lệnh tự động:", error);

        // Vẫn tiếp tục với lô tiếp theo
        if (isRunning) {
          setTimeout(runBatch, intervalInSeconds * 1000);
        }
      }
    };

    // Bắt đầu vòng lặp khớp lệnh
    console.log(
      `Bắt đầu vòng lặp khớp lệnh tự động với khoảng thời gian ${intervalInSeconds}s`
    );
    setTimeout(runBatch, 0); // Bắt đầu ngay lập tức với lô đầu tiên

    // Trả về hàm để dừng vòng lặp
    return () => {
      console.log("Dừng vòng lặp khớp lệnh tự động");
      isRunning = false;
    };
  }
}
