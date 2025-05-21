import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { UploadedFile, FileWithPath } from '@/types';
import { parseTournamentSummary } from '@/lib/tournamentParser';
import { TournamentResult } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { convertToUSD } from '@/lib/currencyConverter';

export function useFileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [parsedTournaments, setParsedTournaments] = useState<TournamentResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [processingSuccess, setProcessingSuccess] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const addFiles = useCallback((newFiles: FileWithPath[]) => {
    const filteredFiles = newFiles.filter(
      file => file.name.endsWith('.txt') && !files.some(f => f.name === file.name)
    );

    const newUploadedFiles = filteredFiles.map(file => ({
      file,
      id: uuidv4(),
      name: file.name,
      status: 'idle' as const,
      parsed: false
    }));

    setFiles(prev => [...prev, ...newUploadedFiles]);
  }, [files]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setParsedTournaments([]);
    setProcessingSuccess(false);
    setProcessingError(null);
    setSessionId(null);
  }, []);

  const processFiles = useCallback(async () => {
    if (files.length === 0) {
      setProcessingError('Por favor adicione pelo menos um arquivo para processar.');
      return;
    }

    setIsProcessing(true);
    setProcessingError(null);
    setProcessingSuccess(false);
    
    try {
      const filesToProcess = files.filter(f => !f.parsed);
      const results: TournamentResult[] = [];
      
      // First parse all files
      for (const fileData of filesToProcess) {
        try {
          fileData.status = 'uploading';
          setFiles(prev => prev.map(f => f.id === fileData.id ? fileData : f));
          
          // Read file content
          const content = await fileData.file.text();
          
          // Parse tournament data
          const tournament = parseTournamentSummary(content, fileData.file.name);
          
          if (tournament) {
            // If not USD, convert the amounts
            if (tournament.currencyCode !== 'USD') {
              const { amount: buyInUSD, rate } = await convertToUSD(tournament.buyIn, tournament.currencyCode);
              const resultUSD = tournament.result * rate;
              
              tournament.buyIn = buyInUSD;
              tournament.result = resultUSD;
              tournament.conversionRate = rate;
            }
            
            results.push(tournament);
            fileData.status = 'success';
            fileData.parsed = true;
          } else {
            fileData.status = 'error';
            fileData.error = 'Não foi possível reconhecer este arquivo como um resumo de torneio válido.';
          }
        } catch (error) {
          fileData.status = 'error';
          fileData.error = error instanceof Error ? error.message : 'Erro ao processar arquivo';
        }
        
        // Update file status
        setFiles(prev => prev.map(f => f.id === fileData.id ? fileData : f));
      }
      
      if (results.length > 0) {
        // Combine with previously parsed tournaments
        setParsedTournaments(prev => [...prev, ...results]);
        
        // Send to server for processing
        const response = await apiRequest('POST', '/api/tournaments/analyze', {
          tournaments: results
        });
        
        if (response.ok) {
          const data = await response.json();
          setParsedTournaments(data.tournaments);
          setSessionId(data.sessionId);
          setProcessingSuccess(true);
        } else {
          const errorData = await response.json();
          setProcessingError(errorData.message || 'Erro ao processar no servidor');
        }
      } else {
        setProcessingError('Nenhum arquivo válido foi encontrado para processar.');
      }
    } catch (error) {
      setProcessingError(error instanceof Error ? error.message : 'Erro ao processar arquivos');
    } finally {
      setIsProcessing(false);
    }
  }, [files]);

  const submitToTracker = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      const response = await apiRequest('POST', `/api/sessions/${sessionId}/submit`);
      
      if (response.ok) {
        const data = await response.json();
        setProcessingSuccess(true);
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao enviar para o tracker');
      }
    } catch (error) {
      setProcessingError(error instanceof Error ? error.message : 'Erro ao enviar para o tracker');
      throw error;
    }
  }, [sessionId]);

  const exportCsv = useCallback(() => {
    if (parsedTournaments.length === 0) return;
    
    // We'll make a server request to get the formatted CSV
    apiRequest('GET', `/api/tournaments/export?sessionId=${sessionId}`)
      .then(response => response.blob())
      .then(blob => {
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `polarize-tournaments-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch(error => {
        setProcessingError('Erro ao exportar CSV: ' + (error instanceof Error ? error.message : String(error)));
      });
  }, [parsedTournaments, sessionId]);

  return {
    files,
    parsedTournaments,
    isProcessing,
    processingError,
    processingSuccess,
    sessionId,
    addFiles,
    removeFile,
    clearFiles,
    processFiles,
    submitToTracker,
    exportCsv
  };
}
