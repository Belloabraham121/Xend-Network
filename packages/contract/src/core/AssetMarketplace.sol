// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/IAssetMarketplace.sol";
import "../interfaces/IDataTypes.sol";
import "../interfaces/IChainlinkPriceOracle.sol";
import "../interfaces/IRewardAssetFactory.sol";

/**
 * @title AssetMarketplace
 * @notice Decentralized marketplace for trading RWA tokens
 */
contract AssetMarketplace is IAssetMarketplace, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using Math for uint256;
    
    // State variables
    mapping(uint256 => IDataTypes.MarketOrder) public orders;
    mapping(address => uint256[]) public userOrders;
    mapping(address => uint256[]) public assetOrders;
    mapping(address => mapping(address => uint256)) public userAssetVolume;
    mapping(address => uint256) public assetTotalVolume;
    mapping(address => uint256) public assetLastPrice;
    
    // Order management
    uint256 public nextOrderId = 1;
    uint256 public maxOrdersPerUser = 50;
    uint256 public minOrderAmount = 0.001 ether;
    uint256 public maxOrderDuration = 30 days;
    
    // Fee structure
    uint256 public tradingFee = 25; // 0.25%
    uint256 public constant BASIS_POINTS = 10000;
    address public feeRecipient;
    
    // Contract references
    IChainlinkPriceOracle public immutable priceOracle;
    IRewardAssetFactory public immutable assetFactory;
    
    // Trading statistics
    uint256 public totalTradingVolume;
    uint256 public totalTradesExecuted;
    mapping(address => uint256) public userTradingVolume;
    mapping(address => uint256) public userTradesCount;
    
    // Order book depth
    mapping(address => uint256[]) public buyOrders; // Sorted by price (highest first)
    mapping(address => uint256[]) public sellOrders; // Sorted by price (lowest first)
    
    // Price tracking
    mapping(address => uint256[]) public priceHistory;
    mapping(address => uint256) public lastTradeTime;
    
    // Events
    event TradingFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);
    event MaxOrdersUpdated(uint256 oldMax, uint256 newMax);
    event MinOrderAmountUpdated(uint256 oldMin, uint256 newMin);
    event MaxOrderDurationUpdated(uint256 oldDuration, uint256 newDuration);
    event OrderBookUpdated(address indexed asset, uint256 buyOrdersCount, uint256 sellOrdersCount);
    event OrderCompleted(uint256 indexed orderId, address indexed trader);
    event TradeExecuted(address indexed buyer, address indexed seller, address indexed asset, uint256 amount, uint256 price);
    
    modifier validOrder(uint256 orderId) {
        require(orderId > 0 && orderId < nextOrderId, "Invalid order ID");
        require(orders[orderId].isActive, "Order not active");
        _;
    }
    
    modifier validAsset(address asset) {
        require(assetFactory.isValidAsset(asset), "Invalid asset");
        _;
    }
    
    modifier validAmount(uint256 amount) {
        require(amount >= minOrderAmount, "Amount below minimum");
        _;
    }
    
    constructor(
        address _priceOracle,
        address _assetFactory,
        address _feeRecipient
    ) Ownable(msg.sender) {
        require(_priceOracle != address(0), "Invalid price oracle");
        require(_assetFactory != address(0), "Invalid asset factory");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        
        priceOracle = IChainlinkPriceOracle(_priceOracle);
        assetFactory = IRewardAssetFactory(_assetFactory);
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @notice Create a new market order
     * @param asset Asset address
     * @param amount Amount to trade
     * @param price Price per token
     * @param isBuyOrder True for buy order, false for sell order
     * @param expirationTime Order expiration timestamp
     * @return orderId New order ID
     */
    function createOrder(
        address asset,
        uint256 amount,
        uint256 price,
        bool isBuyOrder,
        uint256 expirationTime
    ) public nonReentrant whenNotPaused validAsset(asset) validAmount(amount) returns (uint256) {
        require(price > 0, "Price must be greater than 0");
        require(expirationTime > block.timestamp, "Invalid expiration time");
        require(expirationTime <= block.timestamp + maxOrderDuration, "Expiration too far");
        require(userOrders[msg.sender].length < maxOrdersPerUser, "Max orders reached");
        
        uint256 orderId = nextOrderId++;
        
        // For buy orders, lock the payment amount
        // For sell orders, lock the asset tokens
        if (isBuyOrder) {
            uint256 totalCost = (amount * price) / 1e18;
            require(msg.sender.balance >= totalCost, "Insufficient balance for buy order");
        } else {
            require(IERC20(asset).balanceOf(msg.sender) >= amount, "Insufficient asset balance");
            IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        }
        
        orders[orderId] = IDataTypes.MarketOrder({
            seller: isBuyOrder ? address(0) : msg.sender,
            buyer: isBuyOrder ? msg.sender : address(0),
            asset: asset,
            amount: amount,
            price: price,
            timestamp: block.timestamp,
            isActive: true,
            isFilled: false
        });
        
        // Add to user and asset order lists
        userOrders[msg.sender].push(orderId);
        assetOrders[asset].push(orderId);
        
        // Add to order book
        _addToOrderBook(asset, orderId, isBuyOrder);
        
        emit OrderCreated(orderId, msg.sender, asset, amount, price);
        
        // Try to match the order immediately
        _matchOrder(orderId);
        
        return orderId;
    }
    
    /**
     * @notice Fill an existing order
     * @param orderId Order ID to fill
     * @param amount Amount to fill
     */
    function fillOrder(
        uint256 orderId,
        uint256 amount
    ) external override nonReentrant whenNotPaused validOrder(orderId) {
        IDataTypes.MarketOrder storage order = orders[orderId];
        
        // Determine if caller is trying to fill a buy or sell order
        bool isBuyOrder = (order.buyer != address(0));
        address trader = isBuyOrder ? order.buyer : order.seller;
        
        require(trader != msg.sender, "Cannot fill own order");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= order.amount, "Amount exceeds available");
        require(!order.isFilled, "Order already filled");
        
        uint256 tradeValue = (amount * order.price) / 1e18;
        uint256 feeAmount = (tradeValue * tradingFee) / BASIS_POINTS;
        uint256 netValue = tradeValue - feeAmount;
        
        if (isBuyOrder) {
            // Seller fills buy order
            require(IERC20(order.asset).balanceOf(msg.sender) >= amount, "Insufficient asset balance");
            
            // Transfer assets from seller to buyer
            IERC20(order.asset).safeTransferFrom(msg.sender, order.buyer, amount);
            
            // Transfer payment from buyer to seller (minus fees)
            payable(msg.sender).transfer(netValue);
            
            // Update order
            order.seller = msg.sender;
        } else {
            // Buyer fills sell order
            require(msg.sender.balance >= tradeValue, "Insufficient balance");
            
            // Transfer assets from contract (locked by seller) to buyer
            IERC20(order.asset).safeTransfer(msg.sender, amount);
            
            // Transfer payment from buyer to seller (minus fees)
            payable(order.seller).transfer(netValue);
            
            // Update order
            order.buyer = msg.sender;
        }
        
        // Transfer fees
        payable(feeRecipient).transfer(feeAmount);
        
        // Mark order as filled
        order.isFilled = true;
        order.isActive = false;
        
        // Update statistics
        _updateTradingStats(order.asset, amount, order.price, order.buyer, order.seller);
        
        emit OrderFilled(orderId, msg.sender, amount, tradeValue);
        emit OrderCompleted(orderId, trader);
    }
    
    /**
     * @notice Cancel an active order
     * @param orderId Order ID to cancel
     */
    function cancelOrder(uint256 orderId) external override nonReentrant validOrder(orderId) {
        IDataTypes.MarketOrder storage order = orders[orderId];
        
        // Check if caller is the order owner (either buyer or seller depending on order type)
        bool isBuyOrder = (order.buyer != address(0));
        address orderOwner = isBuyOrder ? order.buyer : order.seller;
        require(orderOwner == msg.sender, "Not order owner");
        require(order.isActive, "Order not active");
        
        // Refund locked assets for sell orders
        if (order.seller != address(0) && !order.isFilled) {
            IERC20(order.asset).safeTransfer(msg.sender, order.amount);
        }
        
        order.isActive = false;
        _removeFromOrderBook(order.asset, orderId, isBuyOrder);
        
        emit OrderCancelled(orderId, msg.sender);
    }
    
    /**
     * @notice Get order information
     * @param orderId Order ID
     * @return Order information
     */
    function getOrder(uint256 orderId) external view override returns (IDataTypes.MarketOrder memory) {
        require(orderId > 0 && orderId < nextOrderId, "Invalid order ID");
        return orders[orderId];
    }
    
    /**
     * @notice Get active orders for an asset
     * @param asset Asset address
     * @return Array of active orders
     */
    function getActiveOrders(
        address asset
    ) external view override validAsset(asset) returns (IDataTypes.MarketOrder[] memory) {
        uint256[] memory buyOrderIds = buyOrders[asset];
        uint256[] memory sellOrderIds = sellOrders[asset];
        
        IDataTypes.MarketOrder[] memory activeOrders = new IDataTypes.MarketOrder[](buyOrderIds.length + sellOrderIds.length);
        uint256 index = 0;
        
        for (uint256 i = 0; i < buyOrderIds.length; i++) {
            if (orders[buyOrderIds[i]].isActive) {
                activeOrders[index] = orders[buyOrderIds[i]];
                index++;
            }
        }
        
        for (uint256 i = 0; i < sellOrderIds.length; i++) {
            if (orders[sellOrderIds[i]].isActive) {
                activeOrders[index] = orders[sellOrderIds[i]];
                index++;
            }
        }
        
        // Resize array to actual length
        IDataTypes.MarketOrder[] memory result = new IDataTypes.MarketOrder[](index);
        for (uint256 i = 0; i < index; i++) {
            result[i] = activeOrders[i];
        }
        
        return result;
    }
    
    /**
     * @notice Get user's orders
     * @param user User address
     * @return Array of user's orders
     */
    function getUserOrders(address user) external view override returns (IDataTypes.MarketOrder[] memory) {
        uint256[] memory orderIds = userOrders[user];
        IDataTypes.MarketOrder[] memory result = new IDataTypes.MarketOrder[](orderIds.length);
        
        for (uint256 i = 0; i < orderIds.length; i++) {
            result[i] = orders[orderIds[i]];
        }
        
        return result;
    }
    
    /**
     * @notice Get current market price for an asset
     * @param asset Asset address
     * @return Current market price
     */
    function getMarketPrice(address asset) external view override validAsset(asset) returns (uint256) {
        // Return the last traded price, or oracle price if no trades
        if (assetLastPrice[asset] > 0) {
            return assetLastPrice[asset];
        }
        return priceOracle.getPrice(asset);
    }
    
    /**
     * @notice Get trading volume for an asset
     * @param asset Asset address
     * @return Total trading volume
     */
    function getTradingVolume(address asset) external view override validAsset(asset) returns (uint256) {
        return assetTotalVolume[asset];
    }
    
    /**
     * @notice Get order book for an asset
     * @param asset Asset address
     * @return sellOrdersResult Array of active sell orders
     * @return buyOrdersResult Array of active buy orders
     */
    function getOrderBook(
        address asset
    ) external view override validAsset(asset) returns (
        IDataTypes.MarketOrder[] memory sellOrdersResult,
        IDataTypes.MarketOrder[] memory buyOrdersResult
    ) {
        uint256[] memory buyOrderIds = buyOrders[asset];
        uint256[] memory sellOrderIds = sellOrders[asset];
        
        // Count active orders
        uint256 activeBuyCount = 0;
        uint256 activeSellCount = 0;
        
        for (uint256 i = 0; i < buyOrderIds.length; i++) {
            if (orders[buyOrderIds[i]].isActive) {
                activeBuyCount++;
            }
        }
        
        for (uint256 i = 0; i < sellOrderIds.length; i++) {
            if (orders[sellOrderIds[i]].isActive) {
                activeSellCount++;
            }
        }
        
        // Create result arrays
        buyOrdersResult = new IDataTypes.MarketOrder[](activeBuyCount);
        sellOrdersResult = new IDataTypes.MarketOrder[](activeSellCount);
        
        // Fill buy orders
        uint256 buyIndex = 0;
        for (uint256 i = 0; i < buyOrderIds.length; i++) {
            if (orders[buyOrderIds[i]].isActive) {
                buyOrdersResult[buyIndex] = orders[buyOrderIds[i]];
                buyIndex++;
            }
        }
        
        // Fill sell orders
        uint256 sellIndex = 0;
        for (uint256 i = 0; i < sellOrderIds.length; i++) {
            if (orders[sellOrderIds[i]].isActive) {
                sellOrdersResult[sellIndex] = orders[sellOrderIds[i]];
                sellIndex++;
            }
        }
        
        return (sellOrdersResult, buyOrdersResult);
    }
    
    /**
     * @notice Match two specific orders
     * @param sellOrderId Sell order ID
     * @param buyOrderId Buy order ID
     */
    function matchOrders(uint256 sellOrderId, uint256 buyOrderId) external override {
        require(orders[sellOrderId].isActive, "Sell order not active");
        require(orders[buyOrderId].isActive, "Buy order not active");
        require(orders[sellOrderId].seller != address(0), "First order must be sell order");
        require(orders[buyOrderId].buyer != address(0), "Second order must be buy order");
        require(orders[sellOrderId].asset == orders[buyOrderId].asset, "Asset mismatch");
        
        // For manual matching, we'll just execute a simple trade
        IDataTypes.MarketOrder storage sellOrder = orders[sellOrderId];
        IDataTypes.MarketOrder storage buyOrder = orders[buyOrderId];
        
        uint256 tradeAmount = Math.min(sellOrder.amount, buyOrder.amount);
        _executeTrade(buyOrderId, sellOrderId, tradeAmount, sellOrder.price);
    }
    
    /**
     * @notice Create a buy order
     * @param asset Asset address
     * @param amount Amount to buy
     * @param maxPrice Maximum price per token
     * @return orderId New order ID
     */
    function createBuyOrder(
        address asset,
        uint256 amount,
        uint256 maxPrice
    ) external override nonReentrant whenNotPaused validAsset(asset) validAmount(amount) returns (uint256) {
        return createOrder(asset, amount, maxPrice, true, block.timestamp + maxOrderDuration);
    }

    /**
     * @notice Create a sell order
     * @param asset Asset address
     * @param amount Amount to sell
     * @param price Price per token
     * @return orderId New order ID
     */
    function createSellOrder(
        address asset,
        uint256 amount,
        uint256 price
    ) external override nonReentrant whenNotPaused validAsset(asset) validAmount(amount) returns (uint256) {
        return createOrder(asset, amount, price, false, block.timestamp + maxOrderDuration);
    }

    /**
     * @notice Get trading fee
     * @return Current trading fee in basis points
     */
    function getTradingFee() external view override returns (uint256) {
        return tradingFee;
    }

    /**
     * @notice Withdraw accumulated fees
     */
    function withdrawFees() external override onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        payable(feeRecipient).transfer(balance);
    }
    
    // Internal functions
    
    function _addToOrderBook(address asset, uint256 orderId, bool isBuyOrder) internal {
        if (isBuyOrder) {
            _insertBuyOrder(asset, orderId);
        } else {
            _insertSellOrder(asset, orderId);
        }
        
        emit OrderBookUpdated(asset, buyOrders[asset].length, sellOrders[asset].length);
    }
    

    
    function _insertBuyOrder(address asset, uint256 orderId) internal {
        uint256[] storage orderIds = buyOrders[asset];
        uint256 price = orders[orderId].price;
        
        // Insert in descending order (highest price first)
        uint256 insertIndex = orderIds.length;
        for (uint256 i = 0; i < orderIds.length; i++) {
            if (orders[orderIds[i]].price < price) {
                insertIndex = i;
                break;
            }
        }
        
        orderIds.push(0);
        for (uint256 i = orderIds.length - 1; i > insertIndex; i--) {
            orderIds[i] = orderIds[i - 1];
        }
        orderIds[insertIndex] = orderId;
    }
    
    function _insertSellOrder(address asset, uint256 orderId) internal {
        uint256[] storage orderIds = sellOrders[asset];
        uint256 price = orders[orderId].price;
        
        // Insert in ascending order (lowest price first)
        uint256 insertIndex = orderIds.length;
        for (uint256 i = 0; i < orderIds.length; i++) {
            if (orders[orderIds[i]].price > price) {
                insertIndex = i;
                break;
            }
        }
        
        orderIds.push(0);
        for (uint256 i = orderIds.length - 1; i > insertIndex; i--) {
            orderIds[i] = orderIds[i - 1];
        }
        orderIds[insertIndex] = orderId;
    }
    
    function _removeBuyOrder(address asset, uint256 orderId) internal {
        uint256[] storage orderIds = buyOrders[asset];
        for (uint256 i = 0; i < orderIds.length; i++) {
            if (orderIds[i] == orderId) {
                for (uint256 j = i; j < orderIds.length - 1; j++) {
                    orderIds[j] = orderIds[j + 1];
                }
                orderIds.pop();
                break;
            }
        }
    }
    
    function _removeSellOrder(address asset, uint256 orderId) internal {
        uint256[] storage orderIds = sellOrders[asset];
        for (uint256 i = 0; i < orderIds.length; i++) {
            if (orderIds[i] == orderId) {
                for (uint256 j = i; j < orderIds.length - 1; j++) {
                    orderIds[j] = orderIds[j + 1];
                }
                orderIds.pop();
                break;
            }
        }
    }
    
    function _removeFromOrderBook(address asset, uint256 orderId, bool isBuyOrder) internal {
        if (isBuyOrder) {
            _removeBuyOrder(asset, orderId);
        } else {
            _removeSellOrder(asset, orderId);
        }
        
        // Remove from asset orders
        uint256[] storage assetOrderIds = assetOrders[asset];
        for (uint256 i = 0; i < assetOrderIds.length; i++) {
            if (assetOrderIds[i] == orderId) {
                for (uint256 j = i; j < assetOrderIds.length - 1; j++) {
                    assetOrderIds[j] = assetOrderIds[j + 1];
                }
                assetOrderIds.pop();
                break;
            }
        }
    }
    
    function _matchOrder(uint256 orderId) internal {
        IDataTypes.MarketOrder storage order = orders[orderId];
        if (!order.isActive) return;
        
        _matchOrdersForAsset(order.asset);
    }
    
    function _matchOrdersForAsset(address asset) internal {
        uint256[] storage buyOrderIds = buyOrders[asset];
        uint256[] storage sellOrderIds = sellOrders[asset];
        
        uint256 buyIndex = 0;
        uint256 sellIndex = 0;
        
        while (buyIndex < buyOrderIds.length && sellIndex < sellOrderIds.length) {
            uint256 buyOrderId = buyOrderIds[buyIndex];
            uint256 sellOrderId = sellOrderIds[sellIndex];
            
            IDataTypes.MarketOrder storage buyOrder = orders[buyOrderId];
            IDataTypes.MarketOrder storage sellOrder = orders[sellOrderId];
            
            // Check if orders can be matched
            if (buyOrder.price >= sellOrder.price && 
                buyOrder.isActive && sellOrder.isActive) {
                
                uint256 matchAmount = Math.min(buyOrder.amount, sellOrder.amount);
                
                if (matchAmount > 0) {
                    _executeTrade(buyOrderId, sellOrderId, matchAmount, sellOrder.price);
                }
            }
            
            // Move to next orders  
            if (!buyOrder.isActive) {
                buyIndex++;
            }
            if (!sellOrder.isActive) {
                sellIndex++;
            }
            
            // Prevent infinite loops
            if (buyOrder.price < sellOrder.price) {
                break;
            }
        }
    }
    
    function _executeTrade(
        uint256 buyOrderId,
        uint256 sellOrderId,
        uint256 amount,
        uint256 price
    ) internal {
        IDataTypes.MarketOrder storage buyOrder = orders[buyOrderId];
        IDataTypes.MarketOrder storage sellOrder = orders[sellOrderId];
        
        uint256 tradeValue = (amount * price) / 1e18;
        uint256 feeAmount = (tradeValue * tradingFee) / BASIS_POINTS;
        uint256 netValue = tradeValue - feeAmount;
        
        // Transfer assets from seller to buyer
        IERC20(sellOrder.asset).safeTransfer(buyOrder.buyer, amount);
        
        // Transfer payment from buyer to seller
        payable(sellOrder.seller).transfer(netValue);
        
        // Transfer fees
        payable(feeRecipient).transfer(feeAmount);
        
        // Mark orders as filled
        buyOrder.isFilled = true;
        buyOrder.isActive = false;
        sellOrder.isFilled = true;
        sellOrder.isActive = false;
        
        // Update statistics
        _updateTradingStats(sellOrder.asset, amount, price, buyOrder.buyer, sellOrder.seller);
        
        emit TradeExecuted(buyOrder.buyer, sellOrder.seller, sellOrder.asset, amount, price);
        
        if (!buyOrder.isActive) {
            emit OrderCompleted(buyOrderId, buyOrder.buyer);
        }
        if (!sellOrder.isActive) {
            emit OrderCompleted(sellOrderId, sellOrder.seller);
        }
    }
    
    function _updateTradingStats(
        address asset,
        uint256 amount,
        uint256 price,
        address buyer,
        address seller
    ) internal {
        uint256 tradeValue = (amount * price) / 1e18;
        
        // Update global stats
        totalTradingVolume += tradeValue;
        totalTradesExecuted++;
        
        // Update asset stats
        assetTotalVolume[asset] += tradeValue;
        assetLastPrice[asset] = price;
        lastTradeTime[asset] = block.timestamp;
        
        // Update user stats
        userTradingVolume[buyer] += tradeValue;
        userTradingVolume[seller] += tradeValue;
        userTradesCount[buyer]++;
        userTradesCount[seller]++;
        
        // Update user-asset volume
        userAssetVolume[buyer][asset] += tradeValue;
        userAssetVolume[seller][asset] += tradeValue;
        
        // Add to price history
        priceHistory[asset].push(price);
        
        // Limit price history to last 100 trades
        if (priceHistory[asset].length > 100) {
            for (uint256 i = 0; i < priceHistory[asset].length - 1; i++) {
                priceHistory[asset][i] = priceHistory[asset][i + 1];
            }
            priceHistory[asset].pop();
        }
    }
    
    // Admin functions
    
    /**
     * @notice Update trading fee
     * @param newFee New fee in basis points
     */
    function setTradingFee(uint256 newFee) external override onlyOwner {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        
        uint256 oldFee = tradingFee;
        tradingFee = newFee;
        
        emit TradingFeeUpdated(oldFee, newFee);
    }
    
    /**
     * @notice Update fee recipient
     * @param newRecipient New fee recipient address
     */
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient");
        
        address oldRecipient = feeRecipient;
        feeRecipient = newRecipient;
        
        emit FeeRecipientUpdated(oldRecipient, newRecipient);
    }
    
    /**
     * @notice Update maximum orders per user
     * @param newMax New maximum orders
     */
    function setMaxOrdersPerUser(uint256 newMax) external onlyOwner {
        require(newMax > 0 && newMax <= 200, "Invalid max orders");
        
        uint256 oldMax = maxOrdersPerUser;
        maxOrdersPerUser = newMax;
        
        emit MaxOrdersUpdated(oldMax, newMax);
    }
    
    /**
     * @notice Update minimum order amount
     * @param newAmount New minimum amount
     */
    function setMinOrderAmount(uint256 newAmount) external onlyOwner {
        uint256 oldAmount = minOrderAmount;
        minOrderAmount = newAmount;
        
        emit MinOrderAmountUpdated(oldAmount, newAmount);
    }
    
    /**
     * @notice Update maximum order duration
     * @param newDuration New maximum duration in seconds
     */
    function setMaxOrderDuration(uint256 newDuration) external onlyOwner {
        require(newDuration >= 1 hours, "Duration too short");
        require(newDuration <= 365 days, "Duration too long");
        
        uint256 oldDuration = maxOrderDuration;
        maxOrderDuration = newDuration;
        
        emit MaxOrderDurationUpdated(oldDuration, newDuration);
    }
    
    /**
     * @notice Clean up expired orders
     * @param asset Asset address
     * @param maxCleanup Maximum number of orders to clean up
     */
    function cleanupExpiredOrders(address asset, uint256 maxCleanup) external {
        uint256 cleaned = 0;
        
        // Note: Cleanup function disabled as MarketOrder struct doesn't have expiration fields
        // This would need to be implemented with additional storage for expiration times
    }
    
    /**
     * @notice Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Emergency withdrawal function
     */
    function emergencyWithdraw(address asset) external onlyOwner {
        uint256 balance = IERC20(asset).balanceOf(address(this));
        IERC20(asset).safeTransfer(owner(), balance);
    }
    
    /**
     * @notice Get price history for an asset
     * @param asset Asset address
     * @return Array of historical prices
     */
    function getPriceHistory(address asset) external view returns (uint256[] memory) {
        return priceHistory[asset];
    }
    
    /**
     * @notice Get user trading statistics
     * @param user User address
     * @return totalVolume Total trading volume
     * @return tradesCount Number of trades executed
     */
    function getUserTradingStats(address user) external view returns (uint256 totalVolume, uint256 tradesCount) {
        return (userTradingVolume[user], userTradesCount[user]);
    }
    
    /**
     * @notice Receive function for native token payments
     */
    receive() external payable {
        // Allow contract to receive native tokens for order payments
    }
}