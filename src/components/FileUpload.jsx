'use client';
import { useState, useRef } from 'react';

export default function FileUpload({ 
  label, 
  accept = "image/*,.pdf", 
  maxSize = 5 * 1024 * 1024, // 5MB default
  value, 
  onChange, 
  required = false,
  description,
  uploadToServer = false // New prop to choose upload method
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const uploadToServerAPI = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();
    return result.url;
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (file) => {
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      alert(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    // Validate file type
    const acceptedTypes = accept.split(',').map(type => type.trim());
    const isValidType = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return file.type.match(type.replace('*', '.*'));
    });

    if (!isValidType) {
      alert('Invalid file type. Please select a valid file.');
      return;
    }

    setUploading(true);

    try {
      let fileUrl;
      
      if (uploadToServer) {
        // Upload to server
        fileUrl = await uploadToServerAPI(file);
      } else {
        // Convert to base64
        fileUrl = await convertToBase64(file);
      }

      onChange(fileUrl);
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removeFile = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileName = () => {
    if (!value) return null;
    if (value.startsWith('data:')) {
      return 'uploaded-file';
    }
    if (value.startsWith('/uploads/')) {
      return value.split('/').pop();
    }
    return value.split('/').pop();
  };

  const isImage = (url) => {
    if (!url) return false;
    if (url.startsWith('data:image/')) return true;
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  const getFileSize = () => {
    if (!value || !value.startsWith('data:')) return null;
    
    // Estimate base64 size
    const base64Length = value.split(',')[1]?.length || 0;
    const sizeInBytes = (base64Length * 3) / 4;
    
    if (sizeInBytes < 1024) return `${Math.round(sizeInBytes)} B`;
    if (sizeInBytes < 1024 * 1024) return `${Math.round(sizeInBytes / 1024)} KB`;
    return `${Math.round(sizeInBytes / 1024 / 1024)} MB`;
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      
      {description && (
        <p className="text-xs text-charcoal-400">{description}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {!value ? (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${dragOver 
              ? 'border-terra-400 bg-terra-400/10' 
              : 'border-charcoal-600 hover:border-charcoal-500'
            }
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {uploading ? (
            <div className="space-y-2">
              <div className="animate-spin w-6 h-6 border-2 border-terra-400 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-charcoal-400">
                {uploadToServer ? 'Uploading to server...' : 'Processing file...'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-3xl">📁</div>
              <p className="text-sm text-charcoal-300">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-charcoal-500">
                Max size: {Math.round(maxSize / 1024 / 1024)}MB
              </p>
              <p className="text-xs text-charcoal-500">
                Accepted: {accept.replace(/\*/g, 'all')}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-charcoal-600 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isImage(value) ? (
                <img 
                  src={value} 
                  alt="Preview" 
                  className="w-12 h-12 object-cover rounded border"
                />
              ) : (
                <div className="w-12 h-12 bg-charcoal-700 rounded flex items-center justify-center">
                  <span className="text-lg">📄</span>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-charcoal-200">
                  {getFileName()}
                </p>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-green-400">✓ Uploaded</p>
                  {getFileSize() && (
                    <p className="text-xs text-charcoal-500">({getFileSize()})</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleClick}
                className="text-xs text-terra-400 hover:text-terra-300 px-2 py-1 rounded border border-terra-400/30"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={removeFile}
                className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-400/30"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}