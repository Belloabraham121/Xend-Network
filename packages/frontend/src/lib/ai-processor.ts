import { getTokenAnalysisData, formatTokenDataForAI } from './token-analysis';
import {
  sendToGemini,
  generateInvestmentReport,
  analyzeSpecificTokens,
  analyzeMarketTrends,
  optimizePortfolio,
  handleGeneralQuery
} from './gemini-ai';

/**
 * Process user prompts and route to appropriate AI analysis functions
 */
export class AIProcessor {
  private tokenData: Awaited<ReturnType<typeof getTokenAnalysisData>> | null = null;
  private formattedData: ReturnType<typeof formatTokenDataForAI> | null = null;
  private lastDataFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Ensure we have fresh token data
   */
  private async ensureTokenData(userAddress?: `0x${string}`): Promise<void> {
    const now = Date.now();
    if (!this.tokenData || (now - this.lastDataFetch) > this.CACHE_DURATION) {
      console.log('Fetching fresh token data...');
      this.tokenData = await getTokenAnalysisData(userAddress);
      this.formattedData = formatTokenDataForAI(this.tokenData);
      this.lastDataFetch = now;
    }
  }

  /**
   * Process a user prompt and return AI-generated response
   */
  async processPrompt(prompt: string, userAddress?: `0x${string}`): Promise<string> {
    try {
      await this.ensureTokenData(userAddress);
      
      if (!this.formattedData) {
        throw new Error('Unable to load token data');
      }

      // Analyze the prompt to determine the type of request
      const promptType = this.categorizePrompt(prompt);
      
      switch (promptType.type) {
        case 'token_analysis':
          return await this.handleTokenAnalysis(prompt, promptType.tokens);
        
        case 'market_trends':
          return await this.handleMarketTrends(prompt);
        
        case 'portfolio_optimization':
          return await this.handlePortfolioOptimization(prompt);
        
        case 'investment_report':
          return await this.handleInvestmentReport(prompt);
        
        case 'general':
        default:
          return await this.handleGeneralQuery(prompt);
      }
    } catch (error) {
      console.error('Error processing prompt:', error);
      return this.getErrorResponse(error);
    }
  }

  /**
   * Categorize the user prompt to determine the appropriate response type
   */
  private categorizePrompt(prompt: string): { type: string; tokens?: string[] } {
    const lowerPrompt = prompt.toLowerCase();
    
    // Extract token symbols/names mentioned in the prompt
    const tokenKeywords = ['gold', 'silver', 'real estate', 'realestate', 'art', 'oil'];
    const mentionedTokens = tokenKeywords.filter(token => 
      lowerPrompt.includes(token)
    );

    // Check for specific analysis types
    if (lowerPrompt.includes('market trend') || lowerPrompt.includes('market analysis') || 
        lowerPrompt.includes('market condition') || lowerPrompt.includes('market sentiment')) {
      return { type: 'market_trends' };
    }
    
    if (lowerPrompt.includes('portfolio') && (lowerPrompt.includes('optimize') || 
        lowerPrompt.includes('rebalance') || lowerPrompt.includes('allocation'))) {
      return { type: 'portfolio_optimization' };
    }
    
    if (lowerPrompt.includes('investment report') || lowerPrompt.includes('detailed analysis') ||
        lowerPrompt.includes('comprehensive') || lowerPrompt.includes('full report')) {
      return { type: 'investment_report' };
    }
    
    if (mentionedTokens.length > 0 || lowerPrompt.includes('token') || 
        lowerPrompt.includes('invest in') || lowerPrompt.includes('should i buy')) {
      return { type: 'token_analysis', tokens: mentionedTokens };
    }
    
    return { type: 'general' };
  }

  /**
   * Handle token-specific analysis requests
   */
  private async handleTokenAnalysis(prompt: string, tokens?: string[]): Promise<string> {
    if (!this.formattedData) throw new Error('No token data available');
    
    if (tokens && tokens.length > 0) {
      return await analyzeSpecificTokens(tokens, this.formattedData, prompt);
    }
    
    // If no specific tokens mentioned, provide general token overview
    const allTokenSymbols = this.formattedData.tokens.map(t => t.symbol.toLowerCase());
    return await analyzeSpecificTokens(allTokenSymbols, this.formattedData, prompt);
  }

  /**
   * Handle market trends analysis requests
   */
  private async handleMarketTrends(prompt: string): Promise<string> {
    if (!this.formattedData) throw new Error('No token data available');
    return await analyzeMarketTrends(this.formattedData, prompt);
  }

  /**
   * Handle portfolio optimization requests
   */
  private async handlePortfolioOptimization(prompt: string): Promise<string> {
    if (!this.formattedData) throw new Error('No token data available');
    return await optimizePortfolio(this.formattedData, prompt);
  }

  /**
   * Handle comprehensive investment report requests
   */
  private async handleInvestmentReport(prompt: string): Promise<string> {
    if (!this.formattedData) throw new Error('No token data available');
    return await generateInvestmentReport(this.formattedData, prompt);
  }

  /**
   * Handle general queries
   */
  private async handleGeneralQuery(prompt: string): Promise<string> {
    if (!this.formattedData) throw new Error('No token data available');
    return await handleGeneralQuery(this.formattedData, prompt);
  }

  /**
   * Generate appropriate error responses
   */
  private getErrorResponse(error: unknown): string {
    if (error instanceof Error) {
      if (error.message.includes('token data')) {
        return "I'm having trouble accessing the latest token data. Please ensure you're connected to the network and try again. You can also check the individual token information in the dashboard tabs.";
      }
      
      if (error.message.includes('API')) {
        return "I'm experiencing connectivity issues with the AI service. Please try again in a moment. In the meantime, you can review the market data and charts available in the other dashboard sections.";
      }
    }
    
    return "I apologize, but I encountered an unexpected error while processing your request. Please try rephrasing your question or contact support if the issue persists. You can still access all the raw market data and analytics in the dashboard.";
  }

  /**
   * Get a summary of available data for debugging
   */
  async getDataSummary(): Promise<string> {
    try {
      await this.ensureTokenData();
      
      if (!this.formattedData) {
        return "No token data currently available.";
      }

      const summary = {
        totalTokens: this.formattedData.portfolio_overview.total_tokens,
        supportedTokens: this.formattedData.portfolio_overview.supported_tokens,
        marketCap: this.formattedData.portfolio_overview.total_market_cap,
        topPerformer: this.formattedData.top_performers[0]?.symbol || 'N/A',
        availableTokens: this.formattedData.tokens.map(t => t.symbol).join(', ')
      };

      return `📊 **Current Data Summary**\n\n` +
             `• Total Tokens: ${summary.totalTokens}\n` +
             `• Supported Tokens: ${summary.supportedTokens}\n` +
             `• Total Market Cap: ${summary.marketCap}\n` +
             `• Top Performer: ${summary.topPerformer}\n` +
             `• Available Tokens: ${summary.availableTokens}\n\n` +
             `You can ask me about any of these tokens, market trends, or investment strategies!`;
    } catch (error) {
      return "Unable to load data summary. Please try again.";
    }
  }

  /**
   * Clear cached data to force refresh
   */
  clearCache(): void {
    this.tokenData = null;
    this.formattedData = null;
    this.lastDataFetch = 0;
  }
}

// Export a singleton instance
export const aiProcessor = new AIProcessor();

/**
 * Convenience function for processing prompts
 */
export async function processAIPrompt(prompt: string, userAddress?: `0x${string}`): Promise<string> {
  return await aiProcessor.processPrompt(prompt, userAddress);
}

/**
 * Get available commands and examples
 */
export function getAIHelp(userAddress?: `0x${string}`): string {
  const portfolioSection = userAddress ? `\n\n💼 **Portfolio Analysis** (Connected Wallet)\n` +
         `• "What are my best investment opportunities?"\n` +
         `• "Analyze my current portfolio"\n` +
         `• "Show my lending and borrowing positions"\n` +
         `• "What's my portfolio health factor?"\n` +
         `• "Suggest portfolio optimization"` : '';

  return `🤖 **AI Investment Advisor Help**\n\n` +
         `I can help you with:\n\n` +
         `**Token Analysis:**\n` +
         `• "Analyze my GOLD tokens"\n` +
         `• "Should I invest in Silver?"\n` +
         `• "Compare Gold vs Real Estate tokens"\n\n` +
         `**Market Trends:**\n` +
         `• "Show me current market trends"\n` +
         `• "What's the market sentiment for RWA tokens?"\n` +
         `• "Market analysis for this week"\n\n` +
         `**Portfolio Optimization:**\n` +
         `• "Optimize my portfolio allocation"\n` +
         `• "How should I rebalance my investments?"\n` +
         `• "Portfolio diversification advice"\n\n` +
         `**Investment Reports:**\n` +
         `• "Generate a comprehensive investment report"\n` +
         `• "Detailed analysis of all my tokens"\n` +
         `• "Full market and portfolio review"\n\n` +
         `**General Questions:**\n` +
         `• "What tokens should I invest in?"\n` +
         `• "Risk assessment of my portfolio"\n` +
         `• "Best investment strategy for beginners"` +
         portfolioSection +
         `\n\nJust ask me anything about your investments! 💡`;
}