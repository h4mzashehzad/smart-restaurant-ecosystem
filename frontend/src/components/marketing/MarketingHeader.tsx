'use client';
import Link from 'next/link';
import { Menu, ArrowUpRight } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';

export function Brand() {
  return (
    <span className="marketing-brand">
      Table<span>.com.pk</span>
    </span>
  );
}
export function MarketingHeader() {
  const links = [
    { href: '/#how-it-works', label: 'How it works' },
    { href: '/partners', label: 'For restaurants' },
    { href: '/admin/login', label: 'Restaurant login' },
  ];
  return (
    <header className="marketing-header">
      <div className="marketing-width marketing-nav">
        <Link href="/" aria-label="Table.com.pk homepage">
          <Brand />
        </Link>
        <nav aria-label="Main navigation" className="marketing-desktop-nav">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <Link href="/partners" className="marketing-button marketing-nav-cta">
          Partner with us <ArrowUpRight size={16} />
        </Link>
        <Sheet>
          <SheetTrigger className="marketing-menu" aria-label="Open navigation">
            <Menu size={24} />
          </SheetTrigger>
          <SheetContent className="marketing-mobile-nav">
            <SheetHeader>
              <SheetTitle>
                <Brand />
              </SheetTitle>
            </SheetHeader>
            <nav aria-label="Mobile navigation">
              {links.map((link) => (
                <SheetClose nativeButton={false} key={link.href} render={<Link href={link.href} />}>
                  {link.label}
                </SheetClose>
              ))}
              <SheetClose
                nativeButton={false}
                render={<Link href="/partners" className="marketing-button" />}
              >
                Partner with us
              </SheetClose>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
