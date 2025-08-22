// Google Gemini AI integration for investment analysis

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

interface GeminiRequest {
  contents: {
    parts: {
      text: string;
    }[];
  }[];
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
}

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Send a prompt to Google Gemini AI and get a response
 */
export async function sendToGemini(
  prompt: string,
  context?: string
): Promise<string> {
  try {
    const systemPrompt = `You are an expert AI investment advisor specializing in Real-World Asset (RWA) tokenization and DeFi investments. You have access to comprehensive token data and market analysis.

Your role is to:
1. Analyze token performance, market trends, and risk factors
2. Provide clear, actionable investment recommendations
3. Explain complex financial concepts in simple terms
4. Consider both technical analysis and fundamental factors
5. Always include risk warnings and disclaimers

Context Data: ${context || "No specific context provided"}

Please provide detailed, professional investment advice while being conversational and helpful. Always include:
- Clear recommendations (BUY/HOLD/SELL)
- Risk assessment (LOW/MEDIUM/HIGH)
- Reasoning behind recommendations
- Potential risks and considerations
- Suggested portfolio allocation if relevant

Remember to always include appropriate disclaimers about investment risks.`;

    const requestBody: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\nUser Question: ${prompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    };

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", response.status, errorText);
      throw new Error(`Gemini API request failed: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response generated from Gemini AI");
    }

    const generatedText = data.candidates[0].content.parts[0].text;

    // Add investment disclaimer if not already present
    const disclaimer =
      "\n\n⚠️ **Investment Disclaimer**: This analysis is for informational purposes only and should not be considered as financial advice. Always conduct your own research and consider consulting with a qualified financial advisor before making investment decisions. Cryptocurrency and tokenized assets carry significant risks including potential loss of principal.";

    if (
      !generatedText.toLowerCase().includes("disclaimer") &&
      !generatedText.includes("⚠️")
    ) {
      return generatedText + disclaimer;
    }

    return generatedText;
  } catch (error) {
    console.error("Error calling Gemini AI:", error);

    // Return a helpful error message to the user
    if (error instanceof Error) {
      if (error.message.includes("API request failed")) {
        return "I'm currently experiencing technical difficulties connecting to the AI service. Please try again in a moment. In the meantime, you can review the market data in the other tabs for manual analysis.";
      }
    }

    return "I apologize, but I'm unable to process your request at the moment due to a technical issue. Please try rephrasing your question or check back shortly. You can still view your token data and market analysis in the dashboard.";
  }
}

/**
 * Generate a comprehensive investment report using Gemini AI
 */
export async function generateInvestmentReport(
  tokenData: ReturnType<typeof import("./token-analysis").formatTokenDataForAI>,
  userQuery: string
): Promise<string> {
  try {
    const contextData = JSON.stringify(tokenData, null, 2);

    const reportPrompt = `Based on the following comprehensive token and market data, please provide a detailed investment analysis and recommendations:

${userQuery}

Please structure your response with:
1. Executive Summary
2. Token Analysis (for each relevant token)
3. Market Overview
4. Risk Assessment
5. Investment Recommendations
6. Portfolio Allocation Suggestions
7. Key Considerations and Risks

Make the analysis professional yet accessible, with clear action items.`;

    return await sendToGemini(reportPrompt, contextData);
  } catch (error) {
    console.error("Error generating investment report:", error);
    throw error;
  }
}

/**
 * Analyze specific tokens and provide targeted advice
 */
export async function analyzeSpecificTokens(
  tokens: string[],
  tokenData: ReturnType<typeof import("./token-analysis").formatTokenDataForAI>,
  query: string
): Promise<string> {
  try {
    const relevantTokens = tokenData.tokens.filter((token) =>
      tokens.some(
        (t) =>
          token.symbol.toLowerCase().includes(t.toLowerCase()) ||
          token.name.toLowerCase().includes(t.toLowerCase())
      )
    );

    const contextData = JSON.stringify(
      {
        requested_tokens: tokens,
        token_details: relevantTokens,
        market_overview: tokenData.portfolio_overview,
        recommendations: tokenData.recommendations.filter((rec) =>
          tokens.some((t) => rec.token.toLowerCase().includes(t.toLowerCase()))
        ),
      },
      null,
      2
    );

    const analysisPrompt = `Please provide a detailed analysis of the following specific tokens: ${tokens.join(
      ", "
    )}.

User Query: ${query}

Focus on:
- Individual token performance and prospects
- Comparative analysis between the requested tokens
- Specific buy/sell/hold recommendations for each
- Risk factors unique to each token
- Optimal allocation percentages
- Entry and exit strategies`;

    return await sendToGemini(analysisPrompt, contextData);
  } catch (error) {
    console.error("Error analyzing specific tokens:", error);
    throw error;
  }
}

/**
 * Provide market trend analysis
 */
export async function analyzeMarketTrends(
  tokenData: ReturnType<typeof import("./token-analysis").formatTokenDataForAI>,
  query: string
): Promise<string> {
  try {
    const trendData = JSON.stringify(
      {
        market_overview: tokenData.portfolio_overview,
        top_performers: tokenData.top_performers,
        risk_analysis: tokenData.risk_analysis,
        all_tokens_performance: tokenData.tokens.map((t) => ({
          symbol: t.symbol,
          asset_type: t.asset_type,
          performance: t.monthly_performance,
          market_cap: t.market_cap,
        })),
      },
      null,
      2
    );

    const trendPrompt = `Please analyze the current market trends for Real-World Asset (RWA) tokens based on the provided data.

User Query: ${query}

Please cover:
- Overall market sentiment and direction
- Sector performance (Gold, Silver, Real Estate, Art, etc.)
- Emerging opportunities and threats
- Market cycle analysis
- Timing considerations for investments
- Macro-economic factors affecting RWA tokens`;

    return await sendToGemini(trendPrompt, trendData);
  } catch (error) {
    console.error("Error analyzing market trends:", error);
    throw error;
  }
}

/**
 * Provide portfolio optimization advice
 */
export async function optimizePortfolio(
  tokenData: ReturnType<typeof import("./token-analysis").formatTokenDataForAI>,
  query: string
): Promise<string> {
  try {
    const portfolioData = JSON.stringify(
      {
        current_portfolio: tokenData.portfolio_overview,
        available_tokens: tokenData.tokens,
        recommendations: tokenData.recommendations,
        risk_distribution: tokenData.risk_analysis,
      },
      null,
      2
    );

    const optimizationPrompt = `Please provide portfolio optimization advice based on the available RWA tokens and current market conditions.

User Query: ${query}

Please include:
- Optimal asset allocation percentages
- Diversification strategies
- Risk management approaches
- Rebalancing recommendations
- Timeline for implementation
- Expected returns and risk metrics
- Alternative scenarios (conservative, moderate, aggressive)`;

    return await sendToGemini(optimizationPrompt, portfolioData);
  } catch (error) {
    console.error("Error optimizing portfolio:", error);
    throw error;
  }
}

/**
 * Handle general investment questions
 */
export async function handleGeneralQuery(
  tokenData: ReturnType<typeof import("./token-analysis").formatTokenDataForAI>,
  query: string
): Promise<string> {
  try {
    const generalData = JSON.stringify(
      {
        portfolio_summary: tokenData.portfolio_overview,
        available_options: tokenData.tokens.map((t) => ({
          symbol: t.symbol,
          type: t.asset_type,
          supported: t.is_supported,
        })),
        market_highlights: {
          best_performer: tokenData.top_performers[0],
          recommendations_summary: tokenData.recommendations.slice(0, 3),
        },
      },
      null,
      2
    );

    return await sendToGemini(query, generalData);
  } catch (error) {
    console.error("Error handling general query:", error);
    throw error;
  }
}
