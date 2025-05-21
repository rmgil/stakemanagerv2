/**
 * Testes de upload de diretórios e processamento de múltiplos arquivos
 */

import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { TournamentCategory, TournamentResult } from '../../shared/schema';

// Mock de funções externas e APIs
jest.mock('../lib/tournamentParser', () => ({
  parseTournamentSummary: jest.fn()
}));

jest.mock('../lib/queryClient', () => ({
  apiRequest: jest.fn()
}));

// Importação após os mocks para que usem as versões mockadas
import { parseTournamentSummary } from '../lib/tournamentParser';
import { apiRequest } from '../lib/queryClient';

describe('Directory Upload Tests', () => {
  beforeEach(() => {
    // Limpa os mocks entre os testes
    jest.clearAllMocks();
  });
  
  test('should handle batch upload of multiple tournament files', async () => {
    // Configurar mocks
    const mockFiles = [
      { name: 'tournament1.txt', text: jest.fn().mockResolvedValue('conteudo1') },
      { name: 'tournament2.txt', text: jest.fn().mockResolvedValue('conteudo2') },
      { name: 'tournament3.txt', text: jest.fn().mockResolvedValue('conteudo3') },
      { name: 'tournament4.txt', text: jest.fn().mockResolvedValue('conteudo4') },
      { name: 'tournament5.txt', text: jest.fn().mockResolvedValue('conteudo5') },
      { name: 'tournament6.txt', text: jest.fn().mockResolvedValue('conteudo6') },
      { name: 'tournament7.txt', text: jest.fn().mockResolvedValue('conteudo7') },
      { name: 'tournament8.txt', text: jest.fn().mockResolvedValue('conteudo8') },
      { name: 'tournament9.txt', text: jest.fn().mockResolvedValue('conteudo9') },
      { name: 'tournament10.txt', text: jest.fn().mockResolvedValue('conteudo10') }
    ];
    
    // Mock do parser para retornar um torneio válido para cada arquivo
    const mockTournamentResults: TournamentResult[] = mockFiles.map((file, index) => ({
      name: `Tournament ${index + 1}`,
      tournamentId: `${index + 100000}`,
      category: TournamentCategory.OTHER_TOURNAMENTS,
      buyIn: 100 + index,
      reEntries: index % 3, // Alguns com re-entries
      totalEntries: 1 + (index % 3),
      totalBuyIn: (100 + index) * (1 + (index % 3)),
      result: index % 2 === 0 ? 500 : -100, // Alternando entre vitória e derrota
      normalDeal: 0,
      automaticSale: 0,
      currencyCode: 'USD',
      conversionRate: 1,
      originalFilename: file.name
    }));
    
    // Configura o mock do parser para retornar os resultados
    mockFiles.forEach((file, index) => {
      (parseTournamentSummary as jest.Mock).mockImplementationOnce(() => mockTournamentResults[index]);
    });
    
    // Mock da resposta da API para simular o servidor
    const mockApiResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        tournaments: mockTournamentResults.map(t => ({ ...t, normalDeal: 300, automaticSale: 200 })),
        summary: {
          totalTournaments: 10,
          netProfit: 2000,
          normalDeal: 3000,
          automaticSale: 2000,
          categories: {
            phaseDay1Count: 0,
            phaseDay2Count: 0,
            otherCurrencyCount: 0,
            otherTournamentsCount: 10
          }
        },
        sessionId: 'test-session-123',
        totalProcessed: 10
      })
    };
    
    (apiRequest as jest.Mock).mockResolvedValue(mockApiResponse);
    
    // Simular função de processamento
    async function processFiles() {
      // Ler o conteúdo de todos os arquivos
      const contents = await Promise.all(mockFiles.map(file => file.text()));
      
      // Parsear cada arquivo
      const results: TournamentResult[] = [];
      for (let i = 0; i < mockFiles.length; i++) {
        const result = parseTournamentSummary(contents[i], mockFiles[i].name);
        if (result) {
          results.push(result);
        }
      }
      
      // Enviar para o backend
      const response = await apiRequest('POST', '/api/tournaments/analyze', {
        tournaments: results
      });
      
      // Verificar se foi bem-sucedido
      const data = await response.json();
      return {
        success: response.ok,
        data
      };
    }
    
    // Executar o teste
    const result = await processFiles();
    
    // Verificações
    expect(result.success).toBe(true);
    expect(parseTournamentSummary).toHaveBeenCalledTimes(10);
    expect(apiRequest).toHaveBeenCalledTimes(1);
    
    // Verificar se todos os torneios foram passados corretamente
    const requestPayload = (apiRequest as jest.Mock).mock.calls[0][2];
    expect(requestPayload.tournaments.length).toBe(10);
    
    // Verificar dados retornados
    expect(result.data.totalProcessed).toBe(10);
    expect(result.data.tournaments.length).toBe(10);
    expect(result.data.sessionId).toBe('test-session-123');
  });
  
  test('should handle partial failures gracefully', async () => {
    // Configurar mocks com alguns arquivos que falham no parsing
    const mockFiles = [
      { name: 'valid1.txt', text: jest.fn().mockResolvedValue('conteudo1') },
      { name: 'invalid.txt', text: jest.fn().mockResolvedValue('conteudo_invalido') },
      { name: 'valid2.txt', text: jest.fn().mockResolvedValue('conteudo2') },
    ];
    
    // Mock do parser para retornar torneios válidos para alguns arquivos e null para outros
    (parseTournamentSummary as jest.Mock)
      .mockImplementationOnce(() => ({
        name: 'Valid Tournament 1',
        tournamentId: '100001',
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
        originalFilename: 'valid1.txt'
      }))
      .mockImplementationOnce(() => null) // Falha no segundo arquivo
      .mockImplementationOnce(() => ({
        name: 'Valid Tournament 2',
        tournamentId: '100002',
        category: TournamentCategory.OTHER_TOURNAMENTS,
        buyIn: 200,
        reEntries: 0,
        totalEntries: 1,
        totalBuyIn: 200,
        result: -200,
        normalDeal: 0,
        automaticSale: 0,
        currencyCode: 'USD',
        conversionRate: 1,
        originalFilename: 'valid2.txt'
      }));
    
    // Mock da resposta da API para simular o servidor
    const mockApiResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        tournaments: [
          {
            name: 'Valid Tournament 1',
            tournamentId: '100001',
            category: TournamentCategory.OTHER_TOURNAMENTS,
            buyIn: 100,
            result: 500,
            normalDeal: 300,
            automaticSale: 200,
            currencyCode: 'USD',
            conversionRate: 1,
            originalFilename: 'valid1.txt'
          },
          {
            name: 'Valid Tournament 2',
            tournamentId: '100002',
            category: TournamentCategory.OTHER_TOURNAMENTS,
            buyIn: 200,
            result: -200,
            normalDeal: 0,
            automaticSale: 200,
            currencyCode: 'USD',
            conversionRate: 1,
            originalFilename: 'valid2.txt'
          }
        ],
        summary: {
          totalTournaments: 2,
          netProfit: 300,
          normalDeal: 300,
          automaticSale: 400,
          categories: {
            phaseDay1Count: 0,
            phaseDay2Count: 0,
            otherCurrencyCount: 0,
            otherTournamentsCount: 2
          }
        },
        sessionId: 'test-session-456',
        totalProcessed: 2,
        failedTournaments: [] // Nenhuma falha no servidor, apenas no parsing
      })
    };
    
    (apiRequest as jest.Mock).mockResolvedValue(mockApiResponse);
    
    // Simular função de processamento
    async function processFiles() {
      // Ler o conteúdo de todos os arquivos
      const contents = await Promise.all(mockFiles.map(file => file.text()));
      
      // Parsear cada arquivo
      const results: TournamentResult[] = [];
      const failures: string[] = [];
      
      for (let i = 0; i < mockFiles.length; i++) {
        const result = parseTournamentSummary(contents[i], mockFiles[i].name);
        if (result) {
          results.push(result);
        } else {
          failures.push(mockFiles[i].name);
        }
      }
      
      // Enviar para o backend
      const response = await apiRequest('POST', '/api/tournaments/analyze', {
        tournaments: results
      });
      
      // Verificar se foi bem-sucedido
      const data = await response.json();
      return {
        success: response.ok,
        data,
        failedParsing: failures
      };
    }
    
    // Executar o teste
    const result = await processFiles();
    
    // Verificações
    expect(result.success).toBe(true);
    expect(parseTournamentSummary).toHaveBeenCalledTimes(3);
    expect(apiRequest).toHaveBeenCalledTimes(1);
    
    // Verificar quais arquivos falharam no parsing
    expect(result.failedParsing).toEqual(['invalid.txt']);
    
    // Verificar se os arquivos válidos foram processados corretamente
    const requestPayload = (apiRequest as jest.Mock).mock.calls[0][2];
    expect(requestPayload.tournaments.length).toBe(2);
    
    // Verificar dados retornados
    expect(result.data.totalProcessed).toBe(2);
    expect(result.data.tournaments.length).toBe(2);
  });
});