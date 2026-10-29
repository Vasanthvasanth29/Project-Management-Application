import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, CheckCircle2, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getDashboardPath } from '../../utils/roleUtils';
import { site } from '../../config/siteConfig';
/** In-page destinations that exist on the home page today. */
const PRODUCT_LINKS = [
    { to: '/#product', label: 'Product overview' },
    { to: '/#features', label: 'Capabilities' },
    { to: '/#showcase', label: 'Roadmap & delivery' },
    { to: '/#workflow', label: 'Workflow customization' },
    { to: '/#access', label: 'Roles & access' },
];
const NAV_LINKS = [
    { to: '/#features', label: 'Features' },
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
 * FlowExec brand mark — gradient diamond/spark identity.
 * Uses a teal→cyan gradient without copying any other brand.
 */
export const BrandMark = ({ size = 'md' }) => {
    const dim = size === 'sm' ? 'w-8 h-8 rounded-lg' : 'w-9 h-9 rounded-xl';
    const iconDim = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    return (<span className={`${dim} flex items-center justify-center flex-shrink-0`} style={{
            background: 'linear-gradient(145deg, #0d9488, #0284c7)',
            boxShadow: '0 2px 8px rgba(13,148,136,0.35)',
        }} aria-hidden="true">
      {/* Simple "L" mark made of two overlapping squares */}
      <svg viewBox="0 0 20 20" className={`${iconDim} text-white`} fill="currentColor" aria-hidden="true">
        <path d="M4 4h4v9h7v3H4V4z"/>
      </svg>
    </span>);
};
const DisclosureMenu = ({ label, id, items, active, open, onToggle, onClose, }) => {
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
          {items.map((item) => (<Link key={item.to} to={item.to} role="menuitem" className="block px-3 py-2.5 rounded-xl text-sm font-medium text-[#4b5563] hover:bg-[#f0fdfa] hover:text-[#0f766e] transition-colors" onClick={onClose}>
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
    useEffect(() => {
        setMenuOpen(false);
        setProductOpen(false);
        setResourcesOpen(false);
        const hashId = location.hash.replace('#', '');
        if (hashId) {
            const el = document.getElementById(hashId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
        }
        window.scrollTo({ top: 0 });
    }, [location.pathname, location.hash]);
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
                : 'text-[#4b5563] hover:text-[#0f766e] hover:bg-[#f0fdfa]'}`}>
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
              <span className="block text-[17px] font-bold tracking-tight font-display leading-tight text-[#0a0f1e]">
                {site.name}
              </span>
              <span className="hidden sm:block text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] -mt-0.5">
                Project Management
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {/* Product disclosure */}
            <DisclosureMenu label="Product" id="marketing-product-menu" items={PRODUCT_LINKS} active={false} open={productOpen} onToggle={() => {
            setProductOpen((o) => !o);
            setResourcesOpen(false);
        }} onClose={() => setProductOpen(false)}/>

            {NAV_LINKS.map((link) => renderNavLink(link))}

            {/* Resources disclosure */}
            <DisclosureMenu label="Resources" id="marketing-resources-menu" items={RESOURCE_LINKS} active={RESOURCE_LINKS.some((link) => link.to === location.pathname)} open={resourcesOpen} onToggle={() => {
            setResourcesOpen((o) => !o);
            setProductOpen(false);
        }} onClose={() => setResourcesOpen(false)}/>
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
                Product
              </span>
              {PRODUCT_LINKS.map((link) => (<Link key={link.to} to={link.to} className="pl-5 pr-3 py-2 rounded-xl text-sm font-medium text-[#4b5563] hover:bg-[#f1f5f9]" onClick={() => setMenuOpen(false)}>
                  {link.label}
                </Link>))}

              <span className="px-3 py-1.5 mt-2 text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">
                Resources
              </span>
              {RESOURCE_LINKS.map((link) => (<Link key={link.to} to={link.to} className="px-3 py-2.5 rounded-xl text-sm font-medium text-[#4b5563] hover:bg-[#f1f5f9]" onClick={() => setMenuOpen(false)}>
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
      {/* FOOTER                                                        */}
      {/* ============================================================ */}
      <footer className="border-t border-[#e2e5ea] bg-[#0a0f1e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Brand column — spans 2 on lg */}
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2.5">
                <BrandMark size="sm"/>
                <span className="text-base font-bold tracking-tight font-display text-white">{site.name}</span>
              </div>
              <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-xs">
                {site.description}
              </p>
              <p className="mt-3 text-xs text-slate-500">{site.tagline}.</p>
            </div>

            {/* Product column */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Product
              </h2>
              <ul className="space-y-3 text-sm">
                {PRODUCT_LINKS.map((link) => (<li key={link.to}>
                    <Link to={link.to} className="text-slate-400 hover:text-[#5eead4] transition-colors">
                      {link.label}
                    </Link>
                  </li>))}
                <li>
                  <Link to="/pricing" className="text-slate-400 hover:text-[#5eead4] transition-colors">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            {/* Account column */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Account
              </h2>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/login" className="text-slate-400 hover:text-[#5eead4] transition-colors">
                    Log in
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-slate-400 hover:text-[#5eead4] transition-colors">
                    Get started
                  </Link>
                </li>
                <li>
                  <Link to="/checkout" className="text-slate-400 hover:text-[#5eead4] transition-colors">
                    Checkout
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal & support column */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Legal &amp; support
              </h2>
              <ul className="space-y-3 text-sm">
                {LEGAL_LINKS.map((link) => (<li key={link.to}>
                    <Link to={link.to} className="text-slate-400 hover:text-[#5eead4] transition-colors">
                      {link.label}
                    </Link>
                  </li>))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer bottom bar */}
        <div className="border-t border-white/[0.07]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
            <p>
              © {new Date().getFullYear()} {site.name}. All rights reserved.
            </p>
            <p className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" aria-hidden="true"/>
              Enterprise sign-in with Microsoft Entra ID supported
            </p>
          </div>
        </div>
      </footer>
    </div>);
};
export default MarketingLayout;
