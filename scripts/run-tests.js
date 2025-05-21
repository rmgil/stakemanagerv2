/**
 * Script para executar testes do parser e validar o funcionamento do sistema
 * 
 * Este script executa os testes do parser de torneios e verifica a consistência
 * dos resultados com base nos arquivos gerados automaticamente.
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cores para saída no console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

/**
 * Verifica se os arquivos de teste foram gerados
 */
function checkTestFiles() {
  const generatedPath = path.join(__dirname, '../test-data/generated');
  
  if (!fs.existsSync(generatedPath)) {
    console.log(`${colors.yellow}Pasta de testes gerados não encontrada.${colors.reset}`);
    console.log(`${colors.yellow}Gerando arquivos de teste...${colors.reset}`);
    
    try {
      // Tenta criar o diretório se não existir
      if (!fs.existsSync(path.join(__dirname, '../test-data'))) {
        fs.mkdirSync(path.join(__dirname, '../test-data'));
      }
      
      // Executa o gerador de testes
      exec('node test-data/test-generator.js', (error, stdout, stderr) => {
        if (error) {
          console.error(`${colors.red}Erro ao gerar arquivos de teste:${colors.reset}`, error);
          return;
        }
        
        console.log(stdout);
        runTests();
      });
    } catch (error) {
      console.error(`${colors.red}Erro ao gerar arquivos de teste:${colors.reset}`, error);
      process.exit(1);
    }
  } else {
    // Verifica se existem arquivos na pasta
    const files = fs.readdirSync(generatedPath);
    if (files.length === 0) {
      console.log(`${colors.yellow}Nenhum arquivo de teste encontrado. Gerando...${colors.reset}`);
      exec('node test-data/test-generator.js', (error, stdout, stderr) => {
        if (error) {
          console.error(`${colors.red}Erro ao gerar arquivos de teste:${colors.reset}`, error);
          return;
        }
        
        console.log(stdout);
        runTests();
      });
    } else {
      console.log(`${colors.green}Encontrados ${files.length} arquivos de teste.${colors.reset}`);
      runTests();
    }
  }
}

/**
 * Executa os testes com Jest
 */
function runTests() {
  console.log(`\n${colors.cyan}${colors.bright}Executando testes...${colors.reset}\n`);
  
  // Executa os testes
  exec('npx jest --colors', (error, stdout, stderr) => {
    if (error) {
      console.error(`${colors.red}Falha nos testes:${colors.reset}`);
      console.log(stdout);
      process.exit(1);
    }
    
    // Exibe resultados
    console.log(stdout);
    console.log(`\n${colors.green}${colors.bright}Todos os testes passaram com sucesso!${colors.reset}\n`);
    
    // Estatísticas
    const matches = stdout.match(/(\d+) tests passed/);
    if (matches) {
      const numTests = parseInt(matches[1], 10);
      console.log(`${colors.cyan}Total de testes executados: ${colors.green}${numTests}${colors.reset}`);
    }
    
    console.log(`\n${colors.yellow}${colors.bright}Importante:${colors.reset} Se você modificar o parser ou os cálculos, execute este script novamente para garantir que tudo continua funcionando corretamente.\n`);
  });
}

// Iniciar processo de teste
console.log(`\n${colors.cyan}${colors.bright}Verificação do Sistema de Parser de Torneios${colors.reset}\n`);
console.log(`${colors.cyan}Este script verifica se o parser e os cálculos estão funcionando corretamente.${colors.reset}`);

checkTestFiles();