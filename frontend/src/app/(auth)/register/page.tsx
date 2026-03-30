'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PhoneInput } from '@/components/PhoneInput';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/menu';
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await register(formData);
      router.push(redirectTo);
    } catch (err: any) {
      const backendError = err.response?.data?.errors;
      if (backendError) {
        const firstErrorKey = Object.keys(backendError)[0];
        setError(backendError[firstErrorKey][0]);
      } else {
        setError(err.response?.data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhoneChange = (phone: string) => {
    setFormData({
      ...formData,
      phone
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center px-4 sm:px-6 lg:px-8 bg-gray-50 py-12 relative overflow-hidden">
      
      <div className="w-full max-w-md mx-auto z-10 animate-fade-in-up">
        <div className="flex justify-center mb-8">
          <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center shadow-inner">
             <span className="text-orange-500 font-display font-bold text-2xl">SR</span>
          </div>
        </div>

        <div className="bg-white py-10 px-6 sm:px-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 my-4">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold font-display text-gray-900 tracking-tight">
              Create an account
            </h2>
            <p className="mt-2 text-sm text-gray-500 font-sans">
              Join the Smart Restaurant Ecosystem
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} suppressHydrationWarning>
            {error && (
               <div className="bg-red-50/80 text-red-600 px-4 py-3 rounded-xl border border-red-100/50 text-sm animate-fade-in-up text-center font-medium">
                 {error}
               </div>
            )}
            
            <div className="space-y-5">
              <div className="animate-fade-in-up delay-100">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all sm:text-sm font-medium"
                  placeholder="John Doe"
                  suppressHydrationWarning
                />
              </div>

              <div className="animate-fade-in-up delay-200">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all sm:text-sm font-medium"
                  placeholder="name@example.com"
                  suppressHydrationWarning
                />
              </div>

              <div className="animate-fade-in-up delay-300">
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-2">
                  Phone Number
                </label>
                <PhoneInput 
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  required
                />
              </div>

              <div className="flex gap-4 animate-fade-in-up delay-400">
                <div className="flex-1">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all sm:text-sm font-medium"
                    placeholder="8+ characters"
                    suppressHydrationWarning
                  />
                </div>

                <div className="flex-1">
                  <label htmlFor="password_confirmation" className="block text-sm font-semibold text-gray-900 mb-2">
                    Confirm
                  </label>
                  <input
                    id="password_confirmation"
                    name="password_confirmation"
                    type="password"
                    required
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    className="block w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all sm:text-sm font-medium"
                    placeholder="Verify password"
                    suppressHydrationWarning
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 animate-fade-in-up delay-500">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl text-[15px] font-bold text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-500/20 active:scale-[0.98] shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50 disabled:active:scale-100"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </div>

            <div className="text-center pt-6 animate-fade-in-up delay-[600ms]">
              <p className="text-sm text-gray-500 font-medium">
                Already have an account?{' '}
                <a href={`/login?redirect=${encodeURIComponent(redirectTo)}`} className="font-bold text-orange-500 hover:text-orange-600 transition-colors">
                  Log in here
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
