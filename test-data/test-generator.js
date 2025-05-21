/**
 * Gerador de arquivos de teste para o parser de torneios
 * 
 * Este script gera arquivos de teste com combinações aleatórias de:
 * - Moedas (USD, EUR, BRL, etc)
 * - Buy-ins
 * - Re-entries (0-10)
 * - Categorias (Phase Day 1, Day 2+, normal)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações para geração de arquivos sintéticos
const CURRENCIES = ['$', '€', '£', '¥', 'R$', 'C$'];
const CURRENCY_CODES = ['USD', 'EUR', 'GBP', 'CNY', 'BRL', 'CAD'];
const TOURNAMENT_TYPES = [
  'Regular', 
  'Phase Day 1', 
  'Phase Day 2', 
  'Bounty Hunters', 
  'Knockout'
];

/**
 * Função para gerar um número aleatório dentro de um intervalo
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Função para selecionar um item aleatório de um array
 */
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Função para formatar valor monetário com separador decimal específico
 */
function formatMoney(amount, useDot = true) {
  return useDot 
    ? amount.toFixed(2) 
    : amount.toFixed(2).replace('.', ',');
}

/**
 * Função para criar um nome de torneio aleatório
 */
function generateTournamentName(isPhase, phaseDay, bounty = false) {
  const series = ["Sunday", "Daily", "Weekly", "Monthly", "Special", "Zodiac"];
  const types = ["Big", "Mega", "Super", "Turbo", "Hyper", "Deepstack", "Main Event"];
  const stakes = ["Low", "Mid", "High", "Ultra"];
  
  const seriesName = randomItem(series);
  const typeName = randomItem(types);
  const stakeName = randomItem(stakes);
  
  if (isPhase) {
    return `Phase-${randomItem(['A', 'B', 'C', 'M', 'H'])}: ${stakeName} ${typeName} ${seriesName} Festival [Day ${phaseDay}]`;
  } else if (bounty) {
    return `${randomInt(100, 999)}-${randomItem(['L', 'M', 'H'])}: ${stakeName} ${typeName} ${seriesName} Bounty Hunters`;
  } else {
    return `${stakeName} ${typeName} ${seriesName}`;
  }
}

/**
 * Função para gerar um arquivo de teste de torneio
 */
function generateTournamentFile(options = {}) {
  // Valores padrão
  const defaults = {
    currency: '$',
    currencyCode: 'USD',
    buyIn: randomInt(10, 1000) + randomInt(0, 99) / 100,
    rake: null, // Se null, será calculado como 10% do buy-in
    bounty: null, // Se null, não terá bounty
    reEntries: randomInt(0, 5),
    isPhase: false,
    phaseDay: 1,
    isWin: randomInt(0, 1) === 1,
    playersCount: randomInt(80, 5000),
    position: randomInt(1, 100),
    useDotForDecimal: true,
    tournamentId: randomInt(100000000, 999999999)
  };
  
  // Mesclar opções fornecidas com os valores padrão
  const config = { ...defaults, ...options };
  
  // Calcular valores derivados
  const rake = config.rake !== null ? config.rake : config.buyIn * 0.1;
  const bounty = config.bounty;
  const hasWon = config.isWin && (!config.isPhase || config.phaseDay > 1);
  
  // Calcular resultado do torneio
  let result;
  if (config.isPhase && config.phaseDay === 1) {
    // Phase Day 1 sempre é perda do buy-in
    result = -(config.buyIn + rake) * (1 + config.reEntries);
  } else if (config.isPhase && config.phaseDay > 1) {
    // Phase Day 2+ tem buy-in lógico de 0
    result = hasWon ? randomInt(50, 10000) + randomInt(0, 99) / 100 : 0;
  } else {
    // Torneios normais
    result = hasWon 
      ? randomInt(config.buyIn, config.buyIn * 100) + randomInt(0, 99) / 100
      : -(config.buyIn + rake) * (1 + config.reEntries);
  }
  
  // Formatar valores monetários
  const formatFunction = (val) => formatMoney(val, config.useDotForDecimal);
  
  // Criar conteúdo do arquivo
  let content = `Tournament #${config.tournamentId}, `;
  
  // Nome do torneio baseado no tipo
  if (config.isPhase) {
    content += generateTournamentName(true, config.phaseDay);
  } else if (bounty) {
    content += generateTournamentName(false, 0, true);
  } else {
    content += generateTournamentName(false, 0, false);
  }
  
  content += `, Hold'em No Limit\n`;
  
  // Buy-in
  content += `Buy-in: ${config.currency}${formatFunction(config.buyIn)}+${config.currency}${formatFunction(rake)}`;
  if (bounty) {
    content += `+${config.currency}${formatFunction(bounty)}`;
  }
  content += '\n';
  
  // Informações do torneio
  content += `${config.playersCount} Players\n`;
  content += `Total Prize Pool: ${config.currency}${formatFunction(config.buyIn * config.playersCount)}\n`;
  content += `Tournament started 2025/${randomInt(1, 12).toString().padStart(2, '0')}/${randomInt(1, 28).toString().padStart(2, '0')} ${randomInt(10, 23)}:${randomInt(0, 59).toString().padStart(2, '0')}:00 \n`;
  
  // Resultado
  if (config.isPhase && config.phaseDay === 1 && hasWon) {
    content += `${config.position}th : Hero, ${config.currency}0 Entry\n`;
    content += `You finished the tournament in ${config.position}th place.\n`;
    content += `You have advanced to Day2 with ${randomInt(10000, 50000)} chips.\n`;
  } else if (config.isPhase && config.phaseDay > 1) {
    content += `${config.position}th : Hero, ${config.currency}${formatFunction(Math.abs(result))}\n`;
    content += `You finished the tournament in ${config.position}th place.\n`;
    content += `You received a total of ${config.currency}${formatFunction(Math.abs(result))}.\n`;
  } else {
    content += `${config.position}th : Hero, ${config.currency}${formatFunction(Math.abs(result))}\n`;
    content += `You finished the tournament in ${config.position}th place.\n`;
    
    // Re-entries
    if (config.reEntries > 0) {
      content += `You made ${config.reEntries} re-entries and `;
    }
    
    if (hasWon) {
      content += `received a total of ${config.currency}${formatFunction(Math.abs(result))}.\n`;
    } else {
      content += `lost a total of ${config.currency}${formatFunction(Math.abs(result))}.\n`;
    }
  }
  
  return content;
}

/**
 * Função para gerar arquivos de teste com diferentes configurações
 */
function generateTestFiles() {
  const testCasesDir = path.join(__dirname, 'generated');
  
  // Criar diretório se não existir
  if (!fs.existsSync(testCasesDir)) {
    fs.mkdirSync(testCasesDir);
  }
  
  // Lista de configurações de teste
  const testCases = [
    // Caso básico - torneio regular em USD
    { currency: '$', currencyCode: 'USD', buyIn: 20, rake: 2, reEntries: 0, isPhase: false },
    
    // Caso com re-entries - torneio com o exemplo específico
    { currency: '$', currencyCode: 'USD', buyIn: 18.4, rake: 1.6, reEntries: 3, isPhase: false, isWin: true, result: 32.7 },
    
    // Casos com diferentes moedas
    { currency: '€', currencyCode: 'EUR', buyIn: 50, rake: 5, reEntries: 0, isPhase: false },
    { currency: '£', currencyCode: 'GBP', buyIn: 30, rake: 3, reEntries: 1, isPhase: false },
    { currency: '¥', currencyCode: 'CNY', buyIn: 100, rake: 10, reEntries: 2, isPhase: false },
    { currency: 'R$', currencyCode: 'BRL', buyIn: 100, rake: 10, reEntries: 0, isPhase: false, useDotForDecimal: false },
    
    // Casos com torneios de Phase Day 1
    { currency: '$', currencyCode: 'USD', buyIn: 50, rake: 5, reEntries: 0, isPhase: true, phaseDay: 1, isWin: true },
    { currency: '€', currencyCode: 'EUR', buyIn: 100, rake: 10, reEntries: 1, isPhase: true, phaseDay: 1, isWin: true },
    
    // Casos com torneios de Phase Day 2+
    { currency: '$', currencyCode: 'USD', buyIn: 50, rake: 5, reEntries: 0, isPhase: true, phaseDay: 2, isWin: true },
    { currency: '€', currencyCode: 'EUR', buyIn: 100, rake: 10, reEntries: 0, isPhase: true, phaseDay: 2, isWin: false },
    
    // Casos com bounty
    { currency: '$', currencyCode: 'USD', buyIn: 20, rake: 2, bounty: 20, reEntries: 0, isPhase: false },
    { currency: '€', currencyCode: 'EUR', buyIn: 50, rake: 5, bounty: 50, reEntries: 1, isPhase: false }
  ];
  
  // Gerar os arquivos de teste com as configurações definidas
  testCases.forEach((config, index) => {
    const content = generateTournamentFile(config);
    const currencyCode = config.currencyCode || 'USD';
    
    let fileName = `test${index + 1}_`;
    
    if (config.isPhase) {
      fileName += `phase_day${config.phaseDay}_`;
    }
    
    if (config.bounty) {
      fileName += 'bounty_';
    }
    
    fileName += currencyCode.toLowerCase();
    
    if (config.reEntries > 0) {
      fileName += `_${config.reEntries}re`;
    }
    
    fileName += '.txt';
    
    const filePath = path.join(testCasesDir, fileName);
    fs.writeFileSync(filePath, content);
    console.log(`Arquivo gerado: ${fileName}`);
  });
  
  // Gerar 100 casos de teste aleatórios para fuzzing
  console.log('\nGerando 100 casos de teste aleatórios para fuzzing...');
  
  for (let i = 0; i < 100; i++) {
    // Gerar configurações aleatórias
    const isPhase = Math.random() > 0.7;
    const phaseDay = isPhase ? (Math.random() > 0.5 ? 1 : 2) : 0;
    const hasBounty = !isPhase && Math.random() > 0.7;
    
    const config = {
      currency: randomItem(CURRENCIES),
      currencyCode: randomItem(CURRENCY_CODES),
      buyIn: randomInt(5, 1000) + randomInt(0, 99) / 100,
      rake: randomInt(1, 100) + randomInt(0, 99) / 100,
      bounty: hasBounty ? randomInt(10, 500) : null,
      reEntries: randomInt(0, 10),
      isPhase,
      phaseDay,
      useDotForDecimal: Math.random() > 0.2
    };
    
    const content = generateTournamentFile(config);
    const filePath = path.join(testCasesDir, `fuzz_${i + 1}.txt`);
    fs.writeFileSync(filePath, content);
  }
  
  console.log('100 arquivos de fuzzing gerados com sucesso!');
  console.log(`Total de arquivos gerados: ${testCases.length + 100}`);
}

// Executar geração de arquivos
generateTestFiles();