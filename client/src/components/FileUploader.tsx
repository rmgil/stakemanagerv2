import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileWithPath, UploadedFile } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface FileUploaderProps {
  files: UploadedFile[];
  onAddFiles: (files: FileWithPath[]) => void;
  onRemoveFile: (id: string) => void;
  onProcessFiles: () => void;
  isProcessing: boolean;
  error?: string | null;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  files,
  onAddFiles,
  onRemoveFile,
  onProcessFiles,
  isProcessing,
  error
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    onAddFiles(acceptedFiles as FileWithPath[]);
  }, [onAddFiles]);
  
  // Function to process directory entries and extract all .txt files
  const getFilesFromDirectory = async (dataTransferItems: DataTransferItemList | DataTransferItem[]) => {
    const getAllFileEntries = async (dataTransferItem: any): Promise<File[]> => {
      const entry = dataTransferItem.webkitGetAsEntry?.();
      if (!entry) return [];
      
      return new Promise(resolve => {
        if (entry.isFile) {
          (entry as FileSystemFileEntry).file(file => {
            if (file.name.toLowerCase().endsWith('.txt')) {
              resolve([file]);
            } else {
              resolve([]);
            }
          });
        } else if (entry.isDirectory) {
          const directoryReader = (entry as FileSystemDirectoryEntry).createReader();
          const readEntries = (): Promise<File[]> => {
            return new Promise(resolveEntries => {
              directoryReader.readEntries(async (entries) => {
                if (entries.length === 0) {
                  resolveEntries([]);
                } else {
                  const files = await Promise.all(
                    entries.map(entry => {
                      if (entry.isFile) {
                        return new Promise<File[]>(resolveFile => {
                          (entry as FileSystemFileEntry).file(file => {
                            if (file.name.toLowerCase().endsWith('.txt')) {
                              resolveFile([file]);
                            } else {
                              resolveFile([]);
                            }
                          });
                        });
                      } else if (entry.isDirectory) {
                        const dirReader = (entry as FileSystemDirectoryEntry).createReader();
                        return new Promise<File[]>(resolveDir => {
                          const readDirEntries = () => {
                            dirReader.readEntries(async (dirEntries) => {
                              if (dirEntries.length === 0) {
                                resolveDir([]);
                              } else {
                                const nestedFiles = await Promise.all(
                                  dirEntries.map(e => getAllFileEntries({ webkitGetAsEntry: () => e } as DataTransferItem))
                                );
                                resolveDir(nestedFiles.flat());
                              }
                            });
                          };
                          readDirEntries();
                        });
                      }
                      return Promise.resolve([]);
                    })
                  );
                  
                  const moreFiles = await readEntries(); // Read next batch
                  resolveEntries([...files.flat(), ...moreFiles]);
                }
              });
            });
          };
          
          readEntries().then(files => {
            resolve(files);
          });
        } else {
          resolve([]);
        }
      });
    };
    
    const files = await Promise.all(
      dataTransferItems.map(item => getAllFileEntries(item))
    );
    
    return files.flat();
  };
  
  const [uploadProgress, setUploadProgress] = useState({ total: 0, processed: 0 });
  const [isProcessingFolder, setIsProcessingFolder] = useState(false);
  
  // Custom onDrop handler to handle directory uploads
  const handleDrop = useCallback(async (acceptedFiles: File[], fileRejections: any, event: any) => {
    // Regular file handling for simple cases
    if (!event || !event.dataTransfer) {
      onAddFiles(acceptedFiles as FileWithPath[]);
      return;
    }
    
    // Check if folders are being dropped
    const items = event.dataTransfer.items;
    if (items && items.length > 0) {
      setIsProcessingFolder(true);
      try {
        // Check if any item is a directory
        const hasDirectory = Array.from(items).some((item: any) => {
          return item.webkitGetAsEntry && item.webkitGetAsEntry()?.isDirectory;
        });
        
        if (hasDirectory) {
          // Process directory contents
          const allFiles = await getFilesFromDirectory(Array.from(items));
          
          // Update progress
          setUploadProgress({ 
            total: allFiles.length, 
            processed: allFiles.length 
          });
          
          console.log(`Processed ${allFiles.length} files from directory upload`);
          
          // Filter out non-txt files and add the valid ones
          const validFiles = allFiles.filter(file => 
            file.name.toLowerCase().endsWith('.txt')
          );
          
          onAddFiles(validFiles as FileWithPath[]);
        } else {
          // Regular file upload - but make sure we only process .txt files
          const validFiles = acceptedFiles.filter(file => 
            file.name.toLowerCase().endsWith('.txt')
          );
          onAddFiles(validFiles as FileWithPath[]);
        }
      } catch (error) {
        console.error('Error processing directory:', error);
      } finally {
        setIsProcessingFolder(false);
      }
    } else {
      // Regular file upload fallback
      onAddFiles(acceptedFiles as FileWithPath[]);
    }
  }, [onAddFiles]);
  
  // Configure dropzone
  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop: handleDrop,
    accept: {
      'text/plain': ['.txt']
    },
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
    useFsAccessApi: false, // Disable File System Access API to ensure maximum compatibility
    noClick: false,  // Allow clicking to open file dialog
    noKeyboard: false,  // Allow keyboard navigation
    noDrag: false  // Allow dragging files and folders
  });
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Upload de Torneios
        </h3>
        
        {/* Alert if there's an error */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Drag and Drop Area */}
        <div 
          {...getRootProps()} 
          className={`drag-drop-area rounded-lg p-8 text-center cursor-pointer mb-4 ${
            isDragActive ? 'active border-primary-500 bg-blue-50' : 
            isDragReject ? 'border-red-500 bg-red-50' : 
            'border-2 border-dashed border-gray-300'
          }`}
        >
          <input 
            {...getInputProps()} 
            data-testid="file-input" 
            // Adicionamos estes atributos como props para o DOM nativo, não via TypeScript
            {...{
              directory: '',
              webkitdirectory: '',
              mozdirectory: ''
            }} 
          />
          <svg 
            className="mx-auto h-12 w-12 text-gray-400"
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          
          {isProcessingFolder ? (
            <>
              <p className="text-sm text-blue-500 mb-1">Processando diretório...</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: uploadProgress.total > 0 
                    ? `${(uploadProgress.processed / uploadProgress.total) * 100}%` 
                    : '0%' 
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                {uploadProgress.processed} de {uploadProgress.total} arquivos processados
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-1">Arraste arquivos ou pastas ou clique para selecionar</p>
              <p className="text-xs text-gray-400">Suporta múltiplos arquivos .txt ou pastas completas</p>
              <p className="text-xs text-gray-400">Apenas arquivos de Tournament Summary do GGNetwork</p>
            </>
          )}
        </div>
        
        {/* Selected Files List */}
        {files.length > 0 && (
          <div className="overflow-y-auto max-h-64 bg-gray-50 rounded-md p-2 mb-4">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between bg-white p-2 rounded mb-2 shadow-sm">
                <div className="flex items-center">
                  <svg 
                    className={`h-5 w-5 ${
                      file.status === 'success' ? 'text-green-500' : 
                      file.status === 'error' ? 'text-red-500' : 
                      file.status === 'uploading' ? 'text-blue-500' : 
                      'text-gray-500'
                    }`}
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    {file.status === 'success' ? (
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    ) : file.status === 'error' ? (
                      <circle cx="12" cy="12" r="10"></circle>
                    ) : (
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    )}
                    
                    {file.status === 'success' && (
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    )}
                    
                    {file.status === 'error' && (
                      <>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                      </>
                    )}
                  </svg>
                  <span className="ml-2 text-sm text-gray-700 truncate max-w-[180px]" title={file.name}>
                    {file.name}
                  </span>
                </div>
                <button 
                  type="button" 
                  onClick={() => onRemoveFile(file.id)} 
                  className="text-gray-400 hover:text-red-500 focus:outline-none"
                  aria-label="Remove file"
                >
                  <svg 
                    className="h-5 w-5" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Upload Button */}
        <Button
          className="w-full"
          onClick={onProcessFiles}
          disabled={isProcessing || files.length === 0}
        >
          {isProcessing ? (
            <>
              <svg 
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processando...
            </>
          ) : (
            "Processar Arquivos"
          )}
        </Button>
      </div>
    </div>
  );
};

export default FileUploader;
