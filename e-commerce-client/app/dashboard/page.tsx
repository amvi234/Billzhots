"use client"
import { useRouter } from 'next/navigation';
import FileSaver from 'file-saver';
import { toast } from 'react-toastify';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../providers';
import { localStorageManager } from '../lib/utils';
import { useDeleteBill, useDownloadBill, useListBills, useUploadBill } from '../shared/api/bill/bill-api';

// Interface.
declare global {
  interface Window {
    google: any;
  }
}

export default function Dashboard() {
  // Contexts.
  const { logout } = useAuth();
  const router = useRouter();

  // States.
  const [username, setUsername] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [chartLoaded, setChartLoaded] = useState(false);
  const [bills, setBills] = useState<any>([]);
  const toggleDropdown = () => setShowDropdown(prev => !prev);

  // Refs.
  const dropdownRef = useRef<HTMLDivElement>(null);
  const chartModalRef = useRef<HTMLDivElement>(null);

  // Hooks.
  const {
    mutate: sendUploadBill,
  } = useUploadBill();

  const {
    data: uploadedBillData,
    refetch: refetchBills,
    isLoading: isLoadingUploadedBills,
    isSuccess: isListBillsSuccess,
    isError: isErrorListBills,
    error: errListBills,
  } = useListBills();

  const {
    mutate: deleteBill,
    isPending: isDeleting
  } = useDeleteBill();

  const {
    mutate: downloadBill,
    data: downloadBillResponse,
    isSuccess: isSuccessDownloadBill,
    isError: isErrorDownloadBill,
  } = useDownloadBill();

  // UseEffects.
  useEffect(() => {
    const loadChart = () => {
      if (typeof window !== 'undefined' && !window.google) {
        const script = document.createElement('script');
        script.src = 'https://www.gstatic.com/charts/loader.js';
        script.onload = () => {
          window.google.charts.load('current', { packages: ['corechart'] });
          window.google.charts.setOnLoadCallback(() => {
            setChartLoaded(true);
          });
        };
        document.head.appendChild(script);
      }
      else if (window.google) {
        window.google.charts.load('current', { packages: ['corechart'] });
        window.google.charts.setOnLoadCallback(() => {
          setChartLoaded(true);
        })
      }
    };
    loadChart();
  }, [])

  useEffect(() => {
    if (isListBillsSuccess && uploadedBillData) {
      setBills(uploadedBillData);
    }
    if (isErrorListBills && errListBills) {
      toast.error('Failed to fetch bills. Please try again later')
    }
  }, [isListBillsSuccess, isErrorListBills, uploadedBillData])

  useEffect(() => {
    if (isSuccessDownloadBill && downloadBillResponse) {
      FileSaver.saveAs(downloadBillResponse, 'bill');
      toast.success('Bill downloaded successfully');
    }

    if (isErrorDownloadBill) {
      toast.error('Failed to download bill');
    }
  }, [isSuccessDownloadBill, downloadBillResponse, isErrorDownloadBill]);


  useEffect(() => {
    const name = localStorageManager.getName();
    if (!localStorageManager.hasToken()) {
      router.push('/login');
      toast.error('Not allowed to navigate dashboard without login');
    } else if (name) {
      setUsername(name);
    }
  }, [router]);

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

  useEffect(() => {
    const handleChartModalClickOutside = (event: MouseEvent) => {
      if (chartModalRef.current &&
        !chartModalRef.current.contains(event.target as Node)
        && showChart) {
        setShowChart(false);
      }
    };
    if (showChart) {
      document.addEventListener('mousedown', handleChartModalClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleChartModalClickOutside);
    }
  }, [showChart]);

  // Constants.
  const ACCEPTED_TYPES = {
    'image/png': '.png',
    'image/jpeg': '.jpeg',
    'image/jpg': '.jpg',
    'application/pdf': '.pdf',
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  // Chart data preparation
  const getFileTypeDistribution = () => {
    if (!bills || bills.length === 0) {
      return [];
    }

    const typeCount: { [key: string]: number } = {};
    console.log(bills)

    bills.forEach((bill: any) => {
      const contentType = bill.name || 'unknown';
      console.log(bill.content_type)
      let fileType = 'Other';

      if (contentType.includes('jpg')) {
        fileType = 'JPG';
      } else if (contentType.includes('jpeg')) {
        fileType = 'JPEG';
      } else if (contentType.includes('png')) {
        fileType = 'PNG';
      } else if (contentType.includes('pdf')) {
        fileType = 'PDF';
      }

      typeCount[fileType] = (typeCount[fileType] || 0) + 1;
    });
    console.log(typeCount)

    return Object.entries(typeCount).map(([type, count]) => [type, count]);
  };

  const drawChart = () => {
    if (!chartLoaded || !window.google || !bills || bills.length === 0) {
      return;
  }

    const data = new window.google.visualization.DataTable();
    data.addColumn('string', 'File Type');
    data.addColumn('number', 'Count');

    const chartData = getFileTypeDistribution();
    data.addRows(chartData);

    const options = {
      title: 'Distribution of Uploaded File Types',
      titleTextStyle: {
        fontSize: 18,
        bold: true,
        color: '#333'
      },
      pieHole: 0.4,
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
      backgroundColor: 'white',
      chartArea: {
        left: 50,
        top: 50,
        width: '80%',
        height: '70%'
      },
      legend: {
        position: 'bottom',
        textStyle: {
          fontSize: 12
        }
      }
    };

    const chart = new window.google.visualization.PieChart(
      document.getElementById('file-type-chart')
    );
    chart.draw(data, options);
  };

  // Draw chart when modal opens and data is ready
  useEffect(() => {
    if (showChart && chartLoaded && bills.length > 0) {
      // Small delay to ensure the DOM element is rendered
      setTimeout(drawChart, 100);
    }
  }, [showChart, chartLoaded, bills]);

  // Handlers.
  const validateFile = (file: File) => {
    // Check file type.
    if (!Object.keys(ACCEPTED_TYPES).includes(file.type)) {
      return `File type ${file.type} is not supported. Only PNG, JPG, JPEG, and PDF files are allowed.`;
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
    if (selectedFiles.length === 0) { return };
    setUploading(true);
    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        return new Promise<void>((resolve, reject) => {
          sendUploadBill(file, {
            onSuccess: () => {
              // setUploadedFiles((prev) => [...prev, res.data])
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
      console.warn(`Some files failed to upload ${error}`);
    }
    finally {
      setUploading(false);
    }
  };

  // Format file size.
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) { return '0 Bytes' };
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on type.
  const getFileIcon = (type: string) => {
    if (type.includes('image')) { return '🖼️' };
    if (type.includes('pdf')) {return '📄'};
    if (type.includes('word')) {return '📝'};
    {return '📁'};
  };

  const handleDownloadBill = (billId: string) => {
    downloadBill({ billId });
  };

  const handleShowChart = () => {
    if (bills.length === 0) {
          toast.info('No bills uploaded yet. Upload some files to see the chart.');
          return;
        }
    setShowChart(true);
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
                  handleShowChart();
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
        {/* Chart Modal */}
      {showChart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            ref={chartModalRef}
            className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">File Type Distribution</h3>
              <button
                onClick={() => setShowChart(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            {bills.length > 0 ? (
              <div id="file-type-chart" style={{ width: '100%', height: '400px' }}></div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No data available. Upload some files to see the chart.</p>
              </div>
            )}
          </div>
        </div>
      )}
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
              accept=".png,.jpg,.jpeg,.pdf"
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
              Supported formats: PNG, JPG, JPEG, PDF (Max size: 10MB each)
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
        <div>
          <div className="bg-white rounded shadow-md mt-12 p-6">
            <h2 className="text-2xl font-semibold mb-4 text-center text-green-600">
              Uploaded Bills
            </h2>

            {isLoadingUploadedBills ? (
              <p className="text-center text-gray-500">Loading uploaded bills...</p>
            ) : bills?.length > 0 ? (
              <div className="space-y-4">
                {bills?.map((bill: any) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between border rounded px-4 py-2 bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xl">
                        {getFileIcon(bill.content_type || '')}
                      </span>
                      <div>
                        <p className="font-semibold">{bill.name}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                    <button
                      onClick={() => handleDownloadBill(bill.id)}
                      className='text-blue-500 hover:text-blue-700 cursor-pointer'
                    >
                      Download
                    </button>
                      <button
                        onClick={() =>
                          deleteBill({ billId: bill.id }, {
                            onSuccess: () => {
                              toast.success('Bill deleted');
                              refetchBills();
                            },
                            onError: () => toast.error('Failed to delete bill'),
                          })
                        }
                        disabled={isDeleting}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400">No bills uploaded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
