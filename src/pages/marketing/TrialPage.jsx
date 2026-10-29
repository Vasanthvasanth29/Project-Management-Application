import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRight, CalendarCheck, CheckCircle2, Hourglass, Info, Lock, ShieldCheck, Timer, } from 'lucide-react';
import { site, trial } from '../../config/siteConfig';
import { useAuthStore } from '../../store/authStore';
import { getTrialStatus, splitRemaining } from '../../utils/trialStatus';
import { isTrialUser, TRIAL_HOME_PATH, TRIAL_INCLUDED_FEATURES as INCLUDED_FEATURES, TRIAL_LOCKED_FEATURES as LOCKED_FEATURES } from '../../utils/trialAccess';
import { getDashboardPath } from '../../utils/roleUtils';
/**
 * FlowExec 7-Day Limited Trial page.
 *
 * Deliberately separate from "Get Started Free" (/register): this page has its
 * own route (/trial) and its own onboarding — the trial sign-up creates a new
 * MEMBER account carrying a TRIAL subscription record, which lands on the
 * trial workspace. Existing accounts keep signing in through /login unchanged.
 *
 * Frontend-only: there is no backend subscription system, so the trial record
 * lives in this browser and its restrictions are client-side only. No payment
 * details are collected and nothing auto-renews.
 */
const formatDateTime = (iso) => format(new Date(iso), "EEE d MMM yyyy, h:mm a");
const useNow = (intervalMs) => {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = window.setInterval(() => setNow(Date.now()), intervalMs);
        return () => window.clearInterval(id);
    }, [intervalMs]);
    return now;
};
const StatusTile = ({ icon: Icon, label, value, hint }) => (<div className="rounded-2xl border border-[#e2e5ea] bg-white p-5 shadow-fe-xs">
    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6b7280]">
      <Icon className="w-4 h-4 text-[#d97706]" aria-hidden="true"/>
      {label}
    </div>
    <p className="mt-2 font-display text-xl font-bold text-[#1a1d23]">{value}</p>
    {hint && <p className="mt-1 text-xs text-[#6b7280]">{hint}</p>}
  </div>);
/**
 * Duration / remaining / expiry tiles plus the next step. Presentational, so
 * every trial state can be rendered and tested without touching the store.
 */
export const TrialStatus = ({ status, notStartedAction }) => {
    const { days, hours, minutes } = splitRemaining(status.remainingMs);
    const remainingValue = status.state === 'active'
        ? `${days}d ${hours}h ${minutes}m`
        : status.state === 'expired'
            ? 'Trial ended'
            : `${trial.durationDays} days`;
    const remainingHint = status.state === 'not_started' ? 'Starts when you begin the trial' : undefined;
    return (
      <section aria-labelledby="trial-status-heading" className="py-14 sm:py-16 bg-[#f8fafc] border-b border-[#e2e5ea]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="trial-status-heading" className="font-display text-2xl font-bold text-[#1a1d23]">
            Your trial
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatusTile icon={CalendarCheck} label="Trial duration" value={`${trial.durationDays} days`}/>
            <StatusTile icon={Timer} label="Time remaining" value={remainingValue} hint={remainingHint}/>
            <StatusTile icon={Hourglass} label={status.state === 'expired' ? 'Expired on' : 'Expires on'} value={status.expiresAt ? formatDateTime(status.expiresAt) : 'Not started yet'} hint={status.startedAt ? `Started ${formatDateTime(status.startedAt)}` : undefined}/>
          </div>

          {status.state === 'not_started' ? (<div className="mt-8">{notStartedAction}</div>) : (<div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
              <Link to={status.state === 'active' ? TRIAL_HOME_PATH : '/pricing'} id="trial-continue" className="btn-lg w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-[#0a0f1e] bg-[#fbbf24] hover:bg-[#f59e0b] transition-colors focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:ring-offset-2">
                {status.state === 'active' ? 'Open trial workspace' : 'View Plans'}
                <ArrowRight className="w-4 h-4" aria-hidden="true"/>
              </Link>
              <p className="text-sm text-[#6b7280]">
                {status.state === 'active'
                ? 'Your trial account is signed in on this device.'
                : 'Your limited trial has ended. No charge was made and nothing renews automatically.'}
              </p>
            </div>)}
        </div>
      </section>);
};
const inputClass = 'w-full rounded-xl border border-[#d1d5db] bg-white px-4 py-3 text-sm text-[#1a1d23] focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/50 focus:border-[#f59e0b]';
/** Creates the trial account: name, email and password only — never payment details. */
export const TrialSignupForm = ({ onSubmit, isLoading, error }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState(null);
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || password.length < 8) {
            setLocalError('Enter your name, email and a password of at least 8 characters.');
            return;
        }
        setLocalError(null);
        onSubmit({ name, email, password });
    };
    const shownError = localError || error;
    return (<form id="trial-signup" onSubmit={handleSubmit} noValidate className="rounded-2xl border border-[#e2e5ea] bg-white p-6 shadow-fe-xs max-w-xl">
      <h3 className="font-bold text-[#1a1d23]">Create your trial account</h3>
      <p className="mt-1 text-sm text-[#6b7280]">
        Your {trial.durationDays}-day trial starts as soon as the account is created. No payment details required.
      </p>
      <div className="mt-5 space-y-3">
        <label className="block">
          <span className="text-xs font-bold text-[#4b5563]">Full name</span>
          <input type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={`mt-1 ${inputClass}`}/>
        </label>
        <label className="block">
          <span className="text-xs font-bold text-[#4b5563]">Work email</span>
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`mt-1 ${inputClass}`}/>
        </label>
        <label className="block">
          <span className="text-xs font-bold text-[#4b5563]">Password</span>
          <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`mt-1 ${inputClass}`}/>
        </label>
      </div>
      {shownError && (<p role="alert" className="mt-3 text-sm text-[#b91c1c]">{shownError}</p>)}
      <button type="submit" id="trial-start" disabled={isLoading} className="mt-5 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-[#0a0f1e] bg-[#fbbf24] hover:bg-[#f59e0b] disabled:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:ring-offset-2">
        {isLoading ? 'Creating your trial…' : `Begin ${trial.durationDays}-day trial`}
        <ArrowRight className="w-4 h-4" aria-hidden="true"/>
      </button>
      <p className="mt-4 text-xs text-[#6b7280]">
        Already have a trial account?{' '}
        <Link to="/login" className="font-semibold text-[#0d9488] hover:text-[#0f766e]">Log in</Link>
      </p>
    </form>);
};
export const TrialPage = () => {
    const navigate = useNavigate();
    const { currentUser, isAuthenticated, registerTrial, isLoading, error, clearError } = useAuthStore();
    const now = useNow(30000);
    const signedIn = isAuthenticated && currentUser;
    const trialAccount = signedIn && isTrialUser(currentUser);
    const status = getTrialStatus(trialAccount ? currentUser.subscription.startedAt : null, now, trialAccount ? currentUser.subscription.durationDays : undefined);
    useEffect(() => clearError(), [clearError]);
    const handleSignup = async (data) => {
        const result = await registerTrial(data);
        if (result.success)
            navigate(TRIAL_HOME_PATH);
    };
    // Signed in with a regular account: the trial is for new accounts, so offer
    // the way back to their own dashboard instead of a sign-up form.
    const notStartedAction = signedIn ? (<div className="rounded-2xl border border-[#e2e5ea] bg-white p-6 max-w-xl text-sm text-[#4b5563]">
        You're signed in as <strong className="text-[#1a1d23]">{currentUser.name}</strong>. The limited trial is for new
        accounts — your existing account is not affected.
        <Link to={getDashboardPath(currentUser.role)} className="mt-4 flex items-center gap-1.5 font-bold text-[#0d9488] hover:text-[#0f766e]">
          Back to your dashboard
          <ArrowRight className="w-4 h-4" aria-hidden="true"/>
        </Link>
      </div>) : (<TrialSignupForm onSubmit={handleSignup} isLoading={isLoading} error={error}/>);
    return (<>
      {/* ============================================================ */}
      {/* HERO                                                          */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-[#0a0f1e]">
        <div aria-hidden="true" className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 800px 420px at 50% -10%, rgba(245,158,11,0.22) 0%, transparent 60%), radial-gradient(ellipse 600px 380px at 90% 30%, rgba(13,148,136,0.2) 0%, transparent 58%)',
        }}/>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#fbbf24] text-xs font-bold tracking-wide">
            <Hourglass className="w-3.5 h-3.5" aria-hidden="true"/>
            {trial.durationDays}-Day Limited Trial
          </span>
          <h1 className="mt-6 font-display font-extrabold text-white tracking-tight text-3xl sm:text-5xl">
            Try {site.name} for {trial.durationDays} days
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            A time-boxed look at the core of {site.name}: plan a sprint, run it on a Kanban board and
            collaborate with your team. Premium features stay locked during the trial.
          </p>
          <p className="mt-3 text-sm text-slate-400">
            No payment details required · No automatic charges · Nothing renews when the trial ends
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* TRIAL STATUS                                                  */}
      {/* ============================================================ */}
      <TrialStatus status={status} notStartedAction={notStartedAction}/>

      {/* ============================================================ */}
      {/* INCLUDED vs LOCKED                                            */}
      {/* ============================================================ */}
      <section aria-labelledby="trial-scope-heading" className="py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="trial-scope-heading" className="font-display text-2xl font-bold text-[#1a1d23]">
            What the trial includes
          </h2>
          {!trial.featuresConfirmed && (<p className="mt-2 text-sm text-[#92400e] inline-flex items-center gap-1.5">
              <Info className="w-4 h-4" aria-hidden="true"/>
              Preview — trial scope is pending final business approval.
            </p>)}
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[#99f6e4] bg-[#f0fdfa] p-6">
              <h3 className="font-bold text-[#0f766e]">Included in the trial</h3>
              <ul className="mt-4 space-y-3">
                {INCLUDED_FEATURES.map((feature) => (<li key={feature} className="flex items-start gap-2.5 text-sm text-[#1a1d23]">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#0d9488]" aria-hidden="true"/>
                    <span>{feature}</span>
                  </li>))}
              </ul>
            </div>
            <div className="rounded-2xl border border-[#e2e5ea] bg-[#f8fafc] p-6">
              <h3 className="font-bold text-[#4b5563]">Premium — locked during the trial</h3>
              <ul className="mt-4 space-y-3">
                {LOCKED_FEATURES.map((feature) => (<li key={feature} className="flex items-start gap-2.5 text-sm text-[#6b7280]">
                    <Lock className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#9ca3af]" aria-label="Locked"/>
                    <span>{feature}</span>
                  </li>))}
              </ul>
              <Link to="/pricing" className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#0d9488] hover:text-[#0f766e]">
                See premium plans
                <ArrowRight className="w-4 h-4" aria-hidden="true"/>
              </Link>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-[#e2e5ea] p-5 flex items-start gap-3 text-sm text-[#4b5563]">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 text-[#0d9488]" aria-hidden="true"/>
            <p>
              Your trial account is stored in this browser only, so it can't be used from another device and
              clearing site data removes it. {site.name} never asks for card details during the trial, and the trial does not convert to a
              paid plan on its own.
            </p>
          </div>
        </div>
      </section>
    </>);
};
export default TrialPage;
