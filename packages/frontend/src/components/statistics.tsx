export default function Statistics() {
  const stats = [
    {
      number: "$25.46B",
      label: "Current RWA Market Value with +19.97% Growth",
    },
    {
      number: "342K+",
      label: "RWA Holders Across 259 Asset Issuers",
    },
    {
      number: "$50B",
      label: "Projected Market Size by 2025",
    },
  ]

  return (
    <section className="bg-black py-20 md:py-32">
      <div className="container mx-auto px-6 md:px-8 lg:px-12 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-700 bg-gray-900/50 backdrop-blur-sm mb-8">
          <span className="text-sm font-medium text-green-400">Statistics</span>
        </div>

        {/* Heading */}
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          Leading the AI-Powered RWA Revolution
        </h2>

        {/* Description */}
        <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-4xl mx-auto mb-16">
          Targeting the rapidly expanding tokenized asset market with AI-driven intelligence, 
          professional financial services, and institutional-grade infrastructure for the future of RWA finance.
        </p>

        {/* Statistics */}
        <div className="grid md:grid-cols-3 gap-12 md:gap-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-green-500 mb-4">{stat.number}</div>
              <div className="text-lg md:text-xl text-gray-400 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}