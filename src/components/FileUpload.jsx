'use client';
import { useState, useRef } from 'react';

/**
 * FileUpload — uploads via /api/upload (→ Cloudinary) and returns a URL.
 * The old base64 path is kept as a fallback only when uploadToServer=false.
 */
export default function FileUpload({
  label,
  accept = 'image/*,.pdf,.doc,.docx,.txt',
  maxSize = 5 * 1024 * 1024, // 5 MB default
  value,
  onChange,
  required = false,
  description,
  uploadToServer = true, // Default: always upload to server (Cloudinary)
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const uploadToServerAPI = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();
    return result.url;
  };

  const convertToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileSelect = async (file) => {
    if (!file) return;

    if (file.size > maxSize) {
      alert(`File size must be less than ${Math.round(maxSize / 1024 / 1024)} MB`);
      return;
    }

    const acceptedTypes = accept.split(',').map((t) => t.trim());
    const isValidType = acceptedTypes.some((type) => {
      if (type.startsWith('.')) return file.name.toLowerCase().endsWith(type.toLowerCase());
      return file.type.match(type.replace('*', '.*'));
    });

    if (!isValidType) {
      alert('Invalid file type. Please select a valid file.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Fake progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress((p) => Math.min(p + 10, 85));
    }, 200);

    try {
      let fileUrl;
      if (uploadToServer) {
        fileUrl = await uploadToServerAPI(file);
      } else {
        fileUrl = await convertToBase64(file);
      }
      setUploadProgress(100);
      onChange(fileUrl);
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFileSelect(files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const removeFile = () => {
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getFileName = () => {
    if (!value) return null;
    if (value.startsWith('data:')) return 'uploaded-file';
    return value.split('/').pop().split('?')[0];
  };

  const isImage = (url) => {
    if (!url) return false;
    if (url.startsWith('data:image/')) return true;
    return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      {description && <p className="text-xs text-charcoal-400">{description}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {!value ? (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${dragOver ? 'border-terra-400 bg-terra-400/10' : 'border-charcoal-600 hover:border-charcoal-500'}
            ${uploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {uploading ? (
            <div className="space-y-3">
              <div className="animate-spin w-6 h-6 border-2 border-terra-400 border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-charcoal-400">Uploading… {uploadProgress}%</p>
              <div className="w-full bg-charcoal-700 rounded-full h-1.5">
                <div
                  className="bg-terra-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-3xl">📁</div>
              <p className="text-sm text-charcoal-300">Click to upload or drag and drop</p>
              <p className="text-xs text-charcoal-500">
                Max size: {Math.round(maxSize / 1024 / 1024)} MB
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
                  className="w-12 h-12 object-cover rounded border border-charcoal-700"
                />
              ) : (
                <div className="w-12 h-12 bg-charcoal-700 rounded flex items-center justify-center">
                  <span className="text-lg">📄</span>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-charcoal-200 break-all max-w-xs truncate">
                  {getFileName()}
                </p>
                <p className="text-xs text-green-400">✓ Uploaded</p>
              </div>
            </div>
            <div className="flex space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
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
