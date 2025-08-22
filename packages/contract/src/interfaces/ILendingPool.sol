// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IDataTypes.sol";

/**
 * @title ILendingPool
 * @notice Interface for the Lending Pool contract
 */
interface ILendingPool {
    // Events
    event Deposit(
        address indexed lender,
        address indexed asset,
        uint256 amount,
        uint256 interestRate
    );
    
    event Withdraw(
        address indexed lender,
        address indexed asset,
        uint256 amount,
        uint256 interest
    );
    
    event Borrow(
        address indexed borrower,
        address indexed asset,
        uint256 amount,
        address collateral,
        uint256 collateralAmount
    );
    
    event Repay(
        address indexed borrower,
        address indexed asset,
        uint256 amount,
        uint256 interest
    );
    
    event InterestRateUpdated(
        address indexed asset,
        uint256 newRate
    );
    
    // Functions
    function deposit(
        address asset,
        uint256 amount
    ) external;
    
    function withdraw(
        address asset,
        uint256 amount
    ) external;
    
    function borrow(
        address asset,
        uint256 amount,
        address collateral,
        uint256 collateralAmount
    ) external;
    
    function repay(
        address asset,
        uint256 amount
    ) external;
    
    function getLendingPosition(address lender, address asset) 
        external 
        view 
        returns (IDataTypes.LendingPosition memory);
    
    function getBorrowingPosition(address borrower, address asset) 
        external 
        view 
        returns (IDataTypes.BorrowingPosition memory);
    
    function getInterestRate(address asset) 
        external 
        view 
        returns (uint256);
    
    function setInterestRate(
        address asset,
        uint256 rate
    ) external;
    
    function calculateInterest(
        address asset,
        uint256 amount,
        uint256 duration
    ) external 
        view 
        returns (uint256);
    
    function getAvailableLiquidity(address asset) 
        external 
        view 
        returns (uint256);
    
    function getTotalBorrowed(address asset) 
        external 
        view 
        returns (uint256);
    
    function getCollateralRatio(
        address borrower,
        address asset
    ) external 
        view 
        returns (uint256);
    
    function liquidate(
        address borrower,
        address asset
    ) external;
}