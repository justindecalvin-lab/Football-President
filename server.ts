import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini lazily
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Helper for generating fallback player career history
function generateFallbackCareerHistory(player: any) {
  if (!player) return [];
  const history = [];
  const club = player.clubName || 'Youth Academy';
  const age = player.age || 20;

  history.push({
    season: '2025/26',
    clubName: club,
    appearances: player.stats?.appearances || 18,
    goals: player.stats?.goals || 4,
    assists: player.stats?.assists || 3,
    transferFee: 'Current Squad'
  });

  if (age >= 19) {
    history.push({
      season: '2024/25',
      clubName: club,
      appearances: 28,
      goals: Math.max(1, (player.stats?.goals || 3) + 2),
      assists: Math.max(1, (player.stats?.assists || 2) + 1),
      transferFee: 'Signed for €' + (((player.value || 10000000) * 0.7) / 1000000).toFixed(1) + 'M'
    });
  }

  if (age >= 21) {
    history.push({
      season: '2023/24',
      clubName: `${player.nationality || 'Local'} Youth FC`,
      appearances: 22,
      goals: 5,
      assists: 4,
      transferFee: 'Academy Graduate'
    });
  }

  return history;
}

// AI Player Backstory & Biography Route
app.post('/api/ai/player-backstory', async (req, res) => {
  try {
    const { player } = req.body;
    if (!player) {
      res.status(400).json({ error: 'Player data required' });
      return;
    }

    const ai = getGenAI();
    if (!ai) {
      res.json({
        biography: `${player.name} grew up in ${player.nationality}, honing technical skill on local street pitches before being scouted by top academy coaches. Known for incredible agility as a ${player.position}, fans nickname them "The Maestro". Off the pitch, ${player.name} is a passionate music enthusiast and philanthropist supporting grassroots football.`,
        careerHistory: generateFallbackCareerHistory(player),
        isAiGenerated: false
      });
      return;
    }

    const prompt = `You are a legendary sports biographer and football scout. Write a fun, vivid, engaging backstory and detailed career history for this football player:
Name: ${player.name}
Position: ${player.position}
Age: ${player.age}
Nationality: ${player.nationality}
Current Club: ${player.clubName || 'Free Agent'}
Overall Rating: ${player.rating}/99
Potential: ${player.potential}/99
Traits: ${player.traits ? player.traits.join(', ') : 'Versatile, High Energy'}

Return a valid JSON object with the exact format:
{
  "biography": "A rich 2-paragraph narrative covering childhood roots, academy breakout, fan nicknames, off-pitch hobbies, and future ambitions.",
  "careerHistory": [
    {
      "season": "2025/26",
      "clubName": "${player.clubName || 'Free Agent'}",
      "appearances": ${player.stats?.appearances || 18},
      "goals": ${player.stats?.goals || 5},
      "assists": ${player.stats?.assists || 3},
      "transferFee": "Current Squad"
    },
    {
      "season": "2024/25",
      "clubName": "Former Club Name",
      "appearances": 26,
      "goals": 8,
      "assists": 5,
      "transferFee": "€18.5M Transfer"
    },
    {
      "season": "2023/24",
      "clubName": "Youth Academy FC",
      "appearances": 20,
      "goals": 4,
      "assists": 2,
      "transferFee": "Academy Promotion"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    let jsonResult: any = {};
    try {
      jsonResult = JSON.parse(response.text.trim());
    } catch (e) {
      jsonResult = {
        biography: response.text,
        careerHistory: generateFallbackCareerHistory(player)
      };
    }

    res.json({
      biography: jsonResult.biography || `${player.name} is a star ${player.position} from ${player.nationality}.`,
      careerHistory: jsonResult.careerHistory || generateFallbackCareerHistory(player),
      isAiGenerated: true
    });
  } catch (error) {
    console.error('Error generating player backstory:', error);
    res.json({
      biography: `${req.body?.player?.name || 'The player'} is a talented ${req.body?.player?.position || 'footballer'} with a bright career ahead.`,
      careerHistory: generateFallbackCareerHistory(req.body?.player),
      isAiGenerated: false
    });
  }
});

// AI Scout Analysis Route
app.post('/api/ai/scout-report', async (req, res) => {
  try {
    const { player, scoutName } = req.body;
    if (!player) {
      res.status(400).json({ error: 'Player data required' });
      return;
    }

    const ai = getGenAI();
    if (!ai) {
      // Fallback response
      res.json({
        report: `${scoutName || 'Chief Scout'}'s Analysis on ${player.name} (${player.position}, ${player.age}yo):\n\nKey Strengths: Exceptional vision and athletic composure. Shows natural tactical maturity for ${player.age} years old.\nAreas for Improvement: Needs work on discipline and physical consistency in high-intensity fixtures.\n\nVerdict: High potential candidate (${player.potential} OVR cap). Highly recommended for long-term investment.`,
        isAiGenerated: false
      });
      return;
    }

    const prompt = `You are top football scout ${scoutName || 'Chief Scout'}. Analyze this player:
Name: ${player.name}
Position: ${player.position}
Age: ${player.age}
Overall Rating: ${player.rating}
Potential Rating: ${player.potential}
Club: ${player.clubName || 'Free Agent'}
Nationality: ${player.nationality}
Market Value: €${(player.value / 1000000).toFixed(1)}M
Traits: ${player.traits ? player.traits.join(', ') : 'Versatile, Technical'}

Provide a 3-paragraph realistic, professional scout report covering:
1. Technical & Tactical Breakdown
2. Personality, Mentality & Growth trajectory
3. Scout Verdict & Contract Strategy for an Agent. Keep it concise (150-200 words).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    res.json({
      report: response.text,
      isAiGenerated: true
    });
  } catch (error) {
    console.error('Error generating scout report:', error);
    res.json({
      report: `Scout Analysis: High technical ability with strong potential to reach OVR ${req.body?.player?.potential || 85}. Shows strong work ethic and tactical adaptability.`,
      isAiGenerated: false
    });
  }
});

// AI Negotiation Dialogue Route
app.post('/api/ai/negotiate-talk', async (req, res) => {
  try {
    const { player, club, agentOffer, targetClubWage, history, agentTone, isPresidentMode, buyerClub } = req.body;
    const ai = getGenAI();

    const offeredFee = agentOffer?.transferFee || 10000000;
    const offeredWage = agentOffer?.wage || 50000;
    const playerVal = player?.value || 20000000;
    const isStarter = (player?.rating || 75) >= 80;

    const fallbackFeedback = {
      verdict: offeredFee >= playerVal * 0.95 ? 'accepted' : offeredFee >= playerVal * 0.65 ? 'counter_offer' : 'rejected_valuation',
      statusLabel: offeredFee >= playerVal * 0.95 ? 'Offer Sanctioned & Agreed' : offeredFee >= playerVal * 0.65 ? 'Counter-Proposal Formulated' : 'Rejected: Insufficient Valuation',
      responseQuote: offeredFee >= playerVal * 0.95
        ? `We have reached consensus with the board. Your proposal of €${(offeredFee / 1000000).toFixed(1)}M meets our threshold. We are ready to proceed with contract formalization.`
        : `Your offer of €${(offeredFee / 1000000).toFixed(1)}M is below our benchmark valuation of €${(playerVal / 1000000).toFixed(1)}M. We require enhanced upfront guarantees and a sell-on clause.`,
      directorName: club?.sportingDirectorProfile?.name || `${club?.name || 'Club'} Sporting Director`,
      directorRole: club?.sportingDirectorProfile?.personality || 'Chief Negotiator',
      valuationAssessment: {
        offeredFee: offeredFee,
        expectedFee: playerVal,
        gapAmount: Math.max(0, playerVal - offeredFee),
        verdict: offeredFee >= playerVal * 0.95 ? 'fair' : offeredFee >= playerVal * 0.65 ? 'below_valuation' : 'insulting',
        reasoning: `Offered €${(offeredFee / 1000000).toFixed(1)}M against our valuation benchmark of €${(playerVal / 1000000).toFixed(1)}M.`
      },
      squadImportanceAssessment: {
        importance: isStarter ? 'Key Indispensable Starter' : 'Important Squad Player',
        tacticalReasoning: isStarter ? `${player?.name || 'The player'} plays a key tactical role in our system.` : 'Provides rotational squad depth.'
      },
      financialStructureAssessment: {
        cashflowVerdict: 'Requires structured installment guarantees and liquidity balance.',
        ffpRisk: offeredFee < playerVal * 0.6 ? 'high' : 'moderate'
      },
      suggestedAlternativeStructure: {
        counterTransferFee: Math.round(playerVal * 0.95),
        suggestedInstallmentUpfrontPercent: 65,
        suggestedSellOnPercent: 15,
        suggestedAddOnsAmount: Math.round(playerVal * 0.05),
        counterWage: Math.round(Math.max(offeredWage, (player?.wage || 40000) * 1.1)),
        summaryText: `We counter with €${((playerVal * 0.95) / 1000000).toFixed(1)}M (65% upfront), 15% future sell-on clause, and €${((playerVal * 0.05) / 1000000).toFixed(1)}M in performance bonuses.`
      }
    };

    if (!ai) {
      res.json({
        chairmanReply: fallbackFeedback.responseQuote,
        acceptanceLikelihood: offeredFee > playerVal * 0.9 ? 80 : 45,
        counterOffer: {
          transferFee: fallbackFeedback.suggestedAlternativeStructure.counterTransferFee,
          wage: fallbackFeedback.suggestedAlternativeStructure.counterWage
        },
        feedback: fallbackFeedback,
        isAiGenerated: false
      });
      return;
    }

    const prompt = `You are the Sporting Director of ${club?.name || 'the Football Club'}. You are negotiating a transfer for player ${player.name} (${player.position}, ${player.age}yo, OVR ${player.rating}, Value €${(playerVal/1000000).toFixed(1)}M).
Offered Terms:
- Transfer Fee Offer: €${(offeredFee/1000000).toFixed(1)}M
- Proposed Player Weekly Wage: €${offeredWage.toLocaleString()}
- Tone: ${agentTone || 'Professional'}
- Buyer Context: ${isPresidentMode ? `Club President of ${buyerClub?.name || 'Buyer Club'}` : 'Player Agent'}

Respond with a JSON object matching this schema:
{
  "chairmanReply": "In-character 2-sentence response from the Sporting Director.",
  "verdict": "accepted" | "counter_offer" | "rejected_valuation" | "rejected_indispensable",
  "statusLabel": "Short status string (e.g. Counter-Proposal Formulated)",
  "valuationVerdict": "fair" | "below_valuation" | "insulting",
  "valuationReasoning": "1 sentence explanation of the valuation difference.",
  "tacticalReasoning": "1 sentence on player importance to squad.",
  "suggestedAlternativeStructure": {
    "counterTransferFee": number,
    "suggestedInstallmentUpfrontPercent": number,
    "suggestedSellOnPercent": number,
    "suggestedAddOnsAmount": number,
    "counterWage": number,
    "summaryText": "1 sentence summarizing the alternative deal structure."
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    let parsed: any = {};
    try {
      parsed = JSON.parse(response.text.trim());
    } catch {
      parsed = {};
    }

    const feedback = {
      ...fallbackFeedback,
      verdict: parsed.verdict || fallbackFeedback.verdict,
      statusLabel: parsed.statusLabel || fallbackFeedback.statusLabel,
      responseQuote: parsed.chairmanReply || fallbackFeedback.responseQuote,
      valuationAssessment: {
        ...fallbackFeedback.valuationAssessment,
        verdict: parsed.valuationVerdict || fallbackFeedback.valuationAssessment.verdict,
        reasoning: parsed.valuationReasoning || fallbackFeedback.valuationAssessment.reasoning
      },
      squadImportanceAssessment: {
        ...fallbackFeedback.squadImportanceAssessment,
        tacticalReasoning: parsed.tacticalReasoning || fallbackFeedback.squadImportanceAssessment.tacticalReasoning
      },
      suggestedAlternativeStructure: parsed.suggestedAlternativeStructure || fallbackFeedback.suggestedAlternativeStructure
    };

    res.json({
      chairmanReply: feedback.responseQuote,
      feedback: feedback,
      counterOffer: {
        transferFee: feedback.suggestedAlternativeStructure?.counterTransferFee || Math.round(offeredFee * 0.95),
        wage: feedback.suggestedAlternativeStructure?.counterWage || Math.round(offeredWage * 0.95)
      },
      isAiGenerated: true
    });
  } catch (error) {
    console.error('Error in negotiation talk:', error);
    res.json({
      chairmanReply: "The board has received your terms. We are interested, but we must ensure the deal fits our financial fair play guidelines.",
      isAiGenerated: false
    });
  }
});

// AI Dedicated Player Bio Route
app.post('/api/ai/player-bio', async (req, res) => {
  try {
    const { player } = req.body;
    if (!player) {
      res.status(400).json({ error: 'Player data required' });
      return;
    }

    const ai = getGenAI();
    if (!ai) {
      res.json({
        bio: `${player.name} was born in ${player.nationality}, overcoming early youth system hardships and financial strain through relentless grit on the pitch. Known as a dynamic ${player.position} (${player.rating} OVR) with explosive flair and tactical determination, their signature playstyle combines relentless drive with silky technical control.`,
        isAiGenerated: false
      });
      return;
    }

    const prompt = `You are an elite football biographer and narrative journalist.
Write a rich, captivating 2-paragraph narrative biography for this football player:
- Name: ${player.name}
- Position: ${player.position}
- Age: ${player.age}
- Nationality: ${player.nationality}
- Current Club: ${player.clubName || 'Free Agent'}
- Overall Rating: ${player.rating}/99
- Potential: ${player.potential}/99
- Traits: ${player.traits ? player.traits.join(', ') : 'Creative, Resilient, High Work-Rate'}

You MUST specifically include:
1. Their hometown and childhood background
2. Early career struggles and how they overcame adversity to break through
3. Their signature playstyle, pitch demeanor, and tactical strengths

Keep the tone authentic, inspiring, and immersive.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });

    res.json({
      bio: response.text.trim(),
      isAiGenerated: true
    });
  } catch (error) {
    console.error('Error generating player bio:', error);
    res.json({
      bio: `${req.body?.player?.name || 'This athlete'} developed through grassroots football in ${req.body?.player?.nationality || 'their homeland'}, mastering the ${req.body?.player?.position || 'footballer'} role with exceptional tactical composure and relentless athletic determination.`,
      isAiGenerated: false
    });
  }
});

// AI Press Conference Route
app.post('/api/ai/press-conference', async (req, res) => {
  const { topic, agencyName, playerName, clubName, fee } = req.body || {};
  try {
    const ai = getGenAI();

    if (!ai) {
      res.json({
        headline: `BIG MOVE: ${playerName || 'Player'} completes transfer to ${clubName || 'Club'}!`,
        article: `Journalists at Sky Sports report that ${agencyName || 'Agency'} negotiated a record deal worth €${((fee || 0)/1000000).toFixed(1)}M. The football world is buzzing over this super-agent masterclass.`,
        isAiGenerated: false
      });
      return;
    }

    const prompt = `You are a top football journalist covering breaking news.
Topic: ${topic}
Agency Name: ${agencyName}
Player: ${playerName}
Club involved: ${clubName}
Transfer Fee: €${((fee || 0)/1000000).toFixed(1)}M

Write a short, thrilling football news article (2 paragraphs) with a punchy headline about this agency move.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    res.json({
      article: response.text,
      isAiGenerated: true
    });
  } catch (error) {
    res.json({
      article: `Breaking News: ${playerName || 'Player'} settles deal with ${clubName || 'Club'} brokered by ${agencyName || 'Agency'}!`,
      isAiGenerated: false
    });
  }
});

// Start Express + Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
