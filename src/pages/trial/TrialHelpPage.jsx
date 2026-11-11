import React, { useState } from 'react';
import {
  HelpCircle, BookOpen, MessageCircle, Mail, ExternalLink,
  Crown, Sparkles, Check, Search, ChevronDown, ChevronUp,
  FileQuestion, ShieldCheck, Zap } from
'lucide-react';
import { UpgradeModal } from '../../components/trial/UpgradeModal';
import { toast } from 'sonner';

export const TrialHelpPage = () => {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [feedback, setFeedback] = useState('');

  const faqs = [
  {
    q: 'What is included in the 7-day Free Trial?',
    a: 'The free trial gives you full access to 1 project workspace, basic task management, iteration tracking, and standard velocity reports so you can test the platform with your team.'
  },
  {
    q: 'Will my tasks and settings persist when I upgrade to Pro?',
    a: 'Yes, 100%! All your tasks, custom status flows, and sprint data from the trial will carry over immediately without any data loss.'
  },
  {
    q: 'How do I add more projects or invite team members?',
    a: 'Multiple workspaces, custom user roles (Admin, PM, Team Lead, Member), and enterprise SSO are available immediately upon upgrading to the Pro Pack.'
  },
  {
    q: 'Can I export reports and work items?',
    a: 'Yes, you can export your project summary as a formatted CSV or Executive PDF report directly from the Reports page.'
  }];


  const handleSendFeedback = (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    toast.success('Thank you! Your feedback has been sent to our product team.');
    setFeedback('');
  };

  return (/*#__PURE__*/
    React.createElement("div", { className: "space-y-6 max-w-[1200px] mx-auto pb-8" }, /*#__PURE__*/

    React.createElement("div", { className: "pb-4 border-b border-slate-200" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2.5" }, /*#__PURE__*/
    React.createElement("h1", { className: "text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display" }, "Help & Documentation"

    ), /*#__PURE__*/
    React.createElement("span", { className: "px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-[10px] font-extrabold uppercase tracking-wide" }, "Support Center"

    )
    ), /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-slate-500 mt-1" }, "Guides, FAQs, and assistance to help you get the most out of Limber Lithe."

    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-5" }, /*#__PURE__*/
    React.createElement("div", { className: "bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-3 hover:border-teal-300 transition-all flex flex-col justify-between" }, /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { className: "w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center justify-center font-black shadow-2xs mb-3" }, /*#__PURE__*/
    React.createElement(BookOpen, { className: "w-5 h-5" })
    ), /*#__PURE__*/
    React.createElement("h3", { className: "text-base font-black text-slate-900" }, "Agile Documentation"), /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-slate-500 mt-1 leading-relaxed" }, "Explore step-by-step guides on backlog grooming, sprint cadence, story points, and status transitions."

    )
    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => toast.info('Documentation center is available online.'),
      className: "text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1.5 cursor-pointer pt-2" }, /*#__PURE__*/

    React.createElement("span", null, "Read Quickstart Guide"), /*#__PURE__*/
    React.createElement(ExternalLink, { className: "w-3.5 h-3.5" })
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-3 hover:border-blue-300 transition-all flex flex-col justify-between" }, /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { className: "w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center justify-center font-black shadow-2xs mb-3" }, /*#__PURE__*/
    React.createElement(MessageCircle, { className: "w-5 h-5" })
    ), /*#__PURE__*/
    React.createElement("h3", { className: "text-base font-black text-slate-900" }, "Community & Forum"), /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-slate-500 mt-1 leading-relaxed" }, "Connect with fellow engineering leaders, share custom templates, and get best practice tips."

    )
    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => toast.info('Community forum is accessible on our portal.'),
      className: "text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1.5 cursor-pointer pt-2" }, /*#__PURE__*/

    React.createElement("span", null, "Visit Forum"), /*#__PURE__*/
    React.createElement(ExternalLink, { className: "w-3.5 h-3.5" })
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-3 hover:border-amber-300 transition-all flex flex-col justify-between" }, /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { className: "w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center font-black shadow-2xs mb-3" }, /*#__PURE__*/
    React.createElement(Sparkles, { className: "w-5 h-5" })
    ), /*#__PURE__*/
    React.createElement("h3", { className: "text-base font-black text-slate-900" }, "24/7 Priority Support"), /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-slate-500 mt-1 leading-relaxed" }, "Direct Slack connect and dedicated customer success manager are unlocked with Pro & Enterprise plans."

    )
    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => setUpgradeOpen(true),
      className: "text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1.5 cursor-pointer pt-2" }, /*#__PURE__*/

    React.createElement(Crown, { className: "w-3.5 h-3.5 text-amber-600 fill-amber-500/20" }), /*#__PURE__*/
    React.createElement("span", null, "Upgrade for Priority Desk")
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2 pb-2 border-b border-slate-100" }, /*#__PURE__*/
    React.createElement(FileQuestion, { className: "w-4 h-4 text-teal-600" }), /*#__PURE__*/
    React.createElement("h2", { className: "text-base font-black text-slate-900" }, "Frequently Asked Questions")
    ), /*#__PURE__*/

    React.createElement("div", { className: "divide-y divide-slate-100" },
    faqs.map((faq, idx) => /*#__PURE__*/
    React.createElement("div", { key: idx, className: "py-3" }, /*#__PURE__*/
    React.createElement("button", {
      onClick: () => setOpenFaq(openFaq === idx ? null : idx),
      className: "w-full flex items-center justify-between text-left gap-3 text-xs sm:text-sm font-extrabold text-slate-900 hover:text-teal-700 transition-colors cursor-pointer" }, /*#__PURE__*/

    React.createElement("span", null, faq.q),
    openFaq === idx ? /*#__PURE__*/
    React.createElement(ChevronUp, { className: "w-4 h-4 text-teal-600 shrink-0" }) : /*#__PURE__*/

    React.createElement(ChevronDown, { className: "w-4 h-4 text-slate-400 shrink-0" })

    ),
    openFaq === idx && /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-slate-600 mt-2 leading-relaxed pl-1 animate-in fade-in" },
    faq.a
    )

    )
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4" }, /*#__PURE__*/
    React.createElement("h3", { className: "text-sm font-black text-slate-900" }, "Have feedback or need a custom feature?"), /*#__PURE__*/
    React.createElement("form", { onSubmit: handleSendFeedback, className: "space-y-3" }, /*#__PURE__*/
    React.createElement("textarea", {
      rows: 3,
      placeholder: "Tell us what feature you need or how your trial experience is going...",
      value: feedback,
      onChange: (e) => setFeedback(e.target.value),
      className: "w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-all" }
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex justify-end" }, /*#__PURE__*/
    React.createElement("button", {
      type: "submit",
      className: "px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl transition-colors shadow-xs cursor-pointer" },
    "Submit Feedback"

    )
    )
    )
    ), /*#__PURE__*/

    React.createElement(UpgradeModal, {
      isOpen: upgradeOpen,
      onClose: () => setUpgradeOpen(false) }
    )
    ));

};