// app/cart/page.tsx
"use client"

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '../providers';
import { useCartItems, useDeleteCartItem } from '../shared/api/cart/cart-api';
import { CartItem } from '../shared/api/cart/types';

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { data: cartResponse, isLoading, refetch } = useCartItems();
  const deleteCartItem = useDeleteCartItem();
  const [selectedReport, setSelectedReport] = useState<CartItem | null>(null);

//   useEffect(() => {
//     if (!isAuthenticated) {
//       router.push('/login');
//     }
//   }, [isAuthenticated, router]);

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteCartItem.mutateAsync(itemId);
      refetch(); // Refresh the cart items
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const handleViewDetails = (item: CartItem) => {
    setSelectedReport(item);
  };

  const handleCloseDetails = () => {
    setSelectedReport(null);
  };

  if (!isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Cart</h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Back to Dashboard
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading your cart...</p>
        </div>
      ) : cartResponse?.data?.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cartResponse.data.map((item: CartItem) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
                <p className="text-gray-600 mb-3 text-sm truncate">{item.prompt}</p>

                {item.product_category && (
                  <div className="mb-2">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {item.product_category}
                    </span>
                  </div>
                )}

                {(item.price_range_min !== null && item.price_range_max !== null) && (
                  <p className="text-sm text-gray-700 mb-3">
                    Price Range: ${item.price_range_min} - ${item.price_range_max}
                  </p>
                )}

                <p className="text-xs text-gray-500 mb-4">
                  Saved on {new Date(item.created_at).toLocaleDateString()}
                </p>

                <div className="flex justify-between">
                  <button
                    onClick={() => handleViewDetails(item)}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">
            You haven't saved any product reports yet.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          >
            Go to Dashboard
          </button>
        </div>
      )}

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{selectedReport.title}</h2>
                <button
                  onClick={handleCloseDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-lg mb-2">Search Query</h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedReport.prompt}</p>
              </div>

              {selectedReport.report_data.features && (
                <div className="mb-4">
                  <h3 className="font-medium text-lg mb-2">Key Features</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {selectedReport.report_data.features.map((feature: string, index: number) => (
                      <li key={index} className="text-gray-700">{feature}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedReport.report_data.best_deal && (
                <div className="mb-4">
                  <h3 className="font-medium text-lg mb-2">Best Deal</h3>
                  <div className="border-2 border-green-500 rounded-md p-4 bg-green-50">
                    <div className="flex justify-between mb-2">
                      <h4 className="font-medium">{selectedReport.report_data.best_deal.title}</h4>
                      <span className="font-bold text-green-700">
                        ${selectedReport.report_data.best_deal.price}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {selectedReport.report_data.best_deal.source}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {selectedReport.report_data.listings && (
                <div className="mb-4">
                  <h3 className="font-medium text-lg mb-2">All Listings</h3>
                  <div className="space-y-3">
                    {selectedReport.report_data.listings.slice(0, 3).map((listing: any, index: number) => (
                      <div key={index} className="border rounded-md p-3">
                        <div className="flex justify-between">
                          <h4 className="font-medium">{listing.title}</h4>
                          <span className="font-semibold">${listing.price}</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          From: {listing.source}
                        </div>
                      </div>
                    ))}
                    {selectedReport.report_data.listings.length > 3 && (
                      <p className="text-sm text-gray-500 italic">
                        And {selectedReport.report_data.listings.length - 3} more listings...
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="text-right mt-6">
                <button
                  onClick={handleCloseDetails}
                  className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
