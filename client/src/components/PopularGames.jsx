import { ArrowRight } from "lucide-react";
import { useState } from "react";

const games = [
  {
    title: "WORLD WIDE",
    name: "MATKA",
    image: "https://i.ibb.co/jPm1b0df/card-1.png",
    link: "/matka",
    bg: "from-purple-500 to-violet-400",
  },
  {
    title: "Australia",
    name: "POWERBALL",
    image: "https://i.ibb.co/bRHBMCM9/card-2.png",
    link: "/powerhit",
    bg: "from-lime-500 to-green-400",
  },
  {
    title: "INDIA",
    name: "POWERBALL",
    image: "https://i.ibb.co/B2CJ9CB0/card-3.png",
    link: "/powerhit",
    bg: "from-orange-500 to-yellow-400",
  },
  {
    title: "NEPAL",
    name: "POWERBALL",
    image: "https://i.ibb.co/Kx2qtpjk/card-4.png",
    link: "/powerhit",
    bg: "from-pink-500 to-rose-400",
  },
  {
    title: "USA",
    name: "POWERBALL",
    image: "https://i.ibb.co/jPm1b0df/card-1.png",
    link: "/powerhit",
    bg: "from-blue-500 to-cyan-400",
  },
  {
    title: "UK",
    name: "LOTTO",
    image: "https://i.ibb.co/bRHBMCM9/card-2.png",
    link: "/powerhit",
    bg: "from-indigo-500 to-blue-400",
  },
  {
    title: "CANADA",
    name: "LOTTO MAX",
    image: "https://i.ibb.co/B2CJ9CB0/card-3.png",
    link: "/powerhit",
    bg: "from-red-500 to-orange-400",
  },
  {
    title: "JAPAN",
    name: "LOTO 7",
    image: "https://i.ibb.co/Kx2qtpjk/card-4.png",
    link: "/powerhit",
    bg: "from-emerald-500 to-green-400",
  },
];

export default function PopularGames() {
  const [showAll, setShowAll] = useState(false);

  // Show first 4 cards initially, all 8 when showAll is true
  const displayGames = showAll ? games : games.slice(0, 4);
  const totalGames = games.length;

  // Function to generate link with query parameter
  const getGameLink = (game) => {
    // If it's a powerhit game, add country as query parameter
    if (game.link === "/powerhit" || game.link === "/matka") {
      return `${game.link}?country=${game.title.toLowerCase()}`;
    }
    return game.link;
  };

  return (
    <section className="py-6 md:py-12 ">
      <div className="max-w-8xl mx-auto px-3 md:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>

            <h2 className="text-lg md:text-2xl font-bold uppercase text-gray-800">
              Popular Games
            </h2>
          </div>

          <button
            onClick={() => setShowAll(!showAll)}
            className="border border-gray-300 rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-gray-100"
          >
            {showAll ? "View Less" : "View All"}
          </button>
        </div>

        {/* Cards Grid - 4 columns on all devices */}
        <div className="grid grid-cols-4 gap-2 md:gap-5">
          {displayGames.map((game, index) => (
            <a
              key={index}
              href={getGameLink(game)}
              className="group relative rounded-xl md:rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white aspect-[3/5.5] md:aspect-[3/4.5]"
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${game.image})` }}
              />

              {/* Bottom Section - Content */}
              <div className="absolute bottom-0 left-0 right-0 z-10 p-2 md:p-5">
                {/* Game Name */}
                <div className="text-center text-white mb-1 md:mb-3">
                  <p>
                    <span className="text-white text-[9px] md:text-[10px] font-bold uppercase tracking-wider">
                      {game.title.split(" ")[0]}
                    </span>
                  </p>
                  <h3 className="font-extrabold text-[10px] md:text-xl lg:text-2xl leading-tight drop-shadow-lg">
                    {game.name}
                  </h3>
                </div>

                {/* Play Button */}
                <button className="w-full inline-flex items-center justify-center gap-1 md:gap-2 bg-transparent border-white text-white font-bold rounded-lg md:rounded-xl px-1.5 py-1 md:px-4 md:py-2.5 text-[10px] md:text-xs lg:text-sm transition-all duration-300 shadow-lg hover:shadow-xl border border-yellow-300/50 group-hover:scale-105">
                  <span>PLAY</span>
                  <ArrowRight className="w-2 h-2 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </a>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </section>
  );
}