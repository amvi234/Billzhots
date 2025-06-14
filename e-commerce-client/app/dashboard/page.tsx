"use client"
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../providers';
import { localStorageManager } from '../lib/utils';
import { toast } from 'react-toastify';
import { useUploadBill } from '../shared/api/bill/bill-api';
import { sendError } from 'next/dist/server/api-utils';

export default function Dashboard() {
  // Contexts.

  const { logout } = useAuth();
  const router = useRouter();

  // Refs.
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Hooks.
  const {
    mutate: sendUploadBill,
    isPending: isLoadingBillRequest,
    data: uploadBillRequestResponse,
    isSuccess: isSuccessUploadBillRequest,
    isError: isErrorUploadBillRequest,
    error: uploadBillErrorResponse,
  } = useUploadBill();

  // States.
  const [username, setUsername] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => setShowDropdown(prev => !prev);


  // UseEffects.
  useEffect(() => {
    const name = localStorageManager.getName();
    if (!localStorageManager.hasToken()) {
      router.push('/login');
      toast.error('Not allowed to navigate dashboard without login');
    } else if (name) {
      setUsername(name);
    }
  }, [router]);


  // Constants.
  const ACCEPTED_TYPES = {
    'image/png': '.png',
    'image/jpeg': '.jpeg',
    'image/jpg': '.jpg',
    'application/pdf': '.pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  // Handlers.
  const validateFile = (file: File) => {
    // Check file type.
    if (!Object.keys(ACCEPTED_TYPES).includes(file.type)) {
      return `File type ${file.type} is not supported. Only PNG, JPG, JPEG, PDF, and DOCX files are allowed.`;
    }

    // Check file size.
    if (file.size > MAX_FILE_SIZE) {
      return `File size is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`;
    }

    return null;
  };

  // Handle file selection.
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    processFiles(files);
  };



  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const processFiles = (files: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      alert('Some files were rejected:\n' + errors.join('\n'));
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  // Handle drag and drop.
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload files function
  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        return new Promise<void>((resolve, reject) => {
          sendUploadBill(file, {
            onSuccess: (res) => {
              setUploadedFiles((prev) => [...prev, res.data])
              resolve();
            },
            onError: (err) => {
              console.warn(`Upload failed for ${file.name}:`, err)
              reject(err);
            }
          });
        });
      });
      await Promise.all(uploadPromises);
      setSelectedFiles([]);
      toast.success('Bill(s) uploaded successfully')
    }
    catch (error) {
      console.warn('Some files failed to upload');
    }
    finally {
      setUploading(false);
    }
  };

  // Format file size.
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on type.
  const getFileIcon = (type: string) => {
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    return '📁';
  };

  const showChart = () => {

  }

  const showAmount = () => {

  }

  return (
    <div className="container mx-auto p-8">
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-100 shadow-md h-20 px-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-red-800">Billzhots Dashboard</h1>

        <div className="relative flex items-center ">
          <div
            onClick={toggleDropdown}
            className="bg-blue-500 text-white font-semibold rounded-full h-10 w-10 flex items-center justify-center cursor-pointer select-none"
            title={username || 'Profile'}
          >
            {username?.charAt(0).toUpperCase() || ''}
          </div>

          {/* Dropdown menu */}
          {showDropdown && (
            <div ref={dropdownRef}
              className="absolute right-0 top-12 bg-white shadow-lg rounded-lg py-2 w-40 border border-gray-200 z-50">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  showAmount();
                }}
                className="w-full text-left px-4 py-2 hover:bg-yellow-100 cursor-pointer"
              >
                Amount
              </button>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  showChart();
                }}
                className="w-full text-left px-4 py-2 hover:bg-green-100 cursor-pointer"
              >
                Chart
              </button>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2 hover:bg-red-100 cursor-pointer"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      {/* File Upload Section */}
      <div className="bg-transparent rounded shadow-md mt-12 p-6 mb-8">
        <h2 className="bg-red text-2xl font-semibold mb-4 text-center text-red-400">File Upload</h2>

        {/* Drag and Drop Area */}
        <div
          className={`bg-red-100 border-2 border rounded-lg p-8 text-center transition-colors ${dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
            }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            <div className="text-6xl">📁</div>
            <div>
              <p className="text-lg font-medium">Drag and drop files here</p>
              <p>or click to select files</p>
            </div>
            <input
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.pdf,.docx"
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded cursor-pointer transition-colors"
            >
              Select Files
            </label>
            <p className="text-sm">
              Supported formats: PNG, JPG, JPEG, PDF, DOCX (Max size: 10MB each)
            </p>
          </div>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3 text-blue-500 text-center ">Selected Files ({selectedFiles.length})</h3>
            <div className="border-2 border-gray-300 rounded-lg bg-blue-100 space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-blue-100 p-3 rounded hover:text-red-400">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getFileIcon(file.type)}</span>
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 px-3 py-1 rounded cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={uploadFiles}
                disabled={uploading}
                className={`px-6 py-2 rounded text-white font-medium ${uploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 cursor-pointer'
                  }`}
              >
                {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Files Section */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Uploaded Files</h2>
          <div className="grid gap-4">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-4 rounded">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{ }</span>
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      { } • Uploaded on {new Date(file.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {file.url && (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      View
                    </a>
                  )}
                  <button
                    onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
