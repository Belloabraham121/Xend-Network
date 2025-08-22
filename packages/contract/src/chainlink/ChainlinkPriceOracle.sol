// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../../lib/chainlink-brownie-contracts/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "../interfaces/IChainlinkPriceOracle.sol";
import "../interfaces/IDataTypes.sol";

/**
 * @title ChainlinkPriceOracle
 * @notice Oracle contract for fetching asset prices using Chainlink Data Feeds and Functions
 */
contract ChainlinkPriceOracle is
    IChainlinkPriceOracle,
    Ownable,
    ReentrancyGuard,
    Pausable
{
    // Price feeds mapping
    mapping(string => address) public priceFeeds;
    mapping(address => IDataTypes.PriceFeedData) public assetPrices;

    // Price validation
    uint256 public constant PRICE_STALENESS_THRESHOLD = 3600; // 1 hour
    uint256 public constant MAX_PRICE_DEVIATION = 1000; // 10% in basis points

    // Events
    event PriceFeedAdded(string indexed symbol, address indexed feedAddress);
    event PriceFeedRemoved(string indexed symbol);

    modifier validPriceFeed(string memory symbol) {
        require(priceFeeds[symbol] != address(0), "Price feed not found");
        _;
    }

    modifier validAsset(address asset) {
        require(asset != address(0), "Invalid asset address");
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {
        // Initialize Mantle Sepolia price feeds (using placeholder addresses)
        // Note: These would need to be updated with actual Mantle price feed addresses
        priceFeeds["ETH/USD"] = 0x9bD31B110C559884c49d1bA3e60C1724F2E336a7; // Placeholder
        priceFeeds["BTC/USD"] = 0xecC446a3219da4594d5Ede8314f500212e496E17; // Placeholder
        priceFeeds["LINK/USD"] = 0x06BBD3C28C174E164a7ca0D48E287C09Cc1241Fb; // Placeholder
    }

    /**
     * @notice Add a new price feed
     * @param asset Asset address
     * @param feedAddress Chainlink price feed address
     */
    function addPriceFeed(
        address asset,
        address feedAddress
    ) external override onlyOwner {
        require(asset != address(0), "Invalid asset address");
        require(feedAddress != address(0), "Invalid feed address");

        // For simplicity, store feed address in string mapping with asset address as key
        string memory assetStr = _addressToString(asset);
        priceFeeds[assetStr] = feedAddress;
        emit PriceFeedAdded(asset, feedAddress);
    }

    /**
     * @notice Remove a price feed
     * @param asset Asset address to remove
     */
    function removePriceFeed(
        address asset
    ) external override onlyOwner validAsset(asset) {
        string memory assetStr = _addressToString(asset);
        require(priceFeeds[assetStr] != address(0), "Price feed not found");
        delete priceFeeds[assetStr];
        emit PriceFeedRemoved(asset);
    }

    /**
     * @notice Remove a price feed by symbol
     * @param symbol Asset symbol to remove
     */
    function removePriceFeedBySymbol(
        string memory symbol
    ) external onlyOwner validPriceFeed(symbol) {
        delete priceFeeds[symbol];
        emit PriceFeedRemoved(symbol);
    }

    /**
     * @notice Get latest price from Chainlink price feed
     * @param symbol Asset symbol
     * @return price Latest price
     * @return timestamp Price timestamp
     */
    function getLatestPrice(
        string memory symbol
    )
        external
        view
        validPriceFeed(symbol)
        returns (uint256 price, uint256 timestamp)
    {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(
            priceFeeds[symbol]
        );

        (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();

        require(answer > 0, "Invalid price data");
        require(updatedAt > 0, "Price data not available");
        require(
            block.timestamp - updatedAt <= PRICE_STALENESS_THRESHOLD,
            "Price data is stale"
        );

        return (uint256(answer), updatedAt);
    }

    /**
     * @notice Get historical price from Chainlink price feed
     * @param symbol Asset symbol
     * @param roundId Round ID for historical data
     * @return price Historical price
     * @return timestamp Price timestamp
     */
    function getHistoricalPrice(
        string memory symbol,
        uint80 roundId
    )
        external
        view
        validPriceFeed(symbol)
        returns (uint256 price, uint256 timestamp)
    {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(
            priceFeeds[symbol]
        );

        (
            uint80 id,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeed.getRoundData(roundId);

        require(answer > 0, "Invalid price data");
        require(updatedAt > 0, "Price data not available");

        return (uint256(answer), updatedAt);
    }

    /**
     * @notice Update asset price manually (simplified version without Functions)
     * @param asset Asset address
     * @param price New price
     * @param roundId Round ID from price feed
     */
    function updateAssetPrice(
        address asset,
        uint256 price,
        uint80 roundId
    ) external onlyOwner validAsset(asset) {
        require(price > 0, "Invalid price");

        // Validate price against existing data
        if (assetPrices[asset].price > 0) {
            uint256 deviation = _calculateDeviation(
                assetPrices[asset].price,
                price
            );
            require(
                deviation <= MAX_PRICE_DEVIATION,
                "Price deviation too high"
            );
        }

        // Update asset price
        assetPrices[asset] = IDataTypes.PriceFeedData({
            asset: asset,
            price: price,
            timestamp: block.timestamp,
            decimals: 8,
            isValid: true
        });

        emit PriceUpdated(asset, price, block.timestamp);
    }

    /**
     * @notice Get asset price data
     * @param asset Asset address
     * @return Price feed data
     */
    function getAssetPrice(
        address asset
    )
        external
        view
        validAsset(asset)
        returns (IDataTypes.PriceFeedData memory)
    {
        return assetPrices[asset];
    }

    /**
     * @notice Validate price data
     * @param asset Asset address
     * @return True if price data is valid and not stale
     */
    function validatePriceData(
        address asset
    ) external view validAsset(asset) returns (bool) {
        IDataTypes.PriceFeedData memory priceData = assetPrices[asset];

        if (!priceData.isValid || priceData.price == 0) {
            return false;
        }

        return
            block.timestamp - priceData.timestamp <= PRICE_STALENESS_THRESHOLD;
    }

    /**
     * @notice Get price feed address for symbol
     * @param symbol Asset symbol
     * @return Price feed address
     */
    function getPriceFeedAddress(
        string memory symbol
    ) external view returns (address) {
        return priceFeeds[symbol];
    }

    /**
     * @notice Calculate price deviation percentage
     * @param oldPrice Previous price
     * @param newPrice New price
     * @return Deviation in basis points
     */
    function _calculateDeviation(
        uint256 oldPrice,
        uint256 newPrice
    ) internal pure returns (uint256) {
        if (oldPrice == 0) return 0;

        uint256 diff = oldPrice > newPrice
            ? oldPrice - newPrice
            : newPrice - oldPrice;
        return (diff * 10000) / oldPrice; // Return in basis points
    }

    /**
     * @notice Emergency function to update asset price manually
     * @param asset Asset address
     * @param price New price
     */
    function emergencyUpdatePrice(
        address asset,
        uint256 price
    ) external onlyOwner validAsset(asset) {
        require(price > 0, "Invalid price");

        assetPrices[asset] = IDataTypes.PriceFeedData({
            asset: asset,
            price: price,
            timestamp: block.timestamp,
            decimals: 8,
            isValid: true
        });

        emit PriceUpdated(asset, price, block.timestamp);
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
     * @notice Get price for an asset
     * @param asset Asset address
     * @return Current price
     */
    function getPrice(
        address asset
    ) external view override validAsset(asset) returns (uint256) {
        IDataTypes.PriceFeedData memory priceData = assetPrices[asset];
        require(
            priceData.isValid && priceData.price > 0,
            "No valid price data"
        );
        require(
            block.timestamp - priceData.timestamp <= PRICE_STALENESS_THRESHOLD,
            "Price data is stale"
        );
        return priceData.price;
    }

    /**
     * @notice Get price with timestamp for an asset
     * @param asset Asset address
     * @return price Current price
     * @return timestamp Price timestamp
     */
    function getPriceWithTimestamp(
        address asset
    )
        external
        view
        override
        validAsset(asset)
        returns (uint256 price, uint256 timestamp)
    {
        IDataTypes.PriceFeedData memory priceData = assetPrices[asset];
        require(
            priceData.isValid && priceData.price > 0,
            "No valid price data"
        );
        return (priceData.price, priceData.timestamp);
    }

    /**
     * @notice Request asset price (simplified without actual Chainlink Functions)
     * @param asset Asset address
     * @return requestId Mock request ID
     */
    function requestAssetPrice(
        address asset
    ) external override validAsset(asset) returns (bytes32 requestId) {
        requestId = keccak256(
            abi.encodePacked(asset, block.timestamp, block.prevrandao)
        );
        
        // Store the pending request
        pendingRequests[requestId] = asset;
        
        emit FunctionsRequestSent(requestId, asset);
        return requestId;
    }

    // Mapping to track request ID to asset address
    mapping(bytes32 => address) public pendingRequests;
    
    /**
     * @notice Update price from Chainlink Functions (simplified)
     * @param requestId Request ID
     * @param price New price
     */
    function updatePriceFromFunctions(
        bytes32 requestId,
        uint256 price
    ) external override onlyOwner {
        require(price > 0, "Invalid price");
        
        address asset = pendingRequests[requestId];
        require(asset != address(0), "Invalid request ID");
        
        // Validate price against existing data if available
        if (assetPrices[asset].price > 0) {
            uint256 deviation = _calculateDeviation(
                assetPrices[asset].price,
                price
            );
            require(
                deviation <= MAX_PRICE_DEVIATION,
                "Price deviation too high"
            );
        }
        
        // Update asset price
        assetPrices[asset] = IDataTypes.PriceFeedData({
            asset: asset,
            price: price,
            timestamp: block.timestamp,
            decimals: 8,
            isValid: true
        });
        
        // Clean up the pending request
        delete pendingRequests[requestId];
        
        emit FunctionsRequestFulfilled(requestId, price);
        emit PriceUpdated(asset, price, block.timestamp);
    }

    /**
     * @notice Get price feed data for an asset
     * @param asset Asset address
     * @return Price feed data
     */
    function getPriceFeedData(
        address asset
    )
        external
        view
        override
        validAsset(asset)
        returns (IDataTypes.PriceFeedData memory)
    {
        return assetPrices[asset];
    }

    /**
     * @notice Check if price is valid within max age
     * @param asset Asset address
     * @param maxAge Maximum age in seconds
     * @return True if price is valid and not older than maxAge
     */
    function isValidPrice(
        address asset,
        uint256 maxAge
    ) external view override validAsset(asset) returns (bool) {
        IDataTypes.PriceFeedData memory priceData = assetPrices[asset];

        if (!priceData.isValid || priceData.price == 0) {
            return false;
        }

        return block.timestamp - priceData.timestamp <= maxAge;
    }

    /**
     * @notice Get multiple asset prices
     * @param assets Array of asset addresses
     * @return Array of prices
     */
    function getMultiplePrices(
        address[] memory assets
    ) external view override returns (uint256[] memory) {
        uint256[] memory prices = new uint256[](assets.length);

        for (uint256 i = 0; i < assets.length; i++) {
            require(assets[i] != address(0), "Invalid asset address");
            IDataTypes.PriceFeedData memory priceData = assetPrices[assets[i]];

            if (
                priceData.isValid &&
                priceData.price > 0 &&
                block.timestamp - priceData.timestamp <=
                PRICE_STALENESS_THRESHOLD
            ) {
                prices[i] = priceData.price;
            } else {
                prices[i] = 0; // Invalid or stale price
            }
        }

        return prices;
    }

    // Array to track all registered assets for batch updates
    address[] public registeredAssets;
    mapping(address => bool) public isAssetRegistered;
    
    /**
     * @notice Update all asset prices (owner only)
     */
    function updateAllPrices() external override onlyOwner {
        uint256 updatedCount = 0;
        
        for (uint256 i = 0; i < registeredAssets.length; i++) {
            address asset = registeredAssets[i];
            string memory assetStr = _addressToString(asset);
            address priceFeedAddress = priceFeeds[assetStr];
            
            if (priceFeedAddress != address(0)) {
                try this._updateAssetPriceFromFeed(asset, priceFeedAddress) {
                    updatedCount++;
                } catch {
                    // Continue with next asset if one fails
                    continue;
                }
            }
        }
        
        emit BatchPriceUpdate(updatedCount, block.timestamp);
    }
    
    /**
     * @notice Internal function to update asset price from feed
     * @param asset Asset address
     * @param feedAddress Price feed address
     */
    function _updateAssetPriceFromFeed(address asset, address feedAddress) external {
        require(msg.sender == address(this), "Internal function only");
        
        AggregatorV3Interface priceFeed = AggregatorV3Interface(feedAddress);
        
        (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        
        if (answer > 0 && updatedAt > 0) {
            uint256 price = uint256(answer);
            
            // Validate price against existing data if available
            if (assetPrices[asset].price > 0) {
                uint256 deviation = _calculateDeviation(
                    assetPrices[asset].price,
                    price
                );
                // Skip if deviation is too high
                if (deviation > MAX_PRICE_DEVIATION) {
                    return;
                }
            }
            
            // Update asset price
            assetPrices[asset] = IDataTypes.PriceFeedData({
                asset: asset,
                price: price,
                timestamp: updatedAt,
                decimals: 8,
                isValid: true
            });
            
            emit PriceUpdated(asset, price, updatedAt);
        }
    }
    
    /**
     * @notice Register an asset for batch price updates
     * @param asset Asset address to register
     */
    function registerAssetForUpdates(address asset) external onlyOwner validAsset(asset) {
        if (!isAssetRegistered[asset]) {
            registeredAssets.push(asset);
            isAssetRegistered[asset] = true;
        }
    }
    
    /**
     * @notice Unregister an asset from batch price updates
     * @param asset Asset address to unregister
     */
    function unregisterAssetFromUpdates(address asset) external onlyOwner validAsset(asset) {
        if (isAssetRegistered[asset]) {
            for (uint256 i = 0; i < registeredAssets.length; i++) {
                if (registeredAssets[i] == asset) {
                    registeredAssets[i] = registeredAssets[registeredAssets.length - 1];
                    registeredAssets.pop();
                    break;
                }
            }
            isAssetRegistered[asset] = false;
        }
    }
    
    /**
     * @notice Get all registered assets
     * @return Array of registered asset addresses
     */
    function getRegisteredAssets() external view returns (address[] memory) {
        return registeredAssets;
    }
    
    // Additional event for batch updates
    event BatchPriceUpdate(uint256 updatedCount, uint256 timestamp);

    /**
     * @notice Convert address to string for mapping key
     * @param addr Address to convert
     * @return String representation of address
     */
    function _addressToString(
        address addr
    ) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }

    /**
     * @notice Get contract configuration
     * @return maxDeviation Maximum allowed price deviation
     * @return stalenessThreshold Price staleness threshold
     */
    function getConfiguration()
        external
        view
        returns (uint256 maxDeviation, uint256 stalenessThreshold)
    {
        return (MAX_PRICE_DEVIATION, PRICE_STALENESS_THRESHOLD);
    }
}
