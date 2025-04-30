"use client"
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '../providers';
import { useAddToCart, useGenerateReportRequest } from '../shared/api/cart/cart-api';

export default function Dashboard() {
  // Contexts.
  const { logout } = useAuth();

  // Router.
  const router = useRouter();

  // States.
  const [prompt, setPrompt] = useState('');
  const [report, setReport] = useState<any>(null);

  // Hooks.
  const {
    mutate: generateReport,
    isPending: isLoadingGenerateReport,
    data: reportResponse,
    isSuccess: isSuccessGenerateReport,
  } = useGenerateReportRequest()

  // const { data: cartCountData } = useCartCount();
  const addToCart = useAddToCart();

  // useEffects.
  useEffect(() => {
    if (isSuccessGenerateReport && reportResponse) {
      console.log(reportResponse.data);
      setReport(reportResponse.data);
    }
  }, [isSuccessGenerateReport, reportResponse]);

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">CartVault Dashboard</h1>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/cart')}
            className="bg-blue-600 cursor-pointer hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
            Cart
            {/* {cartCountData && cartCountData?.data?.count > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 ml-1">
                {cartCountData.data.count}
              </span>
            )} */}
          </button>

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
        <h2 className="text-xl font-semibold mb-4">Report</h2>
        <p className="text-gray-700 mb-4">
          <span>{report}</span>
        </p>
      </div>
    </div>
  );
}
