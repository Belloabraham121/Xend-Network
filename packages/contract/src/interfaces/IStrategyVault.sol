// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IDataTypes.sol";

/**
 * @title IStrategyVault
 * @notice Interface for the Strategy Vault contract
 */
interface IStrategyVault {
    // Events
    event StrategyCreated(
        uint256 indexed strategyId,
        string name,
        address indexed manager
    );
    
    event Investment(
        address indexed investor,
        uint256 indexed strategyId,
        uint256 amount,
        uint256 shares
    );
    
    event Withdrawal(
        address indexed investor,
        uint256 indexed strategyId,
        uint256 amount,
        uint256 shares
    );
    
    event StrategyRebalanced(
        uint256 indexed strategyId,
        uint256 newTotalValue
    );
    
    event PerformanceFeeCollected(
        uint256 indexed strategyId,
        uint256 amount
    );
    
    // Functions
    function createStrategy(
        string memory name,
        string memory description,
        address[] memory allowedAssets,
        uint256 minInvestment,
        uint256 maxInvestment,
        uint256 expectedReturn,
        uint256 riskLevel
    ) external returns (uint256);
    
    function invest(
        uint256 strategyId,
        uint256 amount
    ) external;
    
    function withdraw(
        uint256 strategyId,
        uint256 shares
    ) external;
    
    function rebalanceStrategy(uint256 strategyId) external;
    
    function getStrategy(uint256 strategyId) 
        external 
        view 
        returns (IDataTypes.StrategyInfo memory);
    
    function getStrategyPosition(
        address investor,
        uint256 strategyId
    ) external 
        view 
        returns (IDataTypes.StrategyPosition memory);
    
    function getAllStrategies() 
        external 
        view 
        returns (IDataTypes.StrategyInfo[] memory);
    
    function getActiveStrategies() 
        external 
        view 
        returns (IDataTypes.StrategyInfo[] memory);
    
    function getStrategyPerformance(uint256 strategyId) 
        external 
        view 
        returns (uint256 totalValue, uint256 totalReturn);
    
    function calculateShares(
        uint256 strategyId,
        uint256 amount
    ) external 
        view 
        returns (uint256);
    
    function getInvestorPositions(address investor) 
        external 
        view 
        returns (IDataTypes.StrategyPosition[] memory);
    
    function updateStrategyStatus(
        uint256 strategyId,
        bool isActive
    ) external;
}