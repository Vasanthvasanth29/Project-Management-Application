import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppRoutes } from './routes';
import { ErrorBoundary } from './components/common/ErrorBoundary';
// The app is served under Vite's `base` (vite.config.js → '/agile/'), so the
// router must strip that prefix before matching routes — otherwise
// '/agile/login' matches nothing and falls through to the catch-all redirect.
// Derived from BASE_URL so dev, preview and production builds always agree.
const ROUTER_BASENAME = import.meta.env.BASE_URL.replace(/\/+$/, '') || '/';
export const App = () => {
    return (<ErrorBoundary>
      <BrowserRouter basename={ROUTER_BASENAME}>
        <Toaster position="top-right" richColors closeButton/>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>);
};
export default App;
