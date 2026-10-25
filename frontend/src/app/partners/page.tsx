import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Check, ArrowRight } from 'lucide-react';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { ProductScreenshot } from '@/components/marketing/ProductScreenshot';
import { featureGroups } from '@/lib/marketing-content';
import '@/styles/marketing.css';
export const metadata: Metadata = {
  title: 'Partner with Table.com.pk — Your restaurant, connected',
  description:
    'Explore QR ordering, reservations, kitchen operations, split payments, loyalty and analytics. Register your restaurant and set up your own workspace.',
};
export default function PartnersPage() {
  return (
    <div className="marketing">
      <MarketingHeader />
      <main id="main-content">
        <section className="marketing-width partner-hero">
          <p className="marketing-kicker">FOR RESTAURANTS</p>
          <h1>
            Good hospitality.
            <br />
            <span>Backed by a connected system.</span>
          </h1>
          <div className="partner-hero-bottom">
            <p className="marketing-lead">
              Your menu, your tables, your team. Give guests an easier way to dine, and give your
              restaurant a clearer way to work.
            </p>
            <div>
              <Link href="/partners/register" className="marketing-button">
                Register your restaurant <ArrowUpRight size={18} />
              </Link>
              <Link href="/admin/login" className="marketing-text-link">
                Already a partner? Sign in <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
        <nav className="feature-index marketing-width" aria-label="Restaurant features">
          {featureGroups.map((group) => (
            <a key={group.id} href={`#${group.id}`}>
              {
                {
                  arrival: 'Arrival',
                  ordering: 'Ordering',
                  dishes: 'Dish details',
                  service: 'Kitchen & service',
                  payments: 'Payments',
                  relationships: 'Loyalty & feedback',
                  management: 'Management',
                  insights: 'Insights',
                }[group.id]
              }
              <ArrowUpRight size={14} />
            </a>
          ))}
        </nav>
        <div className="marketing-width">
          <p className="marketing-small feature-proof">
            The screens below are captured from the real system, with example restaurant data.
          </p>
          {featureGroups.map((group, index) => (
            <section
              key={group.id}
              id={group.id}
              className={`feature-section ${group.screens.length === 0 ? 'management-section' : ''}`}
            >
              <div className="feature-copy">
                <p className="marketing-kicker">
                  {
                    [
                      'WELCOME YOUR GUESTS',
                      'AT THE TABLE',
                      'BEFORE THEY ORDER',
                      'DURING SERVICE',
                      'AT CHECKOUT',
                      'AFTER THE VISIT',
                      'BEHIND THE SCENES',
                      'THE BIGGER PICTURE',
                    ][index]
                  }
                </p>
                <h2>{group.title}</h2>
                <p>{group.description}</p>
                <ul>
                  {group.features.map((feature) => (
                    <li key={feature}>
                      <Check size={17} aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {group.note && <p className="feature-note">{group.note}</p>}
              </div>
              {group.screens.length > 0 ? (
                <div
                  className={`feature-screens ${group.screens.some((x) => ['kitchen', 'heatmap', 'forecast'].includes(x)) ? 'feature-screens-wide' : ''}`}
                >
                  {group.screens.map((screen) => (
                    <ProductScreenshot
                      key={screen}
                      screen={screen}
                      caption={
                        screen === 'kitchen' ? 'Kitchen display with example tickets.' : undefined
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="workspace-map">
                  <p className="marketing-kicker">YOUR OWN WORKSPACE</p>
                  <h3>Everything has a place.</h3>
                  {[
                    ['Your menu', 'Dishes, categories & ingredients'],
                    ['Your floor', 'Tables, capacities & QR codes'],
                    ['Your people', 'Admin & staff accounts'],
                    ['Your business', 'Operations & restaurant insights'],
                  ].map(([title, text]) => (
                    <div key={title}>
                      <strong>{title}</strong>
                      <span>{text}</span>
                    </div>
                  ))}
                  <Link href="/partners/register" className="marketing-text-link">
                    Set up your restaurant <ArrowRight size={17} />
                  </Link>
                </div>
              )}
            </section>
          ))}
        </div>
        <section className="faq-section">
          <div className="marketing-width">
            <h2>
              A few things before
              <br />
              your first service.
            </h2>
            <div className="faq-list">
              {[
                [
                  'Do guests need to download an app?',
                  'No. A table QR opens the guest experience in their browser. Guests can join a dining session without creating an account; signing in gives them access to personalized features and loyalty.',
                ],
                [
                  'What happens after I register?',
                  'Verify your email to create your restaurant and administrator account. You’ll enter your dashboard with a quick tour and setup checklist for your details, menu, tables and team.',
                ],
                [
                  'Will my restaurant have its own setup?',
                  'Yes. Your restaurant has its own menu, categories, ingredients, tables, operations and team accounts. Administrators and staff only manage the restaurant associated with their account.',
                ],
                [
                  'What do I need for AR and forecasts?',
                  'AR previews require a dish model and a compatible device/browser. Demand forecasts require historical orders and the forecasting service, so they will not be populated for a brand-new restaurant.',
                ],
                [
                  'Which payments are supported?',
                  'The current system supports cash with staff confirmation and card checkout through Safepay, including full payments and equal or itemized splits. Payment processing uses the platform’s configured gateway.',
                ],
                [
                  'Can my team use the system too?',
                  'Yes. An administrator can create staff accounts in the Team section. Staff get access to the operational tools available to their role.',
                ],
              ].map(([question, answer]) => (
                <details key={question}>
                  <summary>
                    {question}
                    <span aria-hidden="true">+</span>
                  </summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter partner />
    </div>
  );
}
