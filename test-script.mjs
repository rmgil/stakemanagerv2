import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importar diretamente dos arquivos .ts
import { parseTournamentSummary } from './client/src/lib/tournamentParser.ts';
import { calculateSingleTournamentDistribution } from './client/src/lib/calculationUtils.ts';
import { TournamentCategory } from './shared/schema.ts';

// Mock player level para testes
const TEST_PLAYER_LEVEL = {
  level: "3.1",
  levelProgress: 0.65,
  levelProgressPercentage: 65,
  normalLimit: 100,
  phaseLimit: 150
};

// Função para ler arquivos de teste
const loadTestFile = (filename) => {
  const filePath = path.join(__dirname, 'test-data', filename);
  return fs.readFileSync(filePath, 'utf8');
};

// Validação de teste
function runTest(filename, description) {
  console.log(`\n🔍 TESTE: ${description}`);
  
  try {
    const fileContent = loadTestFile(filename);
    const result = parseTournamentSummary(fileContent, filename);
    
    if (!result) {
      console.error("❌ Parse falhou, resultado é null");
      return;
    }
    
    console.log("📊 Resultado do parse:");
    console.log(`- Nome: ${result.name}`);
    console.log(`- Categoria: ${result.category}`);
    console.log(`- Buy-in: $${result.buyIn.toFixed(2)}`);
    console.log(`- Re-entries: ${result.reEntries || 0}`);
    console.log(`- Total de entradas: ${result.totalEntries || 1}`);
    console.log(`- Buy-in total: $${(result.totalBuyIn || (result.buyIn * (result.totalEntries || 1))).toFixed(2)}`);
    console.log(`- Resultado: $${result.result.toFixed(2)}`);
    
    // Calcular distribuições
    const { normalDeal, automaticSale } = calculateSingleTournamentDistribution(result, TEST_PLAYER_LEVEL);
    console.log("\n💰 Distribuição financeira:");
    console.log(`- Normal Deal: $${normalDeal.toFixed(2)}`);
    console.log(`- Venda Automática: $${automaticSale.toFixed(2)}`);
    console.log(`- Total distribuído: $${(normalDeal + automaticSale).toFixed(2)}`);
    
    return result;
  } catch (error) {
    console.error(`❌ Erro ao processar ${filename}:`, error);
  }
}

// Executar testes para cada arquivo
console.log("🧪 INICIANDO TESTES DOS ARQUIVOS DE EXEMPLO");

// Teste 1: Torneio em Yuan
runTest('GG20250505_chinese_yuan.txt', 'Torneio em Yuan (categoria: OTHER_CURRENCY)');

// Teste 2: Torneio Phase Day 1
runTest('GG20250511_phase_day1.txt', 'Torneio Phase Day 1');

// Teste 3: Torneio Phase Day 2+
runTest('GG20250512_phase_day2.txt', 'Torneio Phase Day 2+');

// Teste 4: Torneio com Re-entries
const reEntriesResult = runTest('GG20250518_with_reentries.txt', 'Torneio com 3 re-entries ($20 × 4 = $80 total)');

// Teste 5: Torneio Bounty
runTest('GG20250518_bounty_hunters.txt', 'Torneio Bounty');

// Verificação específica do caso de teste principal com re-entries
if (reEntriesResult) {
  console.log("\n✅ VERIFICAÇÃO DO CASO DE RE-ENTRIES");
  console.log(`Buy-in original: $${reEntriesResult.buyIn.toFixed(2)}`);
  console.log(`Re-entries detectados: ${reEntriesResult.reEntries}`);
  console.log(`Total de entradas: ${reEntriesResult.totalEntries}`);
  console.log(`Buy-in total: $${(reEntriesResult.totalBuyIn || (reEntriesResult.buyIn * reEntriesResult.totalEntries)).toFixed(2)}`);
  
  // Verificar se o caso de teste específico está correto ($18.4+$1.6, 3 re-entries)
  if (Math.abs(reEntriesResult.buyIn - 20) < 0.1 && reEntriesResult.reEntries === 3 && reEntriesResult.totalEntries === 4) {
    console.log("✓ O caso de teste com re-entries está correto!");
    console.log("✓ Buy-in: $20.00 × 4 entradas = $80.00 total");
  } else {
    console.log("❌ O caso de teste com re-entries não corresponde ao esperado!");
    console.log(`Esperado: buy-in $20.00, 3 re-entries, 4 entradas no total`);
    console.log(`Recebido: buy-in $${reEntriesResult.buyIn.toFixed(2)}, ${reEntriesResult.reEntries} re-entries, ${reEntriesResult.totalEntries} entradas`);
  }
}

console.log("\n🏁 TESTES CONCLUÍDOS");