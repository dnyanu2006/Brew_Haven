import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Coffee, MapPin, Clock, Phone, Mail, Instagram, Compass } from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigateTo, setIsAiDrawerOpen } = useApp();

  return (
    <footer className="bg-[#21140E] text-[#D4C3B3] border-t border-[#3B251B] pt-14 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#3B251B]">
          {/* Col 1: Wordmark & Philosophy */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#FAF7F2] text-[#291811] flex items-center justify-center">
                <Coffee className="w-4 h-4 text-[#C87D32]" />
              </div>
              <span className="font-serif text-xl font-bold text-[#FAF7F2]">Brew Haven</span>
            </div>
            <p className="text-xs text-[#A89687] leading-relaxed">
              Artisanal specialty coffee roastery and French Viennoiserie bakery. Handcrafted with
              single-origin micro-lots and slow fermentation craftsmanship.
            </p>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-[#FAF7F2] mb-3">Explore</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => navigateTo('menu')}
                  className="hover:text-[#FAF7F2] transition-colors"
                >
                  Seasonal Brew Menu
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('reservations')}
                  className="hover:text-[#FAF7F2] transition-colors"
                >
                  Table Reservations
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsAiDrawerOpen(true)}
                  className="hover:text-[#FAF7F2] transition-colors"
                >
                  AI Sommelier Recommender
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('tracking')}
                  className="hover:text-[#FAF7F2] transition-colors"
                >
                  Live Order Tracker
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('cart')}
                  className="hover:text-[#FAF7F2] transition-colors"
                >
                  Shopping Cart
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Hours & Schedule */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-[#FAF7F2] mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#C87D32]" />
              <span>Roastery Hours</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-[#A89687]">
              <li className="flex justify-between">
                <span>Monday – Friday:</span>
                <span className="font-mono text-[#FAF7F2]">7:00 AM – 10:00 PM</span>
              </li>
              <li className="flex justify-between">
                <span>Saturday – Sunday:</span>
                <span className="font-mono text-[#FAF7F2]">8:00 AM – 11:00 PM</span>
              </li>
              <li className="pt-2 text-[11px] text-[#C87D32]">
                Fresh Bakery Drops at 7:30 AM & 3:30 PM
              </li>
            </ul>
          </div>

          {/* Col 4: Location & Contact */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-[#FAF7F2] mb-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#C87D32]" />
              <span>Location</span>
            </h4>
            <p className="text-xs text-[#A89687] leading-relaxed">
              42 Heritage Boulevard, 12th Main Road, Indiranagar, Bengaluru 560038
            </p>
            <p className="text-xs text-[#A89687] mt-2">
              Reservations: <span className="font-mono text-[#FAF7F2]">+91 98765 43210</span>
            </p>
            <p className="text-xs text-[#A89687]">
              Inquiries: <span className="text-[#FAF7F2]">hello@brewhaven.com</span>
            </p>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8C7565] gap-3">
          <p>© {new Date().getFullYear()} Brew Haven Artisanal Specialty Coffee & Bakery. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Single Origin Terroir</span>
            <span>·</span>
            <span>French Cultured Butter Bakes</span>
            <span>·</span>
            <span>Ethically Sourced</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
