# Pre-Market Contract Simulator

A web-based simulator for testing and visualizing pre-market token trading mechanics. This project provides a full-featured front-end interface to interact with a simulated pre-market smart contract, allowing users to test token trading scenarios without deploying actual blockchain contracts.

## Features

- **Token Management**: Register and manage tokens with configurable settlement durations and collateral percentages
- **Order Placement**: Place buy/sell orders with custom amounts and prices
- **Order Matching**: Manual or automatic matching of compatible buy and sell orders
- **Settlement Simulation**: Test the settlement process after token generation events
- **User Roles**: System owner and trader interfaces with different permissions
- **Auto Trading**: Configurable automated trading to simulate market activity
- **Event Logging**: Track all contract events in real-time
- **Multi-user Simulation**: Test interactions between multiple simulated users

## Technology Stack

- **Frontend**: Next.js 15 with App Router
- **UI**: TailwindCSS 4
- **Language**: TypeScript
- **State Management**: React useState/useContext hooks

## Getting Started

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Start the development server:

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

The simulator provides a dashboard interface with the following features:

- **My Orders**: View and manage your open and matched orders
- **Place Order**: Create new buy or sell orders
- **Match Orders**: Manually match compatible orders (owner only)
- **Settlement**: Simulate the settlement process after TGE
- **Auto Trader**: Configure automated trading bots (owner only)
- **Token Management**: Register and configure tokens (owner only)
- **Market Settings**: Configure market opening/closing times (owner only)
- **Event Log**: View all contract events

## Development

This project is built with Next.js using the App Router. The main simulator logic is implemented in `src/lib/simulator/PreMarketSimulator.ts` which emulates the behavior of a blockchain smart contract in memory.

## License

This project is for demonstration and education purposes only.
