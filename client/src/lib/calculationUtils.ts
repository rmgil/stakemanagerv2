import { 
  TournamentResult, 
  SummaryResult, 
  PlayerLevel, 
  TournamentCategory,
  TournamentCategoryType
} from "@shared/schema";

/**
 * Calculate tournament financial distribution based on player level
 * @param tournaments List of tournaments
 * @param playerLevel Player level data
 * @returns Updated tournaments with calculated amounts
 */
export function calculateTournamentDistributions(
  tournaments: TournamentResult[],
  playerLevel: PlayerLevel
): TournamentResult[] {
  return tournaments.map(tournament => {
    let { normalDeal, automaticSale } = calculateSingleTournamentDistribution(tournament, playerLevel);
    
    return {
      ...tournament,
      normalDeal,
      automaticSale
    };
  });
}

/**
 * Calculate distribution for a single tournament
 * @param tournament Tournament data
 * @param playerLevel Player level data
 * @returns Calculated normal deal and automatic sale amounts
 */
export function calculateSingleTournamentDistribution(
  tournament: TournamentResult,
  playerLevel: PlayerLevel
): { normalDeal: number; automaticSale: number } {
  // Get applicable limit based on tournament type
  const limit = tournament.category === TournamentCategory.PHASE_DAY_1 || 
                tournament.category === TournamentCategory.PHASE_DAY_2_PLUS
                ? playerLevel.phaseLimit
                : playerLevel.normalLimit;
  
  // Handle special cases
  if (tournament.category === TournamentCategory.PHASE_DAY_1) {
    // Phase Day 1 always counts as loss
    return {
      normalDeal: -limit / 2, // 50% of limit
      automaticSale: tournament.result + (limit / 2) // Remaining loss
    };
  } else if (tournament.category === TournamentCategory.PHASE_DAY_2_PLUS) {
    // Phase Day 2+ has logical buy-in of 0
    if (tournament.result > 0) {
      // 50/50 split for profit
      return {
        normalDeal: tournament.result / 2,
        automaticSale: tournament.result / 2
      };
    } else {
      return {
        normalDeal: tournament.result / 2,
        automaticSale: tournament.result / 2
      };
    }
  } else {
    // Regular tournament
    if (tournament.result > 0) {
      // For winnings, split 50/50 up to the limit, rest goes to automatic sale
      const totalBuyIn = Math.abs(tournament.buyIn);
      const profit = tournament.result;
      
      if (totalBuyIn <= limit) {
        // If buy-in is less than or equal to limit
        return {
          normalDeal: profit / 2,
          automaticSale: profit / 2
        };
      } else {
        // If buy-in exceeds limit
        // Limit portion is split 50/50
        const normalDealAmount = limit / 2;
        // Rest is automatic sale
        const automaticSaleAmount = profit - normalDealAmount;
        
        return {
          normalDeal: normalDealAmount,
          automaticSale: automaticSaleAmount
        };
      }
    } else {
      // For losses
      const loss = Math.abs(tournament.result);
      
      if (tournament.buyIn <= limit) {
        // If buy-in is less than or equal to limit, split 50/50
        return {
          normalDeal: -tournament.result / 2,
          automaticSale: -tournament.result / 2
        };
      } else {
        // If buy-in exceeds limit
        // Limit portion is split 50/50
        const normalDealAmount = -limit / 2;
        // Rest is automatic sale
        const automaticSaleAmount = normalDealAmount - tournament.result;
        
        return {
          normalDeal: normalDealAmount,
          automaticSale: -automaticSaleAmount
        };
      }
    }
  }
}

/**
 * Calculate summary statistics from tournament results
 * @param tournaments List of tournament results
 * @returns Summary statistics
 */
export function calculateSummary(tournaments: TournamentResult[]): SummaryResult {
  // Count tournaments by category
  const categoryCount = {
    phaseDay1Count: 0,
    phaseDay2Count: 0,
    otherCurrencyCount: 0,
    otherTournamentsCount: 0
  };
  
  // Calculate totals
  let netProfit = 0;
  let normalDealTotal = 0;
  let automaticSaleTotal = 0;
  
  tournaments.forEach(tournament => {
    // Update category counts
    switch (tournament.category) {
      case TournamentCategory.PHASE_DAY_1:
        categoryCount.phaseDay1Count++;
        break;
      case TournamentCategory.PHASE_DAY_2_PLUS:
        categoryCount.phaseDay2Count++;
        break;
      case TournamentCategory.OTHER_CURRENCY:
        categoryCount.otherCurrencyCount++;
        break;
      case TournamentCategory.OTHER_TOURNAMENTS:
        categoryCount.otherTournamentsCount++;
        break;
    }
    
    // Update totals
    netProfit += tournament.result;
    normalDealTotal += tournament.normalDeal;
    automaticSaleTotal += tournament.automaticSale;
  });
  
  // Calculate percentages
  const totalCount = tournaments.length;
  const percentages = {
    phaseDay1Percentage: totalCount > 0 ? (categoryCount.phaseDay1Count / totalCount) * 100 : 0,
    phaseDay2Percentage: totalCount > 0 ? (categoryCount.phaseDay2Count / totalCount) * 100 : 0,
    otherCurrencyPercentage: totalCount > 0 ? (categoryCount.otherCurrencyCount / totalCount) * 100 : 0,
    otherTournamentsPercentage: totalCount > 0 ? (categoryCount.otherTournamentsCount / totalCount) * 100 : 0
  };
  
  return {
    totalTournaments: tournaments.length,
    netProfit,
    normalDeal: normalDealTotal,
    automaticSale: automaticSaleTotal,
    categories: {
      ...categoryCount,
      ...percentages
    }
  };
}

/**
 * Generate CSV content from tournament results
 * @param tournaments List of tournament results
 * @returns CSV content as string
 */
export function generateCsv(tournaments: TournamentResult[]): string {
  const headers = [
    "Nome do Torneio",
    "Categoria",
    "Buy-in",
    "Resultado",
    "Deal Normal",
    "Venda Automática",
    "Moeda"
  ].join(",");
  
  const categoryLabels: Record<TournamentCategoryType, string> = {
    "PHASE_DAY_1": "Phase Day 1",
    "PHASE_DAY_2_PLUS": "Phase Day 2+",
    "OTHER_CURRENCY": "Outras Moedas",
    "OTHER_TOURNAMENTS": "Outros Torneios"
  };
  
  const rows = tournaments.map(t => [
    `"${t.name}"`,
    `"${categoryLabels[t.category as TournamentCategoryType]}"`,
    t.buyInOriginal || `$${t.buyIn.toFixed(2)}`,
    `$${t.result.toFixed(2)}`,
    `$${t.normalDeal.toFixed(2)}`,
    `$${t.automaticSale.toFixed(2)}`,
    t.currencyCode
  ].join(","));
  
  return [headers, ...rows].join("\n");
}
