import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Camera, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedPhotoUploadProps {
  onUpload: (file: File) => Promise<void>;
  multiple?: boolean;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxSizeBytes?: number;
  className?: string;
}

interface FileWithPreview {
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  id: string;
}

export default function AnimatedPhotoUpload({
  onUpload,
  multiple = false,
  maxFiles = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxSizeBytes = 10 * 1024 * 1024, // 10MB
  className = ''
}: AnimatedPhotoUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} not supported. Please use: ${acceptedTypes.join(', ')}`;
    }
    if (file.size > maxSizeBytes) {
      return `File size too large. Maximum size: ${Math.round(maxSizeBytes / 1024 / 1024)}MB`;
    }
    return null;
  };

  const createFilePreview = (file: File): FileWithPreview => {
    return {
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      progress: 0,
      id: Math.random().toString(36).substr(2, 9)
    };
  };

  const processFiles = useCallback((fileList: FileList) => {
    console.log('processFiles called with', fileList.length, 'files');
    const newFiles: FileWithPreview[] = [];
    const errors: string[] = [];

    Array.from(fileList).forEach(file => {
      console.log('Processing file:', file.name, file.type, file.size);
      const error = validateFile(file);
      if (error) {
        console.log('File validation error:', error);
        errors.push(`${file.name}: ${error}`);
        return;
      }

      if (!multiple && files.length + newFiles.length >= 1) {
        errors.push('Only one file allowed');
        return;
      }

      if (files.length + newFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const filePreview = createFilePreview(file);
      console.log('Created file preview:', filePreview.id);
      newFiles.push(filePreview);
    });

    if (errors.length > 0) {
      console.error('Upload errors:', errors);
    }

    console.log('Adding', newFiles.length, 'new files to state');
    setFiles(prev => {
      const updated = [...prev, ...newFiles];
      console.log('Total files in state:', updated.length);
      return updated;
    });
  }, [files.length, multiple, maxFiles]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set drag over to false if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    console.log('handleDrop called');
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const { files: droppedFiles } = e.dataTransfer;
    console.log('Dropped files:', droppedFiles?.length || 0);
    if (droppedFiles?.length) {
      processFiles(droppedFiles);
    }
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { files: selectedFiles } = e.target;
    if (selectedFiles?.length) {
      processFiles(selectedFiles);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const updatedFiles = prev.filter(f => f.id !== id);
      // Cleanup preview URLs
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return updatedFiles;
    });
  }, []);



  const uploadFile = async (fileWithPreview: FileWithPreview) => {
    setFiles(prev => prev.map(f => 
      f.id === fileWithPreview.id 
        ? { ...f, status: 'uploading' as const, progress: 0 }
        : f
    ));

    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        setFiles(prev => prev.map(f => 
          f.id === fileWithPreview.id 
            ? { ...f, progress }
            : f
        ));
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await onUpload(fileWithPreview.file);

      setFiles(prev => prev.map(f => 
        f.id === fileWithPreview.id 
          ? { ...f, status: 'success' as const, progress: 100 }
          : f
      ));

      // Remove successful uploads after a delay
      setTimeout(() => {
        removeFile(fileWithPreview.id);
      }, 2000);

    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === fileWithPreview.id 
          ? { ...f, status: 'error' as const }
          : f
      ));
    }
  };

  const uploadAll = async () => {
    setIsUploading(true);
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    try {
      await Promise.all(pendingFiles.map(uploadFile));
    } finally {
      setIsUploading(false);
    }
  };

  const clearAll = () => {
    files.forEach(f => URL.revokeObjectURL(f.preview));
    setFiles([]);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Drop Zone */}
      <motion.div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50 scale-105' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        animate={{
          scale: isDragOver ? 1.02 : 1,
          borderColor: isDragOver ? '#3b82f6' : '#d1d5db'
        }}
        transition={{ duration: 0.2 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />

        <motion.div
          animate={{
            y: isDragOver ? -5 : 0,
            opacity: isDragOver ? 0.8 : 1
          }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            animate={{ rotate: isDragOver ? 360 : 0 }}
            transition={{ duration: 0.5 }}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          </motion.div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isDragOver ? 'Drop your photos here!' : 'Upload Photos'}
          </h3>
          
          <p className="text-gray-500 mb-4">
            Drag and drop your images, or click anywhere in this box to select files
          </p>
          
          <p className="text-xs text-gray-400">
            Supports: {acceptedTypes.map(type => type.split('/')[1]).join(', ')} • 
            Max size: {Math.round(maxSizeBytes / 1024 / 1024)}MB
            {multiple && ` • Max ${maxFiles} files`}
          </p>
        </motion.div>

        {/* Drag Overlay */}
        <AnimatePresence>
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="bg-blue-500 text-black p-4 rounded-full"
              >
                <Camera className="w-8 h-8" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* File Previews */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 space-y-4"
          >
            {files.map((fileWithPreview) => (
              <motion.div
                key={fileWithPreview.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white border rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-start space-x-4">
                  {/* Image Preview */}
                  <div className="relative">
                    <img
                      src={fileWithPreview.preview}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    {fileWithPreview.status === 'success' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 bg-green-500 text-black rounded-full p-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </motion.div>
                    )}
                    {fileWithPreview.status === 'error' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <AlertCircle className="w-4 h-4" />
                      </motion.div>
                    )}
                  </div>

                  {/* File Info and Caption */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileWithPreview.file.name}
                      </p>
                      <button
                        onClick={() => removeFile(fileWithPreview.id)}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={fileWithPreview.status === 'uploading'}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-2">
                      {(fileWithPreview.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>



                    {/* Progress Bar */}
                    {fileWithPreview.status === 'uploading' && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <motion.div
                          className="bg-blue-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${fileWithPreview.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    )}

                    {/* Status */}
                    <div className="flex items-center space-x-2 text-xs">
                      {fileWithPreview.status === 'pending' && (
                        <span className="text-gray-500">Ready to upload</span>
                      )}
                      {fileWithPreview.status === 'uploading' && (
                        <span className="text-blue-500">Uploading... {fileWithPreview.progress}%</span>
                      )}
                      {fileWithPreview.status === 'success' && (
                        <span className="text-green-500">Upload complete!</span>
                      )}
                      {fileWithPreview.status === 'error' && (
                        <span className="text-red-500">Upload failed</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={clearAll}
                disabled={isUploading}
              >
                Clear All
              </Button>
              
              <Button
                onClick={uploadAll}
                disabled={isUploading || files.every(f => f.status !== 'pending')}
                className="bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:from-blue-600 hover:to-orange-600"
              >
                {isUploading ? 'Uploading...' : `Upload ${files.filter(f => f.status === 'pending').length} Photo${files.filter(f => f.status === 'pending').length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}