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
/**
 * Calcula a distribuição financeira para um torneio com base no nível do jogador
 * @param tournament Dados do torneio
 * @param playerLevel Nível do jogador
 * @returns Valores calculados para normal deal e automatic sale
 */
export function calculateSingleTournamentDistribution(
  tournament: TournamentResult,
  playerLevel: PlayerLevel
): { normalDeal: number; automaticSale: number; conversionPending?: boolean } {
  // 1. Obter os caps aplicáveis baseados no nível do jogador
  const normalCap = playerLevel.normalLimit;  // ex: 22 USD para torneios normais
  const phaseCap = playerLevel.phaseLimit;    // ex: 11 USD para torneios Phase
  
  // 2. Calcular buy-in individual e total (considerando re-entries)
  const singleBuyIn = Math.abs(tournament.buyIn);
  const totalBuyIn = tournament.totalBuyIn || (singleBuyIn * (tournament.totalEntries || 1));
  
  // 3. Definir cap apropriado conforme a categoria do torneio
  let cap: number;
  
  if (tournament.category === TournamentCategory.PHASE_DAY_1 || 
      tournament.category === TournamentCategory.PHASE_DAY_2_PLUS) {
    cap = phaseCap;  // Usa cap_phase (11 USD) para torneios Phase
  } else {
    cap = normalCap;  // Usa cap_normal (22 USD) para outros torneios
  }
  
  // 4. Calcular percentagens exatas de distribuição
  // Regra: polarize_pct = max(0, (buyin_usd - cap) / buyin_usd)
  const polarizePct = Math.max(0, (singleBuyIn - cap) / singleBuyIn);
  const normalPct = 1 - polarizePct;
  
  // 5. Verificar moeda diferente e conversão pendente
  if (tournament.currencyCode !== 'USD' && tournament.conversionRate <= 0) {
    // Caso 5: Outras moedas sem conversão definida
    return {
      normalDeal: 0,
      automaticSale: 0,
      conversionPending: true
    };
  }
  
  // 6. Processamento por categoria com base nas regras específicas
  if (tournament.category === TournamentCategory.PHASE_DAY_1) {
    // Caso A: Phase Day 1
    // - Sempre trata o buy-in total como prejuízo (resultado = -buyIn)
    // - Usa cap_phase (11 USD) para calcular percentagens
    // - lucro_normal = (-totalBuyIn) * normal_pct
    // - lucro_polar = (-totalBuyIn) * polarize_pct
    
    // Exemplo: Phase Day 1 (55 USD, cap 11)
    // - polarizePct = (55-11)/55 = 0.8
    // - normalPct = 0.2
    // - normalDeal = -55 * 0.2 = -11
    // - automaticSale = -55 * 0.8 = -44
    
    return {
      normalDeal: -totalBuyIn * normalPct,
      automaticSale: -totalBuyIn * polarizePct
    };
  } 
  else if (tournament.category === TournamentCategory.PHASE_DAY_2_PLUS) {
    // Caso B: Phase Day 2+
    // - Buy-in lógico = 0 (resultado = prize, não deduz buy-in)
    // - O buy-in real continua definindo as percentagens
    // - lucro_normal = prize_usd * normal_pct
    // - lucro_polar = prize_usd * polarize_pct
    
    // Exemplo: Phase Day 2+ (55 USD, prize 113.44, cap 11)
    // - polarizePct = (55-11)/55 = 0.8
    // - normalPct = 0.2
    // - normalDeal = 113.44 * 0.2 = 22.69
    // - automaticSale = 113.44 * 0.8 = 90.75
    
    return {
      normalDeal: tournament.result * normalPct,
      automaticSale: tournament.result * polarizePct
    };
  } 
  else {
    // Casos C e D: Torneios regulares (incluindo com re-entries)
    // - resultado = prize - totalBuyIn
    // - lucro_normal = resultado * normal_pct
    // - lucro_polar = resultado * polarize_pct
    
    // Exemplo C: Normal (55 USD, prize 18.75, cap 22)
    // - polarizePct = (55-22)/55 = 0.6
    // - normalPct = 0.4
    // - resultado = 18.75 - 55 = -36.25
    // - normalDeal = -36.25 * 0.4 = -14.5
    // - automaticSale = -36.25 * 0.6 = -21.75
    
    // Exemplo D: Normal re-entry (20 USD, prize 32.7, 3 re-entries, cap 22)
    // - Como buy-in (20) < cap (22), normalPct = 1.0, polarizePct = 0.0
    // - totalBuyIn = 20 * 4 = 80
    // - resultado = 32.7 - 80 = -47.3
    // - normalDeal = -47.3 * 1.0 = -47.3
    // - automaticSale = -47.3 * 0.0 = 0
    
    const resultado = tournament.result - totalBuyIn;
    
    return {
      normalDeal: resultado * normalPct,
      automaticSale: resultado * polarizePct
    };
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
