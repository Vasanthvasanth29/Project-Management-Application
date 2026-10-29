import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Construction, Lock, ShieldCheck } from 'lucide-react';
import { site, payments, memberLimits, formatAmount, normalizeMembers, clampMembers, estimateMembership, } from '../../config/siteConfig';
export const CheckoutPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    // Member count carries through from the calculator — never silently reset.
    const urlMembers = normalizeMembers(searchParams.get('members'));
    const [members, setMembers] = useState(urlMembers);
    const [memberInput, setMemberInput] = useState(() => String(urlMembers));
    const [inputError, setInputError] = useState(null);
    // Re-sync when the URL changes (back/forward, link from the calculator).
    useEffect(() => {
        setMembers(urlMembers);
        setMemberInput(String(urlMembers));
        setInputError(null);
    }, [urlMembers]);
    const estimate = estimateMembership(members);
    const confirmed = estimate.confirmed;
    const updateMembersParam = (value) => {
        const next = new URLSearchParams(searchParams);
        next.set('members', String(value));
        setSearchParams(next, { replace: true });
    };
    const handleInput = (raw) => {
        setMemberInput(raw);
        if (raw.trim() === '') {
            setInputError(`Enter the number of team members (${memberLimits.min}–${memberLimits.max}).`);
            return;
        }
        const parsed = Number.parseInt(raw, 10);
        if (Number.isNaN(parsed)) {
            setInputError('Enter a valid number of members.');
            return;
        }
        if (parsed < memberLimits.min) {
            setInputError(`Minimum is ${memberLimits.min.toLocaleString('en-US')} members.`);
            return;
        }
        if (parsed > memberLimits.max) {
            setInputError(`Maximum is ${memberLimits.max.toLocaleString('en-US')} members.`);
            return;
        }
        setInputError(null);
        setMembers(parsed);
        updateMembersParam(parsed);
    };
    const handleBlur = () => {
        const parsed = Number.parseInt(memberInput, 10);
        const clamped = clampMembers(Number.isNaN(parsed) ? members : parsed);
        setMembers(clamped);
        setMemberInput(String(clamped));
        setInputError(null);
        updateMembersParam(clamped);
    };
    return (<div className="bg-[#f4f6f9] min-h-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <Link to="/pricing" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4b5563] hover:text-[#0f766e] transition-colors">
          <ArrowLeft className="w-4 h-4"/>
          Back to pricing
        </Link>

        <div className="mt-5">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0d9488]">
            Checkout
          </span>
          <h1 className="mt-1.5 font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Review your selection
          </h1>
          <p className="mt-2 text-[#4b5563] max-w-2xl">
            Confirm your team size and the estimated monthly total below. No payment is taken —
            online checkout opens once the payment gateway is live.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start">
          {/* ---------------- Selection ---------------- */}
          <div className="lg:col-span-3 space-y-6">
            <section className="card p-5 sm:p-6" aria-labelledby="members-heading">
              <h2 id="members-heading" className="section-title">
                1 · Team size
              </h2>
              <label htmlFor="checkout-members" className="input-label">
                How many team members do you need?
              </label>
              <div className="flex items-center gap-3">
                <input id="checkout-members" type="number" inputMode="numeric" min={memberLimits.min} max={memberLimits.max} step={1} value={memberInput} onChange={(event) => handleInput(event.target.value)} onBlur={handleBlur} aria-invalid={inputError ? true : undefined} aria-describedby={inputError ? 'checkout-members-error' : undefined} className="input w-32 text-center text-lg font-extrabold"/>
                <span className="text-sm text-[#4b5563]">
                  members ({memberLimits.min.toLocaleString('en-US')}–
                  {memberLimits.max.toLocaleString('en-US')} supported)
                </span>
              </div>
              {inputError ? (<p id="checkout-members-error" role="alert" className="mt-2 text-sm font-semibold text-[#b91c1c]">
                  {inputError}
                </p>) : (<p className="mt-2 text-xs text-[#9ca3af]">
                  Your selection was carried over from the pricing calculator.{' '}
                  <Link to={`/pricing?members=${members}`} className="font-semibold text-[#0f766e] hover:underline">
                    Change it on the pricing page
                  </Link>
                  .
                </p>)}
            </section>

            <section className="card p-5 sm:p-6" aria-labelledby="billing-heading">
              <h2 id="billing-heading" className="section-title">
                2 · Billing frequency
              </h2>
              <p className="text-sm text-[#4b5563]">
                <span className="font-semibold text-[#1a1d23]">Monthly billing.</span> Annual
                billing will be offered once both billing periods are confirmed by the business,
                so no annual total is shown today.
              </p>
            </section>

            {/* Payment gateway notice — required wording, shown until payments are active */}
            <section className="rounded-2xl border border-[#fde68a] bg-[#fffbeb] p-5 sm:p-6" role="status" aria-labelledby="payment-notice-heading">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-xl bg-[#fef3c7] text-[#b45309] flex items-center justify-center flex-shrink-0">
                  <Construction className="w-5 h-5" aria-hidden="true"/>
                </span>
                <div>
                  <h2 id="payment-notice-heading" className="text-sm font-bold text-[#92400e]">
                    Payments
                  </h2>
                  <p className="mt-1 text-sm text-[#92400e] leading-relaxed font-medium">
                    {payments.notice}
                  </p>
                  <p className="mt-2 text-xs text-[#a16207] leading-relaxed">
                    No card details are collected on this page and no order will be charged. We
                    will publish the confirmed payment flow when the gateway is activated.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* ---------------- Summary ---------------- */}
          <aside className="lg:col-span-2" aria-labelledby="summary-heading">
            <div className="card p-5 sm:p-6 lg:sticky lg:top-24">
              <div className="flex items-center justify-between gap-3">
                <h2 id="summary-heading" className="section-title mb-0">
                  Order summary
                </h2>
                <span className={`badge text-[10px] ${confirmed ? 'badge-green' : 'badge-amber'}`}>
                  {confirmed ? 'Approved price' : 'Preview estimate'}
                </span>
              </div>

              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[#4b5563]">Members</dt>
                  <dd className="font-bold text-[#1a1d23] text-right">{estimate.members} seats</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[#4b5563]">Price per member</dt>
                  <dd className="font-semibold text-[#1a1d23] text-right">
                    {formatAmount(estimate.pricePerMemberMonthly)} / month
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[#4b5563]">Billing</dt>
                  <dd className="font-semibold text-[#1a1d23] text-right">Billed monthly</dd>
                </div>
              </dl>

              <div className="divider"/>

              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-bold text-[#1a1d23]">Estimated monthly total</span>
                <span className="text-xl font-extrabold tracking-tight text-[#1a1d23] text-right">
                  {formatAmount(estimate.monthlyTotal)}
                  <span className="text-sm font-semibold text-[#9ca3af]"> / month</span>
                </span>
              </div>

              {!confirmed && (<p className="mt-2 text-xs text-[#9ca3af] leading-relaxed">
                  Estimated from a preview rate — not an approved commercial price. This total
                  will be confirmed with the approved {site.name} pricing. Nothing is charged
                  today.
                </p>)}

              <button type="button" className="btn-primary w-full mt-5 justify-center" disabled aria-disabled="true" title="Online payments are not enabled yet">
                <Lock className="w-4 h-4"/>
                Complete purchase
              </button>
              <p className="mt-2.5 text-xs text-center text-[#9ca3af] leading-relaxed">
                Checkout is disabled while the payment gateway is under construction.
              </p>

              <div className="mt-5 rounded-xl bg-[#f0fdfa] border border-[#99f6e4] px-3.5 py-3 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#0f766e] flex-shrink-0 mt-0.5" aria-hidden="true"/>
                <p className="text-xs text-[#0f766e] leading-relaxed">
                  You can create your account now and choose billing later — no payment
                  information is required to start.
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-[#f1f5f9] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                <Link to="/terms" className="text-[#4b5563] hover:text-[#0f766e] underline">
                  Terms of Service
                </Link>
                <Link to="/privacy" className="text-[#4b5563] hover:text-[#0f766e] underline">
                  Privacy Policy
                </Link>
                <Link to="/refunds" className="text-[#4b5563] hover:text-[#0f766e] underline">
                  Refunds
                </Link>
              </div>

              <Link to="/register" className="btn-secondary w-full mt-4 justify-center">
                Create an account
                <ArrowRight className="w-4 h-4"/>
              </Link>
            </div>
          </aside>
        </div>

        <div className="mt-10 rounded-2xl border border-[#e2e5ea] bg-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-[#4b5563] flex items-center gap-2">
            <Check className="w-4 h-4 text-[#10b981]" aria-hidden="true"/>
            Pricing is member-based — adjust your team size at any time.
          </p>
          <Link to={`/pricing?members=${members}`} className="btn-ghost btn-sm">
            View pricing
            <ArrowRight className="w-4 h-4"/>
          </Link>
        </div>
      </div>
    </div>);
};
export default CheckoutPage;
