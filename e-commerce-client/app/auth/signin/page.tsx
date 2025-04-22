"use client"
import React, { useEffect, useState } from 'react';
import { useLoginRequest, useVerifyOtpRequest } from '@/app/shared/api/auth/auth-api';
import { useRouter } from 'next/navigation';

const SignInPage = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [otpRequired, setOtpRequired] = useState<boolean>(false);
  const [otpSecret, setOtpSecret] = useState<string>();
  const [error, setError] = useState<string>();
  const router = useRouter();
  // Hooks.
  const {
    mutate: sendLoginRequest,
    isPending: isLoadingLoginRequest,
    data: loginRequestResponse,
    isSuccess: isSuccessLoginRequest,
    isError: isErrorLoginRequest,
    error: apiError,
  } = useLoginRequest();

  const {
    mutate: verifyLoginOtpRequest,
    isSuccess: isSuccessVerifyOtpRequest,
    data: verifyOtpResponse,
    isPending: isLoadingVerifyRequest,
  } = useVerifyOtpRequest();

  useEffect(() => {
    if (isSuccessLoginRequest && loginRequestResponse) {
      setOtpRequired(true);
      setOtpSecret(loginRequestResponse.data.otp_secret)
    }
  }, [isSuccessLoginRequest, loginRequestResponse])
  
  useEffect(() => {
    if (isSuccessVerifyOtpRequest) {
      console.log('heere')
    }
  },[isSuccessVerifyOtpRequest, verifyLoginOtpRequest])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otpRequired) {
      verifyLoginOtpRequest({
        username,
        password,
        otp
      });
    } else {
      console.log('should')
      sendLoginRequest({
        username,
        password
      });
    }
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-gray-700">Username</label>
            <input
              type="text"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={otpRequired}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={otpRequired}
              required
            />
          </div>

          {otpRequired && (
            <div>
              <label className="block text-gray-700">OTP Code</label>
              <input
                type="text"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your OTP code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            disabled={isLoadingLoginRequest || isLoadingVerifyRequest}
          >
            {isLoadingVerifyRequest || isLoadingVerifyRequest
              ? 'Processing...'
              : otpRequired
                ? 'Verify OTP'
                : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignInPage;