import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { X, Sparkles, Loader2, ArrowRight, Check } from 'lucide-react';
import { api } from '../services/api.ts';
import { AiRecommendation } from '../types/index.ts';

export const SommelierAiDrawer: React.FC = () => {
  const { isAiDrawerOpen, setIsAiDrawerOpen, setCustomizingItem, requestAddToCart, showToast } = useApp();

  const [taste, setTaste] = useState('Sweet & Creamy');
  const [temperature, setTemperature] = useState('Hot');
  const [sweetness, setSweetness] = useState('Balanced');
  const [dietary, setDietary] = useState('none');
  const [budget, setBudget] = useState<number | undefined>(400);
  const [mood, setMood] = useState('Cozy afternoon recharge');

  const [isLoading, setIsLoading] = useState(false);
  const [recommendationResult, setRecommendationResult] = useState<AiRecommendation | null>(null);

  if (!isAiDrawerOpen) return null;

  const handleGetRecommendations = async () => {
    try {
      setIsLoading(true);
      const res = await api.getAiRecommendations({
        taste,
        temperature,
        sweetness,
        dietary: dietary === 'none' ? undefined : dietary,
        budgetMaxInr: budget,
        mood,
      });
      setRecommendationResult(res);
    } catch (err: any) {
      showToast('Could not fetch recommendations at this time.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-[#FAF7F2] h-full shadow-2xl flex flex-col border-l border-[#E8DFD5]">
        {/* Header */}
        <div className="p-5 border-b border-[#E8DFD5] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#291811] text-[#E5B26E] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-[#291811]">
                AI Coffee Sommelier
              </h2>
              <span className="text-[11px] text-[#8C6D58] block">
                Powered by Gemini & in-house barista intelligence
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsAiDrawerOpen(false)}
            className="p-1.5 text-[#8C6D58] hover:text-[#291811] rounded-lg hover:bg-[#F2ECE4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!recommendationResult ? (
            <>
              {/* Introduction */}
              <div className="p-4 rounded-xl bg-white border border-[#E8DFD5] text-xs text-[#5C4538] leading-relaxed">
                Tell us your mood, flavor preferences, and dietary needs. Our AI barista will craft
                a tailored beverage and bakery pairing from our fresh daily menu.
              </div>

              {/* 1. Taste Profile */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#5C4538] block mb-2">
                  Flavor Profile
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['Sweet & Creamy', 'Bold & Smoky', 'Fruity & Floral', 'Nutty & Smooth'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setTaste(opt)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        taste === opt
                          ? 'border-[#291811] bg-white ring-1 ring-[#291811] font-medium text-[#291811]'
                          : 'border-[#E0D5C8] bg-[#F5EFEB] text-[#6B5547] hover:bg-[#EFE7DE]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Temperature & Sweetness */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#5C4538] block mb-2">
                    Temperature
                  </label>
                  <div className="space-y-1.5 text-xs">
                    {['Hot', 'Cold / Iced', 'Any'].map((temp) => (
                      <button
                        key={temp}
                        type="button"
                        onClick={() => setTemperature(temp)}
                        className={`w-full p-2 rounded-lg border text-left transition-all ${
                          temperature === temp
                            ? 'border-[#291811] bg-white ring-1 ring-[#291811] font-medium text-[#291811]'
                            : 'border-[#E0D5C8] bg-[#F5EFEB] text-[#6B5547] hover:bg-[#EFE7DE]'
                        }`}
                      >
                        {temp}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#5C4538] block mb-2">
                    Sweetness
                  </label>
                  <div className="space-y-1.5 text-xs">
                    {['Unsweetened', 'Light', 'Balanced', 'Indulgent'].map((sweet) => (
                      <button
                        key={sweet}
                        type="button"
                        onClick={() => setSweetness(sweet)}
                        className={`w-full p-2 rounded-lg border text-left transition-all ${
                          sweetness === sweet
                            ? 'border-[#291811] bg-white ring-1 ring-[#291811] font-medium text-[#291811]'
                            : 'border-[#E0D5C8] bg-[#F5EFEB] text-[#6B5547] hover:bg-[#EFE7DE]'
                        }`}
                      >
                        {sweet}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Dietary Needs */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#5C4538] block mb-2">
                  Dietary Restrictions
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'none', label: 'Standard Dairy' },
                    { id: 'oat', label: 'Oat Milk' },
                    { id: 'vegan', label: '100% Plant-Based' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDietary(d.id)}
                      className={`flex-1 p-2 rounded-lg border text-center text-xs transition-all ${
                        dietary === d.id
                          ? 'border-[#291811] bg-white ring-1 ring-[#291811] font-medium text-[#291811]'
                          : 'border-[#E0D5C8] bg-[#F5EFEB] text-[#6B5547] hover:bg-[#EFE7DE]'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Mood & Budget */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#5C4538] block mb-2">
                  Today's Cafe Vibe
                </label>
                <input
                  type="text"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  placeholder="e.g. Focus work session, relaxing read, catch up with friends..."
                  className="w-full text-xs p-2.5 rounded-lg border border-[#E0D5C8] bg-white focus:outline-none focus:ring-1 focus:ring-[#291811]"
                />
              </div>

              <button
                onClick={handleGetRecommendations}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#291811] text-[#FAF7F2] text-xs font-medium rounded-xl hover:bg-[#3D251A] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#E5B26E]" />
                    <span>Consulting Sommelier...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#E5B26E]" />
                    <span>Find My Ideal Brew & Pairing</span>
                  </>
                )}
              </button>
            </>
          ) : (
            /* Results Screen */
            <div className="space-y-5">
              <div className="p-4 bg-white rounded-xl border border-[#E8DFD5] space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C87D32]">
                  Sommelier Note
                </span>
                <p className="font-serif text-sm italic text-[#291811] leading-relaxed">
                  "{recommendationResult.baristaGreeting}"
                </p>
                <div className="text-[11px] text-[#8C6D58] flex items-center justify-between pt-2 border-t border-[#F2ECE4]">
                  <span>Engine: {recommendationResult.source}</span>
                  {recommendationResult.totalEstimatedPriceInr && (
                    <span className="font-mono font-medium text-[#291811]">
                      Est. Total: ₹{recommendationResult.totalEstimatedPriceInr}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-sm font-semibold text-[#291811]">
                  Handcrafted Pairings
                </h3>

                {recommendationResult.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white rounded-xl border border-[#E8DFD5] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase text-[#A66F43] tracking-wider">
                        {rec.role}
                      </span>
                      {rec.itemDetails && (
                        <span className="font-mono text-xs font-semibold text-[#291811] tabular-nums">
                          ₹{(rec.itemDetails.pricePaise / 100).toFixed(0)}
                        </span>
                      )}
                    </div>

                    <h4 className="font-serif text-base font-semibold text-[#291811]">
                      {rec.name}
                    </h4>

                    <p className="text-xs text-[#5C4538] leading-relaxed">{rec.whyItFits}</p>

                    {rec.suggestedCustomization && (
                      <p className="text-[11px] text-[#C87D32] bg-[#FAF7F2] p-2 rounded-lg">
                        💡 Barista Tip: {rec.suggestedCustomization}
                      </p>
                    )}

                    {rec.itemDetails && (
                      <div className="pt-2 flex gap-2">
                        <button
                          onClick={() => {
                            if (rec.itemDetails) {
                              setCustomizingItem(rec.itemDetails);
                              setIsAiDrawerOpen(false);
                            }
                          }}
                          className="flex-1 py-2 px-3 border border-[#291811] text-[#291811] text-xs font-medium rounded-lg hover:bg-[#F5EFEB] transition-colors"
                        >
                          Customize
                        </button>
                        <button
                          onClick={() => {
                            if (rec.itemDetails) {
                              setIsAiDrawerOpen(false);
                              requestAddToCart({
                                id: `${rec.itemDetails._id}-${Date.now()}`,
                                menuItemId: rec.itemDetails._id,
                                name: rec.itemDetails.name,
                                image: rec.itemDetails.image,
                                unitPricePaise: rec.itemDetails.pricePaise,
                                quantity: 1,
                                toppings: [],
                                extras: [],
                                lineTotalPaise: rec.itemDetails.pricePaise,
                              });
                            }
                          }}
                          className="py-2 px-3 bg-[#291811] text-[#FAF7F2] text-xs font-medium rounded-lg hover:bg-[#3D251A] transition-colors"
                        >
                          Add to Order
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setRecommendationResult(null)}
                className="w-full py-2.5 text-xs text-[#5C4538] hover:text-[#291811] font-medium text-center"
              >
                ← Adjust Taste Preferences
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
