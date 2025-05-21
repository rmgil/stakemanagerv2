import { TournamentResult, TournamentCategory, PlayerLevel } from '@shared/schema';
import { convertToUSD } from './currencyConverter';
import { calculateSingleTournamentDistribution } from '../../client/src/lib/calculationUtils';

/**
 * Parse tournament summary text content
 * @param content Tournament summary file content
 * @param filename Original filename
 */
export async function parseTournamentSummary(content: string, filename: string): Promise<TournamentResult | null> {
  try {
    // Extract tournament name
    const nameMatch = content.match(/Tournament: (.+)/);
    if (!nameMatch) return null;
    
    const name = nameMatch[1].trim();
    
    // Extract tournament ID if available
    const idMatch = content.match(/Tournament #(\d+)/);
    const tournamentId = idMatch ? idMatch[1] : undefined;
    
    // Extract buy-in
    const buyInMatch = content.match(/Buy-In: ([A-Z]+|\$)?[\s]?([0-9,.]+)/);
    if (!buyInMatch) return null;
    
    // Determine currency
    let currencyCode = "USD";
    let buyInValue = 0;
    let buyInOriginal = "";
    let conversionRate = 1;
    
    if (buyInMatch[1] && buyInMatch[1] !== "$") {
      currencyCode = buyInMatch[1];
      buyInOriginal = `${currencyCode}${buyInMatch[2]}`;
      
      // Convert to USD
      const buyInAmount = parseFloat(buyInMatch[2].replace(/,/g, ''));
      const { amount, rate } = await convertToUSD(buyInAmount, currencyCode);
      buyInValue = amount;
      conversionRate = rate;
    } else {
      buyInValue = parseFloat(buyInMatch[2].replace(/,/g, ''));
    }
    
    // Extract result
    const resultMatch = content.match(/(?:Won|Profit|Finished): ([A-Z]+|\$)?[\s]?([0-9,.]+)/);
    const resultLossMatch = content.match(/(?:Lost): ([A-Z]+|\$)?[\s]?([0-9,.]+)/);
    
    let result = 0;
    
    if (resultMatch) {
      result = parseFloat(resultMatch[2].replace(/,/g, ''));
      if (currencyCode !== "USD") {
        result = result * conversionRate;
      }
    } else if (resultLossMatch) {
      result = -parseFloat(resultLossMatch[2].replace(/,/g, ''));
      if (currencyCode !== "USD") {
        result = result * conversionRate;
      }
    }
    
    // Determine tournament category
    let category;
    
    if (name.includes("[Day 1]") || name.toLowerCase().includes("phase day 1")) {
      category = TournamentCategory.PHASE_DAY_1;
    } else if (name.includes("[Day 2]") || name.includes("[Day 3]") || 
               name.toLowerCase().includes("phase day 2") || name.toLowerCase().includes("phase day 3")) {
      category = TournamentCategory.PHASE_DAY_2_PLUS;
    } else if (currencyCode !== "USD") {
      category = TournamentCategory.OTHER_CURRENCY;
    } else {
      category = TournamentCategory.OTHER_TOURNAMENTS;
    }
    
    // Default values - will be calculated later with player level
    return {
      name,
      tournamentId,
      category,
      buyIn: buyInValue,
      buyInOriginal: buyInOriginal || undefined,
      result,
      normalDeal: 0,
      automaticSale: 0,
      currencyCode,
      conversionRate,
      originalFilename: filename
    };
  } catch (error) {
    console.error("Error parsing tournament summary:", error);
    return null;
  }
}

/**
 * Calculate financial distributions for tournaments
 * @param tournaments Tournament results
 * @param playerLevel Player level data
 */
export function calculateDistributions(tournaments: TournamentResult[], playerLevel: PlayerLevel): TournamentResult[] {
  return tournaments.map(tournament => {
    const { normalDeal, automaticSale } = calculateSingleTournamentDistribution(tournament, playerLevel);
    
    return {
      ...tournament,
      normalDeal,
      automaticSale
    };
  });
}
