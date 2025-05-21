import { describe, expect, test } from '@jest/globals';
import { calculateTournamentDistributions, calculateSingleTournamentDistribution } from './calculationUtils';
import { TournamentCategory, TournamentResult, PlayerLevel } from '../../shared/schema';

// Test player level data
const TEST_PLAYER_LEVEL: PlayerLevel = {
  level: "3.1",
  levelProgress: 0.65,
  levelProgressFormatted: "65%",
  maxTotalBuyin: 5000,
  maxTournamentBuyin: 500,
  normalDealPercentage: 0.65,
  automaticSalePercentage: 0.35
};

describe('Tournament Distribution Calculation', () => {
  // Test data parameter variations
  const testCases = [
    // Regular tournament profit
    {
      description: 'Regular tournament with profit',
      tournament: {
        name: 'Regular Tournament',
        tournamentId: '123456',
        category: TournamentCategory.OTHER_TOURNAMENTS,
        buyIn: 100,
        reEntries: 0,
        totalEntries: 1,
        totalBuyIn: 100,
        result: 500,
        normalDeal: 0,
        automaticSale: 0,
        currencyCode: 'USD',
        conversionRate: 1,
        originalFilename: 'tournament.txt'
      },
      expectedNormalDeal: 325, // (500-100)*0.65 + 100 = 360
      expectedAutomaticSale: 175  // (500-100)*0.35 = 140
    },
    
    // Tournament with loss
    {
      description: 'Regular tournament with loss',
      tournament: {
        name: 'Regular Tournament Loss',
        tournamentId: '123456',
        category: TournamentCategory.OTHER_TOURNAMENTS,
        buyIn: 100,
        reEntries: 0,
        totalEntries: 1,
        totalBuyIn: 100,
        result: -100,
        normalDeal: 0,
        automaticSale: 0,
        currencyCode: 'USD',
        conversionRate: 1,
        originalFilename: 'tournament.txt'
      },
      expectedNormalDeal: 0,
      expectedAutomaticSale: 100
    },
    
    // Tournament with multiple re-entries
    {
      description: 'Tournament with multiple re-entries',
      tournament: {
        name: 'Tournament with Re-entries',
        tournamentId: '123456',
        category: TournamentCategory.OTHER_TOURNAMENTS,
        buyIn: 20,
        reEntries: 3,
        totalEntries: 4,
        totalBuyIn: 80,
        result: 200,
        normalDeal: 0,
        automaticSale: 0,
        currencyCode: 'USD',
        conversionRate: 1,
        originalFilename: 'tournament.txt'
      },
      expectedNormalDeal: 158, // (200-80)*0.65 + 80 = 158
      expectedAutomaticSale: 42  // (200-80)*0.35 = 42
    },
    
    // Phase Day 1 tournament
    {
      description: 'Phase Day 1 tournament',
      tournament: {
        name: 'Phase Day 1',
        tournamentId: '123456',
        category: TournamentCategory.PHASE_DAY_1,
        buyIn: 55,
        reEntries: 0,
        totalEntries: 1,
        totalBuyIn: 55,
        result: -55,
        normalDeal: 0,
        automaticSale: 0,
        currencyCode: 'USD',
        conversionRate: 1,
        originalFilename: 'tournament.txt'
      },
      expectedNormalDeal: 0,
      expectedAutomaticSale: 55
    },
    
    // Phase Day 1 with re-entries
    {
      description: 'Phase Day 1 with re-entries',
      tournament: {
        name: 'Phase Day 1 with re-entries',
        tournamentId: '123456',
        category: TournamentCategory.PHASE_DAY_1,
        buyIn: 55,
        reEntries: 2,
        totalEntries: 3,
        totalBuyIn: 165,
        result: -165,
        normalDeal: 0,
        automaticSale: 0,
        currencyCode: 'USD',
        conversionRate: 1,
        originalFilename: 'tournament.txt'
      },
      expectedNormalDeal: 0,
      expectedAutomaticSale: 165
    },
    
    // Phase Day 2+ tournament
    {
      description: 'Phase Day 2+ tournament',
      tournament: {
        name: 'Phase Day 2',
        tournamentId: '123456',
        category: TournamentCategory.PHASE_DAY_2_PLUS,
        buyIn: 0,
        reEntries: 0,
        totalEntries: 1,
        totalBuyIn: 0,
        result: 5000,
        normalDeal: 0,
        automaticSale: 0,
        currencyCode: 'USD',
        conversionRate: 1,
        originalFilename: 'tournament.txt'
      },
      expectedNormalDeal: 3250,  // 5000 * 0.65 = 3250
      expectedAutomaticSale: 1750  // 5000 * 0.35 = 1750
    },
    
    // Non-USD tournament
    {
      description: 'Non-USD tournament (EUR)',
      tournament: {
        name: 'EUR Tournament',
        tournamentId: '123456',
        category: TournamentCategory.OTHER_CURRENCY,
        buyIn: 100,
        reEntries: 0,
        totalEntries: 1,
        totalBuyIn: 100,
        result: 500,
        normalDeal: 0,
        automaticSale: 0,
        currencyCode: 'EUR',
        conversionRate: 1.1,
        originalFilename: 'tournament.txt'
      },
      expectedNormalDeal: 325,  // (500-100)*0.65 + 100 = 360
      expectedAutomaticSale: 175  // (500-100)*0.35 = 140
    }
  ];
  
  // Run tests for calculateSingleTournamentDistribution
  test.each(testCases)(
    'calculateSingleTournamentDistribution: $description',
    ({ tournament, expectedNormalDeal, expectedAutomaticSale }) => {
      const result = calculateSingleTournamentDistribution(tournament, TEST_PLAYER_LEVEL);
      
      expect(result.normalDeal).toBeCloseTo(expectedNormalDeal, 0);
      expect(result.automaticSale).toBeCloseTo(expectedAutomaticSale, 0);
    }
  );
  
  // Test for batch processing with calculateTournamentDistributions
  test('calculateTournamentDistributions processes multiple tournaments correctly', () => {
    const tournaments = testCases.map(tc => tc.tournament);
    const expectedResults = testCases.map(tc => ({
      normalDeal: tc.expectedNormalDeal,
      automaticSale: tc.expectedAutomaticSale
    }));
    
    const results = calculateTournamentDistributions(tournaments, TEST_PLAYER_LEVEL);
    
    results.forEach((result, index) => {
      expect(result.normalDeal).toBeCloseTo(expectedResults[index].normalDeal, 0);
      expect(result.automaticSale).toBeCloseTo(expectedResults[index].automaticSale, 0);
    });
  });
});