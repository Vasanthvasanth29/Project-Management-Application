import React from 'react';
import { LegalPage } from './LegalPage';
import { payments, site } from '../../config/siteConfig';
export const TermsPage = () => (<LegalPage title="Terms of Service" summary={`These terms govern your use of ${site.name}, the project management SaaS for agile teams. Read them alongside our Privacy Policy and Refund & Cancellation Policy.`} sections={[
        {
            heading: 'Agreement to these terms',
            paragraphs: [
                'By accessing or creating an account for the service you agree to these terms. If you do not agree, do not use the service.',
                'Where the service is provided to your organisation, your organisation is responsible for the users it invites and for accepting these terms on their behalf.',
            ],
        },
        {
            heading: 'The service',
            paragraphs: [
                `${site.name} is a project management service covering work item and task management, iteration planning, team collaboration and reporting, as described on the Features and Pricing pages.`,
                'We may improve, add or remove functionality over time. Features, interfaces and availability may change; where a change materially affects a paid subscription, it will be communicated through the channels confirmed on our Contact page.',
            ],
        },
        {
            heading: 'Accounts and access',
            paragraphs: [
                'You must provide accurate account information and keep your sign-in confidential. You are responsible for activity that happens under your account.',
                'Access may be granted through your organisation’s identity provider using single sign-on (including Google, Microsoft Entra ID and Okta SAML). Your organisation’s administrators control invitations, roles and permissions within the workspace.',
            ],
            bullets: [
                'Do not share credentials or use another person’s account.',
                'Notify your organisation administrator if you suspect unauthorised access.',
                'Administrators may suspend access to protect the workspace.',
            ],
        },
        {
            heading: 'Acceptable use',
            paragraphs: [
                'You agree to use the service only for lawful purposes and in accordance with these terms.',
            ],
            bullets: [
                'Do not attempt unauthorised access to the service, other workspaces or related systems.',
                'Do not disrupt, overload or degrade the service, or introduce malicious code.',
                'Do not scrape, resell or redistribute the service without permission.',
                'Do not submit content you do not have the right to use.',
            ],
        },
        {
            heading: 'Customer data',
            paragraphs: [
                'You retain ownership of the content you and your organisation put into the service — projects, work items, comments, files and related data.',
                'You grant the licence needed for us to host, process, back up and display that content solely to operate and support the service for your organisation.',
            ],
        },
        {
            heading: 'Subscriptions, fees and billing',
            paragraphs: [
                `Member pricing is published on the Pricing page. ${payments.notice}`,
                'Online payments are not active on this website: no order can be placed, no card details are collected and no charge is made through the checkout page. The member count, billing frequency and estimated total are shown for review only.',
                'When online payments are activated, the confirmed price, billing frequency and total for your selected member count will be displayed before you confirm any purchase, together with the terms that apply to that subscription.',
            ],
        },
        {
            heading: 'Intellectual property',
            paragraphs: [
                `The ${site.name} service, including its software, interface, branding and documentation, is owned by its licensors and is protected by intellectual property laws.`,
                'These terms do not transfer any ownership of that intellectual property to you. If you send feedback, we may use it to improve the service without obligation to you.',
            ],
        },
        {
            heading: 'Third-party services',
            paragraphs: [
                'The service integrates with third-party providers, for example identity providers used for single sign-on. Your use of those providers is also subject to their own terms and privacy policies.',
                'A third-party payment provider will process payments once online payments are activated; details will be confirmed on this site before launch.',
            ],
        },
        {
            heading: 'Suspension and termination',
            paragraphs: [
                'You may stop using the service at any time. Administrators can remove users and close workspace access according to your organisation’s process.',
                'We may suspend or terminate access where these terms are breached, or where required to protect the service or other users. Where a paid subscription is affected, the applicable cancellation and refund terms will be the ones confirmed at purchase and published on our Refund & Cancellation Policy page.',
            ],
        },
        {
            heading: 'Disclaimers and liability',
            paragraphs: [
                'The service is provided on an "as is" and "as available" basis to the fullest extent permitted by applicable law. We do not guarantee that it will be uninterrupted, error-free or free of harmful components.',
                'To the fullest extent permitted by law, neither party is liable for indirect, incidental or consequential losses arising from these terms. Nothing in these terms limits liability that cannot be limited by law.',
                'The final, legally reviewed wording of this section will replace this draft before launch.',
            ],
        },
        {
            heading: 'Changes to these terms',
            paragraphs: [
                'We may update these terms from time to time. The current version, with its last-updated date, will always be published on this page. Material changes will be highlighted through the confirmed contact channels.',
            ],
        },
        {
            heading: 'Contact',
            paragraphs: [
                'For questions about these terms, use our Contact page. Confirmed legal contact details will be published there once approved.',
            ],
        },
    ]}/>);
export default TermsPage;
