import React from 'react';
import { SummaryResult, TournamentResult } from '@shared/schema';
import TournamentTable from './TournamentTable';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';

interface ResultsPanelProps {
  summary: SummaryResult;
  tournaments: TournamentResult[];
  onExportCsv: () => void;
  submittedToPolarize: boolean;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ 
  summary, 
  tournaments, 
  onExportCsv,
  submittedToPolarize
}) => {
  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Total Results Card */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Resumo Total
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Torneios Processados</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.totalTournaments}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Resultado Líquido</p>
                <p className={`text-2xl font-semibold ${
                  summary.netProfit >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  ${summary.netProfit.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Deal Normal (50/50):</span>
                <span className="font-medium text-gray-900">${summary.normalDeal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Venda Automática:</span>
                <span className="font-medium text-gray-900">${summary.automaticSale.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Categories Distribution Card */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Distribuição por Categoria
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 rounded-full bg-primary-500 mr-2"></div>
                  <span className="text-sm text-gray-700">Phase Day 1</span>
                </div>
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 rounded-full bg-success-500 mr-2"></div>
                  <span className="text-sm text-gray-700">Phase Day 2+</span>
                </div>
              </div>
              <div>
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 rounded-full bg-warning-500 mr-2"></div>
                  <span className="text-sm text-gray-700">Outras Moedas</span>
                </div>
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 rounded-full bg-accent-500 mr-2"></div>
                  <span className="text-sm text-gray-700">Outros Torneios</span>
                </div>
              </div>
            </div>
            
            {/* Simple chart representation */}
            <div className="mt-4 h-8 bg-gray-200 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-primary-500" 
                style={{ width: `${summary.categories.phaseDay1Percentage}%` }}
              ></div>
              <div 
                className="h-full bg-success-500" 
                style={{ width: `${summary.categories.phaseDay2Percentage}%` }}
              ></div>
              <div 
                className="h-full bg-warning-500" 
                style={{ width: `${summary.categories.otherCurrencyPercentage}%` }}
              ></div>
              <div 
                className="h-full bg-accent-500" 
                style={{ width: `${summary.categories.otherTournamentsPercentage}%` }}
              ></div>
            </div>
            
            <div className="grid grid-cols-4 gap-2 mt-2 text-xs text-center">
              <div>{summary.categories.phaseDay1Count}</div>
              <div>{summary.categories.phaseDay2Count}</div>
              <div>{summary.categories.otherCurrencyCount}</div>
              <div>{summary.categories.otherTournamentsCount}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tournaments Table */}
      <TournamentTable tournaments={tournaments} onExportCsv={onExportCsv} />
      
      {/* Success/Confirmation Message */}
      {submittedToPolarize && (
        <div className="mt-6">
          <Alert className="bg-green-50 border-l-4 border-success-500">
            <CheckCircle className="h-4 w-4 text-success-500" />
            <AlertDescription className="text-sm text-green-700">
              Os resultados foram enviados com sucesso para o Tracker Polarize.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};

export default ResultsPanel;
