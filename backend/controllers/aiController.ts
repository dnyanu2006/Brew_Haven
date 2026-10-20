import { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import mongoose from 'mongoose';
import { MenuItemModel } from '../models/MenuItem.ts';
import { memoryDb } from '../services/dbStore.ts';

const isMongoLive = () => mongoose.connection.readyState === 1;

let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI client:', err);
  }
}

export async function getCoffeeRecommendations(req: Request, res: Response): Promise<void> {
  try {
    const { taste, sweetness, temperature, dietary, budgetMaxInr, mood } = req.body;

    // 1. Fetch live menu items from DB
    let currentMenuItems: any[] = [];
    if (isMongoLive()) {
      currentMenuItems = await MenuItemModel.find({ isAvailable: true });
    } else {
      currentMenuItems = memoryDb.menuItems.filter((i) => i.isAvailable);
    }

    if (currentMenuItems.length === 0) {
      res.status(404).json({ error: 'No menu items available for recommendation.' });
      return;
    }

    // Prepare item summaries for the model
    const menuCatalog = currentMenuItems.map((item) => ({
      id: item._id.toString(),
      name: item.name,
      categoryName: item.categoryName,
      priceInr: (item.pricePaise / 100).toFixed(0),
      isVeg: item.isVeg,
      description: item.description,
      tags: item.tags,
      image: item.image,
    }));

    // Check if Gemini is available
    if (process.env.GEMINI_API_KEY) {
      if (!aiClient) {
        aiClient = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
      }

      try {
        const systemPrompt = `You are the master coffee sommelier and executive barista at Brew Haven, an artisanal specialty coffee cafe.
Your mission is to recommend the top 2-3 most suitable drink and bakery pairings from the ACTUAL CURRENT MENU based strictly on the user's taste, temperature, sweetness, dietary preference, and budget.
Only recommend items that exist in the provided menu catalog.

Current Menu:
${JSON.stringify(menuCatalog, null, 2)}
`;

        const userPrompt = `User preferences:
- Taste profile: ${taste || 'Any'}
- Sweetness preference: ${sweetness || 'Any'}
- Temperature: ${temperature || 'Any'}
- Dietary preference: ${dietary || 'None'}
- Max budget: ${budgetMaxInr ? '₹' + budgetMaxInr : 'Flexible'}
- Mood/Vibe: ${mood || 'Cozy & relaxed'}

Please recommend 1 primary drink and 1 complementary pairing from the menu, with a personalized barista note explaining why this match fits their palate.`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                baristaGreeting: {
                  type: Type.STRING,
                  description: 'A warm 1-sentence sommelier greeting acknowledging their taste preference.',
                },
                recommendations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      itemId: {
                        type: Type.STRING,
                        description: 'Exact ID from the provided catalog',
                      },
                      name: {
                        type: Type.STRING,
                      },
                      role: {
                        type: Type.STRING,
                        description: 'e.g. Primary Brew or Perfect Bakery Pairing',
                      },
                      whyItFits: {
                        type: Type.STRING,
                        description: 'Sensory notes and why this matches their taste and mood.',
                      },
                      suggestedCustomization: {
                        type: Type.STRING,
                        description: 'e.g., Oat milk with light sweet or single shot',
                      },
                    },
                    required: ['itemId', 'name', 'whyItFits'],
                  },
                },
                totalEstimatedPriceInr: {
                  type: Type.NUMBER,
                },
              },
              required: ['baristaGreeting', 'recommendations'],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');

        // Attach full item details so the client can immediately render rich product cards
        const enrichedRecs = (parsed.recommendations || []).map((rec: any) => {
          const item = currentMenuItems.find((i) => i._id.toString() === rec.itemId || i.name === rec.name);
          return {
            ...rec,
            itemDetails: item || null,
          };
        });

        res.json({
          source: 'gemini-3.8-flash',
          baristaGreeting: parsed.baristaGreeting,
          recommendations: enrichedRecs,
          totalEstimatedPriceInr: parsed.totalEstimatedPriceInr,
        });
        return;
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, falling back to rule-based engine:', geminiError?.message);
      }
    }

    // Rule-based intelligent fallback
    console.log('Running rule-based sommelier engine...');

    let filtered = [...currentMenuItems];

    if (dietary === 'vegan') {
      filtered = filtered.filter((i) => i.isVeg && !i.allergens?.includes('Dairy'));
    }

    if (temperature === 'cold' || temperature === 'iced') {
      const coldItems = filtered.filter((i) => i.categoryName?.includes('Cold') || i.tags?.includes('Cold Infusion'));
      if (coldItems.length > 0) filtered = coldItems;
    } else if (temperature === 'hot') {
      const hotItems = filtered.filter((i) => i.categoryName?.includes('Hot') || i.categoryName?.includes('Pour'));
      if (hotItems.length > 0) filtered = hotItems;
    }

    // Find primary drink
    let primary = filtered.find((i) => i.isBestseller) || filtered[0] || currentMenuItems[0];

    if (taste === 'fruity' || taste === 'light') {
      primary = currentMenuItems.find((i) => i.slug.includes('ethiopian') || i.tags.includes('Fruity & Floral')) || primary;
    } else if (taste === 'sweet' || taste === 'caramel') {
      primary = currentMenuItems.find((i) => i.slug.includes('caramel')) || primary;
    } else if (taste === 'strong' || taste === 'bold') {
      primary = currentMenuItems.find((i) => i.slug.includes('cortado') || i.slug.includes('nitro')) || primary;
    }

    // Find complementary bakery or savory pairing
    const pairing =
      currentMenuItems.find((i) => i.categoryName?.includes('Bakery') || i.categoryName?.includes('Savory')) ||
      currentMenuItems[1];

    const fallbackRecommendations = [
      {
        itemId: primary._id.toString(),
        name: primary.name,
        role: 'Primary Brew',
        whyItFits: `Specially selected for your ${taste || 'signature'} taste profile with rich roasted aromas.`,
        suggestedCustomization: sweetness === 'unsweetened' ? 'Served black to accentuate natural terroir' : 'Prepared with velvety microfoam',
        itemDetails: primary,
      },
      {
        itemId: pairing._id.toString(),
        name: pairing.name,
        role: 'Perfect Pairing',
        whyItFits: `The buttery textures and subtle warmth complement your chosen coffee beautifully.`,
        suggestedCustomization: 'Served warm straight from our morning baking station.',
        itemDetails: pairing,
      },
    ];

    res.json({
      source: 'rule-based-engine',
      baristaGreeting: `Welcome to Brew Haven! Here is our sommelier recommendation handcrafted for your taste.`,
      recommendations: fallbackRecommendations,
      totalEstimatedPriceInr: Math.round((primary.pricePaise + pairing.pricePaise) / 100),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate recommendations.' });
  }
}
