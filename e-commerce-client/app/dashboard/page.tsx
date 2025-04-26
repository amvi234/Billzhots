// app/dashboard/page.tsx
"use client"

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '../providers';

export default function Dashboard() {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();

  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     router.push('/login');
  //   }
  // }, [isAuthenticated, router]);

  // if (!isAuthenticated) {
  //   return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  // }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">CartVault Dashboard</h1>
        <button
          onClick={logout}
          className="bg-red-600 cursor-grab hover:bg-red-700 text-white py-2 px-4 rounded"
        >
          Logout
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Welcome to your Dashboard</h2>
        <p className="text-gray-700 mb-4">
          You are now logged into the CartVault Platform. Here you can manage your account and settings.
        </p>
      </div>
    </div>
  );
}
