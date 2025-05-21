import React from 'react';
import { PlayerLevel } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';

interface PlayerLevelCardProps {
  playerLevel?: PlayerLevel;
  isLoading: boolean;
}

const PlayerLevelCard: React.FC<PlayerLevelCardProps> = ({ playerLevel, isLoading }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Nível do Jogador
        </h3>
        
        {isLoading ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Nível Atual:</span>
              <Skeleton className="h-4 w-12" />
            </div>
            
            <div className="mb-4">
              <Skeleton className="h-2 w-full mb-1" />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-8" />
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Limites por Torneio</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-gray-500">Torneios Normais</p>
                  <Skeleton className="h-4 w-16 mt-1" />
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-gray-500">Torneios Phase</p>
                  <Skeleton className="h-4 w-16 mt-1" />
                </div>
              </div>
            </div>
          </>
        ) : playerLevel ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Nível Atual:</span>
              <span className="text-sm font-medium text-gray-900">{playerLevel.level}</span>
            </div>
            
            <div className="mb-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-600" 
                  style={{ width: `${playerLevel.levelProgressPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Progresso para o próximo nível</span>
                <span>{playerLevel.levelProgressPercentage.toFixed(0)}%</span>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Limites por Torneio</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-gray-500">Torneios Normais</p>
                  <p className="font-medium text-gray-900">${playerLevel.normalLimit.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-gray-500">Torneios Phase</p>
                  <p className="font-medium text-gray-900">${playerLevel.phaseLimit.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
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
            <p className="mt-2 text-sm text-gray-500">Não foi possível carregar os dados do jogador</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerLevelCard;
