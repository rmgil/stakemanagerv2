import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useTournamentHistory } from '@/hooks/useTournaments';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';

const History: React.FC = () => {
  const { historyItems, isLoading, isError, refetch } = useTournamentHistory();
  const [exportingId, setExportingId] = useState<string | null>(null);
  
  const handleExportCsv = async (id: string) => {
    setExportingId(id);
    try {
      const response = await apiRequest('GET', `/api/tournaments/export?sessionId=${id}`);
      const blob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `polarize-tournaments-${id}.csv`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setExportingId(null);
    }
  };
  
  return (
    <Layout>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Histórico de Uploads
            </h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              disabled={isLoading}
            >
              {isLoading ? 'Carregando...' : 'Atualizar'}
            </Button>
          </div>
          
          {isError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Erro ao carregar o histórico. Tente novamente mais tarde.
              </AlertDescription>
            </Alert>
          )}
          
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-md p-4">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : historyItems.length > 0 ? (
            <div className="space-y-4">
              {historyItems.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-md p-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-gray-900">{item.date}</div>
                    <div className={`text-sm ${item.netProfit >= 0 ? 'text-success-500' : 'text-danger-500'} font-medium`}>
                      ${item.netProfit.toFixed(2)}
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-2">
                        {item.totalTournaments} torneios
                      </span>
                      {item.submittedToPolarize && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Enviado ao tracker
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExportCsv(item.id)}
                      disabled={exportingId === item.id}
                    >
                      {exportingId === item.id ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 mr-2"></div>
                          Exportando
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Download className="h-4 w-4 mr-2" />
                          Exportar CSV
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg 
                className="mx-auto h-12 w-12 text-gray-400"
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Sem histórico</h3>
              <p className="mt-1 text-sm text-gray-500">
                Não há registros de uploads anteriores.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default History;
