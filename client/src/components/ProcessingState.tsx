import React from 'react';

const ProcessingState: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-96 flex items-center justify-center">
      <div className="text-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Processando Torneios</h3>
        <p className="text-sm text-gray-500">Por favor, aguarde enquanto analisamos seus arquivos...</p>
      </div>
    </div>
  );
};

export default ProcessingState;
