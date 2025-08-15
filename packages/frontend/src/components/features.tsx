import { Grid3X3, Maximize2, Shield, ArrowLeftRight, Vault, Coins, Brain, TrendingUp, Target } from "lucide-react"

export default function Features() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Investment Intelligence",
      description:
        "Advanced algorithms continuously scan global markets, analyze thousands of real-world assets, and provide personalized investment recommendations with predictive modeling.",
    },
    {
      icon: TrendingUp,
      title: "Smart Asset Discovery & Analytics",
      description:
        "Real-time performance analysis, volatility tracking, and automated risk scoring based on market conditions, asset fundamentals, and regulatory environment.",
    },
    {
      icon: Target,
      title: "Intelligent Portfolio Optimization",
      description:
        "AI-driven opportunity identification, market timing algorithms for optimal entry/exit points, and continuous portfolio rebalancing suggestions.",
    },
    {
      icon: Grid3X3,
      title: "Scalability for Global Assets",
      description:
        "Xend Network uses Mantle Network to support high-volume transactions, allowing you to buy, sell, and swap RWAs with speed and efficiency.",
    },
    {
      icon: Shield,
      title: "Compliant & Secure Transactions",
      description:
        "KYC/AML-ready and audit-friendly. Xend Network aligns with institutional-grade compliance standards for regulated DeFi operations.",
    },
    {
      icon: Vault,
      title: "Unlock Liquidity Without Selling",
      description:
        "Use your RWAs as collateral to borrow funds or lend assets to earn yield—without needing to sell or exit your position.",
    },
  ]

  return (
    <section className="relative">
      {/* Black Background */}
      <div className="bg-black">
        {/* Content Container */}
        <div className="container mx-auto px-6 md:px-8 lg:px-12 pb-20 md:pb-32">
          {/* Section Header */}
          <div className="text-center mb-16 md:mb-20">
            {/* Features Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-700 bg-gray-900/50 backdrop-blur-sm mb-8">
              <span className="text-sm font-medium text-green-400">Features</span>
            </div>

            {/* Title */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              AI-Powered RWA Financial Infrastructure
            </h2>

            {/* Description */}
            <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
              Combining advanced AI analytics with professional financial services to deliver intelligent investment 
              recommendations, automated portfolio management, and comprehensive DeFi opportunities for tokenized real-world assets.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <div
                  key={index}
                  className="group p-8 rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-300"
                >
                  {/* Icon */}
                  <div className="mb-6">
                    <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors duration-300">
                      <IconComponent className="w-6 h-6 text-green-400" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-4">
                    <h3 className="text-xl md:text-2xl font-semibold text-white">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}