// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IDataTypes.sol";

/**
 * @title IChainlinkPriceOracle
 * @notice Interface for the Chainlink Price Oracle contract
 */
interface IChainlinkPriceOracle {
    // Events
    event PriceUpdated(
        address indexed asset,
        uint256 price,
        uint256 timestamp
    );
    
    event PriceFeedAdded(
        address indexed asset,
        address indexed priceFeed
    );
    
    event PriceFeedRemoved(
        address indexed asset
    );
    
    event FunctionsRequestSent(
        bytes32 indexed requestId,
        address indexed asset
    );
    
    event FunctionsRequestFulfilled(
        bytes32 indexed requestId,
        uint256 price
    );
    
    // Functions
    function addPriceFeed(
        address asset,
        address priceFeed
    ) external;
    
    function removePriceFeed(address asset) external;
    
    function getPrice(address asset) 
        external 
        view 
        returns (uint256);
    
    function getPriceWithTimestamp(address asset) 
        external 
        view 
        returns (uint256 price, uint256 timestamp);
    
    function requestAssetPrice(address asset) 
        external 
        returns (bytes32 requestId);
    
    function updatePriceFromFunctions(
        bytes32 requestId,
        uint256 price
    ) external;
    
    function getPriceFeedData(address asset) 
        external 
        view 
        returns (IDataTypes.PriceFeedData memory);
    
    function isValidPrice(
        address asset,
        uint256 maxAge
    ) external 
        view 
        returns (bool);
    
    function getMultiplePrices(address[] memory assets) 
        external 
        view 
        returns (uint256[] memory);
    
    function updateAllPrices() external;
}