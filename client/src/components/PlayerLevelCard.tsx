import React from 'react';

// Valores mock para o nível do jogador
const playerMock = {
  level: "3.1",
  capNormal: 22,
  capPhase: 11
};

const PlayerLevelCard: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mt-6" data-testid="player-level-card">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Nível do Jogador
        </h3>
        
        <div className="mb-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Nível Atual:</span>
            <span className="text-sm font-medium text-gray-900">{playerMock.level}</span>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Limites por Torneio</h4>
          <ul className="space-y-2">
            <li className="flex items-center">
              <span className="text-gray-600 text-sm mr-2">•</span>
              <span className="text-sm text-gray-700">Torneios Normais:</span>
              <span className="text-sm font-medium text-gray-900 ml-auto">${playerMock.capNormal.toFixed(2)}</span>
            </li>
            <li className="flex items-center">
              <span className="text-gray-600 text-sm mr-2">•</span>
              <span className="text-sm text-gray-700">Torneios Phase:</span>
              <span className="text-sm font-medium text-gray-900 ml-auto">${playerMock.capPhase.toFixed(2)}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PlayerLevelCard;
