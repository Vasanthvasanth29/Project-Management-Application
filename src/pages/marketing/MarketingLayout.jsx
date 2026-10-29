import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, CheckCircle2, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getDashboardPath } from '../../utils/roleUtils';
import { site } from '../../config/siteConfig';
import limberLitheMark from '../../assets/limber-lithe-mark.png';
import limberLitheLogo from '../../assets/limber-lithe-logo.png';
/** In-page destinations that exist on the home page today. */
const PRODUCT_LINKS = [
    { to: '/#product', label: 'Product Overview' },
    { to: '/#product-capabilities', label: 'Product Capabilities' },
    { to: '/#showcase', label: 'Roadmap & Delivery' },
    { to: '/#workflow', label: 'Workflow Customization' },
    { to: '/#access', label: 'Roles & Access' },
];
const NAV_LINKS = [
    { to: '/#product-capabilities', label: 'Capabilities' },
    { to: '/pricing', label: 'Pricing' },
];
/** Pages that exist today — only these are offered under Resources. */
const RESOURCE_LINKS = [
    { to: '/contact', label: 'Contact' },
    { to: '/terms', label: 'Terms of Service' },
    { to: '/privacy', label: 'Privacy Policy' },
    { to: '/refunds', label: 'Refund & Cancellation' },
];
const LEGAL_LINKS = RESOURCE_LINKS;
/**
 * Limber Lithe Technologies Brand Mark — transparent upward-arrow logo mark.
 */
export const BrandMark = ({ size = 'md', className = '' }) => {
    const dim = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
    return (
        <img
            src={limberLitheMark}
            alt="Limber Lithe Technologies"
            className={`${dim} object-contain flex-shrink-0 transition-transform group-hover:scale-105 ${className}`}
        />
    );
};
const DisclosureMenu = ({ label, id, items, active, open, onToggle, onClose, onItemClick }) => {
    const containerRef = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        const handlePointerDown = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                onClose();
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === 'Escape')
                onClose();
        };
        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, onClose]);
    return (<div className="relative" ref={containerRef}>
      <button type="button" className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${active
            ? 'text-[#0f766e] bg-[#ccfbf1] font-semibold'
            : 'text-[#4b5563] hover:text-[#0f766e] hover:bg-[#f0fdfa]'}`} aria-expanded={open} aria-haspopup="true" aria-controls={id} onClick={onToggle}>
        {label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true"/>
      </button>
      {open && (<div id={id} className="absolute left-0 lg:left-1/2 lg:-translate-x-1/2 top-full mt-2 w-64 bg-white rounded-2xl border border-[#e2e5ea] shadow-fe-lg p-2 animate-fade-in z-50">
          {items.map((item) => (<Link key={item.to} to={item.to} role="menuitem" className="block px-3 py-2.5 rounded-xl text-sm font-medium text-[#4b5563] hover:bg-[#f0fdfa] hover:text-[#0f766e] transition-colors" onClick={(e) => {
              onClose();
              if (onItemClick) onItemClick(e, item.to);
          }}>
              {item.label}
            </Link>))}
        </div>)}
    </div>);
};
/**
 * Public shell for every FlowExec marketing page.
 */
export const MarketingLayout = ({ children }) => {
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [productOpen, setProductOpen] = useState(false);
    const [resourcesOpen, setResourcesOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { isAuthenticated, currentUser } = useAuthStore();

    // Glitch-free smooth scroll to exact target position
    const scrollToTarget = (targetHash) => {
        if (!targetHash) return;
        const hash = targetHash.replace('#', '');

        // 1. If it's capabilities section, use GSAP ScrollTrigger start point if available
        if (hash === 'product-capabilities' || hash === 'features') {
            if (typeof window !== 'undefined' && window.ScrollTrigger) {
                const st = window.ScrollTrigger.getById('capabilities-scroll');
                if (st && typeof st.start === 'number') {
                    window.scrollTo({ top: st.start, behavior: 'smooth' });
                    return;
                }
            }
        }

        // 2. Otherwise calculate absolute page offset from top to avoid pin-spacer transformation jumps
        const el = document.getElementById(hash);
        if (el) {
            const pinSpacer = el.closest('.pin-spacer');
            const target = pinSpacer || el;
            const top = target.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo({
                top: Math.max(0, top - 64),
                behavior: 'smooth',
            });
        }
    };

    // Clean in-page click handler that prevents native browser anchor jump conflicts
    const handleInPageClick = (e, to) => {
        if (!to || !to.includes('#')) return;
        const [targetPath, hash] = to.split('#');
        const currentPath = location.pathname;
        const isCurrentPage = currentPath === targetPath || (targetPath === '/' && (currentPath === '/' || currentPath === ''));

        if (isCurrentPage && hash) {
            e.preventDefault();
            window.history.pushState(null, '', `#${hash}`);
            scrollToTarget(hash);
        }
    };

    useEffect(() => {
        setMenuOpen(false);
        setProductOpen(false);
        setResourcesOpen(false);
        const hashId = location.hash.replace('#', '');
        if (hashId) {
            const timer = setTimeout(() => {
                scrollToTarget(hashId);
            }, 150);
            return () => clearTimeout(timer);
        }
        window.scrollTo({ top: 0 });
    }, [location.pathname]);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    const appPath = currentUser ? getDashboardPath(currentUser.role) : '/login';
    const renderNavLink = (link) => {
        const active = !link.to.includes('#') && location.pathname === link.to;
        return (<Link key={link.to} to={link.to} aria-current={active ? 'page' : undefined} className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${active
                ? 'text-[#0f766e] bg-[#ccfbf1] font-semibold'
                : 'text-[#4b5563] hover:text-[#0f766e] hover:bg-[#f0fdfa]'}`} onClick={(e) => handleInPageClick(e, link.to)}>
        {link.label}
      </Link>);
    };
    return (<div className="min-h-screen flex flex-col bg-white font-sans text-[#1a1d23]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-3 focus:left-3 focus:bg-white focus:text-[#0f766e] focus:px-4 focus:py-2 focus:rounded-xl focus:border focus:border-[#0d9488] focus:shadow-fe-md text-sm font-semibold">
        Skip to main content
      </a>

      {/* ============================================================ */}
      {/* STICKY HEADER                                                 */}
      {/* ============================================================ */}
      <header className={`sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b transition-all duration-200 ${scrolled ? 'border-[#e2e5ea] shadow-fe-sm' : 'border-transparent'}`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4" aria-label="Main navigation">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 min-w-0 group flex-shrink-0">
            <BrandMark />
            <span className="min-w-0">
              <span className="block text-[17px] font-bold tracking-tight font-display leading-tight text-[#0a0f1e] group-hover:text-[#0d9488] transition-colors">
                {site.name}
              </span>
              <span className="hidden sm:block text-[10px] font-bold uppercase tracking-wider text-[#0d9488] -mt-0.5">
                Technologies
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {/* Products disclosure */}
            <DisclosureMenu label="Products" id="marketing-product-menu" items={PRODUCT_LINKS} active={false} open={productOpen} onToggle={() => {
            setProductOpen((o) => !o);
            setResourcesOpen(false);
        }} onClose={() => setProductOpen(false)} onItemClick={handleInPageClick}/>

            {NAV_LINKS.map((link) => renderNavLink(link))}

            {/* Resources disclosure */}
            <DisclosureMenu label="Resources" id="marketing-resources-menu" items={RESOURCE_LINKS} active={RESOURCE_LINKS.some((link) => link.to === location.pathname)} open={resourcesOpen} onToggle={() => {
            setResourcesOpen((o) => !o);
            setProductOpen(false);
        }} onClose={() => setResourcesOpen(false)} onItemClick={handleInPageClick}/>
          </div>

          {/* Desktop auth CTAs */}
          <div className="hidden md:flex items-center gap-2.5">
            {isAuthenticated ? (<>
                <Link to={appPath} className="btn-ghost btn-sm">
                  Open app
                </Link>
                <Link to={appPath} className="btn-sm inline-flex items-center justify-center gap-1.5 rounded-xl font-bold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40 px-4" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)', boxShadow: '0 2px 8px rgba(13,148,136,0.3)' }}>
                  Go to dashboard
                  <ArrowRight className="w-4 h-4"/>
                </Link>
              </>) : (<>
                <Link to="/login" id="nav-login" className="btn-ghost btn-sm text-[#4b5563] hover:text-[#0f766e]">
                  Log in
                </Link>
                <Link to="/register" id="nav-get-started" className="btn-sm inline-flex items-center justify-center gap-1.5 rounded-xl font-bold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40 px-4 py-2" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)', boxShadow: '0 2px 8px rgba(13,148,136,0.3)' }}>
                  Get Started
                  <ArrowRight className="w-3.5 h-3.5"/>
                </Link>
              </>)}
          </div>

          {/* Mobile hamburger */}
          <button type="button" id="mobile-menu-toggle" className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[#e2e5ea] text-[#4b5563] hover:bg-[#f1f5f9] transition-colors" aria-expanded={menuOpen} aria-controls="marketing-mobile-nav" onClick={() => setMenuOpen((o) => !o)}>
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            {menuOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
          </button>
        </nav>

        {/* Mobile nav panel */}
        {menuOpen && (<div id="marketing-mobile-nav" className="md:hidden border-t border-[#e2e5ea] bg-white px-4 sm:px-6 py-4 animate-slide-in max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="flex flex-col gap-1">
              <span className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">
                Navigation
              </span>
              {NAV_LINKS.map((link) => renderNavLink(link))}

              <span className="px-3 py-1.5 mt-2 text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">
                Products
              </span>
              {PRODUCT_LINKS.map((link) => (<Link key={link.to} to={link.to} className="pl-5 pr-3 py-2 rounded-xl text-sm font-medium text-[#4b5563] hover:bg-[#f1f5f9]" onClick={(e) => {
                  setMenuOpen(false);
                  handleInPageClick(e, link.to);
                }}>
                  {link.label}
                </Link>))}

              <span className="px-3 py-1.5 mt-2 text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">
                Resources
              </span>
              {RESOURCE_LINKS.map((link) => (<Link key={link.to} to={link.to} className="px-3 py-2.5 rounded-xl text-sm font-medium text-[#4b5563] hover:bg-[#f1f5f9]" onClick={(e) => {
                  setMenuOpen(false);
                  handleInPageClick(e, link.to);
                }}>
                  {link.label}
                </Link>))}

              <div className="border-t border-[#e2e5ea] my-3"/>
              {isAuthenticated ? (<Link to={appPath} className="btn-primary w-full justify-center" onClick={() => setMenuOpen(false)}>
                  Go to dashboard
                  <ArrowRight className="w-4 h-4"/>
                </Link>) : (<div className="grid grid-cols-2 gap-2">
                  <Link to="/login" className="btn-secondary justify-center" onClick={() => setMenuOpen(false)}>
                    Log in
                  </Link>
                  <Link to="/register" className="btn-primary justify-center" onClick={() => setMenuOpen(false)}>
                    Get Started
                  </Link>
                </div>)}
            </div>
          </div>)}
      </header>

      {/* ============================================================ */}
      {/* PAGE CONTENT                                                  */}
      {/* ============================================================ */}
      <main id="main" className="flex-1">
        {children}
      </main>

      {/* ============================================================ */}
      {/* HIGH-END TETR-STYLE FOOTER (ALIGNED TO WEBSITE BRAND THEME)   */}
      {/* ============================================================ */}
      <footer className="relative bg-[#0a0f1e] text-white overflow-hidden border-t border-white/[0.08] selection:bg-teal-500 selection:text-white">
        {/* Ambient Teal Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-96 opacity-60"
          style={{
            background:
              'radial-gradient(ellipse 900px 320px at 50% -20%, rgba(13,148,136,0.22) 0%, rgba(6,182,212,0.12) 40%, transparent 75%)',
          }}
        />

        {/* Top-Right Theme Accent Strip */}
        <div className="absolute top-0 right-0 w-20 sm:w-28 h-1.5 bg-gradient-to-r from-teal-400 via-cyan-400 to-sky-400 shadow-[0_0_12px_rgba(45,212,191,0.6)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-14 pb-8">
          
          {/* ========================================================== */}
          {/* TOP SECTION: LOGO + 4 LINK COLUMNS + AWARD & SOCIALS       */}
          {/* ========================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 items-start">
            
            {/* 1. LEFT BRAND COLUMN (Logo Box + Cyan/Teal Brand CTA) */}
            <div className="lg:col-span-4 flex flex-col items-start">
              {/* White/Dark Glass Logo Card */}
              <Link to="/" className="inline-flex items-center gap-2.5 px-3.5 py-2 bg-white rounded-xl shadow-lg border border-slate-200 group hover:shadow-teal-500/10 transition-shadow">
                <img
                  src={limberLitheMark}
                  alt="Limber Lithe"
                  className="w-8 h-8 object-contain flex-shrink-0 group-hover:scale-105 transition-transform"
                />
                <div className="leading-tight">
                  <span className="block text-xs font-black text-slate-900 tracking-tight font-display">
                    LIMBER LITHE
                  </span>
                  <span className="block text-[8px] font-bold uppercase tracking-wider text-teal-700">
                    TECHNOLOGIES
                  </span>
                </div>
              </Link>

              {/* Theme Brand Gradient CTA Button */}
              <Link
                to="/register"
                className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white transition-all shadow-lg shadow-teal-500/25 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
                }}
              >
                <span>GET STARTED NOW</span>
                <span className="text-sm font-black">↗</span>
              </Link>
            </div>

            {/* 2. MIDDLE FOUR LINK COLUMNS */}
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-xs sm:text-[13px]">
              {/* Column A: Product */}
              <div className="space-y-2.5">
                <Link
                  to="/#product"
                  onClick={(e) => handleInPageClick(e, '/#product')}
                  className="block text-slate-300 hover:text-[#5eead4] font-medium transition-colors"
                >
                  Overview
                </Link>
                <Link
                  to="/#product-capabilities"
                  onClick={(e) => handleInPageClick(e, '/#product-capabilities')}
                  className="block text-slate-300 hover:text-[#5eead4] font-medium transition-colors"
                >
                  Capabilities
                </Link>
                <Link
                  to="/#showcase"
                  onClick={(e) => handleInPageClick(e, '/#showcase')}
                  className="block text-slate-300 hover:text-[#5eead4] font-medium transition-colors"
                >
                  Roadmap
                </Link>
                <Link
                  to="/#workflow"
                  onClick={(e) => handleInPageClick(e, '/#workflow')}
                  className="block text-slate-300 hover:text-[#5eead4] font-medium transition-colors"
                >
                  Workflows
                </Link>
              </div>

              {/* Column B: Platform */}
              <div className="space-y-2.5">
                <Link
                  to="/#product-capabilities"
                  onClick={(e) => handleInPageClick(e, '/#product-capabilities')}
                  className="block text-slate-300 hover:text-[#5eead4] font-medium transition-colors"
                >
                  Kanban
                </Link>
                <Link
                  to="/#access"
                  onClick={(e) => handleInPageClick(e, '/#access')}
                  className="block text-slate-300 hover:text-[#5eead4] font-medium transition-colors"
                >
                  Permissions
                </Link>
                <Link
                  to="/#showcase"
                  onClick={(e) => handleInPageClick(e, '/#showcase')}
                  className="block text-slate-300 hover:text-[#5eead4] font-medium transition-colors"
                >
                  Burndown
                </Link>
                <Link
                  to="/#showcase"
                  onClick={(e) => handleInPageClick(e, '/#showcase')}
                  className="block text-slate-300 hover:text-[#5eead4] font-medium transition-colors"
                >
                  Releases
                </Link>
              </div>

              {/* Column C: Resources */}
              <div className="space-y-2.5">
                <Link
                  to="/pricing"
                  className="block text-slate-300 hover:text-[#5eead4] font-medium transition-colors"
                >
                  Pricing
                </Link>
                <Link
                  to="/#access"
                  onClick={(e) => handleInPageClick(e, '/#access')}
                  className="block text-slate-300 hover:text-[#5eead4] font-medium transition-colors"
                >
                  SSO &amp; SAML
                </Link>
                <Link
                  to="/terms"
                  className="block text-slate-300 hover:text-[#5eead4] font-medium transition-colors"
                >
                  Audit Logs
                </Link>
                <Link
                  to="/privacy"
                  className="block text-slate-300 hover:text-[#5eead4] font-medium transition-colors"
                >
                  Compliance
                </Link>
              </div>

              {/* Column D: Company */}
              <div className="space-y-2.5">
                <Link
                  to="/contact"
                  className="block text-slate-300 hover:text-[#5eead4] font-medium transition-colors"
                >
                  Contact Us
                </Link>
                <Link
                  to="/login"
                  className="block text-slate-300 hover:text-[#5eead4] font-medium transition-colors"
                >
                  Member App
                </Link>
                <Link
                  to="/register"
                  className="block text-slate-300 hover:text-[#5eead4] font-medium transition-colors"
                >
                  Free Trial
                </Link>
                <Link
                  to="/checkout"
                  className="block text-slate-300 hover:text-[#5eead4] font-medium transition-colors"
                >
                  Checkout
                </Link>
              </div>
            </div>

          </div>

          {/* Center subtitle note above multi-colored divider line */}
          <div className="text-center mt-8 mb-4">
            <span className="text-[11px] text-slate-400 font-medium tracking-wide">
              Enterprise Agile Engine &amp; Continuous Delivery Platform
            </span>
          </div>

          {/* ========================================================== */}
          {/* MULTI-COLORED SEGMENTED DIVIDER BAR (From TETR Screenshot) */}
          {/* ========================================================== */}
          <div className="w-full h-[3px] flex items-center gap-1.5 my-4 overflow-hidden rounded-full">
            <div className="h-full flex-1 bg-[#a855f7]" /> {/* Violet */}
            <div className="h-full flex-1 bg-[#e2e8f0]" /> {/* White/Silver */}
            <div className="h-full flex-1 bg-[#06b6d4]" /> {/* Cyan */}
            <div className="h-full flex-1 bg-[#0d9488]" /> {/* Teal */}
            <div className="h-full flex-1 bg-[#22c55e]" /> {/* Green */}
            <div className="h-full flex-1 bg-[#f59e0b]" /> {/* Amber/Gold */}
            <div className="h-full flex-1 bg-[#ec4899]" /> {/* Pink */}
            <div className="h-full flex-1 bg-[#38bdf8]" /> {/* Sky Blue */}
            <div className="h-full flex-1 bg-white" />     {/* Pure White */}
            <div className="h-full flex-1 bg-[#10b981]" /> {/* Emerald */}
          </div>

          {/* ========================================================== */}
          {/* BOTTOM SECTION: LEGAL LINKS + DISCLAIMER + CIRCULAR STAMP  */}
          {/* ========================================================== */}
          <div className="pt-2">
            {/* Centered Uppercase Legal Navigation */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-bold tracking-wider uppercase text-slate-300">
              <Link to="/contact" className="hover:text-[#5eead4] transition-colors">
                CONTACT US
              </Link>
              <Link to="/refunds" className="hover:text-[#5eead4] transition-colors">
                REFUND POLICY
              </Link>
              <Link to="/privacy" className="hover:text-[#5eead4] transition-colors">
                PRIVACY POLICY
              </Link>
              <Link to="/terms" className="hover:text-[#5eead4] transition-colors">
                TERMS &amp; CONDITIONS
              </Link>
              <Link to="/privacy" className="hover:text-[#5eead4] transition-colors">
                COOKIE SETTINGS
              </Link>
            </div>

            {/* Bottom Disclaimer + Copyright + Circular Stamp Badge */}
            <div className="mt-5 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-slate-400">
              <p className="text-center md:text-left leading-relaxed max-w-4xl">
                * Limber Lithe Technologies reserves the right to adjust platform specifications in accordance with cloud compliance and SOC 2 standards. Participants and enterprise teams will be notified accordingly. Copyright © {new Date().getFullYear()} Limber Lithe Technologies. All rights reserved.
              </p>

              {/* Circular Brand Seal Badge from Screenshot (aligned to brand theme) */}
              <div className="w-10 h-10 rounded-full border-2 border-teal-500/50 bg-[#0f172a] flex items-center justify-center shadow-lg shadow-teal-950/60 flex-shrink-0 group hover:border-cyan-400 transition-colors">
                <img
                  src={limberLitheMark}
                  alt="Limber Lithe"
                  className="w-5 h-5 object-contain"
                />
              </div>
            </div>
          </div>

        </div>
      </footer>
    </div>);
};
export default MarketingLayout;
