import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Mail, MapPin, Phone, Send, Info } from 'lucide-react';
import { contact, site, legal } from '../../config/siteConfig';
const CHANNELS = [
    {
        label: 'Sales & pricing',
        icon: Mail,
        value: contact.salesEmail,
        fallback: 'Confirmed sales address pending',
        to: '/pricing',
        toLabel: 'See pricing first',
    },
    {
        label: 'Product support',
        icon: Phone,
        value: contact.supportEmail,
        fallback: 'Confirmed support address pending',
        to: '/terms',
        toLabel: 'Read the Terms of Service',
    },
    {
        label: 'Billing',
        icon: Clock,
        value: contact.billingEmail,
        fallback: 'Billing contacts published at payment launch',
        to: '/refunds',
        toLabel: 'Read the refund policy',
    },
];
const TOPICS = ['Sales & pricing', 'Product support', 'Billing', 'Legal & privacy', 'Other'];
export const ContactPage = () => {
    const [submitted, setSubmitted] = useState(false);
    const handleSubmit = (event) => {
        event.preventDefault();
        // No backend endpoint exists for this form yet — tell the visitor the
        // truth instead of pretending the message was delivered.
        setSubmitted(true);
    };
    return (<div className="bg-white">
      <section className="bg-[#f8fafc] border-b border-[#e2e5ea]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0d9488]">
            Contact us
          </span>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight max-w-2xl">
            Talk to the {site.name} team
          </h1>
          <p className="mt-4 text-[#4b5563] max-w-2xl leading-relaxed">
            Questions about pricing, onboarding, support or this website? Pick a channel below or
            send a message using the form.
          </p>

          {!contact.salesEmail && !contact.supportEmail && !contact.billingEmail && (<div className="mt-6 max-w-2xl flex items-start gap-3 rounded-2xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3.5" role="note">
              <Info className="w-5 h-5 text-[#b45309] flex-shrink-0 mt-0.5" aria-hidden="true"/>
              <p className="text-sm text-[#92400e] leading-relaxed">{contact.confirmationNote}</p>
            </div>)}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Channels */}
          <div className="space-y-4 lg:col-span-1">
            <h2 className="section-title">Contact channels</h2>
            {CHANNELS.map((channel) => {
            const Icon = channel.icon;
            return (<div key={channel.label} className="card p-5">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="w-9 h-9 rounded-xl bg-[#f0fdfa] text-[#0d9488] flex items-center justify-center">
                      <Icon className="w-4 h-4" aria-hidden="true"/>
                    </span>
                    <span className="text-sm font-bold text-[#1a1d23]">{channel.label}</span>
                  </div>
                  <p className="text-sm font-semibold text-[#4b5563]">
                    {channel.value ?? channel.fallback}
                  </p>
                  <Link to={channel.to} className="mt-2 inline-block text-xs font-semibold text-[#0f766e] hover:underline">
                    {channel.toLabel}
                  </Link>
                </div>);
        })}

            <div className="card p-5">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-9 h-9 rounded-xl bg-[#f0fdfa] text-[#0d9488] flex items-center justify-center">
                  <MapPin className="w-4 h-4" aria-hidden="true"/>
                </span>
                <span className="text-sm font-bold text-[#1a1d23]">Office</span>
              </div>
              <p className="text-sm font-semibold text-[#4b5563]">
                {contact.officeAddress ?? 'Address pending confirmation'}
              </p>
              {contact.phone && (<p className="mt-1 text-sm text-[#4b5563]">{contact.phone}</p>)}
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <div className="card p-5 sm:p-7">
              <h2 className="section-title">Send a message</h2>

              {submitted ? (<div className="rounded-2xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3.5" role="status" aria-live="polite">
                  <p className="text-sm font-bold text-[#92400e]">Your message has not been sent.</p>
                  <p className="mt-1.5 text-sm text-[#92400e] leading-relaxed">
                    The contact form is not connected to a delivery service yet, so nothing left
                    this page and no data was stored. Confirmed contact details will be published on
                    this page once approved
                    {!legal.approved ? ` (${legal.reviewStatus.toLowerCase()})` : ''}.
                  </p>
                  <button type="button" className="btn-secondary btn-sm mt-3" onClick={() => setSubmitted(false)}>
                    Edit my message
                  </button>
                </div>) : (<form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label" htmlFor="contact-name">
                        Name
                      </label>
                      <input id="contact-name" name="name" type="text" className="input" required autoComplete="name" placeholder="Your name"/>
                    </div>
                    <div>
                      <label className="input-label" htmlFor="contact-email">
                        Email
                      </label>
                      <input id="contact-email" name="email" type="email" className="input" required autoComplete="email" placeholder="you@company.com"/>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label" htmlFor="contact-org">
                        Organisation <span className="normal-case font-normal">(optional)</span>
                      </label>
                      <input id="contact-org" name="organisation" type="text" className="input" autoComplete="organization" placeholder="Company name"/>
                    </div>
                    <div>
                      <label className="input-label" htmlFor="contact-topic">
                        Topic
                      </label>
                      <select id="contact-topic" name="topic" className="select" required>
                        {TOPICS.map((topic) => (<option key={topic} value={topic}>
                            {topic}
                          </option>))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="input-label" htmlFor="contact-message">
                      Message
                    </label>
                    <textarea id="contact-message" name="message" className="input min-h-[140px] resize-y" required placeholder="How can we help?"/>
                  </div>

                  <p className="text-xs text-[#9ca3af] leading-relaxed">
                    This form does not transmit data yet — submitting shows a confirmation of that
                    status. Please see our{' '}
                    <Link to="/privacy" className="underline text-[#4b5563]">
                      Privacy Policy
                    </Link>{' '}
                    for how information is handled.
                  </p>

                  <button type="submit" className="btn-primary">
                    <Send className="w-4 h-4"/>
                    Send message
                  </button>
                </form>)}
            </div>
          </div>
        </div>
      </section>
    </div>);
};
export default ContactPage;
