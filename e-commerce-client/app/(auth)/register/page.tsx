"use client"
import React, { useEffect, useState } from 'react';
import { useRegisterRequest } from '@/app/shared/api/auth/auth-api';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

const RegisterPage = () => {
  // States
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [otpRequired, setOtpRequired] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  // Router.
  const router = useRouter();

  // Hooks.
  const {
    mutate: sendRegisterRequest,
    isPending: isLoadingRegisterRequest,
    data: registerRequestResponse,
    isSuccess: isSuccessRegisterRequest,
    isError: isErrorRegisterRequest,
    error: registerErrorResponse,
  } = useRegisterRequest();

  // useEffects.
  useEffect(() => {
    if (isSuccessRegisterRequest && registerRequestResponse) {
      setOtpRequired(true);
      toast.success('Registration Completed.');
      router.push('/login')
    }
    if (isErrorRegisterRequest && registerErrorResponse) {
      toast.error(registerErrorResponse.meta?.message || 'Registration failed');
    }
  }, [isSuccessRegisterRequest, isErrorRegisterRequest]);

  // Handlers.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match.
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    sendRegisterRequest({
      username,
      email,
      password
    });
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 bg-white rounded shadow-md bg-transparent border-1px-red">
          <h1 className="text-2xl font-bold mb-6 text-center">Register Account</h1>

          <form className="space-y-4 " onSubmit={handleSubmit}>
            <div>
              <label className="block text-gray-700">Username</label>
              <input
                type="text"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={otpRequired}
                required
              />
            </div>

            {!otpRequired && (
              <>
                <div>
                  <label className="block text-gray-700">Email</label>
                  <input
                    type="email"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Password</label>
                  <input
                    type="password"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Confirm Password</label>
                  <input
                    type="password"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </>
            )}
            {error && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full cursor-grab py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-blue-400 disabled:opacity-75 disabled:cursor-not-allowed"
              disabled={isLoadingRegisterRequest}
            >
              {isLoadingRegisterRequest
                ? 'Processing...'
                : 'Register'}
            </button>
            <div className="text-center mt-4">
              <p className="text-gray-600">
                Already have an account?{' '}
                <a href="/login" className="text-blue-600 hover:underline">
                  Log in
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;
