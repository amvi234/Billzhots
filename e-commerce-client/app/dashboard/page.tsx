"use client"
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '../providers';
import { useGenerateReportRequest } from '../shared/api/cart/cart-api';

export default function Dashboard() {
  // Contexts.
  const { logout } = useAuth();

  // States.
  const [prompt, setPrompt] = useState('');
  const [report, setReport] = useState<any>('');

  // Hooks.
  const {
    mutate: generateReport,
    isPending: isLoadingGenerateReport,
    data: reportResponse,
    isSuccess: isSuccessGenerateReport,
  } = useGenerateReportRequest()

  // useEffects.
  useEffect(() => {
    if (isSuccessGenerateReport && reportResponse) {
      setReport(reportResponse.data);
    }
  }, [isSuccessGenerateReport, reportResponse]);

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">CartVault Dashboard</h1>

        <div className="flex items-center space-x-4">
          <button
            onClick={logout}
            className="bg-red-600 cursor-pointer hover:bg-red-700 text-white py-2 px-4 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-3">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Product Analysis</h2>
            <p className="text-gray-700 mb-4">
              Enter a product description below to get a comprehensive analysis including features, pricing, and the best deals across multiple e-commerce platforms.
            </p>

            <div className="mb-4">
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
                What product are you looking for?
              </label>
              <textarea
                id="prompt"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'I want to buy a 4K TV with at least 55 inches screen and good HDR support'"
              />
            </div>

            <button
              onClick={() => {
                generateReport({ prompt });
              }}
              disabled={isLoadingGenerateReport || !prompt.trim()}
              className={`w-full cursor-pointer py-2 px-4 rounded-md text-white font-medium
                ${isLoadingGenerateReport || !prompt.trim() ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isLoadingGenerateReport ? 'Analyzing please wait ...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>
      <div>
        {report && (
          <>
            <h2 className="text-xl font-semibold mb-4">Report</h2>
            <p className="text-gray-700 mb-4">
              <span>{report}</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
