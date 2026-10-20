import heroImage from '../assets/images/hero_brewhaven_cafe_1792323910107.jpg';
import coffeeImage from '../assets/images/coffee_pour_over_specialty_1792323909005.jpg';
import pastryImage from '../assets/images/pastry_croissant_breakfast_1792323910120.jpg';
import latteImage from '../assets/images/latte_art_caramel_macchiato_1792323909916.jpg';
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { ProductCard } from '../components/ProductCard.tsx';
import { MenuItem, Review } from '../types/index.ts';
import { api } from '../services/api.ts';
import {
  Sparkles,
  ArrowRight,
  Coffee,
  Croissant,
  Clock,
  MapPin,
  Calendar,
  Star,
  ShieldCheck,
  Award,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { setCurrentView, setIsAiDrawerOpen, setSelectedCategorySlug } = useApp();

  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getMenuItems({ sort: 'rating' }), api.getItemReviews('item_caramel_macchiato')])
      .then(([items, revs]) => {
        setFeaturedItems(items.slice(0, 4));
        setReviews(revs);
      })
      .catch((err) => {
        console.error('Failed to load homepage data:', err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. Hero Section (Split Screen with 16:9 Image) */}
      <section className="relative overflow-hidden bg-[#FAF7F2] border-b border-[#E8DFD5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Editorial Headline & Actions */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#C87D32]">
                <span className="w-6 h-[1.5px] bg-[#C87D32]" />
                <span>Specialty Coffee Roastery & Bakery</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#291811] tracking-tight leading-[1.12] text-balance">
                Handcrafted terroir. Fresh morning bakes.
              </h1>

              <p className="text-sm sm:text-base text-[#5C4538] leading-relaxed max-w-xl">
                Every cup is precisely extracted from micro-lot harvests. Every pastry is laminated
                with Normandy butter and baked fresh each dawn. Welcome to your neighborhood sanctuary.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setCurrentView('menu')}
                  className="px-6 py-3 bg-[#291811] text-[#FAF7F2] text-xs sm:text-sm font-medium rounded-xl hover:bg-[#3D251A] transition-colors flex items-center gap-2 shadow-xs"
                >
                  <span>Explore Seasonal Menu</span>
                  <ArrowRight className="w-4 h-4 text-[#E5B26E]" />
                </button>

                <button
                  onClick={() => setCurrentView('reservations')}
                  className="px-6 py-3 bg-white text-[#291811] text-xs sm:text-sm font-medium rounded-xl border border-[#D9CEBF] hover:bg-[#F2ECE4] transition-colors"
                >
                  Reserve a Table
                </button>

                <button
                  onClick={() => setIsAiDrawerOpen(true)}
                  className="flex items-center gap-2 px-4 py-3 text-xs font-semibold text-[#C87D32] hover:text-[#A75D1E] transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ask AI Sommelier</span>
                </button>
              </div>

              {/* Trust Metric Strip */}
              <div className="pt-6 border-t border-[#E8DFD5] grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="font-mono text-xl font-bold text-[#291811] block tabular-nums">100%</span>
                  <span className="text-[#8C6D58] text-[11px]">Direct Trade Specialty Lots</span>
                </div>
                <div>
                  <span className="font-mono text-xl font-bold text-[#291811] block tabular-nums">36</span>
                  <span className="text-[#8C6D58] text-[11px]">Viennoiserie Butter Layers</span>
                </div>
                <div>
                  <span className="font-mono text-xl font-bold text-[#291811] block tabular-nums">4.9★</span>
                  <span className="text-[#8C6D58] text-[11px]">Guest Experience Rating</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero High-Res Image Card */}
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden shadow-xl border border-[#E0D5C8] aspect-[16/10] bg-[#EFE8DF]">
                <img
                  src={heroImage}
                  alt="Brew Haven Cafe Interior"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                  <div className="text-white">
                    <p className="text-xs font-mono tracking-widest uppercase text-[#E5B26E]">
                      Indiranagar Sanctuary
                    </p>
                    <p className="font-serif text-lg font-medium">
                      Open 7:00 AM – 10:00 PM Daily · Barista Seating Available
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Artisanal Craft Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white rounded-xl border border-[#EBE4DC] space-y-2">
            <div className="w-9 h-9 rounded-lg bg-[#FAF7F2] text-[#C87D32] flex items-center justify-center border border-[#E8DFD5]">
              <Coffee className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-base font-semibold text-[#291811]">
              Micro-Lot Roasts
            </h3>
            <p className="text-xs text-[#6B5547] leading-relaxed">
              Heirloom Ethiopian Yirgacheffe, single-estate Coorg Arabica, and washed Colombian
              beans roasted in small 5kg batches weekly.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-[#EBE4DC] space-y-2">
            <div className="w-9 h-9 rounded-lg bg-[#FAF7F2] text-[#C87D32] flex items-center justify-center border border-[#E8DFD5]">
              <Croissant className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-base font-semibold text-[#291811]">
              French Viennoiserie
            </h3>
            <p className="text-xs text-[#6B5547] leading-relaxed">
              36-layer laminated dough with French cultured butter. Warm golden croissants, chocolate
              cruffins, and sourdough baked fresh every morning.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-[#EBE4DC] space-y-2">
            <div className="w-9 h-9 rounded-lg bg-[#FAF7F2] text-[#C87D32] flex items-center justify-center border border-[#E8DFD5]">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-base font-semibold text-[#291811]">
              AI Taste Sommelier
            </h3>
            <p className="text-xs text-[#6B5547] leading-relaxed">
              Get intelligent pairings based on sweetness, dairy preference, and budget powered by
              Gemini directly connected to our live menu.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-[#EBE4DC] space-y-2">
            <div className="w-9 h-9 rounded-lg bg-[#FAF7F2] text-[#C87D32] flex items-center justify-center border border-[#E8DFD5]">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-base font-semibold text-[#291811]">
              Cozy Reserved Seating
            </h3>
            <p className="text-xs text-[#6B5547] leading-relaxed">
              Choose your table: sunlit window, quiet reading booth, or open breezy garden patio.
              Instant confirmation with zero wait.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Featured Bestsellers Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#C87D32] block mb-1">
              Curated Selection
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#291811]">
              Our Signature Specialties
            </h2>
          </div>
          <button
            onClick={() => setCurrentView('menu')}
            className="text-xs font-semibold text-[#291811] hover:text-[#C87D32] flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <span>View Full Menu & Pricing</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-72 bg-white rounded-xl border border-[#E8DFD5] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredItems.map((item) => (
              <ProductCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* 4. AI Sommelier Interactive Teaser */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl bg-[#291811] text-[#FAF7F2] p-8 sm:p-12 overflow-hidden shadow-lg border border-[#40271B]">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2]/10 text-xs font-medium text-[#E5B26E]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gemini Coffee Sommelier Assistant</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-semibold leading-snug">
              Unsure what to order today? Let our digital barista tailor your cup.
            </h2>

            <p className="text-xs sm:text-sm text-[#D4C3B3] leading-relaxed">
              Answer 3 quick sensory questions about your palate, caffeine mood, and sweetness. We'll
              instantly pair your brew with the ideal bakery accompaniment.
            </p>

            <div className="pt-2">
              <button
                onClick={() => setIsAiDrawerOpen(true)}
                className="px-5 py-3 bg-[#E5B26E] text-[#291811] text-xs font-semibold rounded-xl hover:bg-[#F2C58A] transition-colors flex items-center gap-2 shadow-xs"
              >
                <span>Launch Sommelier Guide</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Visual Craft Showcase Gallery */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#C87D32]">
            Artisanal Gallery
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#291811]">
            Moments at the Haven
          </h2>
          <p className="text-xs text-[#6B5547]">
            Capturing the precision of manual extractions and freshly proofed dough.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="rounded-xl overflow-hidden border border-[#E0D5C8] aspect-[4/3] bg-[#EFE8DF]">
            <img
              src={coffeeImage}
              alt="Single Origin Pour Over"
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
          <div className="rounded-xl overflow-hidden border border-[#E0D5C8] aspect-[4/3] bg-[#EFE8DF]">
            <img
              src={pastryImage}
              alt="Fresh Butter Croissants"
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
          <div className="rounded-xl overflow-hidden border border-[#E0D5C8] aspect-[4/3] bg-[#EFE8DF]">
            <img
              src={latteImage}
              alt="Velvet Latte Art"
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        </div>
      </section>

      {/* 6. Guest Testimonials & Reviews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#C87D32] block mb-1">
                Customer Voices
              </span>
              <h2 className="font-serif text-2xl font-semibold text-[#291811]">
                Loved by Bengaluru's Coffee Connoisseurs
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#5C4538]">
              <div className="flex text-[#C87D32]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="font-bold text-[#291811]">4.9 / 5.0</span>
              <span className="text-[#8C6D58]">· 320+ Verified Reviews</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="p-5 bg-white rounded-xl border border-[#E8DFD5] space-y-3">
              <div className="flex text-[#C87D32]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="text-xs text-[#5C4538] leading-relaxed italic">
                "The V60 pour over here is legitimately world class. You can taste the jasmine and
                bergamot clarity. The baristas treat extraction like a fine science."
              </p>
              <div className="text-[11px] text-[#8C6D58]">
                <strong className="text-[#291811] block">Rohan Mehra</strong>
                <span>Specialty Coffee Enthusiast</span>
              </div>
            </div>

            <div className="p-5 bg-white rounded-xl border border-[#E8DFD5] space-y-3">
              <div className="flex text-[#C87D32]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="text-xs text-[#5C4538] leading-relaxed italic">
                "Their Salted Caramel Silk Macchiato combined with the French almond pain au chocolat
                is my weekend sanctuary ritual. Sublime atmosphere and power outlets for working."
              </p>
              <div className="text-[11px] text-[#8C6D58]">
                <strong className="text-[#291811] block">Kavita Sharma</strong>
                <span>Architect & Writer</span>
              </div>
            </div>

            <div className="p-5 bg-white rounded-xl border border-[#E8DFD5] space-y-3">
              <div className="flex text-[#C87D32]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="text-xs text-[#5C4538] leading-relaxed italic">
                "We reserved table T-01 for an anniversary morning coffee tasting. Flawless online
                table booking and the table was held perfectly on time."
              </p>
              <div className="text-[11px] text-[#8C6D58]">
                <strong className="text-[#291811] block">Alex Rivera</strong>
                <span>Regular Guest</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Location & Visit Info */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-8 sm:p-10 rounded-2xl border border-[#E8DFD5]">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#C87D32]">
              Visit Us
            </span>
            <h2 className="font-serif text-2xl font-semibold text-[#291811]">
              The Brew Haven Flagship
            </h2>
            <div className="space-y-3 text-xs text-[#5C4538]">
              <p className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#C87D32] shrink-0 mt-0.5" />
                <span>42 Heritage Boulevard, 12th Main Road, Indiranagar, Bengaluru 560038</span>
              </p>
              <p className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#C87D32] shrink-0 mt-0.5" />
                <span>Monday – Sunday: 7:00 AM – 10:00 PM (Bakery fresh drops 7:30 AM & 3:30 PM)</span>
              </p>
            </div>
            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setCurrentView('reservations')}
                className="px-5 py-2.5 bg-[#291811] text-[#FAF7F2] text-xs font-medium rounded-lg hover:bg-[#3D251A] transition-colors"
              >
                Reserve Your Table
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 h-64 rounded-xl overflow-hidden border border-[#E0D5C8] bg-[#F5EFEB] relative flex items-center justify-center p-6 text-center">
            {/* Interactive Cafe Map Mockup */}
            <div className="space-y-2 max-w-sm">
              <div className="w-10 h-10 rounded-full bg-[#291811] text-[#E5B26E] flex items-center justify-center mx-auto shadow-md">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-sm font-semibold text-[#291811]">Brew Haven Indiranagar</h3>
              <p className="text-xs text-[#6B5547]">
                Located opposite Defence Colony Park with dedicated bicycle racks and valet parking.
              </p>
              <span className="inline-block px-3 py-1 rounded bg-[#E8DFD5] text-[11px] font-mono text-[#291811]">
                Lat: 12.9716° N, Lon: 77.5946° E
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
