import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Construction, Info, Minus, ShieldCheck, Sparkles, Users, Zap, Building2, ChevronDown, ChevronUp, } from 'lucide-react';
import { site, pricing, payments, memberLimits, plans, estimateMembership, } from '../../config/siteConfig';
import { MemberPricingSection } from './MemberPricing';
/**
 * FlowExec Pricing page.
 *
 * Three tiers (Starter / Pro / Enterprise) are presented for discovery.
 * Preview prices ($12/$29/user/month) are the business-proposed values from
 * the brief, clearly labelled as unconfirmed pending final approval.
 * No commercial transaction is enabled until payments.enabled is true.
 */
/* ---------------- Plan feature lists ---------------- */
const PLAN_FEATURES = {
    starter: [
        'Up to 10 team members',
        'Kanban board with drag-and-drop',
        'Sprint and iteration planning',
        'Task management: story, task, bug, sub-task',
        'Comments, mentions and notifications',
        'Basic project dashboard and reports',
    ],
    pro: [
        'Everything in Starter',
        'Unlimited team members',
        'Cross-project roadmaps and Gantt charts',
        'Advanced sprint reports exported to PDF',
        'Team workload and capacity management',
        'Project health signals and analytics',
        'Single sign-on (Entra ID, Google, Okta SAML)',
        'Audit log export for administrators',
        'Custom workflow statuses and WIP limits',
        'Role-based access: Admin, PM, TL, Member',
    ],
    enterprise: [
        'Everything in Pro',
        'Unlimited projects and workspaces',
        'Dedicated customer success manager',
        'Custom security and compliance review',
        'Priority support with SLA',
        'Custom onboarding and training',
        'Governance across multiple programmes',
    ],
};
const COMPARISON_GROUPS = [
    {
        group: 'Planning & tracking',
        rows: [
            { label: 'Kanban board with drag-and-drop', starter: 'yes', pro: 'yes', enterprise: 'yes' },
            { label: 'Work items: story, task, bug, sub-task, initiative', starter: 'yes', pro: 'yes', enterprise: 'yes' },
            { label: 'Sprint and iteration planning', starter: 'yes', pro: 'yes', enterprise: 'yes' },
            { label: 'Gantt charts and timeline view', starter: 'no', pro: 'yes', enterprise: 'yes' },
            { label: 'Cross-project roadmaps', starter: 'no', pro: 'yes', enterprise: 'yes' },
            { label: 'Project health signals', starter: 'no', pro: 'yes', enterprise: 'yes' },
            { label: 'Release and version management', starter: 'no', pro: 'yes', enterprise: 'yes' },
        ],
    },
    {
        group: 'Collaboration & access',
        rows: [
            { label: 'Comments, mentions and notifications', starter: 'yes', pro: 'yes', enterprise: 'yes' },
            { label: 'Project chat and activity feed', starter: 'yes', pro: 'yes', enterprise: 'yes' },
            { label: 'Roles: Admin, PM, Team Leader, Member', starter: 'yes', pro: 'yes', enterprise: 'yes' },
            { label: 'Team workload and capacity management', starter: 'no', pro: 'yes', enterprise: 'yes' },
            { label: 'Single sign-on (Entra ID, Google, Okta SAML)', starter: 'no', pro: 'yes', enterprise: 'yes' },
            { label: 'Audit log export', starter: 'no', pro: 'yes', enterprise: 'yes' },
        ],
    },
    {
        group: 'Analytics & reporting',
        rows: [
            { label: 'Basic project dashboard', starter: 'yes', pro: 'yes', enterprise: 'yes' },
            { label: 'Sprint burndown and velocity charts', starter: 'no', pro: 'yes', enterprise: 'yes' },
            { label: 'PDF report exports', starter: 'no', pro: 'yes', enterprise: 'yes' },
            { label: 'Portfolio and initiative reporting', starter: 'no', pro: 'yes', enterprise: 'yes' },
        ],
    },
    {
        group: 'Seats & billing',
        rows: [
            {
                label: 'Team members',
                starter: { placeholder: 'Up to 10 (to be confirmed)' },
                pro: { placeholder: 'Unlimited' },
                enterprise: { placeholder: 'Unlimited + custom' },
            },
            {
                label: 'Price',
                starter: { placeholder: `$${plans.starter.previewPriceMonthly}/user/mo — preview` },
                pro: { placeholder: `$${plans.pro.previewPriceMonthly}/user/mo — preview` },
                enterprise: { placeholder: 'By agreement' },
            },
            {
                label: 'Billing period',
                starter: { placeholder: 'Monthly billing' },
                pro: { placeholder: 'Monthly billing' },
                enterprise: { placeholder: 'To be confirmed' },
            },
        ],
    },
    {
        group: 'Enterprise features',
        rows: [
            { label: 'Dedicated customer success manager', starter: 'no', pro: 'no', enterprise: 'yes' },
            { label: 'Custom security and compliance review', starter: 'no', pro: 'no', enterprise: 'yes' },
            { label: 'Priority support with SLA', starter: 'no', pro: 'no', enterprise: 'yes' },
            { label: 'Custom onboarding and training', starter: 'no', pro: 'no', enterprise: 'yes' },
        ],
    },
];
/* ---------------- FAQ data ---------------- */
const FAQS = [
    {
        question: 'What is the difference between Starter and Pro?',
        answer: 'Starter is ideal for small teams getting organized. It includes core Kanban, sprint planning and basic reporting. Pro adds Gantt charts, cross-project roadmaps, advanced analytics, team workload tracking, SSO, audit logs, and PDF report exports — everything growing teams need.',
    },
    {
        question: 'How is pricing calculated?',
        answer: 'Pricing follows a per-user-per-month model. Your total is simply the price per user × the number of users you add. The interactive calculator below lets you estimate your monthly cost instantly.',
    },
    {
        question: 'Are these the final prices?',
        answer: 'The prices shown ($12/user/month for Starter and $29/user/month for Pro) are proposed values pending business confirmation. They are clearly labelled as preview estimates rather than approved prices. Final prices will be published here once confirmed.',
    },
    {
        question: 'What does Enterprise include?',
        answer: 'Enterprise builds on Pro with dedicated success management, custom security and compliance reviews, priority SLA support, custom onboarding, and governance tooling for managing multiple programmes. Pricing is agreed directly with FlowExec rather than published as a self-service rate.',
    },
    {
        question: 'Do you offer annual billing?',
        answer: 'Monthly billing only for now. Annual billing will be offered once both billing periods are confirmed and approved — no annual price is shown until then.',
    },
    {
        question: 'How do I pay?',
        answer: `Online checkout is disabled until the payment gateway is live. ${payments.notice}`,
    },
    {
        question: 'Can I change my plan later?',
        answer: 'Yes. Plan upgrades, downgrades, user seat changes, cancellation and refund terms are detailed on the Refund & Cancellation Policy page and will be confirmed before online payments go live.',
    },
    {
        question: 'Is there a free trial?',
        answer: 'You can create an account and explore the workspace without providing payment details. For a guided evaluation of an Enterprise rollout, contact us directly.',
    },
];
/* ---------------- Components ---------------- */
const PlaceholderNote = ({ children }) => (<span className="inline-flex items-center gap-1.5 rounded-lg border border-[#fde68a] bg-[#fffbeb] px-2 py-1 text-[11px] font-bold text-[#b45309]">
    <Construction className="w-3 h-3" aria-hidden="true"/>
    {children}
  </span>);
const CellContent = ({ cell }) => {
    if (cell === 'yes') {
        return (<span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0f766e]">
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" aria-hidden="true"/>
        Included
      </span>);
    }
    if (cell === 'no') {
        return (<span className="inline-flex items-center gap-1.5 text-sm text-[#9ca3af]">
        <Minus className="w-4 h-4 flex-shrink-0" aria-hidden="true"/>
        Not included
      </span>);
    }
    return <span className="text-sm font-medium text-[#4b5563]">{cell.placeholder}</span>;
};
const FaqItem = ({ question, answer }) => {
    const [open, setOpen] = useState(false);
    return (<div className="rounded-2xl border border-[#e2e5ea] bg-white overflow-hidden">
      <button type="button" className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#0d9488]/30" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="text-sm font-bold text-[#1a1d23]">{question}</span>
        {open ? (<ChevronUp className="w-4 h-4 text-[#0d9488] flex-shrink-0" aria-hidden="true"/>) : (<ChevronDown className="w-4 h-4 text-[#9ca3af] flex-shrink-0" aria-hidden="true"/>)}
      </button>
      {open && (<div className="px-5 pb-4 animate-slide-in">
          <p className="text-sm text-[#4b5563] leading-relaxed">{answer}</p>
        </div>)}
    </div>);
};
/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export const PricingPage = () => {
    const estimate = estimateMembership(memberLimits.default);
    const confirmed = estimate.confirmed;
    return (<div className="bg-white">
      {/* ============================================================ */}
      {/* HERO HEADER                                                   */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-[#0a0f1e]">
        <div aria-hidden="true" className="absolute inset-0" style={{
            background: 'radial-gradient(760px 380px at 50% -12%, rgba(13,148,136,0.3) 0%, transparent 62%), radial-gradient(560px 300px at 92% 30%, rgba(245,158,11,0.12) 0%, transparent 60%)',
        }}/>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.14] text-[#5eead4] text-xs font-bold tracking-wide">
            <Zap className="w-3.5 h-3.5" aria-hidden="true"/>
            Pricing
          </span>
          <h1 className="mt-5 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Simple, transparent pricing for teams
            <br className="hidden sm:block"/>
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #2dd4bf, #06b6d4)' }}>
              {' '}that get work done.
            </span>
          </h1>
          <p className="mt-5 text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Per-user, monthly pricing — pay only for who you add. Start with Starter for small teams,
            upgrade to Pro when you need roadmaps, Gantt charts and SSO.
          </p>

          {!pricing.pricesConfirmed && (<div className="mt-8 max-w-3xl mx-auto flex items-start gap-3 rounded-2xl border border-[#fde68a]/60 bg-[#fffbeb]/[0.06] px-5 py-4 text-left backdrop-blur-sm" role="status">
              <Construction className="w-5 h-5 text-[#fcd34d] flex-shrink-0 mt-0.5" aria-hidden="true"/>
              <p className="text-sm text-[#fde68a] leading-relaxed">
                <span className="font-bold text-[#fef3c7]">Preview pricing — not an approved offer.</span>{' '}
                The per-user rates shown ($12/$29/month) are proposed values pending business confirmation.
                Final prices will replace this preview once approved.
              </p>
            </div>)}
        </div>
      </section>

      {/* ============================================================ */}
      {/* PLAN CARDS                                                    */}
      {/* ============================================================ */}
      <section aria-labelledby="plans-heading" className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0d9488]">Plans</span>
            <h2 id="plans-heading" className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0a0f1e]">
              Choose the plan that fits your team
            </h2>
            <p className="mt-3 text-[#4b5563] leading-relaxed">
              All plans run on the same {site.name} workspace. Preview prices are clearly marked and
              will be replaced once approved.
            </p>
          </div>

          {/* 3-column cards — equal height via grid */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

            {/* -------- Starter -------- */}
            <div className="flex flex-col rounded-2xl border border-[#e2e5ea] bg-white p-7 shadow-fe-sm hover:shadow-fe-md transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-1">
                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#f0fdfa] border border-[#99f6e4]">
                  <Users className="w-4.5 h-4.5 text-[#0d9488]" aria-hidden="true"/>
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#0a0f1e]">Starter</h3>
                  <p className="text-xs text-[#9ca3af]">For small teams</p>
                </div>
              </div>

              <div className="mt-5 mb-1 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold tracking-tight text-[#0a0f1e]">
                  ${plans.starter.previewPriceMonthly}
                </span>
                <span className="text-sm font-semibold text-[#9ca3af]">/ user / month</span>
              </div>
              <PlaceholderNote>Preview estimate — not an approved price</PlaceholderNote>

              <p className="mt-4 text-sm text-[#4b5563] leading-relaxed">
                Perfect for small teams getting organized. Core Kanban, sprint planning and
                essential collaboration included.
              </p>

              <ul className="mt-6 space-y-2.5 border-t border-[#f1f5f9] pt-6 flex-1">
                {PLAN_FEATURES.starter.map((feature) => (<li key={feature} className="flex items-start gap-2.5 text-sm text-[#1a1d23]">
                    <CheckCircle2 className="w-4 h-4 text-[#0d9488] flex-shrink-0 mt-0.5" aria-hidden="true"/>
                    <span>{feature}</span>
                  </li>))}
              </ul>

              <div className="mt-7">
                <Link to="/register" className="btn-secondary w-full justify-center">
                  Get Started
                  <ArrowRight className="w-4 h-4"/>
                </Link>
                <p className="mt-2.5 text-xs text-[#9ca3af] text-center">No card required · Cancel anytime</p>
              </div>
            </div>

            {/* -------- Pro (recommended) -------- */}
            <div className="relative flex flex-col rounded-2xl border-2 border-[#0d9488] bg-white p-7 shadow-[0_0_0_4px_rgba(13,148,136,0.08),0_20px_40px_-12px_rgba(13,148,136,0.2)]">
              {plans.pro.recommended && (<span className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#0d9488] to-[#0284c7] px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-fe-sm whitespace-nowrap">
                  <Sparkles className="w-3 h-3" aria-hidden="true"/>
                  Most popular
                </span>)}

              <div className="flex items-center gap-3 mb-1 mt-1">
                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#0d9488] to-[#0284c7]">
                  <Zap className="w-4.5 h-4.5 text-white" aria-hidden="true"/>
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#0a0f1e]">Pro</h3>
                  <p className="text-xs text-[#9ca3af]">For growing teams</p>
                </div>
                <span className="ml-auto badge-teal text-[10px]">Recommended</span>
              </div>

              <div className="mt-5 mb-1 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold tracking-tight text-[#0a0f1e]">
                  ${plans.pro.previewPriceMonthly}
                </span>
                <span className="text-sm font-semibold text-[#9ca3af]">/ user / month</span>
              </div>
              {confirmed ? (<span className="inline-flex items-center gap-1.5 rounded-lg border border-[#99f6e4] bg-[#f0fdfa] px-2 py-1 text-[11px] font-bold text-[#0f766e]">
                  <CheckCircle2 className="w-3 h-3" aria-hidden="true"/>
                  Approved price
                </span>) : (<PlaceholderNote>Preview estimate — not an approved price</PlaceholderNote>)}

              <p className="mt-4 text-sm text-[#4b5563] leading-relaxed">
                The full {site.name} workspace for teams delivering together — Gantt charts, roadmaps,
                capacity tracking, advanced analytics, and enterprise SSO.
              </p>

              <ul className="mt-6 space-y-2.5 border-t border-[#f1f5f9] pt-6 flex-1">
                {PLAN_FEATURES.pro.map((feature) => (<li key={feature} className="flex items-start gap-2.5 text-sm text-[#1a1d23]">
                    <CheckCircle2 className="w-4 h-4 text-[#0d9488] flex-shrink-0 mt-0.5" aria-hidden="true"/>
                    <span>{feature}</span>
                  </li>))}
              </ul>

              <div className="mt-7">
                <Link to="/register" className="w-full justify-center inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:ring-offset-2" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)', boxShadow: '0 4px 12px rgba(13,148,136,0.35)' }}>
                  Get Started with Pro
                  <ArrowRight className="w-4 h-4"/>
                </Link>
                <p className="mt-2.5 text-xs text-[#9ca3af] text-center">{payments.notice}</p>
              </div>
            </div>

            {/* -------- Enterprise -------- */}
            <div className="flex flex-col rounded-2xl border border-[#e2e5ea] bg-white p-7 shadow-fe-sm hover:shadow-fe-md transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-1">
                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#f3e8ff] border border-[#e9d5ff]">
                  <Building2 className="w-4.5 h-4.5 text-[#7e22ce]" aria-hidden="true"/>
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#0a0f1e]">Enterprise</h3>
                  <p className="text-xs text-[#9ca3af]">For large organizations</p>
                </div>
              </div>

              <div className="mt-5 mb-1 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold tracking-tight text-[#0a0f1e]">
                  Let&#8217;s talk
                </span>
              </div>
              <PlaceholderNote>Price agreed by contract</PlaceholderNote>

              <p className="mt-4 text-sm text-[#4b5563] leading-relaxed">
                For organisations standardising delivery across many teams, with governance,
                dedicated support and security requirements confirmed together.
              </p>

              <ul className="mt-6 space-y-2.5 border-t border-[#f1f5f9] pt-6 flex-1">
                {PLAN_FEATURES.enterprise.map((feature) => (<li key={feature} className="flex items-start gap-2.5 text-sm text-[#1a1d23]">
                    <CheckCircle2 className="w-4 h-4 text-[#7e22ce] flex-shrink-0 mt-0.5" aria-hidden="true"/>
                    <span>{feature}</span>
                  </li>))}
              </ul>

              <div className="mt-7">
                <Link to="/contact" className="btn-secondary w-full justify-center">
                  Contact Sales
                  <ArrowRight className="w-4 h-4"/>
                </Link>
                <p className="mt-2.5 text-xs text-[#9ca3af] text-center">Contact channels being confirmed</p>
              </div>
            </div>
          </div>

          {/* Monthly billing note */}
          <p className="mt-8 text-center text-sm text-[#4b5563]">
            <span className="font-semibold text-[#1a1d23]">Monthly billing only.</span>{' '}
            Annual billing will be offered once approved — no annual price is shown until confirmed.
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* PRICING CALCULATOR                                            */}
      {/* ============================================================ */}
      <MemberPricingSection id="calculator" heading="Estimate your monthly cost" supportingText="Set your user count — the estimated monthly total recalculates instantly."/>

      {/* ============================================================ */}
      {/* COMPARISON TABLE                                              */}
      {/* ============================================================ */}
      <section aria-labelledby="comparison-heading" className="bg-white border-t border-[#e2e5ea]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0d9488]">Compare</span>
            <h2 id="comparison-heading" className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0a0f1e]">
              What each plan includes
            </h2>
            <p className="mt-3 text-[#4b5563] leading-relaxed">
              Capabilities verified in the product today. Anything not yet confirmed is marked as a
              placeholder rather than guessed.
            </p>
          </div>

          <div className="mt-10 overflow-x-auto rounded-2xl border border-[#e2e5ea]">
            <table className="w-full min-w-[680px] border-collapse text-left">
              <caption className="sr-only">
                Feature comparison of the Starter, Pro and Enterprise plans
              </caption>
              <thead>
                <tr className="bg-[#f8fafc]">
                  <th scope="col" className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#9ca3af] w-[34%]">
                    Feature
                  </th>
                  <th scope="col" className="px-5 py-4 text-sm font-bold text-[#1a1d23]">
                    Starter
                  </th>
                  <th scope="col" className="px-5 py-4 text-sm font-bold text-[#0f766e] bg-[#f0fdfa]/60">
                    Pro
                    <span className="ml-2 align-middle badge-teal text-[10px]">Recommended</span>
                  </th>
                  <th scope="col" className="px-5 py-4 text-sm font-bold text-[#7e22ce]">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_GROUPS.map((group) => (<React.Fragment key={group.group}>
                    <tr>
                      <th scope="colgroup" colSpan={4} className="border-t border-[#e2e5ea] bg-[#f8fafc] px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[#4b5563]">
                        {group.group}
                      </th>
                    </tr>
                    {group.rows.map((row) => (<tr key={row.label} className="border-t border-[#f1f5f9] hover:bg-[#f8fafc]/70 transition-colors">
                        <th scope="row" className="px-5 py-3.5 text-sm font-medium text-[#1a1d23]">
                          {row.label}
                        </th>
                        <td className="px-5 py-3.5">
                          <CellContent cell={row.starter}/>
                        </td>
                        <td className="px-5 py-3.5 bg-[#f0fdfa]/40">
                          <CellContent cell={row.pro}/>
                        </td>
                        <td className="px-5 py-3.5">
                          <CellContent cell={row.enterprise}/>
                        </td>
                      </tr>))}
                  </React.Fragment>))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-center text-xs text-[#9ca3af]">
            Scroll horizontally on small screens. Preview rows are confirmed with the business before launch.
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* BILLING / CHECKOUT STATUS                                     */}
      {/* ============================================================ */}
      <section className="bg-[#f8fafc] border-t border-[#e2e5ea]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0d9488]">Billing &amp; checkout</span>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0a0f1e]">
              How billing works today
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card px-5 py-5">
              <h3 className="text-sm font-bold text-[#1a1d23] mb-2">Billing</h3>
              <p className="text-sm text-[#4b5563] leading-relaxed">
                Monthly billing only for now. Annual billing is not offered until both periods are confirmed
                — no annual price is shown.
              </p>
            </div>
            <div className="card px-5 py-5">
              <h3 className="text-sm font-bold text-[#1a1d23] mb-2">Checkout status</h3>
              <p className="text-sm text-[#4b5563] leading-relaxed">
                Online checkout is disabled until the gateway is live — the order summary is for review
                only. {payments.notice}
              </p>
            </div>
            <div className="card px-5 py-5">
              <h3 className="text-sm font-bold text-[#1a1d23] mb-2">Account creation</h3>
              <p className="text-sm text-[#4b5563] leading-relaxed">
                You can create your account today and add billing later. No payment details are required
                to start exploring {site.name}.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card px-5 py-4 flex items-start gap-3">
              <Users className="w-4 h-4 text-[#0d9488] flex-shrink-0 mt-0.5" aria-hidden="true"/>
              <p className="text-sm text-[#4b5563] leading-relaxed">
                <span className="font-bold text-[#1a1d23]">User seats:</span> the calculator supports{' '}
                {memberLimits.min}–{memberLimits.max.toLocaleString('en-US')} users.
              </p>
            </div>
            <div className="card px-5 py-4 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-[#0d9488] flex-shrink-0 mt-0.5" aria-hidden="true"/>
              <p className="text-sm text-[#4b5563] leading-relaxed">
                <span className="font-bold text-[#1a1d23]">Enterprise SSO:</span> Microsoft Entra ID,
                Google and Okta SAML supported in the product today.
              </p>
            </div>
            <div className="card px-5 py-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-[#0d9488] flex-shrink-0 mt-0.5" aria-hidden="true"/>
              <p className="text-sm text-[#4b5563] leading-relaxed">
                <span className="font-bold text-[#1a1d23]">Refunds:</span>{' '}
                cancellation and refund terms are on the{' '}
                <Link to="/refunds" className="font-semibold text-[#0f766e] hover:underline">
                  Refund &amp; Cancellation Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FAQ                                                           */}
      {/* ============================================================ */}
      <section className="bg-white border-t border-[#e2e5ea]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-center text-[#0a0f1e] mb-10">
            Pricing FAQ
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq) => (<FaqItem key={faq.question} question={faq.question} answer={faq.answer}/>))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-[#4b5563]">More questions about pricing or billing?</p>
            <Link to="/contact" className="btn-primary mt-4">
              Contact us
              <ArrowRight className="w-4 h-4"/>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FINAL CTA                                                     */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-20 bg-[#f8fafc] border-t border-[#e2e5ea]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl px-8 sm:px-14 py-14 text-center text-white" style={{
            background: 'linear-gradient(145deg, #0a0f1e 0%, #0f1a30 55%, #0a1628 100%)',
            boxShadow: '0 30px 60px -12px rgba(0,0,0,0.4)',
        }}>
            <div aria-hidden="true" className="absolute inset-0" style={{
            background: 'radial-gradient(560px 280px at 50% -20%, rgba(13,148,136,0.38) 0%, transparent 65%), radial-gradient(460px 240px at 0% 120%, rgba(245,158,11,0.18) 0%, transparent 60%)',
        }}/>
            <div className="relative">
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                Start free. Scale when you're ready.
              </h2>
              <p className="mt-4 text-slate-300 max-w-xl mx-auto">
                Create your account today — no payment details required — and add users when your
                team is ready to grow.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/register" className="btn-lg w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white transition-all focus:outline-none focus:ring-2 focus:ring-[#2dd4bf] focus:ring-offset-2 focus:ring-offset-[#0a0f1e]" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)', boxShadow: '0 0 28px rgba(13,148,136,0.5)' }}>
                  Get Started Free
                  <ArrowRight className="w-4 h-4"/>
                </Link>
                <Link to="/contact" className="btn-lg w-full sm:w-auto text-white bg-white/10 border border-white/25 hover:bg-white/20 inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0a0f1e]">
                  Talk to us about Enterprise
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>);
};
export default PricingPage;
