import { describe, expect, test } from '@jest/globals';
import { parseTournamentSummary } from '../lib/tournamentParser';
import { calculateTournamentDistributions } from '../lib/calculationUtils';
import { TournamentCategory, TournamentResult, PlayerLevel } from '../../shared/schema';
import fs from 'fs';
import path from 'path';

const TEST_PLAYER_LEVEL: PlayerLevel = {
  level: "3.1",
  levelProgress: 0.65,
  levelProgressFormatted: "65%",
  maxTotalBuyin: 5000,
  maxTournamentBuyin: 500,
  normalDealPercentage: 0.65,
  automaticSalePercentage: 0.35
};

describe('Tournament Parser', () => {
  test('should parse tournament summary correctly', () => {
    const fileContent = `Tournament #203693115, Zodiac Dog Ultra Deepstack 7-Max 110 [Turbo], Hold'em No Limit
Buy-in: $100+$10
110 Players
Total Prize Pool: $11000
Tournament started 2025/05/05 19:00:00 
5th : Hero, $660
You finished the tournament in 5th place and received a total of $660.`;

    const result = parseTournamentSummary(fileContent, 'tournament1.txt');
    
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Zodiac Dog Ultra Deepstack 7-Max 110 [Turbo]');
    expect(result?.buyIn).toBe(110);
    expect(result?.result).toBe(660);
    expect(result?.category).toBe(TournamentCategory.OTHER_TOURNAMENTS);
  });

  test('should handle re-entries correctly', () => {
    const fileContent = `Tournament #206195723, Sunday Big 20, Hold'em No Limit
Buy-in: $18.40+$1.60
1000 Players
Total Prize Pool: $18400
Tournament started 2025/05/18 19:00:00 
38th : Hero, $53.10
You finished the tournament in 38th place.
You made 3 re-entries and received a total of $53.10.`;

    const result = parseTournamentSummary(fileContent, 'tournament_reentries.txt');
    
    expect(result).not.toBeNull();
    expect(result?.buyIn).toBe(20);
    expect(result?.reEntries).toBe(3);
    expect(result?.totalEntries).toBe(4);
    expect(result?.totalBuyIn).toBe(80);
    expect(result?.result).toBe(53.10);
  });

  test('should correctly identify Phase Day 1 tournaments', () => {
    const fileContent = `Tournament #202948246, Phase-M 55 Global World Festival [Day 1], Hold'em No Limit
Buy-in: $55+$0
5000 Players
Total Prize Pool: $275000
Tournament started 2025/05/11 14:00:00 
100th : Hero, $0 Entry
You finished the tournament in 100th place.
You have advanced to Day2 with 25000 chips.`;

    const result = parseTournamentSummary(fileContent, 'phase_day1.txt');
    
    expect(result).not.toBeNull();
    expect(result?.category).toBe(TournamentCategory.PHASE_DAY_1);
    expect(result?.buyIn).toBe(55);
    expect(result?.result).toBe(-55); // Loss is the buy-in amount for Day 1
  });

  test('should correctly identify Phase Day 2+ tournaments', () => {
    const fileContent = `Tournament #202946684, Phase-M 55 Global World Festival [Day 2], Hold'em No Limit
Buy-in: $0+$0
1000 Players
Total Prize Pool: $275000
Tournament started 2025/05/12 14:00:00 
5th : Hero, $8800
You finished the tournament in 5th place and received a total of $8800.`;

    const result = parseTournamentSummary(fileContent, 'phase_day2.txt');
    
    expect(result).not.toBeNull();
    expect(result?.category).toBe(TournamentCategory.PHASE_DAY_2_PLUS);
    expect(result?.buyIn).toBe(0);
    expect(result?.result).toBe(8800);
  });

  test('should handle different currencies', () => {
    const fileContent = `Tournament #205722512, 132-M 55 Bounty Hunters Sunday Main Event, Hold'em No Limit
Buy-in: €50+€5+€50
1000 Players
Total Prize Pool: €50000
Tournament started 2025/05/18 18:00:00 
10th : Hero, €800
You finished the tournament in 10th place and received a total of €800.`;

    const result = parseTournamentSummary(fileContent, 'euro_tournament.txt');
    
    expect(result).not.toBeNull();
    expect(result?.currencyCode).toBe('EUR');
    expect(result?.buyIn).toBe(105);
    expect(result?.result).toBe(800);
    expect(result?.category).toBe(TournamentCategory.OTHER_CURRENCY);
  });
});

describe('Tournament Distribution Calculation', () => {
  test('should calculate distribution correctly for regular tournaments', () => {
    const tournament: TournamentResult = {
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
    };

    const calculatedTournament = calculateTournamentDistributions([tournament], TEST_PLAYER_LEVEL)[0];
    
    expect(calculatedTournament.normalDeal).toBe(325); // 500 * 0.65
    expect(calculatedTournament.automaticSale).toBe(175); // 500 * 0.35
  });

  test('should calculate distribution correctly for tournaments with re-entries', () => {
    const tournament: TournamentResult = {
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
    };

    const calculatedTournament = calculateTournamentDistributions([tournament], TEST_PLAYER_LEVEL)[0];
    
    // Result is 200, so profit is 200 - 80 = 120
    // normalDeal = profit * normalDealPercentage + totalBuyIn = 120 * 0.65 + 80 = 158
    // automaticSale = profit * automaticSalePercentage = 120 * 0.35 = 42
    expect(calculatedTournament.normalDeal).toBeCloseTo(158, 0);
    expect(calculatedTournament.automaticSale).toBeCloseTo(42, 0);
  });

  test('should handle Phase Day 1 tournaments correctly', () => {
    const tournament: TournamentResult = {
      name: 'Phase Day 1 Tournament',
      tournamentId: '123456',
      category: TournamentCategory.PHASE_DAY_1,
      buyIn: 55,
      reEntries: 0,
      totalEntries: 1,
      totalBuyIn: 55,
      result: -55, // Loss is the buy-in amount
      normalDeal: 0,
      automaticSale: 0,
      currencyCode: 'USD',
      conversionRate: 1,
      originalFilename: 'tournament.txt'
    };

    const calculatedTournament = calculateTournamentDistributions([tournament], TEST_PLAYER_LEVEL)[0];
    
    // For Phase Day 1, result is negative (the buy-in), so normalDeal is 0 and automaticSale is the buy-in
    expect(calculatedTournament.normalDeal).toBe(0);
    expect(calculatedTournament.automaticSale).toBe(55);
  });

  test('should handle Phase Day 2+ tournaments correctly', () => {
    const tournament: TournamentResult = {
      name: 'Phase Day 2 Tournament',
      tournamentId: '123456',
      category: TournamentCategory.PHASE_DAY_2_PLUS,
      buyIn: 0,
      reEntries: 0,
      totalEntries: 1,
      totalBuyIn: 0,
      result: 5000, // All winnings
      normalDeal: 0,
      automaticSale: 0,
      currencyCode: 'USD',
      conversionRate: 1,
      originalFilename: 'tournament.txt'
    };

    const calculatedTournament = calculateTournamentDistributions([tournament], TEST_PLAYER_LEVEL)[0];
    
    // For Phase Day 2+, result is all winnings, split according to percentages
    expect(calculatedTournament.normalDeal).toBe(5000 * 0.65);
    expect(calculatedTournament.automaticSale).toBe(5000 * 0.35);
  });
});

describe('Parametrized Tests - Various Formats', () => {
  // Test different currency formats and decimal separators
  const currencyTestCases = [
    { currency: '$', value: '125.50', expected: 125.50 },
    { currency: '€', value: '80,75', expected: 80.75 },
    { currency: '£', value: '90.00', expected: 90 },
    { currency: '¥', value: '1000', expected: 1000 },
    { currency: 'R$', value: '120,90', expected: 120.90 }
  ];

  test.each(currencyTestCases)(
    'should correctly parse $currency$value',
    ({ currency, value, expected }) => {
      const fileContent = `Tournament #123456, Test Tournament, Hold'em No Limit
Buy-in: ${currency}${value}+${currency}10
100 Players
Total Prize Pool: ${currency}10000
Tournament started 2025/05/18 18:00:00 
10th : Hero, ${currency}${value}
You finished the tournament in 10th place and received a total of ${currency}${value}.`;

      const result = parseTournamentSummary(fileContent, 'test.txt');
      expect(result).not.toBeNull();
      expect(result?.result).toBeCloseTo(expected);
      expect(result?.buyIn).toBeCloseTo(expected + 10);
    }
  );

  // Test different re-entry formats
  const reEntryTestCases = [
    { text: 'You made 3 re-entries', expected: 3 },
    { text: '2 re-entries', expected: 2 },
    { text: 're-entered 5 times', expected: 5 },
    { text: '1 time re-entered', expected: 1 }
  ];

  test.each(reEntryTestCases)(
    'should correctly parse re-entry format: "$text"',
    ({ text, expected }) => {
      const fileContent = `Tournament #123456, Test Tournament, Hold'em No Limit
Buy-in: $20+$2
100 Players
Total Prize Pool: $2000
Tournament started 2025/05/18 18:00:00 
10th : Hero, $100
You finished the tournament in 10th place.
${text} and received a total of $100.`;

      const result = parseTournamentSummary(fileContent, 'test.txt');
      expect(result).not.toBeNull();
      expect(result?.reEntries).toBe(expected);
      expect(result?.totalEntries).toBe(expected + 1);
    }
  );

  // Test different Phase tournament naming patterns
  const phaseTestCases = [
    { name: 'Phase-M 55 Global World Festival [Day 1]', category: TournamentCategory.PHASE_DAY_1 },
    { name: 'Phase M Day 1 Tournament', category: TournamentCategory.PHASE_DAY_1 },
    { name: 'Phase#1: World Series Main Event', category: TournamentCategory.PHASE_DAY_1 },
    { name: 'Phase-M 55 Global World Festival [Day 2]', category: TournamentCategory.PHASE_DAY_2_PLUS },
    { name: 'Phase M Day 3 Tournament', category: TournamentCategory.PHASE_DAY_2_PLUS },
    { name: 'Phase#2: World Series Main Event', category: TournamentCategory.PHASE_DAY_2_PLUS },
    { name: 'Final Day: World Series Tournament', category: TournamentCategory.PHASE_DAY_2_PLUS }
  ];

  test.each(phaseTestCases)(
    'should correctly identify phase tournament: "$name"',
    ({ name, category }) => {
      const fileContent = `Tournament #123456, ${name}, Hold'em No Limit
Buy-in: $50+$5
100 Players
Total Prize Pool: $5000
Tournament started 2025/05/18 18:00:00 
10th : Hero, $100
You finished the tournament in 10th place and received a total of $100.`;

      const result = parseTournamentSummary(fileContent, 'test.txt');
      expect(result).not.toBeNull();
      expect(result?.category).toBe(category);
    }
  );
});

// Only run if test-data/generated directory exists with files
if (fs.existsSync(path.join(__dirname, '../../test-data/generated'))) {
  describe('Fuzzing Tests', () => {
    const generatedDir = path.join(__dirname, '../../test-data/generated');
    const files = fs.readdirSync(generatedDir).filter(file => file.startsWith('fuzz_'));
    
    test.each(files)(
      'should parse generated file %s without errors',
      (filename) => {
        const filePath = path.join(generatedDir, filename);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        // Just make sure it doesn't throw an exception
        expect(() => parseTournamentSummary(fileContent, filename)).not.toThrow();
        
        // Additional verification that the parsing produces a valid result
        const result = parseTournamentSummary(fileContent, filename);
        
        // If parsing succeeds, verify basic properties
        if (result) {
          expect(result.name).toBeTruthy();
          expect(result.tournamentId).toBeTruthy();
          expect(typeof result.buyIn).toBe('number');
          expect(typeof result.result).toBe('number');
          expect(result.currencyCode).toBeTruthy();
          
          // Verify that totalEntries = reEntries + 1
          expect(result.totalEntries).toBe(result.reEntries + 1);
          
          // Verify that totalBuyIn = buyIn * totalEntries
          expect(result.totalBuyIn).toBeCloseTo(result.buyIn * result.totalEntries);
        }
      }
    );
  });
}