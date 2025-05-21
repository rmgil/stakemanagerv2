import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseTournamentSummary } from '../client/src/lib/tournamentParser.js';
import { calculateSingleTournamentDistribution } from '../client/src/lib/calculationUtils.js';
import { PlayerLevel, TournamentCategory } from '../shared/schema.js';

// Configuração para ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock player level para testes
const TEST_PLAYER_LEVEL: PlayerLevel = {
  level: "3.1",
  levelProgress: 0.65,
  levelProgressPercentage: 65,
  normalLimit: 100,
  phaseLimit: 150
};

// Função para ler arquivos de teste
const loadTestFile = (filename: string): string => {
  const filePath = path.join(__dirname, '..', 'test-data', filename);
  return fs.readFileSync(filePath, 'utf8');
};

// Função para validar um resultado
function validateResult(expected: any, actual: any, label: string) {
  if (expected !== actual) {
    console.error(`❌ ${label} falhou! Esperado: ${expected}, Recebido: ${actual}`);
    return false;
  }
  console.log(`✅ ${label} passou! Valor: ${actual}`);
  return true;
}

// Função para validar números próximos
function validateClose(expected: number, actual: number, precision: number, label: string) {
  if (Math.abs(expected - actual) > Math.pow(10, -precision)) {
    console.error(`❌ ${label} falhou! Esperado aproximadamente: ${expected}, Recebido: ${actual}`);
    return false;
  }
  console.log(`✅ ${label} passou! Valor: ${actual} (esperado ~${expected})`);
  return true;
}

// Teste 1: Torneio em Yuan (Moeda diferente)
console.log("\n🔍 TESTE 1: Torneio em Yuan (Moeda diferente)");
try {
  const fileContent = loadTestFile('GG20250505_chinese_yuan.txt');
  const result = parseTournamentSummary(fileContent, 'GG20250505_chinese_yuan.txt');
  
  if (!result) {
    console.error("❌ Parse falhou, resultado é null");
  } else {
    validateResult('Zodiac Dog Ultra Deepstack 7-Max ¥110 [Turbo]', result.name, "Nome do torneio");
    validateResult(TournamentCategory.OTHER_CURRENCY, result.category, "Categoria");
    validateClose(110, result.buyIn, 0, "Buy-in (convertido)");
    validateClose(302.9, result.result, 1, "Resultado");
    validateResult('¥', result.currencyCode, "Moeda");
    validateResult(0, result.reEntries, "Re-entries");
    validateResult(1, result.totalEntries, "Total de entradas");
    
    // Calcular distribuições
    const { normalDeal, automaticSale } = calculateSingleTournamentDistribution(result, TEST_PLAYER_LEVEL);
    validateClose(302.9, normalDeal + automaticSale, 1, "Distribuição total");
  }
} catch (error) {
  console.error("❌ Erro ao processar teste 1:", error);
}

// Teste 2: Torneio Phase Day 1
console.log("\n🔍 TESTE 2: Torneio Phase Day 1");
try {
  const fileContent = loadTestFile('GG20250511_phase_day1.txt');
  const result = parseTournamentSummary(fileContent, 'GG20250511_phase_day1.txt');
  
  if (!result) {
    console.error("❌ Parse falhou, resultado é null");
  } else {
    validateResult('Phase-M: $55 Global World Festival [Day 1]', result.name, "Nome do torneio");
    validateResult(TournamentCategory.PHASE_DAY_1, result.category, "Categoria");
    validateClose(55, result.buyIn, 0, "Buy-in");
    validateClose(-55, result.result, 0, "Resultado (sempre prejuízo em Phase Day 1)");
    validateResult(0, result.reEntries, "Re-entries");
    validateResult(1, result.totalEntries, "Total de entradas");
    
    // Calcular distribuições
    const { normalDeal, automaticSale } = calculateSingleTournamentDistribution(result, TEST_PLAYER_LEVEL);
    validateClose(-TEST_PLAYER_LEVEL.phaseLimit / 2, normalDeal, 1, "Normal Deal (phaseLimit/2)");
    validateClose(-55, normalDeal + automaticSale, 0, "Distribuição total (deve igualar a perda)");
  }
} catch (error) {
  console.error("❌ Erro ao processar teste 2:", error);
}

// Teste 3: Torneio Phase Day 2+
console.log("\n🔍 TESTE 3: Torneio Phase Day 2+");
try {
  const fileContent = loadTestFile('GG20250512_phase_day2.txt');
  const result = parseTournamentSummary(fileContent, 'GG20250512_phase_day2.txt');
  
  if (!result) {
    console.error("❌ Parse falhou, resultado é null");
  } else {
    validateResult('Phase-M: $55 Global World Festival [Day 2]', result.name, "Nome do torneio");
    validateResult(TournamentCategory.PHASE_DAY_2_PLUS, result.category, "Categoria");
    // Buy-in lógico de 0 para Day 2
    validateClose(0, result.buyIn, 0, "Buy-in lógico (deve ser 0 para Day 2+)");
    validateClose(113.44, result.result, 2, "Resultado");
    validateResult(0, result.reEntries, "Re-entries");
    validateResult(1, result.totalEntries, "Total de entradas");
    
    // Calcular distribuições
    const { normalDeal, automaticSale } = calculateSingleTournamentDistribution(result, TEST_PLAYER_LEVEL);
    validateClose(113.44 / 2, normalDeal, 2, "Normal Deal (50% do lucro)");
    validateClose(113.44 / 2, automaticSale, 2, "Automatic Sale (50% do lucro)");
    validateClose(113.44, normalDeal + automaticSale, 2, "Distribuição total (igual ao lucro)");
  }
} catch (error) {
  console.error("❌ Erro ao processar teste 3:", error);
}

// Teste 4: Torneio com Re-entries
console.log("\n🔍 TESTE 4: Torneio com Re-entries");
try {
  const fileContent = loadTestFile('GG20250518_with_reentries.txt');
  const result = parseTournamentSummary(fileContent, 'GG20250518_with_reentries.txt');
  
  if (!result) {
    console.error("❌ Parse falhou, resultado é null");
  } else {
    validateResult('Sunday Big $20', result.name, "Nome do torneio");
    validateResult(TournamentCategory.OTHER_TOURNAMENTS, result.category, "Categoria");
    validateClose(20, result.buyIn, 0, "Buy-in individual");
    validateClose(32.7, result.result, 1, "Resultado");
    validateResult(3, result.reEntries, "Re-entries (deve detectar 3)");
    validateResult(4, result.totalEntries, "Total de entradas (1 + 3 re-entries)");
    validateClose(80, result.totalBuyIn || (result.buyIn * result.totalEntries), 0, "Buy-in total ($20 * 4)");
    
    // Calcular distribuições considerando o buy-in total
    const { normalDeal, automaticSale } = calculateSingleTournamentDistribution(result, TEST_PLAYER_LEVEL);
    validateClose(32.7, normalDeal + automaticSale, 1, "Distribuição total (igual ao lucro)");
  }
} catch (error) {
  console.error("❌ Erro ao processar teste 4:", error);
}

// Teste 5: Torneio Bounty
console.log("\n🔍 TESTE 5: Torneio Bounty");
try {
  const fileContent = loadTestFile('GG20250518_bounty_hunters.txt');
  const result = parseTournamentSummary(fileContent, 'GG20250518_bounty_hunters.txt');
  
  if (!result) {
    console.error("❌ Parse falhou, resultado é null");
  } else {
    validateResult('132-M: $55 Bounty Hunters Sunday Main Event, $1M GTD', result.name, "Nome do torneio");
    validateResult(TournamentCategory.OTHER_TOURNAMENTS, result.category, "Categoria");
    validateClose(55, result.buyIn, 0, "Buy-in ($25.6+$4.4+$25)");
    validateClose(18.75, result.result, 2, "Resultado");
    validateResult(0, result.reEntries, "Re-entries");
    validateResult(1, result.totalEntries, "Total de entradas");
    
    // Calcular distribuições
    const { normalDeal, automaticSale } = calculateSingleTournamentDistribution(result, TEST_PLAYER_LEVEL);
    validateClose(18.75, normalDeal + automaticSale, 2, "Distribuição total (igual ao lucro)");
  }
} catch (error) {
  console.error("❌ Erro ao processar teste 5:", error);
}

console.log("\n🔍 RESUMO DOS TESTES");
console.log("Verifique acima os resultados de cada teste para validar o processamento de re-entries.");