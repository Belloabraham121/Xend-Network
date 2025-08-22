// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IDataTypes.sol";

/**
 * @title IAssetMarketplace
 * @notice Interface for the Asset Marketplace contract
 */
interface IAssetMarketplace {
    // Events
    event OrderCreated(
        uint256 indexed orderId,
        address indexed seller,
        address indexed asset,
        uint256 amount,
        uint256 price
    );
    
    event OrderFilled(
        uint256 indexed orderId,
        address indexed buyer,
        uint256 amount,
        uint256 totalPrice
    );
    
    event OrderCancelled(
        uint256 indexed orderId,
        address indexed seller
    );
    
    event Trade(
        address indexed seller,
        address indexed buyer,
        address indexed asset,
        uint256 amount,
        uint256 price
    );
    
    // Functions
    function createSellOrder(
        address asset,
        uint256 amount,
        uint256 price
    ) external returns (uint256);
    
    function createBuyOrder(
        address asset,
        uint256 amount,
        uint256 maxPrice
    ) external returns (uint256);
    
    function fillOrder(
        uint256 orderId,
        uint256 amount
    ) external;
    
    function cancelOrder(uint256 orderId) external;
    
    function getOrder(uint256 orderId) 
        external 
        view 
        returns (IDataTypes.MarketOrder memory);
    
    function getActiveOrders(address asset) 
        external 
        view 
        returns (IDataTypes.MarketOrder[] memory);
    
    function getUserOrders(address user) 
        external 
        view 
        returns (IDataTypes.MarketOrder[] memory);
    
    function getMarketPrice(address asset) 
        external 
        view 
        returns (uint256);
    
    function getTradingVolume(address asset) 
        external 
        view 
        returns (uint256);
    
    function getOrderBook(address asset) 
        external 
        view 
        returns (
            IDataTypes.MarketOrder[] memory sellOrders,
            IDataTypes.MarketOrder[] memory buyOrders
        );
    
    function matchOrders(
        uint256 sellOrderId,
        uint256 buyOrderId
    ) external;
    
    function setTradingFee(uint256 fee) external;
    
    function getTradingFee() external view returns (uint256);
    
    function withdrawFees() external;
}