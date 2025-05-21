import { describe, expect, test } from '@jest/globals';
import { calculateSingleTournamentDistribution } from '../lib/calculationUtils';
import { TournamentCategory, TournamentResult, PlayerLevel } from '../../shared/schema';

// Player level para os testes (nivel 3.1 com caps de 22 USD e 11 USD)
const TEST_PLAYER_LEVEL: PlayerLevel = {
  level: "3.1",
  levelProgress: 0.65,
  levelProgressFormatted: "65%",
  normalLimit: 22,  // cap_normal = 22 USD
  phaseLimit: 11,   // cap_phase = 11 USD
};

describe('Financial Logic Tests', () => {
  // Teste os casos específicos mencionados no documento
  test('Caso A: Phase Day 1 (buy-in 55, prize 0, re-entries 0, cap 11)', () => {
    const tournament: TournamentResult = {
      name: 'Phase Day 1 Tournament',
      tournamentId: '12345',
      category: TournamentCategory.PHASE_DAY_1,
      buyIn: 55,
      reEntries: 0,
      totalEntries: 1,
      totalBuyIn: 55,
      result: 0,  // Não importa para Phase Day 1, sempre usa o buy-in como perda
      normalDeal: 0,
      automaticSale: 0,
      currencyCode: 'USD',
      conversionRate: 1,
      originalFilename: 'tournament.txt'
    };

    const result = calculateSingleTournamentDistribution(tournament, TEST_PLAYER_LEVEL);

    // Esperado: normal -11 / polar -44
    expect(result.normalDeal).toBeCloseTo(-11, 0.01);
    expect(result.automaticSale).toBeCloseTo(-44, 0.01);
  });

  test('Caso B: Phase Day 2 (buy-in 55, prize 113.44, re-entries 0, cap 11)', () => {
    const tournament: TournamentResult = {
      name: 'Phase Day 2 Tournament',
      tournamentId: '12345',
      category: TournamentCategory.PHASE_DAY_2_PLUS,
      buyIn: 55,
      reEntries: 0,
      totalEntries: 1,
      totalBuyIn: 55,
      result: 113.44,  // Prize total, sem deduzir buy-in (lógico = 0)
      normalDeal: 0,
      automaticSale: 0,
      currencyCode: 'USD',
      conversionRate: 1,
      originalFilename: 'tournament.txt'
    };

    const result = calculateSingleTournamentDistribution(tournament, TEST_PLAYER_LEVEL);

    // Esperado: normal 22.688 / polar 90.752
    expect(result.normalDeal).toBeCloseTo(22.688, 0.01);
    expect(result.automaticSale).toBeCloseTo(90.752, 0.01);
  });

  test('Caso C: Normal bounty (buy-in 55, prize 18.75, re-entries 0, cap 22)', () => {
    const tournament: TournamentResult = {
      name: 'Normal Bounty Tournament',
      tournamentId: '12345',
      category: TournamentCategory.OTHER_TOURNAMENTS,
      buyIn: 55,
      reEntries: 0,
      totalEntries: 1,
      totalBuyIn: 55,
      result: 18.75,  // Prize menor que buy-in, resulta em perda
      normalDeal: 0,
      automaticSale: 0,
      currencyCode: 'USD',
      conversionRate: 1,
      originalFilename: 'tournament.txt'
    };

    const result = calculateSingleTournamentDistribution(tournament, TEST_PLAYER_LEVEL);

    // Esperado: normal -14.5 / polar -21.75
    expect(result.normalDeal).toBeCloseTo(-14.5, 0.01);
    expect(result.automaticSale).toBeCloseTo(-21.75, 0.01);
  });

  test('Caso D: Normal re-entry (buy-in 20, prize 32.7, re-entries 3, cap 22)', () => {
    const tournament: TournamentResult = {
      name: 'Normal Tournament with Re-entries',
      tournamentId: '12345',
      category: TournamentCategory.OTHER_TOURNAMENTS,
      buyIn: 20,
      reEntries: 3,
      totalEntries: 4,
      totalBuyIn: 80,  // 20 * 4 = 80
      result: 32.7,    // Prize < totalBuyIn, resulta em perda
      normalDeal: 0,
      automaticSale: 0,
      currencyCode: 'USD',
      conversionRate: 1,
      originalFilename: 'tournament.txt'
    };

    const result = calculateSingleTournamentDistribution(tournament, TEST_PLAYER_LEVEL);

    // Esperado: normal -47.3 / polar 0
    // Cálculo: resultado (32.7) - totalBuyIn (80) = -47.3
    // Como buy-in (20) < cap (22), 100% é normal deal
    expect(result.normalDeal).toBeCloseTo(-47.3, 0.01);
    expect(result.automaticSale).toBeCloseTo(0, 0.01);
  });

  test('Caso E: Moeda diferente USD (buy-in ¥110, prize 302.9, re-entries 0, cap 22)', () => {
    const tournament: TournamentResult = {
      name: 'Yen Tournament',
      tournamentId: '12345',
      category: TournamentCategory.OTHER_CURRENCY,
      buyIn: 110,
      reEntries: 0,
      totalEntries: 1,
      totalBuyIn: 110,
      result: 302.9,
      normalDeal: 0,
      automaticSale: 0,
      currencyCode: 'CNY',
      conversionRate: 0,  // Conversão pendente
      originalFilename: 'tournament.txt'
    };

    const result = calculateSingleTournamentDistribution(tournament, TEST_PLAYER_LEVEL);

    // Esperado: conversão pendente, valores zerados
    expect(result.normalDeal).toBe(0);
    expect(result.automaticSale).toBe(0);
  });
});