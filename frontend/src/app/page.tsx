'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowRightIcon, 
  SparklesIcon, 
  QrCodeIcon, 
  CreditCardIcon, 
  ChatBubbleBottomCenterTextIcon, 
  ChartBarIcon,
  PlayIcon,
  CheckCircleIcon,
  Bars3Icon,
  XMarkIcon
} from "@heroicons/react/24/outline";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f9fafb] text-zinc-900 font-sans selection:bg-orange-500 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Table.com.pk Logo" width={40} height={40} className="w-10 h-10 object-contain rounded-xl" />
            <span className="font-display font-semibold text-xl tracking-tight text-zinc-900">Table<span className="text-orange-500">.com.pk</span></span>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-zinc-600">
            <Link href="#features" className="hover:text-orange-500 transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-orange-500 transition-colors">How it works</Link>
            <Link href="#pricing" className="hover:text-orange-500 transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-orange-500 transition-colors">Restaurant Login</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              href="/register" 
              className="hidden md:inline-flex items-center justify-center px-6 py-2.5 rounded-2xl bg-orange-500 text-white font-medium text-sm transition-all hover:bg-orange-600 hover:shadow-orange-500/25 hover:shadow-lg active:scale-95"
            >
              Partner With Us
            </Link>
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors focus:outline-none"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] flex md:hidden">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          
          {/* Sidebar */}
          <div className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white py-6 pb-12 shadow-2xl animate-fade-in-up">
            <div className="px-6 flex items-center justify-between font-display font-semibold text-xl tracking-tight text-zinc-900 mb-8">
              <span>Table<span className="text-orange-500">.com.pk</span></span>
              <button 
                type="button" 
                className="-mr-2 flex h-10 w-10 items-center justify-center rounded-md p-2 text-zinc-400 hover:bg-zinc-100 focus:outline-none" 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="px-6 space-y-6 flex-1">
              <Link href="#features" onClick={() => setIsMobileMenuOpen(false)} className="block text-lg font-medium text-zinc-900 hover:text-orange-500">Features</Link>
              <Link href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="block text-lg font-medium text-zinc-900 hover:text-orange-500">How it works</Link>
              <Link href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="block text-lg font-medium text-zinc-900 hover:text-orange-500">Pricing</Link>
              <div className="my-6 border-t border-zinc-100"></div>
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block text-lg font-medium text-zinc-600 hover:text-orange-500">Restaurant Login</Link>
              <Link 
                href="/register" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-center mt-6 px-6 py-3 rounded-2xl bg-orange-500 text-white font-medium text-base hover:bg-orange-600 hover:shadow-orange-500/25 hover:shadow-lg transition-all"
              >
                Partner With Us
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="max-w-2xl animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-sm font-semibold mb-6">
              <SparklesIcon className="w-4 h-4" />
              <span>The #1 Smart Restaurant Ecosystem</span>
            </div>
            
            <h1 className="font-display text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-zinc-900 mb-8">
              Transform Your <br />
              <span className="text-orange-500 relative">
                Dining Experience
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-orange-200 opacity-60" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="transparent"/>
                </svg>
              </span>
            </h1>
            
            <p className="text-lg lg:text-xl text-zinc-600 leading-relaxed mb-10 max-w-xl">
              Elevate your restaurant with our end-to-end AI-powered platform. From WebAR dish visualization to real-time predictive KDS and smart split-bill payments.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link 
                href="/register" 
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-orange-500 text-white font-semibold text-lg transition-all hover:bg-orange-600 hover:shadow-orange-500/25 hover:shadow-xl active:scale-95 gap-2 group"
              >
                Become a Partner
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                href="/scan" 
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-white text-zinc-900 font-semibold text-lg border border-zinc-200 transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-95 gap-2"
              >
                <PlayIcon className="w-5 h-5 text-zinc-500" />
                View Customer Demo
              </Link>
            </div>
            
            <div className="mt-12 flex items-center gap-6 text-sm text-zinc-500 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-orange-500" />
                <span>Zero Installation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-orange-500" />
                <span>Real-Time Sync</span>
              </div>
            </div>
          </div>
          
          <div className="relative animate-fade-in-up delay-200 lg:h-[600px] flex justify-center items-center">
            {/* Soft background glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-100 to-orange-50 rounded-[3rem] transform rotate-3 flex-shrink-0"></div>
            <Image 
              src="/hero.png" 
              alt="Smart Dining Experience" 
              width={800} 
              height={800} 
              className="relative z-10 w-full max-w-lg object-contain drop-shadow-2xl rounded-[2rem] border-4 border-white/50"
              priority
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white border-y border-zinc-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20 animate-fade-in-up">
            <h2 className="font-display text-4xl font-bold tracking-tight text-zinc-900 mb-6">Designed to maximize engagement & efficiency</h2>
            <p className="text-lg text-zinc-600">Our unified platform automates operations while providing an unforgettable contactless experience for your guests.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-zinc-50 border border-zinc-100 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-default">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <QrCodeIcon className="w-7 h-7" />
              </div>
              <h3 className="font-display text-xl font-bold mb-3">Instant QR Ordering</h3>
              <p className="text-zinc-600 leading-relaxed">Guests scan a unique code to instantly access your digital menu without downloading any apps.</p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-zinc-50 border border-zinc-100 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-default">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <SparklesIcon className="w-7 h-7" />
              </div>
              <h3 className="font-display text-xl font-bold mb-3">AI Recommendations</h3>
              <p className="text-zinc-600 leading-relaxed">Machine learning algorithms suggest the perfect pairings and upsells tailored to individual preferences.</p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-zinc-50 border border-zinc-100 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-default">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CreditCardIcon className="w-7 h-7" />
              </div>
              <h3 className="font-display text-xl font-bold mb-3">Smart Split-Bill</h3>
              <p className="text-zinc-600 leading-relaxed">End checkout friction. Multiple guests can dynamically join a table session and pay for their own items.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AR Feature Deep Dive */}
      <section className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative order-2 lg:order-1 animate-fade-in-up">
            <Image 
              src="/ar-mockup.png" 
              alt="AR Dish Visualization Mockup" 
              width={600} 
              height={800} 
              className="w-full max-w-lg mx-auto drop-shadow-2xl rounded-3xl"
            />
          </div>
          <div className="order-1 lg:order-2 animate-fade-in-up delay-200">
            <h2 className="font-display text-4xl font-bold tracking-tight text-zinc-900 mb-6">See it before you taste it with WebAR</h2>
            <p className="text-lg text-zinc-600 leading-relaxed mb-8">
              Increase high-margin item sales by 45%. Guests can project realistic, true-to-scale 3D models of your signature dishes right onto their table using their phone&apos;s camera — entirely through the browser.
            </p>
            <ul className="space-y-5">
              <li className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircleIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900">Zero-Friction</h4>
                  <p className="text-zinc-600 text-sm mt-1">No app downloads required. Works natively on iOS and Android browsers.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircleIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900">Increase Order Confidence</h4>
                  <p className="text-zinc-600 text-sm mt-1">Reduce ordering regret and returns by showing guests exactly what they are getting.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Analytics Feature Deep Dive */}
      <section className="py-24 bg-zinc-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-orange-400 text-sm font-semibold mb-6">
              <ChartBarIcon className="w-4 h-4" />
              <span>Executive Dashboard</span>
            </div>
            <h2 className="font-display text-4xl font-bold tracking-tight mb-6">Data-driven decisions for restaurant owners</h2>
            <p className="text-lg text-zinc-400 leading-relaxed mb-8">
              Gain complete visibility into your restaurant operations. Our advanced analytics suite process NLP sentiment feedback, predicts peak hour demands, and tracks live ingredient consumption to minimize wastage.
            </p>
            <Link 
              href="/admin/login" 
              className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all gap-2"
            >
              Explore Dashboard
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
          <div className="relative animate-fade-in-up delay-200">
            <Image 
              src="/dashboard-mockup.png" 
              alt="Restaurant Analytics Dashboard" 
              width={700} 
              height={500} 
              className="w-full drop-shadow-2xl rounded-2xl border flex-shrink-0 border-zinc-800"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-orange-50/50 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10 animate-fade-in-up">
          <h2 className="font-display text-5xl font-bold tracking-tight text-zinc-900 mb-6">Ready to digitize your dining experience?</h2>
          <p className="text-xl text-zinc-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join the smart restaurant revolution. Increase your table turnover rate, eliminate order inaccuracies, and boost revenue.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/register" 
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-orange-500 text-white font-semibold text-lg transition-all hover:bg-orange-600 hover:shadow-orange-500/25 hover:shadow-xl active:scale-95"
            >
              Partner With Us Now
            </Link>
            <Link 
              href="/contact" 
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#f9fafb] text-zinc-900 font-semibold text-lg transition-all hover:bg-zinc-100 active:scale-95 border border-zinc-200"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-xl tracking-tight">Table<span className="text-orange-500">.com.pk</span></span>
          </div>
          <p className="text-zinc-500 text-sm">
            © {new Date().getFullYear()} Smart Restaurant Ecosystem. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-zinc-500 font-medium">
            <Link href="#" className="hover:text-zinc-900 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-zinc-900 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
