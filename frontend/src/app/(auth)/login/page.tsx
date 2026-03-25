'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PhoneInput } from '@/components/PhoneInput';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(identifier, password);
      router.push('/menu');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center px-4 sm:px-6 lg:px-8 bg-gray-50 relative overflow-hidden">
      {/* Absolute faint background texture/blur can go here if needed per DESIGN.md */}
      
      <div className="w-full max-w-md mx-auto z-10 animate-fade-in-up">
        {/* Logo/Icon placeholder for brand context */}
        <div className="flex justify-center mb-8">
          <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center shadow-inner">
             <span className="text-orange-500 font-display font-bold text-2xl">SR</span>
          </div>
        </div>
        
        <div className="bg-white py-10 px-6 sm:px-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold font-display text-gray-900 tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-500 font-sans">
              Log in to the Smart Restaurant Ecosystem
            </p>
          </div>
          
          <div className="flex p-1 mb-8 bg-gray-50 rounded-xl border border-gray-100 animate-fade-in-up delay-100">
            <button
              type="button"
              onClick={() => { setLoginMethod('email'); setIdentifier(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${loginMethod === 'email' ? 'bg-white text-gray-900 shadow border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => { setLoginMethod('phone'); setIdentifier(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${loginMethod === 'phone' ? 'bg-white text-gray-900 shadow border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Phone
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
               <div className="bg-red-50/80 text-red-600 px-4 py-3 rounded-xl border border-red-100/50 text-sm animate-fade-in-up text-center font-medium">
                 {error}
               </div>
            )}
            
            <div className="space-y-5">
              <div className="animate-fade-in-up delay-200">
                <label htmlFor="identifier" className="block text-sm font-semibold text-gray-900 mb-2">
                  {loginMethod === 'email' ? 'Email Address' : 'Phone Number'}
                </label>
                {loginMethod === 'email' ? (
                  <input
                    id="identifier"
                    name="identifier"
                    type="email"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="block w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all sm:text-sm font-medium"
                    placeholder="name@example.com"
                  />
                ) : (
                  <PhoneInput 
                    id="identifier"
                    name="identifier"
                    value={identifier}
                    onChange={setIdentifier}
                    required
                  />
                )}
              </div>
              
              <div className="animate-fade-in-up delay-300">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all sm:text-sm font-medium"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="pt-4 animate-fade-in-up delay-400">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl text-[15px] font-bold text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-500/20 active:scale-[0.98] shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50 disabled:active:scale-100"
              >
                {loading ? 'Authenticating...' : 'Log in'}
              </button>
            </div>

            <div className="text-center pt-6 animate-fade-in-up delay-500">
              <p className="text-sm text-gray-500 font-medium">
                New to the ecosystem?{' '}
                <a href="/register" className="font-bold text-orange-500 hover:text-orange-600 transition-colors">
                  Create an account
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
