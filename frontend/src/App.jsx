import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Zones from './pages/Zones';
import Wallet from './pages/Wallet';
import Cashout from './pages/Cashout';
import Insights from './pages/Insights';
import Community from './pages/Community';
import PostJob from './pages/PostJob';
import JobDetail from './pages/JobDetail';
import Loans from './pages/Loans';
import Savings from './pages/Savings';
import { ProtectedRoute } from './components/shared/ProtectedRoute';

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

function App() {
  return (
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
                  <Route path="/cashout" element={<Cashout />} />
                  <Route path="/insights" element={<Insights />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/community/:id" element={<JobDetail />} />
                  <Route path="/post-job" element={<PostJob />} />
                  <Route path="/loans" element={<Loans />} />
                  <Route path="/savings" element={<Savings />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/zones" element={<Zones />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
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
  );
}

export default App;
