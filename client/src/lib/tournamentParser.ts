import { TournamentResult, TournamentCategory, TournamentCategoryType } from "@shared/schema";

/**
 * Parse a tournament summary file content
 * @param fileContent Content of the tournament summary file
 * @param filename Original filename
 * @returns Parsed tournament data
 */
export function parseTournamentSummary(fileContent: string, filename: string): TournamentResult | null {
  try {
    // Extract tournament name
    const nameMatch = fileContent.match(/Tournament: (.+)/);
    if (!nameMatch) return null;
    
    const name = nameMatch[1].trim();
    
    // Extract tournament ID if available
    const idMatch = fileContent.match(/Tournament #(\d+)/);
    const tournamentId = idMatch ? idMatch[1] : undefined;
    
    // Extract buy-in
    const buyInMatch = fileContent.match(/Buy-In: ([A-Z]+|\$)?[\s]?([0-9,.]+)/);
    if (!buyInMatch) return null;
    
    // Determine currency
    let currencyCode = "USD";
    let buyInValue = 0;
    let buyInOriginal = "";
    let conversionRate = 1;
    
    if (buyInMatch[1] && buyInMatch[1] !== "$") {
      currencyCode = buyInMatch[1];
      buyInOriginal = `${currencyCode}${buyInMatch[2]}`;
      
      // Will be converted on the server
      buyInValue = parseFloat(buyInMatch[2].replace(/,/g, ''));
    } else {
      buyInValue = parseFloat(buyInMatch[2].replace(/,/g, ''));
    }
    
    // Extract re-entries information
    const reEntriesMatch = fileContent.match(/You made (\d+) re-entr[yi]es/);
    const reEntries = reEntriesMatch ? parseInt(reEntriesMatch[1], 10) : 0;
    const totalEntries = reEntries + 1;
    const totalBuyIn = buyInValue * totalEntries;
    
    // Extract result
    const resultMatch = fileContent.match(/(?:Won|Profit|Finished): ([A-Z]+|\$)?[\s]?([0-9,.]+)/);
    const resultLossMatch = fileContent.match(/(?:Lost): ([A-Z]+|\$)?[\s]?([0-9,.]+)/);
    
    let result = 0;
    
    if (resultMatch) {
      result = parseFloat(resultMatch[2].replace(/,/g, ''));
    } else if (resultLossMatch) {
      result = -parseFloat(resultLossMatch[2].replace(/,/g, ''));
    }
    
    // Determine tournament category
    let category: TournamentCategoryType;
    
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
