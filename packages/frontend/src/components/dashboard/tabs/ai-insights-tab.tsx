"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Badge component not available, using styled span instead
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
  Activity
} from "lucide-react";

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
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", label: "AI Overview", icon: Brain },
    { id: "market", label: "Market Analysis", icon: BarChart3 },
    { id: "discovery", label: "Asset Discovery", icon: Search },
    { id: "optimization", label: "Portfolio Optimization", icon: Target },
    { id: "risk", label: "Risk Assessment", icon: Shield },
    { id: "sentiment", label: "Market Sentiment", icon: Activity }
  ];

  return (
    <div className="space-y-8">
      {/* Section Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

      {/* AI Overview Section */}
      {activeSection === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">AI Confidence Score</CardTitle>
              <Brain className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">87%</div>
              <p className="text-xs text-gray-400">+5% from last week</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Opportunities Found</CardTitle>
              <Search className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">23</div>
              <p className="text-xs text-gray-400">12 high-priority</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Risk Level</CardTitle>
              <Shield className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">Medium</div>
              <p className="text-xs text-gray-400">Optimized portfolio</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Market Analysis Section */}
      {activeSection === "market" && (
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
              <AreaChart data={marketTrendsData}>
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
      )}

      {/* Asset Discovery Section */}
      {activeSection === "discovery" && (
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
                    data={assetDiscoveryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {assetDiscoveryData.map((entry, index) => (
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
                {assetDiscoveryData.map((asset, index) => (
                  <div key={asset.name} className="p-4 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white">{asset.name}</h4>
                        <p className="text-sm text-green-400">Growth: +{asset.growth}%</p>
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
      )}

      {/* Portfolio Optimization Section */}
      {activeSection === "optimization" && (
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
              <BarChart data={portfolioOptimizationData}>
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
      )}

      {/* Risk Assessment Section */}
      {activeSection === "risk" && (
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
              <RadarChart data={riskAssessmentData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="category" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <Radar name="Risk Score" dataKey="score" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Market Sentiment Section */}
      {activeSection === "sentiment" && (
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
              <LineChart data={sentimentData}>
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
      )}
    </div>
  );
}