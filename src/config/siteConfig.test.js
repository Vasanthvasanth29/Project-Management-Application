import { describe, it, expect } from 'vitest';
import { payments, pricing, legal, site, memberLimits, memberPresets, clampMembers, normalizeMembers, estimateMembership, getPerMemberMonthlyRate, isPricingConfirmed, formatAmount, } from './siteConfig';
describe('siteConfig — branding', () => {
    it('publishes FlowExec as the product name everywhere', () => {
        expect(site.name).toBe('FlowExec');
        expect(site.tagline).toContain('Project management SaaS');
        expect(site.description).toContain('FlowExec');
    });
    it('carries no legacy brand name in the public copy', () => {
        const copy = [site.name, site.tagline, site.description].join(' ');
        expect(copy).not.toMatch(/LimberLithe/i);
    });
});
describe('siteConfig — payment gating', () => {
    it('keeps the payment gateway disabled until activation is confirmed', () => {
        expect(payments.enabled).toBe(false);
    });
    it('uses the exact business-approved construction notice', () => {
        expect(payments.notice).toBe('Payment gateway is under construction. Online payments will be available soon.');
    });
});
describe('siteConfig — member-based pricing model', () => {
    it('offers a single member rate with no plan tiers', () => {
        expect('plans' in pricing).toBe(false);
        expect(pricing.pricesConfirmed).toBe(false);
        expect(isPricingConfirmed()).toBe(false);
        expect(pricing.approvedPricePerMember).toBeNull();
        expect(pricing.previewPricePerMember).toBeGreaterThan(0);
        expect(getPerMemberMonthlyRate()).toBe(pricing.previewPricePerMember);
    });
    it('offers a single billing period until both are approved', () => {
        expect(pricing.billingModelConfirmed).toBe(false);
        expect(pricing.annualDiscountPercent).toBeNull();
    });
    it('does not flag pricing as approved while legal content is a draft', () => {
        expect(legal.approved).toBe(false);
    });
    it('formats configured amounts with the configured currency', () => {
        expect(formatAmount(0)).toBe('$0');
        expect(formatAmount(12)).toBe('$12');
        expect(formatAmount(12.5)).toBe('$12.50');
        expect(formatAmount(1234)).toBe('$1,234');
        expect(formatAmount(1000)).toBe('$1,000');
    });
    it('never renders an unfinished price label', () => {
        expect(formatAmount(1)).not.toMatch(/pending/i);
    });
});
describe('siteConfig — member count handling', () => {
    it('supports 100 to 1,000 members with a default of 100', () => {
        expect(memberLimits.min).toBe(100);
        expect(memberLimits.max).toBe(1000);
        expect(memberLimits.default).toBe(100);
    });
    it('clamps member counts into the supported range', () => {
        expect(clampMembers(0)).toBe(memberLimits.min);
        expect(clampMembers(-20)).toBe(memberLimits.min);
        expect(clampMembers(50)).toBe(100);
        expect(clampMembers(250)).toBe(250);
        expect(clampMembers(500)).toBe(500);
        expect(clampMembers(1000)).toBe(1000);
        expect(clampMembers(1001)).toBe(memberLimits.max);
        expect(clampMembers(Number.NaN)).toBe(memberLimits.default);
    });
    it('normalises URL and free-text values', () => {
        expect(normalizeMembers('100')).toBe(100);
        expect(normalizeMembers('500')).toBe(500);
        expect(normalizeMembers('1000')).toBe(1000);
        expect(normalizeMembers('')).toBe(memberLimits.default);
        expect(normalizeMembers(null)).toBe(memberLimits.default);
        expect(normalizeMembers('abc')).toBe(memberLimits.default);
        expect(normalizeMembers('50')).toBe(100);
        expect(normalizeMembers('10000')).toBe(memberLimits.max);
    });
    it('offers presets inside the supported range', () => {
        expect(memberPresets).toContain(100);
        expect(memberPresets).toContain(500);
        expect(memberPresets).toContain(1000);
        for (const preset of memberPresets) {
            expect(preset).toBeGreaterThanOrEqual(memberLimits.min);
            expect(preset).toBeLessThanOrEqual(memberLimits.max);
        }
    });
});
describe('siteConfig — estimateMembership', () => {
    const rate = pricing.previewPricePerMember;
    it('calculates monthly total = per-member rate × member count', () => {
        const hundred = estimateMembership(100);
        expect(hundred.members).toBe(100);
        expect(hundred.pricePerMemberMonthly).toBe(rate);
        expect(hundred.monthlyTotal).toBe(rate * 100);
        const fiveHundred = estimateMembership(500);
        expect(fiveHundred.members).toBe(500);
        expect(fiveHundred.monthlyTotal).toBe(rate * 500);
        const thousand = estimateMembership(1000);
        expect(thousand.members).toBe(1000);
        expect(thousand.monthlyTotal).toBe(rate * 1000);
    });
    it('produces the exact supported totals', () => {
        expect(estimateMembership(100).monthlyTotal).toBe(1000);
        expect(estimateMembership(500).monthlyTotal).toBe(5000);
        expect(estimateMembership(1000).monthlyTotal).toBe(10000);
    });
    it('marks every estimate as unconfirmed while the rate is a placeholder', () => {
        expect(estimateMembership(100).confirmed).toBe(false);
        expect(estimateMembership(1000).confirmed).toBe(false);
    });
    it('never produces an annual total until annual billing is approved', () => {
        expect(estimateMembership(100).annualTotal).toBeNull();
        expect(estimateMembership(1000).annualTotal).toBeNull();
    });
    it('clamps out-of-range member counts instead of failing', () => {
        expect(estimateMembership(0).members).toBe(memberLimits.min);
        expect(estimateMembership(9999).members).toBe(memberLimits.max);
        expect(estimateMembership(Number.NaN).members).toBe(memberLimits.default);
    });
});
