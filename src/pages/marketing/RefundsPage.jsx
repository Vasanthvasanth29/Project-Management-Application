import React from 'react';
import { LegalPage } from './LegalPage';
import { payments, site } from '../../config/siteConfig';
export const RefundsPage = () => (<LegalPage title="Refund & Cancellation Policy" summary={`This page explains the current status of billing on ${site.name} and the cancellation and refund terms that will apply once online payments are activated.`} sections={[
        {
            heading: 'Current status of payments',
            paragraphs: [
                payments.notice,
                'Because online payments are not active, no subscription can be purchased through this website, no payment details are collected on the checkout page and no charge is made. There is therefore nothing to cancel or refund at this stage.',
            ],
        },
        {
            heading: 'What you will see before you pay',
            paragraphs: [
                'When the payment gateway is activated, checkout will show the member count you selected, the billing frequency, the price and the total before you confirm anything.',
                'The confirmed prices will first be published on the Pricing page, and the terms applying to your subscription will be presented at checkout before any charge is made.',
            ],
        },
        {
            heading: 'Cancelling a subscription',
            paragraphs: [
                `Since no subscription can be bought online today, there is no active billing to cancel on ${site.name}.`,
                'Once billing is live, the cancellation process — including how to cancel, when access continues until, and any notice period — will be published on this page and shown at checkout before purchase. You will also be able to ask your organisation administrator or contact us through the confirmed channels.',
            ],
        },
        {
            heading: 'Refunds',
            paragraphs: [
                'No payments are processed through this website today, so no refunds are due from transactions made here.',
                'Refund eligibility, timeframes and methods for paid subscriptions will be confirmed by the business and published on this page before online payments are activated. Until that approved text is published, do not treat any other source as the refund policy for this service.',
                'Where a charge was made in error, contact us through the confirmed channels as soon as possible and we will investigate.',
            ],
        },
        {
            heading: 'Changing your subscription',
            paragraphs: [
                'The effect of changing your member count or subscription — including proration and timing — will be published here together with the confirmed pricing before online payments go live.',
                `You can change your workspace configuration today without any billing impact: membership changes only matter once subscriptions are billed. See the ${site.name} Pricing page for the member-based pricing model.`,
            ],
        },
        {
            heading: 'Your legal rights',
            paragraphs: [
                'Nothing in this policy affects any non-waivable rights you have under applicable consumer protection law.',
            ],
        },
        {
            heading: 'Contact',
            paragraphs: [
                'For billing, cancellation or refund questions, use our Contact page. Confirmed billing contact details will be published there once approved.',
            ],
        },
    ]}/>);
export default RefundsPage;
