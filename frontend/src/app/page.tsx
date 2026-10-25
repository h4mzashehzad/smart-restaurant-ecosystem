import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  QrCode,
  ChefHat,
  ChartNoAxesCombined,
  Check,
} from 'lucide-react';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { ProductScreenshot } from '@/components/marketing/ProductScreenshot';
import '@/styles/marketing.css';
export const metadata: Metadata = {
  title: 'Table.com.pk — From table to kitchen, connected',
  description:
    'QR menus, shared ordering, split bills, kitchen service, reservations and restaurant insights. Explore the real Table.com.pk experience.',
};
export default function Home() {
  return (
    <div className="marketing">
      <MarketingHeader />
      <main id="main-content">
        <section className="marketing-width home-hero">
          <div className="home-hero-copy">
            <p className="marketing-kicker">A little less busywork. A better service.</p>
            <h1>
              Every table.
              <br />
              One connected
              <br />
              <span>experience.</span>
            </h1>
            <p className="marketing-lead">
              From the first table booking to the last split bill. Bring your guests, kitchen and
              restaurant team together with Table.com.pk.
            </p>
            <div className="marketing-actions">
              <Link href="/partners" className="marketing-button">
                Partner with us <ArrowUpRight size={18} />
              </Link>
              <a href="#how-it-works" className="marketing-text-link">
                See how it works <ArrowRight size={17} />
              </a>
            </div>
            <p className="marketing-small hero-footnote">
              <Check size={15} /> Guests open it in their browser. No app download needed.
            </p>
          </div>
          <div className="home-hero-product">
            <div className="hero-product-label">
              <span>Made for the way you serve.</span>
              <span>GUEST EXPERIENCE</span>
            </div>
            <div className="hero-product-pair">
              <ProductScreenshot
                screen="session"
                priority
                caption="A table, already connected."
                className="hero-session"
              />
              <ProductScreenshot
                screen="payment"
                priority
                caption="A bill, shared their way."
                className="hero-payment"
              />
            </div>
            <p className="marketing-small">
              Real screens from Table.com.pk. Tap any screen to explore.
            </p>
          </div>
        </section>
        <div className="platform-strip">
          <div className="marketing-width">
            <span>
              <QrCode size={20} /> At the table
            </span>
            <ArrowRight size={16} />
            <span>
              <ChefHat size={20} /> In the kitchen
            </span>
            <ArrowRight size={16} />
            <span>
              <ChartNoAxesCombined size={20} /> Across your business
            </span>
          </div>
        </div>
        <section id="how-it-works" className="marketing-width marketing-section dining-story">
          <div className="marketing-section-heading">
            <p className="marketing-kicker">THE SERVICE, FROM START TO FINISH</p>
            <h2>
              A smoother visit.
              <br />
              Every step of the way.
            </h2>
            <p>Keep the guest experience moving, while your team stays in the loop.</p>
          </div>
          <div className="dining-story-layout">
            <div className="dining-stages">
              {[
                [
                  'Reserve a place.',
                  'Guests choose a date, time and available table. Your team manages reservations and food preorders in one place.',
                ],
                [
                  'Scan. Browse. Make it theirs.',
                  'A table QR opens your menu. Guests join the session, explore dishes and customize ingredients before ordering.',
                ],
                [
                  'Share the meal, split the bill.',
                  'Pay together, split equally or claim individual items. See who has paid, with cash and card options.',
                ],
                [
                  'Stay connected through service.',
                  'Kitchen tickets, order updates and waiter requests keep the right details moving between guests and staff.',
                ],
              ].map(([title, text], i) => (
                <article key={title}>
                  <span className="stage-number">0{i + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </article>
              ))}
              <Link href="/partners#ordering" className="marketing-text-link">
                Explore the guest experience <ArrowRight size={17} />
              </Link>
            </div>
            <div className="story-screens">
              <ProductScreenshot
                screen="menu"
                caption="Your dishes, with the details guests need."
              />
              <ProductScreenshot
                screen="ingredients"
                caption="Customizations reach the kitchen with the order."
              />
            </div>
          </div>
        </section>
        <section className="kitchen-section">
          <div className="marketing-width marketing-section">
            <div className="kitchen-heading">
              <div>
                <p className="marketing-kicker">IN THE KITCHEN</p>
                <h2>
                  Less chasing tickets.
                  <br />
                  More clarity on the pass.
                </h2>
              </div>
              <p>
                See orders, table numbers and customization notes together. Follow preparation and
                service, respond to assistance requests, and confirm cash payments.
              </p>
            </div>
            <ProductScreenshot
              screen="kitchen"
              caption="Actual kitchen display. Example tickets and overdue states shown."
            />
            <Link href="/partners#service" className="marketing-text-link">
              See the service tools <ArrowRight size={17} />
            </Link>
          </div>
        </section>
        <section className="marketing-width marketing-section insight-story">
          <div>
            <p className="marketing-kicker">AFTER THE RUSH</p>
            <h2>
              Know what happened.
              <br />
              <span>Plan what comes next.</span>
            </h2>
            <p className="marketing-lead">
              Understand your peak hours, popular dishes, revenue and guest feedback. Use order
              history to inform preparation with demand forecasts.
            </p>
            <Link href="/partners#insights" className="marketing-text-link">
              Explore restaurant insights <ArrowRight size={17} />
            </Link>
            <p className="marketing-small">
              Forecasts become available as your order history grows.
            </p>
          </div>
          <div className="insight-screens">
            <ProductScreenshot screen="heatmap" caption="Spot the busy hours across your week." />
            <ProductScreenshot
              screen="forecast"
              caption="Plan preparation with expected demand. Example data shown."
            />
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
