import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Brand } from './MarketingHeader';
export function MarketingFooter({ partner = false }: { partner?: boolean }) {
  return (
    <footer className="marketing-footer">
      <div className="marketing-width">
        <div className="marketing-footer-invite">
          <h2>
            Your next service,
            <br />
            better connected.
          </h2>
          <div>
            <p>
              Your menu, your tables, your team.
              <br />
              Bring them together with Table.com.pk.
            </p>
            <Link href={partner ? '/partners/register' : '/partners'} className="marketing-button">
              {partner ? 'Register your restaurant' : 'Partner with us'}
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
        <div className="marketing-footer-bottom">
          <Link href="/">
            <Brand />
          </Link>
          <p>© {new Date().getFullYear()} Table.com.pk</p>
          <nav aria-label="Footer">
            <Link href="/partners">For restaurants</Link>
            <Link href="/admin/login">Restaurant login</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
