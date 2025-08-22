"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Badge component not available, using styled span instead
const Badge = ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
  <span className={`px-2 py-1 rounded text-xs font-medium ${
    variant === 'default' ? 'bg-blue-500/20 text-blue-400' :
    variant === 'secondary' ? 'bg-yellow-500/20 text-yellow-400' :
    variant === 'destructive' ? 'bg-red-500/20 text-red-400' :
    'bg-gray-500/20 text-gray-400'
  }`}>
    {children}
  </span>
);
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import {
  Brain,
  TrendingUp,
  Target,
  Shield,
  Search,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  MessageSquare
} from "lucide-react";
import { AIChatInterface } from "../ui/ai-chat-interface";
import { processAIPrompt, getAIHelp } from "@/lib/ai-processor";
import { AIInsightsService } from "@/lib/ai-insights-service";

// Mock data for AI analytics
const marketTrendsData = [
  { month: "Jan", realEstate: 4000, gold: 2400, silver: 2400, art: 1800 },
  { month: "Feb", realEstate: 3000, gold: 1398, silver: 2210, art: 2200 },
  { month: "Mar", realEstate: 2000, gold: 9800, silver: 2290, art: 2800 },
  { month: "Apr", realEstate: 2780, gold: 3908, silver: 2000, art: 3200 },
  { month: "May", realEstate: 1890, gold: 4800, silver: 2181, art: 2600 },
  { month: "Jun", realEstate: 2390, gold: 3800, silver: 2500, art: 3400 }
];

const assetDiscoveryData = [
  { name: "Luxury Real Estate", value: 35, growth: 12.5, risk: "Low" },
  { name: "Precious Metals", value: 25, growth: 8.3, risk: "Medium" },
  { name: "Fine Art", value: 20, growth: 15.2, risk: "High" },
  { name: "Commodities", value: 15, growth: 6.8, risk: "Medium" },
  { name: "Infrastructure", value: 5, growth: 4.2, risk: "Low" }
];

const portfolioOptimizationData = [
  { asset: "Real Estate", current: 40, recommended: 35, performance: 8.5 },
  { asset: "Gold", current: 25, recommended: 30, performance: 12.3 },
  { asset: "Silver", current: 20, recommended: 15, performance: 6.8 },
  { asset: "Art", current: 10, recommended: 15, performance: 15.2 },
  { asset: "Bonds", current: 5, recommended: 5, performance: 3.2 }
];

const riskAssessmentData = [
  { category: "Market Risk", score: 65, max: 100 },
  { category: "Liquidity Risk", score: 45, max: 100 },
  { category: "Credit Risk", score: 30, max: 100 },
  { category: "Operational Risk", score: 25, max: 100 },
  { category: "Regulatory Risk", score: 40, max: 100 }
];

const sentimentData = [
  { date: "Week 1", bullish: 65, bearish: 35, neutral: 45 },
  { date: "Week 2", bullish: 70, bearish: 30, neutral: 40 },
  { date: "Week 3", bullish: 55, bearish: 45, neutral: 50 },
  { date: "Week 4", bullish: 80, bearish: 20, neutral: 35 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function AIInsightsTab() {
  const { address: userAddress } = useAccount();
  const [activeSection, setActiveSection] = useState("chat");
  
  // State for AI-generated data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [aiOverview, setAiOverview] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [marketAnalysis, setMarketAnalysis] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [assetDiscovery, setAssetDiscovery] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [portfolioOptimization, setPortfolioOptimization] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [riskAssessment, setRiskAssessment] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [marketSentiment, setMarketSentiment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load AI insights on component mount
  useEffect(() => {
    const loadAIInsights = async () => {
      try {
        setLoading(true);
        const walletAddress = userAddress?.startsWith('0x') ? userAddress as `0x${string}` : undefined;
        const [overview, market, assets, optimization, risk, sentiment] = await Promise.all([
          AIInsightsService.generateAIOverview(walletAddress),
          AIInsightsService.generateMarketAnalysis(),
          AIInsightsService.generateAssetDiscovery(walletAddress),
          AIInsightsService.generatePortfolioOptimization(walletAddress),
          AIInsightsService.generateRiskAssessment(walletAddress),
          AIInsightsService.generateMarketSentiment()
        ]);
        
        setAiOverview(overview);
        setMarketAnalysis(market);
        setAssetDiscovery(assets);
        setPortfolioOptimization(optimization);
        setRiskAssessment(risk);
        setMarketSentiment(sentiment);
      } catch (error) {
        console.error('Error loading AI insights:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAIInsights();
  }, [userAddress]);

  const sections = [
    { id: "chat", label: "AI Chat", icon: MessageSquare },
    { id: "overview", label: "AI Overview", icon: Brain },
    { id: "market", label: "Market Analysis", icon: BarChart3 },
    { id: "discovery", label: "Asset Discovery", icon: Search },
    { id: "optimization", label: "Portfolio Optimization", icon: Target },
    { id: "risk", label: "Risk Assessment", icon: Shield },
    { id: "sentiment", label: "Market Sentiment", icon: Activity }
  ];

  const handleSendMessage = async (message: string, userAddress?: string): Promise<string> => {
    try {
      const walletAddress = userAddress?.startsWith('0x') ? userAddress as `0x${string}` : undefined;
      if (message.toLowerCase().includes('help') || message.toLowerCase().includes('commands')) {
        return getAIHelp(walletAddress);
      }
      return await processAIPrompt(message, walletAddress);
    } catch (error) {
      console.error('Error processing AI message:', error);
      return "I apologize, but I'm having trouble processing your request right now. Please try again or check your connection.";
    }
  };

  return (
    <div className="space-y-8">
      {/* Section Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Button
              key={section.id}
              variant={activeSection === section.id ? "default" : "outline"}
              onClick={() => setActiveSection(section.id)}
              className={`h-16 flex flex-col items-center gap-2 text-sm ${
                activeSection === section.id 
                  ? "bg-blue-500/20 border-blue-500/20 text-blue-400 hover:bg-blue-500/30" 
                  : "bg-gray-950/80 border-gray-800 text-gray-400 hover:bg-gray-900/50 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{section.label}</span>
            </Button>
          );
        })}
      </div>

      {/* AI Chat Section */}
      {activeSection === "chat" && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">AI Investment Advisor</h2>
            <p className="text-gray-400">Ask me anything about your tokens, market trends, or investment strategies</p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <AIChatInterface onSendMessage={handleSendMessage} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-2">💡 Quick Tips</h3>
                <p className="text-sm text-gray-400">Try asking: &quot;What tokens should I invest in?&quot; or &quot;Analyze my portfolio&quot;</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-2">📊 Data Sources</h3>
                <p className="text-sm text-gray-400">Real-time data from your supported tokens, RWA assets, and market trends</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-2">🎯 Personalized</h3>
                <p className="text-sm text-gray-400">Recommendations based on your actual token holdings and preferences</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* AI Overview Section */}
      {activeSection === "overview" && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading AI insights...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white">AI Confidence Score</CardTitle>
                    <Brain className="h-4 w-4 text-gray-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-400">{aiOverview?.confidenceScore || 75}%</div>
                    <p className="text-xs text-gray-400">
                      {aiOverview?.confidenceScore > 80 ? 'High' : aiOverview?.confidenceScore > 60 ? 'Medium' : 'Low'} confidence in recommendations
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white">Opportunities Found</CardTitle>
                    <Search className="h-4 w-4 text-gray-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{aiOverview?.opportunitiesFound || 12}</div>
                    <p className="text-xs text-gray-400">Investment opportunities identified</p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white">Risk Level</CardTitle>
                    <Shield className="h-4 w-4 text-gray-400" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${
                      aiOverview?.riskLevel === 'Low' ? 'text-green-400' :
                      aiOverview?.riskLevel === 'High' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {aiOverview?.riskLevel || 'Medium'}
                    </div>
                    <p className="text-xs text-gray-400">Current portfolio risk assessment</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* AI Insights */}
              {aiOverview?.insights && (
                <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Key AI Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {aiOverview.insights.map((insight: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm text-gray-300">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* Market Analysis Section */}
      {activeSection === "market" && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading market analysis...</div>
          ) : (
            <>
              <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                    <BarChart3 className="h-6 w-6" />
                    Global RWA Market Trends
                  </CardTitle>
                  <p className="text-gray-400">
                    AI-powered analysis of real-world asset market performance
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={marketAnalysis?.trends || marketTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }} 
                      />
                      <Legend />
                      <Area type="monotone" dataKey="realEstate" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="gold" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="silver" stackId="1" stroke="#6B7280" fill="#6B7280" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="art" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              {/* Market Insights */}
              {marketAnalysis?.insights && (
                <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Market Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {marketAnalysis.insights.map((insight: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <TrendingUp className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-300">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* Asset Discovery Section */}
      {activeSection === "discovery" && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading asset discovery...</div>
          ) : (
            <>
              <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                    <Search className="h-6 w-6" />
                    AI-Discovered Investment Opportunities
                  </CardTitle>
                  <p className="text-gray-400">
                    Smart asset discovery powered by machine learning algorithms
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={assetDiscovery?.assets || assetDiscoveryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                           {(assetDiscovery?.assets || assetDiscoveryData).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    <div className="space-y-4">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                       {(assetDiscovery?.assets || assetDiscoveryData).map((asset: any, index: number) => (
                        <div key={asset.name} className="p-4 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-white">{asset.name}</h4>
                              <p className="text-sm text-green-400">Growth: +{asset.growth}%</p>
                              {asset.reasoning && (
                                <p className="text-xs text-gray-500 mt-1">{asset.reasoning}</p>
                              )}
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              asset.risk === "Low" ? "bg-green-500/20 text-green-400" : 
                              asset.risk === "Medium" ? "bg-yellow-500/20 text-yellow-400" : 
                              "bg-red-500/20 text-red-400"
                            }`}>
                              {asset.risk} Risk
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* AI Asset Discovery Insights */}
              {assetDiscovery?.insights && (
                <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Discovery Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {assetDiscovery.insights.map((insight: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <Search className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-300">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* Portfolio Optimization Section */}
      {activeSection === "optimization" && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading portfolio optimization...</div>
          ) : (
            <>
              <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                    <Target className="h-6 w-6" />
                    AI-Driven Portfolio Rebalancing
                  </CardTitle>
                  <p className="text-gray-400">
                    Intelligent asset allocation recommendations based on market analysis
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={portfolioOptimization?.allocations || portfolioOptimizationData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="asset" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="current" fill="#6B7280" name="Current Allocation (%)" />
                      <Bar dataKey="recommended" fill="#10B981" name="AI Recommended (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              {/* Optimization Insights */}
              {portfolioOptimization?.insights && (
                <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Optimization Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {portfolioOptimization.insights.map((insight: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <Target className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-300">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* Risk Assessment Section */}
      {activeSection === "risk" && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading risk assessment...</div>
          ) : (
            <>
              <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                    <Shield className="h-6 w-6" />
                    AI Risk Analysis
                  </CardTitle>
                  <p className="text-gray-400">
                    Comprehensive risk assessment across multiple dimensions
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={riskAssessment?.riskFactors || riskAssessmentData}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="category" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                      <Radar name="Risk Score" dataKey="score" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              {/* Risk Insights */}
              {riskAssessment?.insights && (
                <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Risk Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {riskAssessment.insights.map((insight: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <Shield className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-300">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* Market Sentiment Section */}
      {activeSection === "sentiment" && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading market sentiment...</div>
          ) : (
            <>
              <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                    <Activity className="h-6 w-6" />
                    Market Sentiment Analysis
                  </CardTitle>
                  <p className="text-gray-400">
                    Real-time sentiment tracking across market indicators
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={marketSentiment?.trends || sentimentData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                      <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151', 
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }} 
                      />
                      <Legend wrapperStyle={{ color: '#9CA3AF' }} />
                      <Line type="monotone" dataKey="bullish" stroke="#10B981" strokeWidth={2} name="Bullish Sentiment" />
                      <Line type="monotone" dataKey="bearish" stroke="#EF4444" strokeWidth={2} name="Bearish Sentiment" />
                      <Line type="monotone" dataKey="neutral" stroke="#F59E0B" strokeWidth={2} name="Neutral Sentiment" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              {/* Sentiment Insights */}
              {marketSentiment?.insights && (
                <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Sentiment Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {marketSentiment.insights.map((insight: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <Activity className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-300">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}