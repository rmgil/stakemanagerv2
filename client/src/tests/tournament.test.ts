import fs from 'fs';
import path from 'path';
import { 
  parseTournamentSummary 
} from '../lib/tournamentParser';
import { 
  calculateSingleTournamentDistribution,
  calculateTournamentDistributions
} from '../lib/calculationUtils';
import { 
  PlayerLevel, 
  TournamentCategory 
} from '@shared/schema';

// Mock player level para testes
const TEST_PLAYER_LEVEL: PlayerLevel = {
  level: "3.1",
  levelProgress: 0.65,
  levelProgressPercentage: 65,
  normalLimit: 100,
  phaseLimit: 150
};

describe('Testes de processamento de torneios com re-entries', () => {
  // Carregar arquivos de exemplo
  const loadTestFile = (filename: string): string => {
    const filePath = path.join(process.cwd(), 'test-data', filename);
    return fs.readFileSync(filePath, 'utf8');
  };

  test('Deve processar torneio em Yuan corretamente', () => {
    const fileContent = loadTestFile('GG20250505_chinese_yuan.txt');
    const result = parseTournamentSummary(fileContent, 'GG20250505_chinese_yuan.txt');
    
    expect(result).not.toBeNull();
    if (result) {
      expect(result.name).toBe('Zodiac Dog Ultra Deepstack 7-Max ¥110 [Turbo]');
      expect(result.category).toBe(TournamentCategory.OTHER_CURRENCY);
      expect(result.buyIn).toBeCloseTo(110, 0);  // Yuan convertido aproximadamente para USD
      expect(result.result).toBeCloseTo(302.9, 1);
      expect(result.currencyCode).toBe('¥');
      expect(result.reEntries).toBe(0);
      expect(result.totalEntries).toBe(1);
      
      // Calcular distribuições com player level de teste
      const { normalDeal, automaticSale } = calculateSingleTournamentDistribution(result, TEST_PLAYER_LEVEL);
      
      // O buy-in está em Yuan, mas consideramos o limite em USD
      // Como é outro currency, os limites são aplicados ao valor convertido
      expect(normalDeal + automaticSale).toBeCloseTo(302.9, 1);
    }
  });

  test('Deve processar torneio Phase Day 1 corretamente', () => {
    const fileContent = loadTestFile('GG20250511_phase_day1.txt');
    const result = parseTournamentSummary(fileContent, 'GG20250511_phase_day1.txt');
    
    expect(result).not.toBeNull();
    if (result) {
      expect(result.name).toBe('Phase-M: $55 Global World Festival [Day 1]');
      expect(result.category).toBe(TournamentCategory.PHASE_DAY_1);
      expect(result.buyIn).toBeCloseTo(55, 0);
      expect(result.result).toBeCloseTo(-55, 0); // Phase Day 1 é sempre um prejuízo
      expect(result.reEntries).toBe(0);
      expect(result.totalEntries).toBe(1);
      
      // Calcular distribuições com player level de teste
      const { normalDeal, automaticSale } = calculateSingleTournamentDistribution(result, TEST_PLAYER_LEVEL);
      
      // Para Phase Day 1, normalDeal deve ser -phaseLimit/2
      expect(normalDeal).toBeCloseTo(-TEST_PLAYER_LEVEL.phaseLimit / 2, 1);
      // A soma deve ser igual ao resultado (perda)
      expect(normalDeal + automaticSale).toBeCloseTo(-55, 0);
    }
  });

  test('Deve processar torneio Phase Day 2 corretamente', () => {
    const fileContent = loadTestFile('GG20250512_phase_day2.txt');
    const result = parseTournamentSummary(fileContent, 'GG20250512_phase_day2.txt');
    
    expect(result).not.toBeNull();
    if (result) {
      expect(result.name).toBe('Phase-M: $55 Global World Festival [Day 2]');
      expect(result.category).toBe(TournamentCategory.PHASE_DAY_2_PLUS);
      expect(result.buyIn).toBeCloseTo(0, 0); // Day 2 tem buy-in lógico de 0
      expect(result.result).toBeCloseTo(113.44, 2);
      expect(result.reEntries).toBe(0);
      expect(result.totalEntries).toBe(1);
      
      // Calcular distribuições com player level de teste
      const { normalDeal, automaticSale } = calculateSingleTournamentDistribution(result, TEST_PLAYER_LEVEL);
      
      // Para Phase Day 2+, o resultado é dividido 50/50
      expect(normalDeal).toBeCloseTo(113.44 / 2, 2);
      expect(automaticSale).toBeCloseTo(113.44 / 2, 2);
      expect(normalDeal + automaticSale).toBeCloseTo(113.44, 2);
    }
  });

  test('Deve processar torneio com re-entries corretamente', () => {
    const fileContent = loadTestFile('GG20250518_with_reentries.txt');
    const result = parseTournamentSummary(fileContent, 'GG20250518_with_reentries.txt');
    
    expect(result).not.toBeNull();
    if (result) {
      expect(result.name).toBe('Sunday Big $20');
      expect(result.category).toBe(TournamentCategory.OTHER_TOURNAMENTS);
      expect(result.buyIn).toBeCloseTo(20, 0);
      expect(result.result).toBeCloseTo(32.7, 1);
      expect(result.reEntries).toBe(3); // Deve detectar 3 re-entries
      expect(result.totalEntries).toBe(4); // 1 original + 3 re-entries
      expect(result.totalBuyIn).toBeCloseTo(80, 0); // $20 * 4 entradas
      
      // Calcular distribuições com player level de teste
      const { normalDeal, automaticSale } = calculateSingleTournamentDistribution(result, TEST_PLAYER_LEVEL);
      
      // Distribuição do lucro considerando buy-in total
      expect(normalDeal + automaticSale).toBeCloseTo(32.7, 1);
    }
  });

  test('Deve processar torneio bounty corretamente', () => {
    const fileContent = loadTestFile('GG20250518_bounty_hunters.txt');
    const result = parseTournamentSummary(fileContent, 'GG20250518_bounty_hunters.txt');
    
    expect(result).not.toBeNull();
    if (result) {
      expect(result.name).toBe('132-M: $55 Bounty Hunters Sunday Main Event, $1M GTD');
      expect(result.category).toBe(TournamentCategory.OTHER_TOURNAMENTS);
      expect(result.buyIn).toBeCloseTo(55, 0); // $25.6+$4.4+$25
      expect(result.result).toBeCloseTo(18.75, 2);
      expect(result.reEntries).toBe(0);
      expect(result.totalEntries).toBe(1);
      
      // Calcular distribuições com player level de teste
      const { normalDeal, automaticSale } = calculateSingleTournamentDistribution(result, TEST_PLAYER_LEVEL);
      
      // Distribuição do lucro considerando limites
      expect(normalDeal + automaticSale).toBeCloseTo(18.75, 2);
    }
  });
});