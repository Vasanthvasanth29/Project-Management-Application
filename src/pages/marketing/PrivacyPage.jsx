import React from 'react';
import { LegalPage } from './LegalPage';
import { site } from '../../config/siteConfig';
export const PrivacyPage = () => (<LegalPage title="Privacy Policy" summary={`This policy explains what information is processed when you use ${site.name}, why it is used and the choices you have. It covers the ${site.name} website and workspace application.`} sections={[
        {
            heading: 'Overview and scope',
            paragraphs: [
                'This policy applies to visitors of this website and to users of the workspace application.',
                'Where your organisation is the customer, your organisation decides how the workspace is used; personal data you enter into the workspace is processed on its instructions, and requests about that data should go to your organisation administrator first.',
            ],
        },
        {
            heading: 'Information we process',
            paragraphs: ['Depending on how you use the service, the following categories are involved:'],
            bullets: [
                'Account details: name, email address, role, job title and profile picture, provided by you or by your organisation’s identity provider.',
                'Workspace content: projects, work items, comments, files, activity entries and other material you or your team create.',
                'Organisation settings: roles, permissions, workflows, custom fields and administrative configuration.',
                'Technical data: the current build keeps you signed in and persists workspace state using your browser’s local storage; deployment logs may record access and error information.',
            ],
        },
        {
            heading: 'How information is used',
            paragraphs: ['We use information to:'],
            bullets: [
                'Provide, operate and secure the service.',
                'Authenticate you and enforce your organisation’s access rules.',
                'Show activity, notifications and reporting within the workspace.',
                'Support users, investigate problems and prevent misuse.',
                'Improve the product and meet legal obligations where applicable.',
            ],
        },
        {
            heading: 'Single sign-on providers',
            paragraphs: [
                'Sign-in can be federated through identity providers such as Google, Microsoft Entra ID (Azure AD) and Okta SAML. When you sign in this way, we receive the identifiers needed to create or match your account — typically your email address, display name and provider user id.',
                'Those providers process data under their own privacy policies. Where your organisation enforces a sign-in domain, authentication is handled by your organisation’s provider.',
            ],
        },
        {
            heading: 'How information is shared',
            paragraphs: [
                'Workspace content is visible to users of your organisation according to their role and permissions.',
                'We do not sell personal data.',
                'Information may be shared with service providers that help us host, secure or support the service, subject to appropriate commitments, and where disclosure is required by law.',
            ],
        },
        {
            heading: 'Storage, retention and location',
            paragraphs: [
                'In the current build, session and workspace state are stored in your browser’s local storage on your device, alongside any server-side storage configured for the deployment.',
                'Retention periods for backups, audit records and workspace data will be confirmed and published here once approved. Clearing site data in your browser signs you out and removes locally stored workspace state.',
            ],
        },
        {
            heading: 'Security',
            paragraphs: [
                'We protect information with role-based access control, administrative oversight, single sign-on options and activity auditing. No method of transmission or storage is completely secure, so we cannot guarantee absolute security.',
                'You help by keeping credentials confidential and reporting suspicious activity to your administrator.',
            ],
        },
        {
            heading: 'Your choices and rights',
            paragraphs: [
                'You can review and update profile details in your account settings, and contact your organisation administrator to change roles, access or workspace content.',
                'Depending on where you live, you may have rights to access, correct, delete or restrict the processing of your personal data. Submit such requests through our Contact page and we will respond through the confirmed channels.',
                'You can also remove locally stored data at any time through your browser’s site-data settings.',
            ],
        },
        {
            heading: 'Children',
            paragraphs: [
                'The service is intended for business use and is not directed at children. We do not knowingly collect personal data from children.',
            ],
        },
        {
            heading: 'Changes to this policy',
            paragraphs: [
                'We may update this policy from time to time. The current version, with its last-updated date, will be published on this page and material changes will be announced through the confirmed contact channels.',
            ],
        },
        {
            heading: 'Contact',
            paragraphs: [
                `Privacy questions can be sent through our Contact page. Confirmed privacy contact details for ${site.name} will be published there once approved.`,
            ],
        },
    ]}/>);
export default PrivacyPage;
