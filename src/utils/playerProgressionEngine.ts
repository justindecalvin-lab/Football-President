import { Player, Club, AgencyState, NewsItem } from '../types';
import { calculateValuationForRating } from './proceduralGenerator';

export interface ProgressionResult {
  updatedPlayers: Player[];
  newsItems: NewsItem[];
  toastMessages: string[];
}

/**
 * Evaluates weekly dynamic player progression, development, and realistic ability degradation.
 * 
 * Dynamic Degradation Triggers:
 * 1. Consistent Bad Form: Form < 40 or avgRating < 6.2 for 3+ consecutive weeks causes -1 rating drop.
 * 2. Severe Discontent & Morale: Morale < 25 or strike for 4+ weeks causes fitness/sharpness degradation (-1 rating).
 * 3. Homesickness: International player suffering homesick unrest drops in form and degrades -1 rating if unaddressed.
 * 4. Stagnation / Lack of Minutes / Unregistered: 6+ consecutive weeks benched or unregistered drops rating and erodes potential ceiling.
 * 5. Veteran Regression: Age 32+ players suffer natural physical/stat decline.
 * 6. Major Injuries: 8+ week musculoskeletal injuries permanently clip -1 from rating/potential.
 * 
 * Dynamic Growth Triggers:
 * 1. Consistent In-Form Matchdays: Form >= 85, Morale >= 80, Age <= 27, regular starter gains +1 rating (up to potential).
 * 2. Youth Potential Realization: Based on potentialRealizationRate (0.70 to 1.10).
 */
export function processWeeklyPlayerProgressionAndDegradation(
  players: Player[],
  clubs: Club[],
  week: number,
  season: number,
  agency?: AgencyState
): ProgressionResult {
  const updatedPlayers = [...players];
  const newsItems: NewsItem[] = [];
  const toastMessages: string[] = [];

  // Index clubs for O(1) instant lookup to eliminate 5,000,000 linear search iterations
  const clubById = new Map<string, Club>();
  for (let i = 0; i < clubs.length; i++) {
    clubById.set(clubs[i].id, clubs[i]);
  }

  updatedPlayers.forEach(player => {
    // Free agents or retired skip match-based form logic
    if (!player.clubId || player.clubId === 'free_agent' || player.clubId === 'c_free') {
      return;
    }

    const club = clubById.get(player.clubId);
    let ratingChanged = false;
    let originalRating = player.rating;
    let degradationReason = '';
    let progressionReason = '';

    // Initialize tracking fields if not present
    if (player.consecutiveBadFormWeeks === undefined) player.consecutiveBadFormWeeks = 0;
    if (player.consecutiveGoodFormWeeks === undefined) player.consecutiveGoodFormWeeks = 0;
    if (player.consecutiveUnregisteredWeeks === undefined) player.consecutiveUnregisteredWeeks = 0;
    if (player.homesickWeeks === undefined) player.homesickWeeks = 0;
    if (!player.potentialCeiling) player.potentialCeiling = player.potential || player.rating + 5;
    if (!player.potentialRealizationRate) {
      // 0.75 (struggling to realize) to 1.05 (rapid bloomer)
      player.potentialRealizationRate = Number((0.75 + Math.random() * 0.30).toFixed(2));
    }

    // -------------------------------------------------------------
    // 0. PHYSICAL CONDITION RESTORATION & FOREIGN ADAPTATION
    // -------------------------------------------------------------
    const physioUpgradeBonus = (agency?.headquartersUpgrades?.physioRecoveryClinic || 0) * 5 + ((agency?.staff?.physioLevel || 0) * 3);
    const weeklyFitnessRestoration = player.isMyClient ? (20 + physioUpgradeBonus) : 20;
    player.condition = Math.min(100, (player.condition ?? 95) + weeklyFitnessRestoration);
    player.matchFitness = Math.min(100, (player.matchFitness ?? 95) + 15);

    // Initialize injury resistance if not set
    if (player.injuryResistance === undefined) {
      player.injuryResistance = player.traits.includes('Injury Prone') ? 45 : 85;
    }

    // Retraining position progression
    if (player.retrainingProgress && player.retrainingProgress.weeksRemaining > 0) {
      player.retrainingProgress.weeksRemaining -= 1;
      if (player.retrainingProgress.weeksRemaining <= 0) {
        if (!player.secondaryPositions) player.secondaryPositions = [];
        if (!player.secondaryPositions.includes(player.retrainingProgress.targetPosition)) {
          player.secondaryPositions.push(player.retrainingProgress.targetPosition);
        }
        if (player.isMyClient) {
          toastMessages.push(`🎯 Retraining Complete: ${player.name} can now play as a natural ${player.retrainingProgress.targetPosition}!`);
          newsItems.push({
            id: `news_retrain_${Date.now()}_${player.id}`,
            week,
            season,
            headline: `🎯 POSITIONAL MASTERY: ${player.name} Adapts to ${player.retrainingProgress.targetPosition}`,
            content: `After rigorous tactical drills, ${player.name} has successfully integrated the ${player.retrainingProgress.targetPosition} role into his positional profile.`,
            category: 'player_development',
            urgency: 'normal',
            read: false,
            targetRole: 'agent',
            actionTab: 'my_players',
            relatedPlayerId: player.id
          });
        }
        delete player.retrainingProgress;
      }
    }

    // International Break Callups & Tournaments (Weeks 7, 15, 23, 31)
    if ([7, 15, 23, 31].includes(week) && player.rating >= 76) {
      if (!player.internationalStatus) {
        player.internationalStatus = {
          isInternational: true,
          nationalTeam: player.nationality || 'National Team',
          caps: Math.max(1, Math.floor((player.rating - 70) * 2.5)),
          goals: player.position === 'ST' || player.position === 'LW' || player.position === 'RW' ? Math.floor((player.rating - 70) * 1.2) : 1,
          isCalledUp: true
        };
      }
      player.internationalStatus.isCalledUp = true;
      player.internationalStatus.caps += 1;
      player.condition = Math.max(40, (player.condition || 90) - 12); // travel fatigue
      if (player.position === 'ST' || Math.random() < 0.35) {
        player.internationalStatus.goals += 1;
      }
      if (player.isMyClient && week === 15) {
        newsItems.push({
          id: `news_intl_${Date.now()}_${player.id}`,
          week,
          season,
          headline: `🌍 NATIONAL CALL-UP: ${player.name} Selected for ${player.nationality} International Duty`,
          content: `${player.name} represented ${player.nationality} on the international stage (Total Caps: ${player.internationalStatus.caps}, International Goals: ${player.internationalStatus.goals}).`,
          category: 'match',
          urgency: 'normal',
          read: false,
          targetRole: 'agent',
          relatedPlayerId: player.id
        });
      }
    }

    // Milestone Check (50/100 Caps, 50/100 Goals)
    if (player.isMyClient) {
      if (!player.milestones) player.milestones = {};
      if (player.internationalStatus && player.internationalStatus.caps >= 50 && !player.milestones.caps50) {
        player.milestones.caps50 = true;
        toastMessages.push(`🏅 Career Milestone: ${player.name} reached 50 International Caps!`);
        newsItems.push({
          id: `news_ms_caps50_${Date.now()}_${player.id}`,
          week,
          season,
          headline: `🏅 50 CAPS MILESTONE: ${player.name} Joins Elite International Honor Roll`,
          content: `Representing ${player.nationality}, ${player.name} has officially earned his 50th international cap. Merchandising royalties spiked!`,
          category: 'award',
          urgency: 'breaking',
          read: false
        });
      }
      if (player.stats.goals >= 50 && !player.milestones.goals100) {
        player.milestones.goals100 = true;
        toastMessages.push(`🔥 Goalscoring Milestone: ${player.name} reached 50 competitive career goals!`);
      }
    }

    // Decrement foreign league cultural adaptation
    if (player.adaptationWeeksRemaining && player.adaptationWeeksRemaining > 0) {
      player.adaptationWeeksRemaining -= 1;
      if (player.adaptationWeeksRemaining === 0 && player.isMyClient) {
        newsItems.push({
          id: `news_adapt_done_${Date.now()}_${player.id}`,
          week,
          season,
          headline: `🌍 ADAPTATION COMPLETE: ${player.name} Has Fully Settled at ${player.clubName}`,
          content: `${player.name} has overcome language and cultural barriers in ${club?.league || 'his new league'}. Tactical synergy and dressing room chemistry are at peak levels.`,
          category: 'player_development',
          urgency: 'normal',
          read: false,
          targetRole: 'agent',
          actionTab: 'my_players',
          relatedPlayerId: player.id
        });
      }
    }

    // Injury Rehabilitation & Medical Recovery Countdown
    if (player.injury?.isInjured) {
      const physioBonus = (agency?.headquartersUpgrades?.physioRecoveryClinic || 0) >= 2 || ((agency?.staff?.physioLevel || 0) >= 2) ? 2 : 1;
      const prevWeeks = player.injury.weeks || 1;
      const newWeeks = Math.max(0, prevWeeks - physioBonus);
      player.injury.weeks = newWeeks;

      if (newWeeks <= 0) {
        player.injury.isInjured = false;
        player.injury.weeks = 0;
        player.condition = Math.max(75, player.condition || 80);

        if (player.isMyClient) {
          toastMessages.push(`🏥 Medical Clearance: ${player.name} has completed rehab and returned to full squad training!`);
          newsItems.push({
            id: `news_inj_cleared_${Date.now()}_${player.id}`,
            week,
            season,
            headline: `🏥 INJURY RECOVERY: ${player.name} Medically Cleared for Match Selection`,
            content: `Following physical therapy and fitness tests, ${player.name} (${player.position}) is back to full fitness at ${player.clubName}.`,
            category: 'player_development',
            urgency: 'normal',
            read: false,
            targetRole: 'agent',
            actionTab: 'my_players',
            relatedPlayerId: player.id
          });
        }
      }
    }

    // Suspension tick down (protect newly issued suspensions from immediate wipe)
    if (player.justSuspendedThisWeek) {
      // Suspension was handed out in this matchweek; player sits out upcoming matches
      player.justSuspendedThisWeek = false;
    } else if (player.isSuspended && player.suspensionMatchesRemaining && player.suspensionMatchesRemaining > 0) {
      player.suspensionMatchesRemaining -= 1;
      if (player.suspensionMatchesRemaining <= 0) {
        player.isSuspended = false;
        player.suspensionMatchesRemaining = 0;
        if (player.isMyClient) {
          toastMessages.push(`⚖️ Suspension Served: ${player.name} has concluded their disciplinary ban and is eligible for selection.`);
        }
      }
    }

    // -------------------------------------------------------------
    // 1. TRACK CONSECUTIVE FORM STREAKS
    // -------------------------------------------------------------
    if (player.form < 42 || (player.stats.appearances >= 3 && player.stats.avgRating < 6.3)) {
      player.consecutiveBadFormWeeks += 1;
      player.consecutiveGoodFormWeeks = 0;
    } else if (player.form >= 84 && (player.stats.appearances < 3 || player.stats.avgRating >= 7.3)) {
      player.consecutiveGoodFormWeeks += 1;
      player.consecutiveBadFormWeeks = 0;
    } else {
      player.consecutiveBadFormWeeks = Math.max(0, player.consecutiveBadFormWeeks - 1);
      player.consecutiveGoodFormWeeks = Math.max(0, player.consecutiveGoodFormWeeks - 1);
    }

    // -------------------------------------------------------------
    // 2. HOMESICKNESS EVALUATION
    // -------------------------------------------------------------
    const isForeigner = club && player.nationality && !club.name.toLowerCase().includes(player.nationality.toLowerCase());
    
    // Chance of homesickness triggering for young foreign players or unhappy players
    if (isForeigner && !player.unrest && player.age <= 23 && player.morale < 60 && Math.random() < 0.03) {
      player.unrest = {
        status: 'discontent',
        reason: 'homesick',
        reasonLabel: 'Homesickness & Cultural Isolation',
        discontentLevel: 65,
        description: `${player.name} is struggling with homesickness, isolation from family in ${player.nationality}, and language adaptation at ${player.clubName}.`,
        discountPercent: 25
      };

      if (player.isMyClient) {
        newsItems.push({
          id: `news_homesick_start_${Date.now()}_${player.id}`,
          week,
          season,
          headline: `💔 HOMESICKNESS: ${player.name} Struggling with Isolation in ${club?.league || 'Foreign League'}`,
          content: `Your client ${player.name} is homesick and struggling to adjust away from ${player.nationality}. Morale and training sharpness are suffering. Intervene via My Clients or arrange compassionate leave.`,
          category: 'agency',
          urgency: 'hot',
          read: false,
          targetRole: 'agent',
          actionTab: 'my_players',
          relatedPlayerId: player.id
        });
      }
    }

    if (player.unrest?.reason === 'homesick') {
      player.homesickWeeks += 1;
      player.form = Math.max(25, player.form - 2);
      player.morale = Math.max(15, player.morale - 3);

      // If homesickness persists untreated for 4+ weeks, trigger -1 rating degradation
      if (player.homesickWeeks >= 4 && player.rating > 52 && Math.random() < 0.35) {
        player.rating -= 1;
        ratingChanged = true;
        degradationReason = `Homesickness & Psychological Strain (-1 OVR to ${player.rating})`;
        player.homesickWeeks = 0; // reset counter after drop
      }
    } else {
      player.homesickWeeks = 0;
    }

    // -------------------------------------------------------------
    // 3. CONSISTENT BAD FORM DEGRADATION
    // -------------------------------------------------------------
    if (player.consecutiveBadFormWeeks >= 4 && player.rating > 52) {
      // 40% chance per week after 4 weeks of continuous slump
      if (Math.random() < 0.40) {
        player.rating -= 1;
        ratingChanged = true;
        degradationReason = `Prolonged Slump & Crisis of Confidence (-1 OVR to ${player.rating})`;
        player.consecutiveBadFormWeeks = 1; // Reset to avoid dropping every single week
      }
    }

    // -------------------------------------------------------------
    // 4. LOW MORALE & DRESSING ROOM STRIKE DEGRADATION
    // -------------------------------------------------------------
    if (player.morale < 25 && player.rating > 52) {
      if (Math.random() < 0.25) {
        player.rating -= 1;
        ratingChanged = true;
        degradationReason = `Severe Discontent & Loss of Training Intensity (-1 OVR to ${player.rating})`;
      }
    }

    // -------------------------------------------------------------
    // 5. LACK OF GAME TIME & UNREGISTERED STAGNATION
    // -------------------------------------------------------------
    if (player.isRegistered === false) {
      player.consecutiveUnregisteredWeeks = (player.consecutiveUnregisteredWeeks || 0) + 1;
      if (player.consecutiveUnregisteredWeeks >= 6 && player.rating > 52) {
        if (Math.random() < 0.35) {
          player.rating -= 1;
          // Also lower potential ceiling (unfulfilled youth development)
          if (player.potential > player.rating) {
            player.potential = Math.max(player.rating, player.potential - 1);
          }
          ratingChanged = true;
          degradationReason = `Inactivity & Registration Exile (-1 OVR to ${player.rating}, POT eroded)`;
          player.consecutiveUnregisteredWeeks = 2;
        }
      }
    } else {
      player.consecutiveUnregisteredWeeks = 0;
    }

    // Stagnation from being benched
    if ((player.consecutiveWeeksBenched || 0) >= 7 && player.rating > 52 && player.age <= 28) {
      if (Math.random() < 0.25) {
        player.rating -= 1;
        if (player.potential > player.rating) {
          player.potential = Math.max(player.rating, player.potential - 1);
        }
        ratingChanged = true;
        degradationReason = `Bench Stagnation & Match Rustiness (-1 OVR to ${player.rating})`;
        player.consecutiveWeeksBenched = 3;
      }
    }

    // -------------------------------------------------------------
    // 6. VETERAN AGE REGRESSION (Age 32+)
    // -------------------------------------------------------------
    if (player.age >= 32 && player.rating > 55) {
      const ageRisk = (player.age - 31) * 0.04; // 4% at 32, 16% at 35, 28% at 38
      if (Math.random() < ageRisk && week % 10 === 0) {
        player.rating -= 1;
        ratingChanged = true;
        degradationReason = `Natural Physical Decline & Age Regression (-1 OVR to ${player.rating})`;
      }
    }

    // -------------------------------------------------------------
    // 7. SEVERE MAJOR INJURY ATTRIBUTE EROSION
    // -------------------------------------------------------------
    if (player.injury?.isInjured && player.injury.weeks >= 8 && player.rating > 55) {
      if (Math.random() < 0.15 && !player.traits.includes('Injury Prone')) {
        player.traits.push('Injury Prone');
        player.rating = Math.max(50, player.rating - 1);
        if (player.potential > player.rating) player.potential -= 2;
        ratingChanged = true;
        degradationReason = `Severe Musculoskeletal Injury Complication (-1 OVR, -2 POT)`;
      }
    }

    // -------------------------------------------------------------
    // 8. DYNAMIC GROWTH & POTENTIAL REALIZATION VOLATILITY
    // -------------------------------------------------------------
    const currentCeiling = player.actualPotentialLimit || player.potential || 85;
    
    // Check if boom_or_bust player turns into a 'bust'
    if (player.potentialVolatility === 'boom_or_bust' && player.realizationStatus !== 'bust' && player.age <= 23) {
      if (player.consecutiveBadFormWeeks >= 3 || player.morale < 35 || (player.consecutiveWeeksBenched || 0) >= 5) {
        if (Math.random() < 0.30) {
          player.realizationStatus = 'bust';
          const oldPot = player.potential;
          player.potential = Math.min(player.potential, Math.max(player.rating, (player.actualPotentialLimit || player.rating + 2)));
          if (player.isMyClient) {
            newsItems.push({
              id: `news_bust_${Date.now()}_${player.id}`,
              week,
              season,
              headline: `⚠️ POTENTIAL VOLATILITY: ${player.name} Hit by Development Wall!`,
              content: `Scouts report that due to prolonged slumps and lack of regular playing rhythm, ${player.name}'s projected ceiling has stalled (Potential adjusted from ${oldPot} to ${player.potential}).`,
              category: 'player_development',
              urgency: 'hot',
              read: false,
              targetRole: 'agent',
              actionTab: 'my_players',
              relatedPlayerId: player.id
            });
          }
        }
      }
    }

    if (!ratingChanged && player.rating < currentCeiling) {
      const isYouthOrPrime = player.age <= 26;
      const isPerformingWell = player.form >= 80 && player.morale >= 70;
      const hasRegularMinutes = (player.stats.appearances || 0) >= Math.floor(week * 0.35);

      // Archetype multipliers
      let archetypeMultiplier = 1.0;
      if (player.potentialVolatility === 'early_peaker') {
        archetypeMultiplier = player.age <= 21 ? 1.4 : 0.2; // Ramps early, stalls after 21
      } else if (player.potentialVolatility === 'late_bloomer') {
        archetypeMultiplier = player.age <= 21 ? 0.7 : player.age <= 26 ? 1.6 : 1.0; // Surges in mid-20s
      } else if (player.potentialVolatility === 'boom_or_bust') {
        archetypeMultiplier = isPerformingWell ? 1.5 : 0.4;
      } else if (player.potentialVolatility === 'volatile') {
        archetypeMultiplier = (player.form / 75);
      }

      // Mentorship bonus
      if (player.mentorship?.mentorPlayerId) {
        archetypeMultiplier *= 1.35;
        if (player.actualPotentialLimit && player.actualPotentialLimit < (player.potentialCeiling || player.potential)) {
          if (Math.random() < 0.10) {
            player.actualPotentialLimit += 1;
            player.mentorship.bonusPotentialGained = (player.mentorship.bonusPotentialGained || 0) + 1;
          }
        }
      }

      if (isYouthOrPrime && isPerformingWell && (hasRegularMinutes || player.consecutiveGoodFormWeeks >= 3)) {
        // Growth probability scaled by potentialRealizationRate & realizationChance
        const baseRealization = player.realizationChance ?? 0.75;
        const growthChance = 0.16 * (player.potentialRealizationRate || 1.0) * archetypeMultiplier * baseRealization;

        if (Math.random() < growthChance) {
          player.rating += 1;
          ratingChanged = true;
          progressionReason = `Breakout Form & Tactical Growth (+1 OVR to ${player.rating} / ${player.potential} POT)`;
          player.consecutiveGoodFormWeeks = 0;
          if (player.potentialVolatility === 'boom_or_bust' && player.realizationStatus !== 'bust') {
            player.realizationStatus = 'breakout';
          }
        }
      }
    }

    // -------------------------------------------------------------
    // 9. UPDATE VALUE & LOG EVENTS IF RATING CHANGED
    // -------------------------------------------------------------
    if (ratingChanged) {
      // Re-calculate market valuation
      player.value = calculateValuationForRating(player.rating, player.age, player.potential);

      if (degradationReason) {
        if (!player.degradationEvents) player.degradationEvents = [];
        player.degradationEvents.push({
          week,
          season,
          reason: degradationReason,
          ratingDelta: player.rating - originalRating
        });

        // Announce for user clients or superstars
        if (player.isMyClient) {
          toastMessages.push(`⚠️ Client Ability Degradation: ${player.name} dropped from ${originalRating} to ${player.rating} OVR (${degradationReason}).`);
          newsItems.push({
            id: `news_deg_${Date.now()}_${player.id}`,
            week,
            season,
            headline: `📉 ABILITY REGRESSION: Client ${player.name} Drops to ${player.rating} OVR!`,
            content: `Following ${degradationReason.toLowerCase()}, your client ${player.name}'s overall rating has dropped from ${originalRating} to ${player.rating}. Intervene via tactical coaching, mental health support, or transfer.`,
            category: 'agency',
            urgency: 'hot',
            read: false,
            targetRole: 'agent',
            actionTab: 'my_players',
            relatedPlayerId: player.id
          });
        } else if (originalRating >= 88) {
          newsItems.push({
            id: `news_superstar_slump_${Date.now()}_${player.id}`,
            week,
            season,
            headline: `📉 SUPERSTAR DIP: ${player.name} (${player.clubName}) Suffers Form Slump & Rating Drop`,
            content: `European analysts report that ${player.name} has suffered a noticeable drop in match sharpness (${degradationReason}), adjusting his world-class rating to ${player.rating} OVR.`,
            category: 'match',
            urgency: 'normal',
            read: false
          });
        }
      } else if (progressionReason) {
        if (!player.progressionEvents) player.progressionEvents = [];
        player.progressionEvents.push({
          week,
          season,
          reason: progressionReason,
          ratingDelta: player.rating - originalRating
        });

        if (player.isMyClient) {
          toastMessages.push(`⭐ Client Development Boost: ${player.name} improved to ${player.rating} OVR (+1)!`);
          newsItems.push({
            id: `news_prog_${Date.now()}_${player.id}`,
            week,
            season,
            headline: `📈 BREAKOUT STAR: Client ${player.name} Upgrades to ${player.rating} OVR!`,
            content: `Hard work on the pitch has paid off for ${player.name}! Driven by ${progressionReason.toLowerCase()}, his rating increased to ${player.rating} (Potential: ${player.potential}). Market value rose to €${((player.value || 0)/1000000).toFixed(1)}M.`,
            category: 'agency',
            urgency: 'normal',
            read: false,
            targetRole: 'agent',
            actionTab: 'my_players',
            relatedPlayerId: player.id
          });
        }
      }
    }
  });

  return { updatedPlayers, newsItems, toastMessages };
}
