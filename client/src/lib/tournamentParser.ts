import { TournamentResult, TournamentCategory, TournamentCategoryType } from "@shared/schema";

/**
 * Parse a tournament summary file content
 * @param fileContent Content of the tournament summary file
 * @param filename Original filename
 * @returns Parsed tournament data
 */
export function parseTournamentSummary(fileContent: string, filename: string): TournamentResult | null {
  try {
    // Extract tournament name and ID
    // Format: Tournament #123456789, Name of Tournament, Hold'em No Limit
    const headerMatch = fileContent.match(/Tournament #(\d+), (.+?), Hold'em/);
    if (!headerMatch) return null;
    
    const tournamentId = headerMatch[1];
    const name = headerMatch[2].trim();
    
    // Extract buy-in
    // Format common in GGPoker: Buy-in: $XX.X+$XX.X
    const buyInMatch = fileContent.match(/Buy-in: ([¥$€])?([\d.]+)\+([¥$€])?([\d.]+)/);
    if (!buyInMatch) return null;
    
    // Determine currency and buy-in values
    let currencyCode = "USD";
    let buyInValue = 0;
    let buyInOriginal = "";
    let conversionRate = 1;
    
    // Get the currency symbol (if any) and the buy-in amount
    const currencySymbol = buyInMatch[1] || buyInMatch[3] || "$";
    if (currencySymbol && currencySymbol !== "$") {
      currencyCode = currencySymbol;
    }
    
    // Calculate total buy-in (main + fee)
    const mainBuyIn = parseFloat(buyInMatch[2]);
    const fee = parseFloat(buyInMatch[4]);
    buyInValue = mainBuyIn + fee;
    
    if (currencyCode !== "USD") {
      buyInOriginal = `${currencyCode}${buyInValue}`;
    }
    
    // Extract re-entries information
    const reEntriesMatch = fileContent.match(/You made (\d+) re-entr[yi]es/);
    const reEntries = reEntriesMatch ? parseInt(reEntriesMatch[1], 10) : 0;
    const totalEntries = reEntries + 1;
    const totalBuyIn = buyInValue * totalEntries;
    
    // Extract result from GGPoker tournaments format
    // Pattern: You received a total of $XX.XX or similar
    const receivedMatch = fileContent.match(/received a total of ([¥$€])([\d,.]+)/);
    // For Day 1 tournaments, detect if player advanced to Day 2
    const advancedToDayMatch = fileContent.match(/advanced to Day2/i);
    
    let result = 0;
    
    if (receivedMatch) {
      // If winnings received
      const amountStr = receivedMatch[2].replace(/,/g, '');
      result = parseFloat(amountStr);
    } else if (advancedToDayMatch) {
      // Day 1 tournament with advancement - full buy-in is the loss
      result = -buyInValue;
    } else {
      // Default case, no explicit result mentioned
      result = -buyInValue;
    }
    
    // Determine tournament category
    let category: TournamentCategoryType;
    
    // Check if it's a phase tournament (Day 1, Day 2+)
    if (name.includes("[Day 1]") || name.toLowerCase().includes("phase") && name.includes("Day 1")) {
      category = TournamentCategory.PHASE_DAY_1;
    } else if (name.includes("[Day 2]") || name.includes("[Day 3]") || 
              (name.toLowerCase().includes("phase") && (name.includes("Day 2") || name.includes("Day 3")))) {
      category = TournamentCategory.PHASE_DAY_2_PLUS;
      // Phase Day 2+ has logical buy-in of 0
      if (result > 0) {
        // Keep the result as positive
      } else {
        // Handle case where player didn't win but was in Day 2+
        // In this case, result is still 0 (no buy-in) + any winnings
      }
    } else if (currencyCode !== "USD") {
      category = TournamentCategory.OTHER_CURRENCY;
    } else {
      category = TournamentCategory.OTHER_TOURNAMENTS;
    }
    
    // Default values - will be calculated later with player level
    const normalDeal = 0;
    const automaticSale = 0;
    
    return {
      name,
      tournamentId,
      category,
      buyIn: buyInValue,
      buyInOriginal: buyInOriginal || undefined,
      reEntries,
      totalEntries,
      totalBuyIn,
      result,
      normalDeal,
      automaticSale,
      currencyCode,
      conversionRate,
      originalFilename: filename
    };
  } catch (error) {
    console.error("Error parsing tournament summary:", error);
    return null;
  }
}
