import { TournamentResult, TournamentCategory, TournamentCategoryType } from "@shared/schema";

/**
 * Parse a tournament summary file content
 * @param fileContent Content of the tournament summary file
 * @param filename Original filename
 * @returns Parsed tournament data
 */
export function parseTournamentSummary(fileContent: string, filename: string): TournamentResult | null {
  try {
    // Extract tournament name and ID with more flexible pattern
    // Various formats: "Tournament #123456, Name, Hold'em" or similar variants
    const headerMatch = fileContent.match(/Tournament #(\d+)[,:]?\s*([^,]+(?:,\s*[^,]+)*?)(?:,\s*Hold'em|$)/i);
    if (!headerMatch) return null;
    
    const tournamentId = headerMatch[1];
    const name = headerMatch[2].trim();
    
    // Extract buy-in with flexible pattern for various formats and currencies
    // Matches: "$50.6+$4.4", "€50+€5", "$25.6+$4.4+$25" (bounty), etc.
    const buyInPattern = /Buy-in:\s*([¥$€£₩₽₹])?(\d+[.,]?\d*)(?:\+([¥$€£₩₽₹])?(\d+[.,]?\d*))?(?:\+([¥$€£₩₽₹])?(\d+[.,]?\d*))?/i;
    const buyInMatch = fileContent.match(buyInPattern);
    if (!buyInMatch) return null;
    
    // Determine currency and buy-in values
    let currencyCode = "USD";
    let buyInValue = 0;
    let buyInOriginal = "";
    let conversionRate = 1;
    
    // Get the currency symbol, defaulting to $
    // First check main buy-in, then fee, then possible bounty
    const currencySymbol = buyInMatch[1] || buyInMatch[3] || buyInMatch[5] || "$";
    
    // Map currency symbols to codes
    const currencyMap: Record<string, string> = {
      "$": "USD",
      "€": "EUR",
      "£": "GBP",
      "¥": "CNY",
      "₩": "KRW",
      "₽": "RUB",
      "₹": "INR"
    };
    
    currencyCode = currencyMap[currencySymbol] || currencySymbol;
    
    // Parse all numbers, handling different decimal separators (. or ,)
    const parseAmount = (str?: string): number => {
      if (!str) return 0;
      return parseFloat(str.replace(',', '.'));
    };
    
    // Calculate total buy-in (main + fee + optional bounty)
    const mainBuyIn = parseAmount(buyInMatch[2]);
    const fee = parseAmount(buyInMatch[4]);
    const bounty = parseAmount(buyInMatch[6]); // May be 0 if no bounty
    
    buyInValue = mainBuyIn + fee + bounty;
    
    if (currencyCode !== "USD") {
      buyInOriginal = `${currencyCode}${buyInValue}`;
    }
    
    // Extract re-entries information with more flexible pattern
    // Look for various phrasings across different poker platforms
    const reEntriesPatterns = [
      /You made (\d+) re-entr[yi]es/i,
      /(\d+) re-entr[yi]es/i,
      /re-entered (\d+) times/i,
      /(\d+) times re-entered/i
    ];
    
    let reEntries = 0;
    for (const pattern of reEntriesPatterns) {
      const match = fileContent.match(pattern);
      if (match) {
        reEntries = parseInt(match[1], 10);
        break;
      }
    }
    
    const totalEntries = reEntries + 1;
    const totalBuyIn = buyInValue * totalEntries;
    
    // Extract result with flexible patterns for different formats
    // Look for money amounts in various contexts
    const resultPatterns = [
      // Direct result statements: "You received a total of $XX.XX"
      new RegExp(`received a total of ([¥$€£₩₽₹]?)(\\d+[.,]?\\d*)`, 'i'),
      // Position and amount: "5th : Hero, $123.45"
      new RegExp(`\\d+[a-z]*\\s*(?::|place|position)[^,]*,\\s*([¥$€£₩₽₹]?)(\\d+[.,]?\\d*)`, 'i'),
      // Direct winnings: "You won $123.45"
      new RegExp(`won\\s*([¥$€£₩₽₹]?)(\\d+[.,]?\\d*)`, 'i')
    ];
    
    // For Day 1 tournaments
    const advancedPatterns = [
      /advanced to Day[- ]?2/i,
      /qualified (?:for|to) Day[- ]?2/i,
      /(?:qualified|advanced) with .* chips/i
    ];
    
    let result = 0;
    let resultFound = false;
    
    // Check result patterns
    for (const pattern of resultPatterns) {
      const match = fileContent.match(pattern);
      if (match) {
        // If winnings received
        const amountStr = match[2].replace(/,/g, '.');
        result = parseAmount(amountStr);
        resultFound = true;
        break;
      }
    }
    
    // If no result found, check advancement patterns
    if (!resultFound) {
      let advanced = false;
      for (const pattern of advancedPatterns) {
        if (fileContent.match(pattern)) {
          advanced = true;
          break;
        }
      }
      
      if (advanced) {
        // Day 1 tournament with advancement - full buy-in is the loss
        result = -buyInValue * totalEntries;
      } else {
        // Default case, no explicit result mentioned
        result = -buyInValue * totalEntries;
      }
    }
    
    // Determine tournament category with flexible pattern matching
    let category: TournamentCategoryType;
    
    // More comprehensive patterns for phase tournaments
    const phaseDay1Patterns = [
      /\[Day 1\]/i,
      /Day 1/i,
      /Phase.*Day ?1/i,
      /Phase.*\#1/i,
      /Phase 1/i,
      /Phase-\w+.*Day ?1/i
    ];
    
    const phaseDay2PlusPatterns = [
      /\[Day 2\]/i,
      /\[Day 3\]/i,
      /Day 2\+?/i,
      /Day 3\+?/i,
      /Phase.*Day ?2/i,
      /Phase.*Day ?3/i,
      /Phase.*\#2/i,
      /Phase.*\#3/i,
      /Phase 2/i,
      /Phase 3/i,
      /Phase-\w+.*Day ?[23]/i,
      /Final Day/i
    ];
    
    // Check all patterns
    let isPhaseDay1 = false;
    let isPhaseDay2Plus = false;
    
    // Check if any Phase Day 1 pattern matches
    for (const pattern of phaseDay1Patterns) {
      if (pattern.test(name)) {
        isPhaseDay1 = true;
        break;
      }
    }
    
    // Check if any Phase Day 2+ pattern matches
    if (!isPhaseDay1) {
      for (const pattern of phaseDay2PlusPatterns) {
        if (pattern.test(name)) {
          isPhaseDay2Plus = true;
          break;
        }
      }
    }
    
    // Additional file content checks to detect phase tournaments
    if (!isPhaseDay1 && !isPhaseDay2Plus) {
      // Check content for advancement indicators
      for (const pattern of advancedPatterns) {
        if (pattern.test(fileContent)) {
          isPhaseDay1 = true;
          break;
        }
      }
      
      // Check for Day 2 indicators in content
      if (!isPhaseDay1 && fileContent.match(/Day ?2.*tournament/i)) {
        isPhaseDay2Plus = true;
      }
    }
    
    // Assign category based on results
    if (isPhaseDay1) {
      category = TournamentCategory.PHASE_DAY_1;
      
      // Always count as a loss for Day 1 tournaments
      result = -buyInValue * totalEntries;
    } else if (isPhaseDay2Plus) {
      category = TournamentCategory.PHASE_DAY_2_PLUS;
      
      // Phase Day 2+ has logical buy-in of 0, keeping whatever result we parsed
      // If no winnings detected, set to 0 (no buy-in)
      if (!resultFound) {
        result = 0;
      }
      
      // If result is negative, assume 0 since Day 2+ has no buy-in cost
      if (result < 0) {
        result = 0;
      }
    } else if (currencyCode !== "USD") {
      category = TournamentCategory.OTHER_CURRENCY;
    } else {
      category = TournamentCategory.OTHER_TOURNAMENTS;
    }
    
    // Default values - will be calculated later with player level
    const normalDeal = 0;
    const automaticSale = 0;
    
    // Store final parsed result in standardized format
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
