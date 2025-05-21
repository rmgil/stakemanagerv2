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
  // 1. Obter os caps aplicáveis baseados no nível do jogador
  const normalCap = playerLevel.normalLimit;  // ex: 22 USD para torneios normais
  const phaseCap = playerLevel.phaseLimit;    // ex: 11 USD para torneios Phase
  
  // 2. Calcular buy-in individual e total (considerando re-entries)
  const singleBuyIn = Math.abs(tournament.buyIn);
  const totalBuyIn = tournament.totalBuyIn || (singleBuyIn * (tournament.totalEntries || 1));
  
  // 3. Obter cap apropriado e calcular percentagens de distribuição
  // Regra: polarize_pct = max(0, (buyin_usd - cap) / buyin_usd)
  let cap: number;
  
  if (tournament.category === TournamentCategory.PHASE_DAY_1 || 
      tournament.category === TournamentCategory.PHASE_DAY_2_PLUS) {
    cap = phaseCap;  // Usa cap_phase para torneios Phase
  } else {
    cap = normalCap;  // Usa cap_normal para outros torneios
  }
  
  // Calcular percentagens de distribuição com base no buy-in individual (não o total)
  const polarizePct = Math.max(0, (singleBuyIn - cap) / singleBuyIn);
  const normalPct = 1 - polarizePct;
  
  // 4. Processamento por categoria
  if (tournament.category === TournamentCategory.PHASE_DAY_1) {
    // Caso 2: Phase Day 1
    // - Sempre trata o buy-in total como prejuízo
    // - lucro_normal = (-totalBuyIn) * normal_pct
    // - lucro_polar = (-totalBuyIn) * polarize_pct
    return {
      normalDeal: -totalBuyIn * normalPct,
      automaticSale: -totalBuyIn * polarizePct
    };
  } 
  else if (tournament.category === TournamentCategory.PHASE_DAY_2_PLUS) {
    // Caso 3: Phase Day 2+
    // - Buy-in lógico = 0 (resultado = prize sem deduzir buy-in)
    // - O buy-in real continua a definir as percentagens
    // - lucro_normal = prize_usd * normal_pct
    // - lucro_polar = prize_usd * polarize_pct
    return {
      normalDeal: tournament.result * normalPct,
      automaticSale: tournament.result * polarizePct
    };
  } 
  else if (tournament.currencyCode !== 'USD' && tournament.conversionRate <= 0) {
    // Caso 5: Outras moedas sem conversão definida
    // Quando conversão pendente, retorna valores zerados
    return {
      normalDeal: 0,
      automaticSale: 0
    };
  } 
  else {
    // Casos 1 e 4: Torneios regulares (incluindo com re-entries)
    // - resultado = prize - totalBuyIn
    // - lucro_normal = resultado * normal_pct + totalBuyIn
    // - lucro_polar = resultado * polarize_pct

    // Caso D: Normal re-entry (Big 20 com 3 re-entries)
    // - Como buy-in = 20 < cap (22), 100% normal deal
    // - 20 $ x 4 = 80 $ custo total
    // - 32.7 - 80 = -47.3 $ perda
    // - -47.3 $ x 100% = -47.3 $ normal deal, 0 $ polarize
    
    const profit = tournament.result - totalBuyIn;
    
    if (profit >= 0) {
      // Lucro
      return {
        normalDeal: profit * normalPct + totalBuyIn,
        automaticSale: profit * polarizePct
      };
    } else {
      // Perda - distribuir conforme percentagens
      // Se buy-in ≤ cap, tudo vai para normal deal
      // Caso contrário, distribui proporcionalmente
      return {
        normalDeal: profit * normalPct + totalBuyIn,
        automaticSale: profit * polarizePct
      };
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
    "Re-entries",
    "Entradas Totais",
    "Buy-in Total",
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
    t.reEntries || 0,
    t.totalEntries || 1,
    `$${(t.totalBuyIn || (t.buyIn * (t.totalEntries || 1))).toFixed(2)}`,
    `$${t.result.toFixed(2)}`,
    `$${t.normalDeal.toFixed(2)}`,
    `$${t.automaticSale.toFixed(2)}`,
    t.currencyCode
  ].join(","));
  
  return [headers, ...rows].join("\n");
}
