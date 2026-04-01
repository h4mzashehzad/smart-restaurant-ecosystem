import { MenuContainer } from './MenuContainer';
import { SessionBanner } from '@/components/Menu/SessionBanner';
import { UserMenu } from '@/components/Menu/UserMenu';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Menu - Smart Restaurant Ecosystem',
  description: 'Explore our delicious menu items, curated just for you.',
};

export default function MenuPage() {
  return (
    <div className="min-h-[100dvh] bg-gray-50 relative selection:bg-orange-500/30">
      <div className="menu-scroll-container max-w-md mx-auto min-h-screen bg-gray-50 relative flex flex-col shadow-[0_0_50px_rgb(0,0,0,0.03)] border-x border-gray-100/50">
        
        {/* Top Spacer / Status bar area */}
        <div className="h-6 w-full bg-white/95 backdrop-blur-xl sticky top-0 z-40"></div>
        
        {/* Header */}
        <header className="px-5 pt-2 pb-5 bg-white/95 backdrop-blur-xl sticky top-6 z-30 border-b border-gray-100 flex items-center justify-between shadow-sm shadow-gray-100/50">
          <div>
            <h1 className="text-[2rem] leading-none font-display font-bold text-gray-900 tracking-tight animate-fade-in-up">
              Our Menu
            </h1>
            <p className="text-sm font-sans text-gray-400 mt-2 font-medium animate-fade-in-up delay-100">
              Fresh, authentic &amp; undeniably delicious.
            </p>
          </div>
          {/* Clickable user icon — shows profile or login/register */}
          <UserMenu />
        </header>

        {/* Session Banner — appears when a session is active */}
        <SessionBanner />

        {/* Client Boundary wrapping the interactive menu components */}
        <div className="relative z-10 flex-1 bg-gray-50/50">
          <MenuContainer />
        </div>
        
      </div>
    </div>
  );
}
