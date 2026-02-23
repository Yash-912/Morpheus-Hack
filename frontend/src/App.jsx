import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,       // 5 minutes
      gcTime: 10 * 60 * 1000,          // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-dark-900 text-white">
          <Routes>
            {/* Routes will be added in Phase 12+ */}
            <Route
              path="*"
              element={
                <div className="flex items-center justify-center min-h-screen">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-primary-500 mb-4">
                      GigPay
                    </h1>
                    <p className="text-dark-400 text-lg">
                      Instant Earnings. Smart Tools. Financial Freedom.
                    </p>
                    <p className="text-dark-500 text-sm mt-6">
                      🚧 Building in progress...
                    </p>
                  </div>
                </div>
              }
            />
          </Routes>
        </div>
      </Router>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            borderRadius: '0.75rem',
            border: '1px solid #334155',
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
