/**
 * FlowExec public website configuration — the ONE source of truth for the
 * business-facing values used by the marketing, pricing, checkout, contact and
 * legal pages.
 *
 * RULE: never invent a value here. Anything still awaiting business sign-off
 * stays `null` (or a flag stays `false`) so the UI renders a clearly marked
 * "pending confirmation" / "preview" state instead of publishing unapproved
 * details as commercial offers.
 *
 * Publishing checklist (flip these once the business confirms):
 *   - pricing.approvedPricePerMember          → Pricing + Checkout show money
 *   - pricing.pricesConfirmed                 → figures stop being labelled "preview"
 *   - pricing.billingModelConfirmed           → monthly AND annual selectable
 *   - pricing.annualDiscountPercent           → annual discount shown
 *   - payments.enabled                        → checkout activation
 *   - contact.*                               → Contact page channels
 *   - legal.approved                          → remove the draft banner
 *
 * PRICING MODEL: the public Pro price is always `price per member × member
 * count`, computed by the member-based calculator. Plan tiers are presented for
 * discovery only and may not publish a commercial figure until the business
 * verifies tier requirements (`plans.tiersConfirmed`).
 *
 * PLAN TIERS (preview): the pricing page now presents the three tiers the
 * business asked to showcase — Free, Pro and Enterprise. `plans.tiersConfirmed`
 * stays `false`, so every tier renders with a clearly marked placeholder where
 * a figure is not published yet:
 *   - Free       → $0 is the definition of a free entry tier (account creation
 *                  takes no payment); its seat/usage LIMITS stay unpublished.
 *   - Pro        → priced by the member-based model above (`estimateMembership`),
 *                  so no separate Pro rate is invented here.
 *   - Enterprise → priced by agreement; `enterprisePrice` stays null until the
 *                  business publishes one.
 * The member-based calculator remains the authoritative pricing surface.
 */
export const site = {
    name: 'FlowExec',
    tagline: 'Smart Project Management Software for Growing Teams',
    description: 'FlowExec is a premium project management SaaS for growing teams — plan sprints, track work on Kanban boards, collaborate in one place, and deliver projects on time.',
};
export const payments = {
    /** Stays false until the payment activation is confirmed. */
    enabled: false,
    gateway: 'Nomod',
    /** Exact wording required by the business for every checkout surface. */
    notice: 'Payment gateway is under construction. Online payments will be available soon.',
};
/** Member seats supported by the calculator and checkout today. */
export const memberLimits = {
    min: 5,
    max: 1000,
    default: 25,
};
/** Quick-select member counts offered next to the slider. */
export const memberPresets = [5, 25, 100, 250, 500, 1000];
export const pricing = {
    currency: 'USD',
    /**
     * Business-approved price per member per month (USD).
     * Null → no approved rate exists yet, so the UI uses the preview placeholder
     * below and labels every figure as a preview estimate.
     */
    approvedPricePerMember: null,
    /**
     * PLACEHOLDER rates used for the internal preview calculator only.
     * These are the business-proposed values from the brief ($12 Starter / $29 Pro).
     * Never presented as approved commercial prices while pricesConfirmed is false.
     */
    previewStarterPricePerMember: 12,
    previewPricePerMember: 29,
    /**
     * False → every figure renders as a clearly marked PREVIEW estimate instead
     * of an approved price. Set to true only after the business approves
     * `approvedPricePerMember`.
     */
    pricesConfirmed: false,
    /**
     * False → monthly billing only. Annual billing (and any annual figure)
     * becomes available once the business has approved both billing periods.
     */
    billingModelConfirmed: false,
    /**
     * Approved annual discount applied to the member rate, in percent.
     * Null → no annual discount is offered or advertised.
     */
    annualDiscountPercent: null,
};
/**
 * Plan tiers shown on the pricing page for discovery.
 *
 * Nothing here is an approved commercial offer: while `tiersConfirmed` is
 * false the UI labels the section a preview and renders placeholders for any
 * figure that has not been published.
 *
 * Tier names: Starter / Pro / Enterprise (as specified in the brief).
 * Preview prices ($12/$29/month per user) are the business-proposed values
 * from the brief and must stay clearly labelled as unconfirmed previews.
 */
export const plans = {
    /** True only once the business approves tier prices and limits. */
    tiersConfirmed: false,
    /** Starter tier: $12/user/month — proposed figure, not yet confirmed. */
    starter: {
        priceMonthly: null,
        previewPriceMonthly: 12,
        /** Seat / usage limits — null until published, rendered as a placeholder. */
        seatLimit: null,
        recommended: false,
    },
    /** Pro: member-based pricing at $29/user/month proposed rate. */
    pro: {
        priceMonthly: null,
        previewPriceMonthly: 29,
        recommended: true,
    },
    /** Enterprise: priced by agreement; nothing is published until confirmed. */
    enterprise: {
        priceMonthly: null,
        contactOnly: true,
    },
};
/**
 * 7-Day Limited Trial — a separate entry point from "Get Started Free".
 *
 * There is no backend subscription system yet, so the trial is a FRONTEND
 * experience only: the start time is kept in this browser (see trialStore) and
 * nothing is enforced server-side. No payment details are collected and
 * nothing converts into a paid plan automatically.
 *
 * The included / locked feature lists on the trial page mirror the Starter vs
 * Pro split from the pricing comparison. `featuresConfirmed` stays false until
 * the business approves the trial scope, so the page labels it a preview.
 */
export const trial = {
    durationDays: 7,
    featuresConfirmed: false,
    /** 'client' → browser-only timer; flip to 'server' once a backend enforces it. */
    enforcement: 'client',
    /** The one existing demo project a trial account can open (E-Commerce Platform). */
    sampleProjectId: 'proj-001',
};
export const contact = {
    salesEmail: null,
    supportEmail: null,
    billingEmail: null,
    phone: null,
    officeAddress: null,
    confirmationNote: 'Contact channels are being confirmed. Publish them here once approved — do not guess addresses.',
};
export const legal = {
    /** False → every legal page shows the "draft / pending approval" banner. */
    approved: false,
    reviewStatus: 'Draft — pending business and legal approval',
    /** Governing-law / entity details are intentionally not stated anywhere. */
    placeholders: ['Company legal entity details', 'Governing law and jurisdiction'],
};
/** Clamp a member count into the supported seat range. */
export const clampMembers = (value) => {
    if (!Number.isFinite(value))
        return memberLimits.default;
    return Math.min(memberLimits.max, Math.max(memberLimits.min, Math.round(value)));
};
/**
 * Parse a member count from a URL param / free-text input.
 * Invalid or missing values fall back to `fallback` (defaults to the
 * configured default member count) — never to zero or a negative seat count.
 */
export const normalizeMembers = (raw, fallback = memberLimits.default) => {
    if (raw === null || raw === undefined || raw === '')
        return clampMembers(fallback);
    const parsed = typeof raw === 'number' ? raw : Number.parseInt(raw, 10);
    if (Number.isNaN(parsed))
        return clampMembers(fallback);
    return clampMembers(parsed);
};
/** The rate actually used for the Pro plan (general member rate): approved rate, else the preview placeholder. */
export const getPerMemberMonthlyRate = () => pricing.approvedPricePerMember ?? pricing.previewPricePerMember;
/** The Starter plan preview rate used for discovery display only. */
export const getStarterRate = () => plans.starter.previewPriceMonthly;
/**
 * True when the displayed money figures come from business-approved rates.
 * While false, every surface must label its figures as preview estimates.
 */
export const isPricingConfirmed = () => pricing.pricesConfirmed;
/**
 * Member-based subscription estimate.
 *
 *   Estimated monthly total = price per member × member count
 *
 * An annual figure is only produced once annual billing is approved; until
 * then `annualTotal` is null so no unapproved annual price can be rendered.
 *
 * @typedef {object} MembershipEstimate
 * @property {number} members Member count actually used (clamped into the supported range).
 * @property {number} pricePerMemberMonthly Rate used, per member per month (approved or preview placeholder).
 * @property {number} monthlyTotal pricePerMemberMonthly × members.
 * @property {number | null} annualTotal Annual total — null while annual billing is not approved.
 * @property {boolean} confirmed False → preview estimate built from a placeholder rate.
 */
/** @returns {MembershipEstimate} */
export const estimateMembership = (members) => {
    const seatCount = clampMembers(members);
    const pricePerMemberMonthly = getPerMemberMonthlyRate();
    const monthlyTotal = seatCount * pricePerMemberMonthly;
    const annualTotal = pricing.billingModelConfirmed
        ? Math.round(monthlyTotal * 12 * (1 - (pricing.annualDiscountPercent ?? 0) / 100))
        : null;
    return {
        members: seatCount,
        pricePerMemberMonthly,
        monthlyTotal,
        annualTotal,
        confirmed: isPricingConfirmed(),
    };
};
/**
 * `1234.5` → `$1,234.50`. Callers rendering a preview figure must add their
 * own "estimate" wording — this helper only formats the number.
 */
export const formatAmount = (amount) => {
    const formatted = amount.toLocaleString('en-US', {
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    });
    return `${getCurrencySymbol()}${formatted}`;
};
/**
 * Small extension point: the currency symbol is derived from the configured
 * ISO code so the site never shows a symbol the business did not approve.
 */
const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', GBP: '£' };
export const getCurrencySymbol = () => CURRENCY_SYMBOLS[pricing.currency] ?? '';
