'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Loader2, MailCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PhoneInput } from '@/components/PhoneInput';
import {
  restaurantRegistration,
  type RegistrationChallenge,
  type RestaurantRegistrationPayload,
} from '@/lib/restaurant-registration';
import { getErrorMessage } from '@/lib/error-message';
import axios from 'axios';

type Form = Omit<RestaurantRegistrationPayload, 'opening_time' | 'closing_time'> & {
  password: string;
  password_confirmation: string;
  opening_time: string;
  closing_time: string;
};
const blank: Form = {
  name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
  restaurant_name: '',
  restaurant_slug: '',
  restaurant_address: '',
  restaurant_phone: '',
  restaurant_email: '',
  opening_time: '',
  closing_time: '',
  timezone: 'Asia/Karachi',
};
const draftKey = 'restaurant-registration-draft-v1';
const steps = ['Your account', 'Your restaurant', 'Hours & review', 'Verify email'];
const labels: Partial<Record<keyof Form, string>> = {
  name: 'Full name',
  email: 'Your email',
  phone: 'Your phone',
  password: 'Password',
  password_confirmation: 'Confirm password',
  restaurant_name: 'Restaurant name',
  restaurant_slug: 'Restaurant link',
  restaurant_address: 'Restaurant address',
  restaurant_phone: 'Restaurant phone',
  restaurant_email: 'Restaurant email',
  opening_time: 'Opens at',
  closing_time: 'Closes at',
  timezone: 'Timezone',
};

export function RestaurantRegistrationWizard() {
  const router = useRouter();
  const { user, loading: authLoading, completeRestaurantRegistration } = useAuth();
  const [form, setForm] = useState<Form>(blank);
  const [step, setStep] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [challenge, setChallenge] = useState<RegistrationChallenge | null>(null);
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [resendAt, setResendAt] = useState(0);
  const [clock, setClock] = useState(0);
  const [slugEdited, setSlugEdited] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const existing = user?.role === 'customer';

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(draftKey) || 'null');
      if (saved) {
        const allowed = Object.fromEntries(
          Object.entries(blank)
            .filter(([key]) => !['password', 'password_confirmation'].includes(key))
            .map(([key, value]) => [
              key,
              typeof saved.form?.[key] === 'string' ? saved.form[key] : value,
            ])
        );
        setForm({ ...blank, ...allowed });
        setSlugEdited(Boolean(saved.form?.restaurant_slug));
        if (
          saved.challenge?.expires_at > Date.now() / 1000 &&
          typeof saved.challenge?.challenge_id === 'string'
        ) {
          setChallenge(saved.challenge);
          setStep(3);
          setResendAt(saved.resendAt || 0);
        }
      }
    } catch {
      sessionStorage.removeItem(draftKey);
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    const { password: _password, password_confirmation: _confirmation, ...safe } = form;
    void _password;
    void _confirmation;
    sessionStorage.setItem(draftKey, JSON.stringify({ form: safe, challenge, resendAt }));
  }, [form, challenge, resendAt, hydrated]);
  useEffect(() => {
    if (!challenge) return;
    const update = () => setClock(Date.now());
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [challenge]);
  useEffect(() => {
    if (hydrated) heading.current?.focus({ preventScroll: true });
  }, [step, hydrated]);
  useEffect(() => {
    if (
      !authLoading &&
      user &&
      (user.role === 'admin' || user.role === 'staff') &&
      user.restaurant_id &&
      user.is_active !== false
    )
      router.replace('/admin');
  }, [user, authLoading, router]);

  function change(name: keyof Form, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'restaurant_name' && !slugEdited
        ? {
            restaurant_slug: value
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '')
              .slice(0, 100),
          }
        : {}),
    }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }
  function handleError(err: unknown) {
    if (axios.isAxiosError(err) && err.response?.data?.errors) {
      const fields = Object.fromEntries(
        Object.entries(err.response.data.errors as Record<string, string[]>).map(([key, value]) => [
          key,
          value[0],
        ])
      );
      setErrors(fields);
      setError(Object.values(fields)[0] || 'Please check the highlighted fields.');
      if (!fields.otp) {
        if (
          ['name', 'email', 'phone', 'password', 'password_confirmation'].some((key) => fields[key])
        )
          setStep(0);
        else if (Object.keys(fields).some((key) => key.startsWith('restaurant_'))) setStep(1);
      }
    } else setError(getErrorMessage(err, 'We could not complete that step. Please try again.'));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    setErrors({});
    if (step === 0) {
      if (!existing && form.password !== form.password_confirmation) {
        setErrors({ password_confirmation: 'Passwords must match.' });
        return;
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      setStep(2);
      return;
    }
    setBusy(true);
    try {
      if (step === 2) {
        const { password, password_confirmation, ...details } = form;
        const payload: RestaurantRegistrationPayload = {
          ...details,
          name: existing ? user.name : form.name,
          email: existing ? user.email : form.email,
          phone: existing ? user.phone || form.phone : form.phone,
          opening_time: form.opening_time || null,
          closing_time: form.closing_time || null,
          ...(!existing ? { password, password_confirmation } : {}),
        };
        const next = await restaurantRegistration.start(payload, existing);
        setChallenge(next);
        setResendAt(Date.now() + next.resend_after * 1000);
        setStep(3);
        setForm((current) => ({ ...current, password: '', password_confirmation: '' }));
      } else if (challenge) {
        const result = await restaurantRegistration.verify(challenge.challenge_id, otp);
        sessionStorage.removeItem(draftKey);
        completeRestaurantRegistration(result.user, result.token);
        router.replace('/admin');
      }
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    if (!challenge || busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await restaurantRegistration.resend(challenge.challenge_id);
      setResendAt(Date.now() + result.resend_after * 1000);
      setNotice('A fresh code is on its way. Use the newest email.');
      setOtp('');
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }
  function back() {
    setError('');
    setErrors({});
    setStep((current) => Math.max(0, current - 1));
    if (step === 3) {
      setChallenge(null);
      setOtp('');
      setStep(0);
    }
  }
  function field(name: keyof Form, type = 'text', required = true, hint?: string) {
    const isPassword = type === 'password';
    return (
      <div className="registration-field" key={name}>
        <label htmlFor={name}>
          {labels[name]}
          {!required && <span> (optional)</span>}
        </label>
        <div className="registration-input-wrap">
          <input
            id={name}
            name={name}
            type={isPassword && showPassword ? 'text' : type}
            required={required}
            value={form[name]}
            onChange={(e) => {
              if (name === 'restaurant_slug') setSlugEdited(true);
              change(name, e.target.value);
            }}
            aria-invalid={Boolean(errors[name])}
            aria-describedby={errors[name] || hint ? `${name}-help` : undefined}
            minLength={isPassword ? 8 : undefined}
            maxLength={
              name === 'restaurant_address'
                ? 1000
                : isPassword
                  ? 128
                  : name === 'restaurant_slug'
                    ? 100
                    : 150
            }
            pattern={name === 'restaurant_slug' ? '[a-z0-9]+(-[a-z0-9]+)*' : undefined}
            autoComplete={
              name === 'email'
                ? 'email'
                : name === 'name'
                  ? 'name'
                  : isPassword
                    ? 'new-password'
                    : name.includes('phone')
                      ? 'tel'
                      : undefined
            }
          />
          {name === 'password' && (
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {(errors[name] || hint) && (
          <p
            id={`${name}-help`}
            className={errors[name] ? 'registration-error' : 'registration-hint'}
          >
            {errors[name] || hint}
          </p>
        )}
      </div>
    );
  }
  if (!hydrated || authLoading)
    return (
      <div className="registration-loading" role="status">
        <Loader2 className="animate-spin" size={22} /> Preparing your restaurant setup…
      </div>
    );
  if (user && user.role !== 'customer')
    return (
      <div className="registration-panel">
        <h2>You already have an operator account.</h2>
        <p>
          Sign in to your existing restaurant dashboard. Accounts are associated with one
          restaurant.
        </p>
        <Link className="marketing-button" href="/admin/login">
          Restaurant login
        </Link>
      </div>
    );
  const resendSeconds = Math.max(0, Math.ceil((resendAt - clock) / 1000));
  const expired = Boolean(challenge && clock > challenge.expires_at * 1000);
  return (
    <div className="registration-layout marketing-width">
      <aside className="registration-aside">
        <Link href="/partners" className="marketing-text-link">
          <ArrowLeft size={16} /> Back to the platform
        </Link>
        <p className="marketing-kicker">LET’S GET YOU SET UP</p>
        <h1>
          Your restaurant.
          <br />
          <span>Your own space.</span>
        </h1>
        <p>Your details, menu, tables and team come together in one restaurant workspace.</p>
        <ol>
          {steps.map((label, index) => (
            <li key={label} aria-current={step === index ? 'step' : undefined}>
              <span>{step > index ? <Check size={15} /> : index + 1}</span>
              {label}
            </li>
          ))}
        </ol>
        <p className="marketing-small">
          Verify your email, then go straight to your dashboard. Add your menu and tables at your
          own pace.
        </p>
      </aside>
      <section className="registration-panel" aria-busy={busy}>
        <p className="marketing-kicker">STEP {step + 1} OF 4</p>
        <h2 tabIndex={-1} ref={heading}>
          {
            [
              'First, your account.',
              'Tell us about your restaurant.',
              'A few details. Then you’re in.',
              'Check your email.',
            ][step]
          }
        </h2>
        <p>
          {
            [
              'Your email will be used to verify and access your administrator account.',
              'These are the details your guests and team will use.',
              'Set your hours now or finish them from your dashboard.',
              `Enter the six-digit code sent to ${challenge?.email ?? 'your email'}.`,
            ][step]
          }
        </p>
        {error && (
          <div className="registration-alert" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <p className="registration-success" role="status">
            {notice}
          </p>
        )}
        <form onSubmit={submit}>
          {step === 0 && (
            <>
              {existing ? (
                <div className="existing-account">
                  <strong>Continue as {user.name}</strong>
                  <p>{user.email}</p>
                  <p className="marketing-small">
                    Continuing will create a restaurant using your signed-in account. We will verify
                    this email before adding administrator access.
                  </p>
                  {!user.phone && (
                    <div className="registration-field">
                      <label htmlFor="phone">Your phone</label>
                      <PhoneInput
                        id="phone"
                        value={form.phone}
                        onChange={(value) => change('phone', value)}
                        required
                      />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="registration-fields">
                    {field('name')}
                    {field('email', 'email')}
                    <div className="registration-field">
                      <label htmlFor="phone">Your phone</label>
                      <PhoneInput
                        id="phone"
                        value={form.phone}
                        onChange={(value) => change('phone', value)}
                        required
                      />
                      {errors.phone && <p className="registration-error">{errors.phone}</p>}
                    </div>
                    <div className="registration-two">
                      {field('password', 'password')}
                      {field('password_confirmation', 'password')}
                    </div>
                  </div>
                  <p className="registration-signin">
                    Already have an account?{' '}
                    <Link href="/login?redirect=%2Fpartners%2Fregister">Sign in to use it</Link>
                  </p>
                </>
              )}
            </>
          )}
          {step === 1 && (
            <div className="registration-fields">
              {field('restaurant_name')}
              {field(
                'restaurant_slug',
                'text',
                true,
                'Your reservation link will be /' +
                  (form.restaurant_slug || 'your-restaurant') +
                  '/reserve.'
              )}
              {field('restaurant_address')}
              <button
                type="button"
                className="marketing-text-link"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    restaurant_phone: existing ? user.phone || current.phone : current.phone,
                    restaurant_email: existing ? user.email : current.email,
                  }))
                }
              >
                Use my contact details <ArrowRight size={15} />
              </button>
              <div className="registration-two">
                {field('restaurant_email', 'email')}
                {field('restaurant_phone', 'tel')}
              </div>
            </div>
          )}
          {step === 2 && (
            <>
              <div className="registration-two">
                {field('opening_time', 'time', Boolean(form.closing_time))}
                {field('closing_time', 'time', Boolean(form.opening_time))}
              </div>
              {field('timezone', 'text', true, 'Use a timezone such as Asia/Karachi.')}
              <div className="registration-review">
                <div>
                  <h3>Ready to create</h3>
                  <button type="button" className="marketing-text-link" onClick={() => setStep(1)}>
                    Edit details
                  </button>
                </div>
                <strong>{form.restaurant_name}</strong>
                <p>{form.restaurant_address}</p>
                <p>
                  {form.restaurant_email} · {form.restaurant_phone}
                </p>
                <p>Owner: {existing ? user.email : form.email}</p>
                <p className="marketing-small">
                  We’ll send a verification code before creating your restaurant and administrator
                  account.
                </p>
              </div>
            </>
          )}
          {step === 3 && (
            <div className="registration-verification">
              <MailCheck size={36} />
              <label htmlFor="otp">Email verification code</label>
              <input
                id="otp"
                name="otp"
                className="registration-otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                pattern="[0-9]{6}"
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-invalid={Boolean(errors.otp)}
                aria-describedby="otp-help"
                maxLength={6}
              />
              <p id="otp-help" className={expired ? 'registration-error' : 'registration-hint'}>
                {expired
                  ? 'This code has expired. Start again to get a new code.'
                  : 'Your code expires 15 minutes after it was first sent.'}
              </p>
              <button
                type="button"
                className="marketing-text-link"
                onClick={resend}
                disabled={busy || resendSeconds > 0 || expired}
              >
                {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend code'}
              </button>
            </div>
          )}
          <div className="registration-controls">
            {step > 0 && (
              <button
                type="button"
                className="marketing-button secondary"
                onClick={back}
                disabled={busy}
              >
                <ArrowLeft size={16} /> {step === 3 ? 'Start again' : 'Back'}
              </button>
            )}
            <button type="submit" className="marketing-button" disabled={busy || expired}>
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Please wait…
                </>
              ) : (
                <>
                  {['Continue', 'Continue', 'Send verification code', 'Create restaurant'][step]}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
        <p className="registration-bottom">
          Already a restaurant partner? <Link href="/admin/login">Restaurant login</Link>
        </p>
      </section>
    </div>
  );
}
