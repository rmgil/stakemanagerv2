import React from 'react';

const EmptyState: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-96 flex items-center justify-center">
      <div className="text-center p-6">
        <div className="mx-auto h-32 w-32 mb-4 rounded-md bg-gray-100 flex items-center justify-center">
          <svg 
            className="h-16 w-16 text-gray-400"
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum resultado disponível</h3>
        <p className="text-sm text-gray-500">Faça upload dos arquivos de Tournament Summary para ver a análise.</p>
      </div>
    </div>
  );
};

export default EmptyState;
