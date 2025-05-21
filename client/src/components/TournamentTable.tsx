import React, { useState } from 'react';
import { TournamentResult, TournamentCategory } from '@shared/schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/types';

interface TournamentTableProps {
  tournaments: TournamentResult[];
  onExportCsv: () => void;
}

const TournamentTable: React.FC<TournamentTableProps> = ({ tournaments, onExportCsv }) => {
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const filteredTournaments = categoryFilter === 'all' 
    ? tournaments 
    : tournaments.filter(t => t.category === categoryFilter);
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Detalhes dos Torneios
          </h3>
          <div className="flex space-x-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todas as Categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                <SelectItem value={TournamentCategory.PHASE_DAY_1}>Phase Day 1</SelectItem>
                <SelectItem value={TournamentCategory.PHASE_DAY_2_PLUS}>Phase Day 2+</SelectItem>
                <SelectItem value={TournamentCategory.OTHER_CURRENCY}>Outras Moedas</SelectItem>
                <SelectItem value={TournamentCategory.OTHER_TOURNAMENTS}>Outros Torneios</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              className="flex items-center"
              onClick={onExportCsv}
            >
              <svg 
                className="h-4 w-4 mr-2" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              CSV
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Torneio
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Buy-in
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resultado
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deal Normal
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Venda Auto.
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTournaments.map((tournament, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {tournament.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      CATEGORY_COLORS[tournament.category]?.light || 'bg-gray-100'
                    } ${CATEGORY_COLORS[tournament.category]?.text || 'text-gray-800'}`}>
                      {CATEGORY_LABELS[tournament.category as keyof typeof CATEGORY_LABELS] || tournament.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tournament.buyInOriginal || `$${tournament.buyIn.toFixed(2)}`}
                    {tournament.buyInOriginal && tournament.currencyCode !== 'USD' && (
                      <span className="text-xs text-gray-400 ml-1">
                        (${tournament.buyIn.toFixed(2)})
                      </span>
                    )}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    tournament.result >= 0 ? 'text-success-500' : 'text-danger-500'
                  }`}>
                    {tournament.result >= 0 ? '+' : ''}${tournament.result.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${tournament.normalDeal.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${tournament.automaticSale.toFixed(2)}
                  </td>
                </tr>
              ))}
              {filteredTournaments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    Nenhum torneio encontrado para esta categoria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TournamentTable;
