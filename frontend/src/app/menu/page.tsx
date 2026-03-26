import { MenuContainer } from './MenuContainer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Menu - Smart Restaurant Ecosystem',
  description: 'Explore our delicious menu items, curated just for you.',
};

export default function MenuPage() {
  return (
    <div className="min-h-[100dvh] bg-gray-50 relative selection:bg-orange-500/30">
      <div className="max-w-md mx-auto min-h-screen bg-gray-50 relative overflow-hidden flex flex-col shadow-[0_0_50px_rgb(0,0,0,0.03)] border-x border-gray-100/50">
        
        {/* Top Spacer / Status bar area */}
        <div className="h-6 w-full bg-white/95 backdrop-blur-xl sticky top-0 z-40"></div>
        
        {/* Header content */}
        <header className="px-5 pt-2 pb-5 bg-white/95 backdrop-blur-xl sticky top-6 z-30 border-b border-gray-100 flex items-center justify-between shadow-sm shadow-gray-100/50">
          <div>
            <h1 className="text-[2rem] leading-none font-display font-bold text-gray-900 tracking-tight animate-fade-in-up">
              Our Menu
            </h1>
            <p className="text-sm font-sans text-gray-400 mt-2 font-medium animate-fade-in-up delay-100">
              Fresh, authentic & undeniably delicious.
            </p>
          </div>
          <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 shadow-inner shrink-0 text-gray-400 animate-fade-in-up delay-200">
            {/* User Icon placeholder */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
        </header>

        {/* Client Boundary wrapping the interactive components */}
        <div className="relative z-10 flex-1 bg-gray-50/50">
          <MenuContainer />
        </div>
        
      </div>
    </div>
  );
}
