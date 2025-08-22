// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IDataTypes.sol";

/**
 * @title IPortfolioManager
 * @notice Interface for the Portfolio Manager contract
 */
interface IPortfolioManager {
    // Events
    event PositionAdded(
        address indexed user,
        address indexed asset,
        uint256 amount,
        uint256 value
    );
    
    event PositionUpdated(
        address indexed user,
        address indexed asset,
        uint256 newAmount,
        uint256 newValue
    );
    
    event PositionRemoved(
        address indexed user,
        address indexed asset
    );
    
    event PortfolioRebalanced(
        address indexed user,
        uint256 newTotalValue
    );
    
    // Functions
    function addPosition(
        address user,
        address asset,
        uint256 amount,
        uint256 entryPrice
    ) external;
    
    function updatePosition(
        address user,
        address asset,
        uint256 newAmount,
        uint256 currentPrice
    ) external;
    
    function removePosition(
        address user,
        address asset
    ) external;
    
    function getPortfolio(address user) 
        external 
        view 
        returns (IDataTypes.Portfolio memory);
    
    function getPosition(
        address user,
        address asset
    ) external 
        view 
        returns (IDataTypes.Position memory);
    
    function getTotalValue(address user) 
        external 
        view 
        returns (uint256);
    
    function getActivePositions(address user) 
        external 
        view 
        returns (IDataTypes.Position[] memory);
    
    function calculateRiskScore(address user) 
        external 
        view 
        returns (uint256);
    
    function rebalancePortfolio(address user) external;
    
    function updateAllPrices() external;
    
    function getUserAssets(address user) 
        external 
        view 
        returns (address[] memory);
    
    // Analytics Functions
    function getDiversificationScore(address user) 
        external 
        view 
        returns (uint256 diversificationScore);
    
    function getRiskScore(address user) 
        external 
        view 
        returns (uint256 riskScore);
    
    function getAssetAllocation(address user) 
        external 
        view 
        returns (uint256[6] memory allocations);
    
    function getPortfolioPerformance(address user) 
        external 
        view 
        returns (
            uint256 totalReturn,
            uint256 annualizedReturn,
            uint256 volatility,
            uint256 sharpeRatio
        );
    
    function takePerformanceSnapshot(address user) external;
}