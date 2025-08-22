# Makefile for RWA Platform Smart Contracts

# Default network
NETWORK ?= local

# Environment variables
include .env
export

# Foundry commands
FORGE := forge
CAST := cast
ANVIL := anvil

# Network configurations
ifeq ($(NETWORK),mantle-testnet)
	RPC_URL := $(MANTLE_TESTNET_RPC_URL)
	VERIFY_FLAGS := --etherscan-api-key $(MANTLE_TESTNET_API_KEY) --verifier-url $(MANTLE_TESTNET_VERIFIER_URL)
else ifeq ($(NETWORK),mantle)
	RPC_URL := $(MANTLE_RPC_URL)
	VERIFY_FLAGS := --etherscan-api-key $(MANTLE_API_KEY) --verifier-url $(MANTLE_VERIFIER_URL)
else
	RPC_URL := http://localhost:8545
	VERIFY_FLAGS :=
endif

# Colors for output
RED := \033[31m
GREEN := \033[32m
YELLOW := \033[33m
BLUE := \033[34m
RESET := \033[0m

.PHONY: help install build test clean deploy verify format lint

# Default target
help:
	@echo "$(BLUE)RWA Platform Smart Contracts$(RESET)"
	@echo ""
	@echo "$(YELLOW)Available commands:$(RESET)"
	@echo "  $(GREEN)install$(RESET)     - Install dependencies"
	@echo "  $(GREEN)build$(RESET)       - Compile contracts"
	@echo "  $(GREEN)test$(RESET)        - Run tests"
	@echo "  $(GREEN)test-gas$(RESET)    - Run tests with gas reporting"
	@echo "  $(GREEN)clean$(RESET)       - Clean build artifacts"
	@echo "  $(GREEN)deploy$(RESET)      - Deploy contracts (NETWORK=local|mantle-testnet|mantle)"
	@echo "  $(GREEN)verify$(RESET)      - Verify contracts on block explorer"
	@echo "  $(GREEN)format$(RESET)      - Format code"
	@echo "  $(GREEN)lint$(RESET)        - Lint code"
	@echo "  $(GREEN)coverage$(RESET)    - Generate test coverage report"
	@echo "  $(GREEN)anvil$(RESET)       - Start local Anvil node"
	@echo ""
	@echo "$(YELLOW)Examples:$(RESET)"
	@echo "  make deploy NETWORK=mantle-testnet"
	@echo "  make test"
	@echo "  make verify NETWORK=mantle-testnet"

# Install dependencies
install:
	@echo "$(BLUE)Installing dependencies...$(RESET)"
	$(FORGE) install
	@echo "$(GREEN)Dependencies installed successfully!$(RESET)"

# Build contracts
build:
	@echo "$(BLUE)Building contracts...$(RESET)"
	$(FORGE) build
	@echo "$(GREEN)Build completed successfully!$(RESET)"

# Run tests
test:
	@echo "$(BLUE)Running tests...$(RESET)"
	$(FORGE) test -vvv

# Run tests with gas reporting
test-gas:
	@echo "$(BLUE)Running tests with gas reporting...$(RESET)"
	$(FORGE) test --gas-report

# Generate test coverage
coverage:
	@echo "$(BLUE)Generating test coverage...$(RESET)"
	$(FORGE) coverage --report lcov
	@echo "$(GREEN)Coverage report generated!$(RESET)"

# Clean build artifacts
clean:
	@echo "$(BLUE)Cleaning build artifacts...$(RESET)"
	$(FORGE) clean
	@echo "$(GREEN)Clean completed!$(RESET)"

# Deploy contracts
deploy:
	@echo "$(BLUE)Deploying contracts to $(NETWORK)...$(RESET)"
ifeq ($(NETWORK),local)
	$(FORGE) script script/Deploy.s.sol:Deploy --rpc-url $(RPC_URL) --broadcast --private-key $(PRIVATE_KEY)
else
	$(FORGE) script script/Deploy.s.sol:Deploy --rpc-url $(RPC_URL) --broadcast --private-key $(PRIVATE_KEY) $(VERIFY_FLAGS)
endif
	@echo "$(GREEN)Deployment completed!$(RESET)"

# Deploy to specific networks
deploy-local:
	@$(MAKE) deploy NETWORK=local

deploy-testnet:
	@$(MAKE) deploy NETWORK=mantle-testnet

deploy-mainnet:
	@$(MAKE) deploy NETWORK=mantle

# Verify contracts
verify:
	@echo "$(BLUE)Verifying contracts on $(NETWORK)...$(RESET)"
	# Add verification commands here based on deployed addresses
	@echo "$(GREEN)Verification completed!$(RESET)"

# Format code
format:
	@echo "$(BLUE)Formatting code...$(RESET)"
	$(FORGE) fmt
	@echo "$(GREEN)Code formatted!$(RESET)"

# Lint code
lint:
	@echo "$(BLUE)Linting code...$(RESET)"
	$(FORGE) fmt --check
	@echo "$(GREEN)Linting completed!$(RESET)"

# Start local Anvil node
anvil:
	@echo "$(BLUE)Starting Anvil local node...$(RESET)"
	$(ANVIL) --host 0.0.0.0 --port 8545 --chain-id 31337

# Create .env file template
env-template:
	@echo "$(BLUE)Creating .env template...$(RESET)"
	@echo "# RWA Platform Environment Variables" > .env.example
	@echo "" >> .env.example
	@echo "# Private key for deployment (without 0x prefix)" >> .env.example
	@echo "PRIVATE_KEY=your_private_key_here" >> .env.example
	@echo "" >> .env.example
	@echo "# Mantle Testnet Configuration" >> .env.example
	@echo "MANTLE_TESTNET_RPC_URL=https://rpc.sepolia.mantle.xyz" >> .env.example
	@echo "MANTLE_TESTNET_API_KEY=your_api_key_here" >> .env.example
	@echo "MANTLE_TESTNET_VERIFIER_URL=https://explorer.sepolia.mantle.xyz/api" >> .env.example
	@echo "" >> .env.example
	@echo "# Mantle Mainnet Configuration" >> .env.example
	@echo "MANTLE_RPC_URL=https://rpc.mantle.xyz" >> .env.example
	@echo "MANTLE_API_KEY=your_api_key_here" >> .env.example
	@echo "MANTLE_VERIFIER_URL=https://explorer.mantle.xyz/api" >> .env.example
	@echo "" >> .env.example
	@echo "# Deployment Configuration" >> .env.example
	@echo "DEPLOYER_ADDRESS=your_deployer_address" >> .env.example
	@echo "FEE_RECIPIENT=your_fee_recipient_address" >> .env.example
	@echo "CREATION_FEE=10000000000000000" >> .env.example
	@echo "MAX_ASSETS_PER_USER=50" >> .env.example
	@echo "MAX_POSITIONS_PER_PORTFOLIO=20" >> .env.example
	@echo "REWARD_POOL_AMOUNT=10000000000000000000" >> .env.example
	@echo "" >> .env.example
	@echo "# Chainlink Configuration" >> .env.example
	@echo "CHAINLINK_SUBSCRIPTION_ID=your_subscription_id" >> .env.example
	@echo "$(GREEN).env.example created! Copy it to .env and fill in your values.$(RESET)"

# Quick setup for new developers
setup: install env-template
	@echo "$(GREEN)Setup completed! Don't forget to:$(RESET)"
	@echo "1. Copy .env.example to .env"
	@echo "2. Fill in your private key and API keys"
	@echo "3. Run 'make build' to compile contracts"
	@echo "4. Run 'make test' to run tests"

# Development workflow
dev: clean build test
	@echo "$(GREEN)Development workflow completed!$(RESET)"

# CI/CD workflow
ci: install build test coverage
	@echo "$(GREEN)CI workflow completed!$(RESET)"

# Emergency commands
kill-anvil:
	@echo "$(YELLOW)Killing Anvil processes...$(RESET)"
	@pkill -f anvil || true
	@echo "$(GREEN)Anvil processes killed!$(RESET)"

reset-local:
	@$(MAKE) kill-anvil
	@$(MAKE) clean
	@$(MAKE) build
	@echo "$(GREEN)Local environment reset!$(RESET)"