import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import FileUploader from '@/components/FileUploader';
import PlayerLevelCard from '@/components/PlayerLevelCard';
import EmptyState from '@/components/EmptyState';
import ProcessingState from '@/components/ProcessingState';
import ResultsPanel from '@/components/ResultsPanel';
import { useFileUpload } from '@/hooks/useFileUpload';
import { usePlayerLevel } from '@/hooks/usePlayerLevel';
import { calculateSummary } from '@/lib/calculationUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const Home: React.FC = () => {
  const {
    files,
    parsedTournaments,
    isProcessing,
    processingError,
    processingSuccess,
    addFiles,
    removeFile,
    processFiles,
    exportCsv
  } = useFileUpload();

  const { playerLevel, isLoading: isLoadingPlayer } = usePlayerLevel();
  
  const [summary, setSummary] = useState(() => 
    calculateSummary(parsedTournaments)
  );
  
  useEffect(() => {
    setSummary(calculateSummary(parsedTournaments));
  }, [parsedTournaments]);
  
  return (
    <Layout>
      {/* Info Alert */}
      <Alert className="mb-6 bg-blue-50 border-l-4 border-primary-500 text-blue-700">
        <AlertCircle className="h-4 w-4 text-primary-500" />
        <AlertDescription className="text-sm text-blue-700">
          Arraste e solte arquivos .txt de "Tournament Summary" do GGNetwork para análise automática.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Panel - Upload Section */}
        <div className="md:col-span-1">
          <FileUploader
            files={files}
            onAddFiles={addFiles}
            onRemoveFile={removeFile}
            onProcessFiles={processFiles}
            isProcessing={isProcessing}
            error={processingError}
          />
          
          <PlayerLevelCard 
            playerLevel={playerLevel} 
            isLoading={isLoadingPlayer} 
          />
        </div>

        {/* Right Panel - Results Section */}
        <div className="md:col-span-2">
          {isProcessing ? (
            <ProcessingState />
          ) : parsedTournaments.length > 0 ? (
            <ResultsPanel 
              summary={summary}
              tournaments={parsedTournaments}
              onExportCsv={exportCsv}
              submittedToPolarize={processingSuccess}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Home;
