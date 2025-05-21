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
                <p className="text-2xl font-semibold text-gray-900">
                  {/* Total de torneios + re-entries */}
                  {tournaments.reduce((total, t) => total + (t.totalEntries || 1), 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Investimento Total</p>
                <p className="text-2xl font-semibold text-blue-600">
                  {/* Soma de todos os buy-ins, incluindo re-entries */}
                  ${tournaments.reduce((total, t) => total + (t.totalBuyIn || t.buyIn), 0).toFixed(2)}
                </p>
              </div>
            </div>
            
            {/* Novo campo para Balanço Final (prêmios - investimento) */}
            <div className="mt-4 border-t border-gray-200 pt-4">
              {/* Cálculo: total de prêmios (sum de result onde result > 0) - investimento total */}
              {(() => {
                const totalInvestimento = tournaments.reduce((total, t) => total + (t.totalBuyIn || t.buyIn), 0);
                const totalPremios = tournaments.reduce((total, t) => {
                  // Apenas considera os resultados positivos como prêmios
                  return total + (t.result > 0 ? t.result : 0);
                }, 0);
                const balancoFinal = totalPremios - totalInvestimento;
                
                return (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Balanço Final:</span>
                    <span className={`font-medium ${balancoFinal >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      ${balancoFinal.toFixed(2)}
                    </span>
                  </div>
                );
              })()}
              
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
            
            {/* Listagem vertical simples em coluna */}
            <dl className="flex flex-col space-y-3">
              <div className="flex justify-between items-center" data-testid="category-count-phase-d1">
                <dt className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-primary-500 mr-2"></div>
                  <span className="text-sm text-gray-700">Phase Day 1:</span>
                </dt>
                <dd className="text-sm font-medium text-gray-900">
                  {summary.categories.phaseDay1Count}
                </dd>
              </div>
              
              <div className="flex justify-between items-center" data-testid="category-count-phase-d2">
                <dt className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-success-500 mr-2"></div>
                  <span className="text-sm text-gray-700">Phase Day 2+:</span>
                </dt>
                <dd className="text-sm font-medium text-gray-900">
                  {summary.categories.phaseDay2Count}
                </dd>
              </div>
              
              <div className="flex justify-between items-center" data-testid="category-count-other-currency">
                <dt className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-warning-500 mr-2"></div>
                  <span className="text-sm text-gray-700">Outras Moedas:</span>
                </dt>
                <dd className="text-sm font-medium text-gray-900">
                  {summary.categories.otherCurrencyCount}
                </dd>
              </div>
              
              <div className="flex justify-between items-center" data-testid="category-count-other">
                <dt className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-accent-500 mr-2"></div>
                  <span className="text-sm text-gray-700">Outros Torneios:</span>
                </dt>
                <dd className="text-sm font-medium text-gray-900">
                  {summary.categories.otherTournamentsCount}
                </dd>
              </div>
            </dl>
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
