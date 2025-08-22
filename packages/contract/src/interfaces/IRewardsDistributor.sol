// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IDataTypes.sol";

/**
 * @title IRewardsDistributor
 * @notice Interface for the Rewards Distributor contract
 */
interface IRewardsDistributor {
    // Events
    event RewardCalculated(
        address indexed user,
        address indexed asset,
        uint256 amount,
        uint256 multiplier
    );
    
    event RewardClaimed(
        address indexed user,
        address indexed asset,
        uint256 amount
    );
    
    event MonthlyRewardDistributed(
        uint256 totalAmount,
        uint256 recipientCount
    );
    
    event RewardMultiplierUpdated(
        address indexed asset,
        uint256 newMultiplier
    );
    
    // Functions
    function calculateReward(
        address user,
        address asset,
        uint256 amount,
        uint256 holdingPeriod
    ) external view returns (uint256);
    
    function claimReward(
        address asset
    ) external returns (uint256);
    
    function claimAllRewards() external returns (uint256);
    
    function distributeMonthlyRewards() external;
    
    function getPendingRewards(address user) 
        external 
        view 
        returns (IDataTypes.RewardInfo[] memory);
    
    function getTotalRewards(address user) 
        external 
        view 
        returns (uint256);
    
    function getRewardMultiplier(address asset) 
        external 
        view 
        returns (uint256);
    
    function setRewardMultiplier(
        address asset,
        uint256 multiplier
    ) external;
    
    function updateRewardCalculation(
        address user,
        address asset,
        uint256 newAmount
    ) external;
    
    function getLastClaimTime(address user) 
        external 
        view 
        returns (uint256);
    
    function isEligibleForReward(
        address user,
        address asset
    ) external 
        view 
        returns (bool);
}