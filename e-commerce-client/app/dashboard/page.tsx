// app/dashboard/page.tsx
"use client"

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../providers';
import { useAddToCart, useCartCount } from '../shared/api/cart/cart-api';
import { AddToCartPayload } from '../shared/api/cart/types';

export default function Dashboard() {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const { data: cartCountData } = useCartCount();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [reportTitle, setReportTitle] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const addToCart = useAddToCart();

  // For demo purposes, we'll simulate the product analysis
  const generateReport = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setTimeout(() => {
      // This is mock data that would normally come from your backend
      const mockReport = {
        query: {
          prompt: prompt,
          extracted_info: {
            product_name: prompt.split(' ').slice(0, 3).join(' '),
            category: prompt.toLowerCase().includes('laptop') ? 'Electronics' :
                    prompt.toLowerCase().includes('shoes') ? 'Footwear' : 'General',
          }
        },
        features: [
          'High-quality construction',
          'Premium materials',
          'Excellent customer reviews',
          'Long warranty period',
          'Multiple color options'
        ],
        listings: [
          {
            title: `Premium ${prompt}`,
            price: 129.99,
            source: 'Amazon',
            rating: 4.5,
            reviews_count: 1256
          },
          {
            title: `Standard ${prompt}`,
            price: 89.99,
            source: 'Myntra',
            rating: 4.2,
            reviews_count: 875
          },
          {
            title: `Budget ${prompt}`,
            price: 59.99,
            source: 'Flipkart',
            rating: 3.9,
            reviews_count: 432
          }
        ],
        best_deal: {
          title: `Standard ${prompt}`,
          price: 89.99,
          source: 'Myntra',
          rating: 4.2,
          reviews_count: 875,
          features: ['Good value for money', 'Fast shipping', 'Reliable brand']
        },
        average_rating: 4.2,
        summary: {
          total_listings: 3,
          price_range: {
            min: 59.99,
            max: 129.99
          }
        }
      };

      setReport(mockReport);
      setIsLoading(false);
    }, 2000);
  };
 // Simulating API call to analyze product


  const handleSaveToCart = async () => {
    if (!report || !reportTitle.trim()) return;

    try {
      const payload: AddToCartPayload = {
        title: reportTitle,
        prompt: report.query.prompt,
        report_data: report,
        product_category: report.query.extracted_info.category,
        price_range_min: report.summary.price_range.min,
        price_range_max: report.summary.price_range.max
      };

      await addToCart.mutateAsync(payload);
      setShowSaveForm(false);
      setReportTitle('');

      // You might want to show a success notification here
    } catch (error) {
      console.error('Failed to save to cart:', error);
      // You might want to show an error notification here
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">CartVault Dashboard</h1>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/cart')}
            className="bg-blue-600 cursor-grab hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
            Cart
            {cartCountData && cartCountData?.data?.count > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 ml-1">
                {cartCountData.data.count}
              </span>
            )}
          </button>

          <button
            onClick={logout}
            className="bg-red-600 cursor-grab hover:bg-red-700 text-white py-2 px-4 rounded"
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
              onClick={generateReport}
              disabled={isLoading || !prompt.trim()}
              className={`w-full cursor-grab py-2 px-4 rounded-md text-white font-medium
                ${isLoading || !prompt.trim() ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isLoading ? 'Analyzing...' : 'Generate Report'}
            </button>
          </div>
        </div>

        {report && (
          <>
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Analysis Results</h2>

                  {!showSaveForm ? (
                    <button
                      onClick={() => setShowSaveForm(true)}
                      className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded text-sm"
                    >
                      Save to Cart
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={reportTitle}
                        onChange={(e) => setReportTitle(e.target.value)}
                        placeholder="Report Title"
                        className="border rounded px-2 py-1 text-sm"
                      />
                      <button
                        onClick={handleSaveToCart}
                        disabled={!reportTitle.trim()}
                        className={`py-1 px-3 text-white rounded-md text-sm ${
                          !reportTitle.trim() ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setShowSaveForm(false)}
                        className="py-1 px-3 bg-gray-400 hover:bg-gray-500 text-white rounded-md text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <h3 className="font-medium text-lg mb-2">Product Summary</h3>
                  <p className="text-gray-700">
                    <span className="font-semibold">Category:</span> {report.query.extracted_info.category}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Price Range:</span> ${report.summary.price_range.min} - ${report.summary.price_range.max}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Average Rating:</span> {report.average_rating.toFixed(1)}/5
                  </p>
                </div>

                <div className="mb-4">
                  <h3 className="font-medium text-lg mb-2">Key Features</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {report.features.map((feature: string, index: number) => (
                      <li key={index} className="text-gray-700">{feature}</li>
                    ))}
                  </ul>
                </div>

                <div className="mb-4">
                  <h3 className="font-medium text-lg mb-2">Product Listings</h3>
                  <div className="space-y-3">
                    {report.listings.map((listing: any, index: number) => (
                      <div key={index} className="border rounded-md p-3">
                        <div className="flex justify-between">
                          <h4 className="font-medium">{listing.title}</h4>
                          <span className="font-semibold">${listing.price}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 mt-1">
                          <span>From: {listing.source}</span>
                          <div>
                            Rating: {listing.rating} ({listing.reviews_count} reviews)
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-medium text-lg mb-3">Best Deal</h3>
                {report.best_deal && (
                  <div className="border-2 border-green-500 rounded-md p-4 bg-green-50">
                    <div className="flex justify-between mb-2">
                      <h4 className="font-medium">{report.best_deal.title}</h4>
                      <span className="font-bold text-green-700">
                        ${report.best_deal.price}
                      </span>
                    </div>
                    <div className="mb-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {report.best_deal.source}
                      </span>
                      <span className="ml-3 text-sm">
                        Rating: {report.best_deal.rating}
                      </span>
                    </div>
                    <h5 className="font-medium mb-1">Highlights:</h5>
                    <ul className="list-disc pl-5 space-y-1">
                      {report.best_deal.features.map((feature: string, index: number) => (
                        <li key={index} className="text-sm">{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
