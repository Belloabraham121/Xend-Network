// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IDataTypes
 * @notice Interface defining common data structures used across the platform
 */
interface IDataTypes {
    // Asset Types
    enum AssetType {
        GOLD,
        SILVER,
        REAL_ESTATE,
        ART,
        OIL,
        CUSTOM
    }

    // Asset Information
    struct AssetInfo {
        string name;
        string symbol;
        AssetType assetType;
        uint256 totalSupply;
        uint256 pricePerToken;
        address tokenAddress;
        bool isActive;
        uint256 createdAt;
        address creator;
    }

    // Portfolio Position
    struct Position {
        address tokenAddress;
        uint256 amount;
        uint256 value;
        uint256 entryPrice;
        uint256 currentPrice;
        uint256 lastUpdated;
        bool isActive;
    }

    // Portfolio Data
    struct Portfolio {
        address owner;
        Position[] positions;
        uint256 totalValue;
        uint256 totalRewards;
        uint256 lastRewardClaim;
        uint256 riskScore;
    }

    // Lending Position
    struct LendingPosition {
        address lender;
        address asset;
        uint256 amount;
        uint256 interestRate;
        uint256 startTime;
        uint256 duration;
        bool isActive;
        uint256 accruedInterest;
    }

    // Borrowing Position
    struct BorrowingPosition {
        address borrower;
        address asset;
        uint256 amount;
        uint256 interestRate;
        uint256 startTime;
        uint256 duration;
        address collateral;
        uint256 collateralAmount;
        bool isActive;
        uint256 accruedInterest;
    }

    // Strategy Information
    struct StrategyInfo {
        string name;
        string description;
        address[] allowedAssets;
        uint256 minInvestment;
        uint256 maxInvestment;
        uint256 expectedReturn;
        uint256 riskLevel;
        bool isActive;
        address manager;
    }

    // Strategy Position
    struct StrategyPosition {
        address investor;
        uint256 strategyId;
        uint256 amount;
        uint256 shares;
        uint256 entryTime;
        uint256 lastRebalance;
        bool isActive;
    }

    // Market Order
    struct MarketOrder {
        address seller;
        address buyer;
        address asset;
        uint256 amount;
        uint256 price;
        uint256 timestamp;
        bool isActive;
        bool isFilled;
    }

    // Reward Information
    struct RewardInfo {
        address recipient;
        address asset;
        uint256 amount;
        uint256 multiplier;
        uint256 timestamp;
        bool isClaimed;
        string rewardType;
        uint256 totalClaimed;
        uint256 pendingRewards;
    }

    // Price Feed Data
    struct PriceFeedData {
        address asset;
        uint256 price;
        uint256 timestamp;
        uint8 decimals;
        bool isValid;
    }

    // Chainlink Request
    struct ChainlinkRequest {
        bytes32 requestId;
        address requester;
        string dataType;
        uint256 timestamp;
        bool isFulfilled;
    }
}