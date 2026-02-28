import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Zones from './pages/Zones';
import Wallet from './pages/Wallet';
import Insights from './pages/Insights';
import Loans from './pages/Loans';
import Savings from './pages/Savings';
import Cashout from './pages/Cashout';
import NotFound from './pages/NotFound';
import { ProtectedRoute } from './components/shared/ProtectedRoute';

// Step 7 — Wallet sub-pages
import Transactions from './pages/Wallet/Transactions';

// Step 8 — Insights sub-pages
import AlgoInsights from './pages/Insights/AlgoInsights';
import Tax from './pages/Insights/Tax';

// Step 10 — Profile sub-pages
import LinkedAccounts from './pages/Profile/LinkedAccounts';
import Support from './pages/Profile/Support';

// SMS Transactions
import SmsTransactions from './pages/SmsTransactions';

// Financial Hub
import GigScoreDashboard from './pages/GigScoreDashboard';
import MicroSavingsHub from './pages/MicroSavingsHub';
import CreditHub from './pages/CreditHub';
import TaxDashboard from './pages/TaxDashboard';

// Onboarding Pages
import Landing from './pages/Onboarding/Landing';
import PhoneEntry from './pages/Onboarding/PhoneEntry';
import AadhaarKYC from './pages/Onboarding/AadhaarKYC';
import SelfieCapture from './pages/Onboarding/SelfieCapture';
import PlatformLink from './pages/Onboarding/PlatformLink';
import BankSetup from './pages/Onboarding/BankSetup';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

import { LanguageProvider } from './context/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen w-full bg-[#E5E9DF] flex justify-center text-gigpay-text-primary">
            <div className="w-full max-w-[420px] bg-gigpay-surface relative shadow-xl overflow-x-hidden">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Landing />} />
                <Route path="/auth/phone" element={<PhoneEntry />} />

                {/* Protected Routes (Require Authentication and Tokens) */}
                <Route element={<ProtectedRoute />}>
                  {/* Mid-Journey Onboarding */}
                  <Route path="/onboarding/kyc" element={<AadhaarKYC />} />
                  <Route path="/onboarding/selfie" element={<SelfieCapture />} />
                  <Route path="/onboarding/platforms" element={<PlatformLink />} />
                  <Route path="/onboarding/bank" element={<BankSetup />} />

                  {/* Authenticated App Routes */}
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/wallet" element={<Wallet />} />
                    <Route path="/wallet/transactions" element={<Transactions />} />
                    <Route path="/cashout" element={<Cashout />} />
                    <Route path="/insights" element={<Insights />} />
                    <Route path="/insights/algo" element={<AlgoInsights />} />
                    <Route path="/insights/tax" element={<Tax />} />
                    <Route path="/loans" element={<Loans />} />
                    <Route path="/savings" element={<Savings />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/linked-accounts" element={<LinkedAccounts />} />
                    <Route path="/profile/support" element={<Support />} />
                    <Route path="/sms-transactions" element={<SmsTransactions />} />
                    <Route path="/gigscore" element={<GigScoreDashboard />} />
                    <Route path="/microsavings" element={<MicroSavingsHub />} />
                    <Route path="/credit" element={<CreditHub />} />
                    <Route path="/tax-hub" element={<TaxDashboard />} />
                    <Route path="/zones" element={<Zones />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Route>
              </Routes>
            </div>
          </div>
        </Router>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#FFFFFF',
              color: '#0D1B3E',
              borderRadius: '16px',
              border: '1.5px solid #D4D8C8',
              boxShadow: '4px 4px 0px #D4D8C8',
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 600
            },
          }}
        />
      </QueryClientProvider>
    </LanguageProvider>
  );
}

export default App;
