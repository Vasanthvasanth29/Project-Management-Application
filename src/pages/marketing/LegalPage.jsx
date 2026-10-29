import React from 'react';
import { Link } from 'react-router-dom';
import { FileWarning } from 'lucide-react';
import { legal, site } from '../../config/siteConfig';
const slugify = (value) => value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
/**
 * Shared shell for the public legal pages (Terms, Privacy, Refunds).
 *
 * Content rule: describe only verifiable product behaviour. Company
 * registration details, addresses, jurisdictions and other business
 * particulars are never invented — they are listed as pending placeholders
 * until the approved text is supplied.
 */
export const LegalPage = ({ title, summary, sections }) => (<div className="bg-white">
    <section className="bg-[#f8fafc] border-b border-[#e2e5ea]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <span className="text-xs font-bold uppercase tracking-wider text-[#0d9488]">Legal</span>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight">
          {title}
        </h1>
        <p className="mt-3 text-[#4b5563] leading-relaxed">{summary}</p>
        <p className="mt-4 text-xs text-[#9ca3af]">
          {site.name} — {site.tagline}
        </p>

        {!legal.approved && (<div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3.5" role="note">
            <FileWarning className="w-5 h-5 text-[#b45309] flex-shrink-0 mt-0.5" aria-hidden="true"/>
            <p className="text-sm text-[#92400e] leading-relaxed">
              <span className="font-bold">{legal.reviewStatus}.</span> This page is published for
              review and must be replaced with the approved text before launch. Pending items:{' '}
              {legal.placeholders.join(' and ')}.
            </p>
          </div>)}
      </div>
    </section>

    <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <nav aria-label="On this page" className="mb-10">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#9ca3af] mb-3">
          On this page
        </h2>
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {sections.map((section, index) => (<li key={section.heading}>
              <a href={`#${slugify(section.heading)}`} className="text-sm text-[#4b5563] hover:text-[#0f766e] transition-colors">
                {index + 1}. {section.heading}
              </a>
            </li>))}
        </ol>
      </nav>

      <div className="space-y-10">
        {sections.map((section) => (<section key={section.heading} id={slugify(section.heading)} className="scroll-mt-24">
            <h2 className="font-display text-xl font-bold tracking-tight text-[#1a1d23]">
              {section.heading}
            </h2>
            <div className="mt-3 space-y-3">
              {section.paragraphs.map((paragraph) => (<p key={paragraph} className="text-sm text-[#4b5563] leading-relaxed">
                  {paragraph}
                </p>))}
            </div>
            {section.bullets && (<ul className="mt-3 space-y-2">
                {section.bullets.map((bullet) => (<li key={bullet} className="text-sm text-[#4b5563] leading-relaxed pl-4 relative before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-[#0d9488]">
                    {bullet}
                  </li>))}
              </ul>)}
          </section>))}
      </div>

      <div className="mt-12 rounded-2xl border border-[#e2e5ea] bg-[#f8fafc] px-5 py-4">
        <p className="text-sm text-[#4b5563]">
          Questions about this page?{' '}
          <Link to="/contact" className="font-semibold text-[#0f766e] hover:underline">
            Contact us
          </Link>{' '}
          or review our{' '}
          <Link to="/privacy" className="font-semibold text-[#0f766e] hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </section>
  </div>);
export default LegalPage;
