import { Zap, Plus, Target, LucideIcon } from "lucide-react";
import Image from "next/image";

export default function Partners() {
  const partners: Array<{
    name: string;
    // description: string;
    type: "image" | "icon";
    logo?: string;
    icon?: LucideIcon;
  }> = [
    {
      name: "Mantle Network",
      logo: "https://www.mantle.xyz/logo-mantle-network.svg",
      // description: "Layer 2 Blockchain",
      type: "image",
    },
  ];

  return (
    <section className="bg-black py-16 md:py-20">
      <div className="container mx-auto px-6 md:px-8 lg:px-12">
        {/* Section Title */}
        <div className="text-center mb-12">
          <h2 className="text-lg md:text-xl text-gray-400 font-medium">
            Built on Mantle Network & Powered by Industry Leaders
          </h2>
        </div>

        {/* Partners Grid */}
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 lg:gap-16">
          {partners.map((partner, index) => {
            return (
              <div
                key={index}
                className="flex flex-col items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors duration-300 group"
              >
                <div className="flex items-center justify-center">
                  {partner.type === "image" && partner.logo ? (
                    <Image
                      src={partner.logo}
                      alt={`${partner.name} logo`}
                      width={60}
                      height={60}
                      className="w-60 h-60 md:w-60 md:h-60 group-hover:opacity-80 transition-opacity"
                    />
                  ) : partner.icon ? (
                    <partner.icon className="w-60 h-60 md:w-60 md:h-60 group-hover:text-green-400 transition-colors" />
                  ) : null}
                </div>
                {/* <span className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
                  {partner.description}
                </span> */}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
