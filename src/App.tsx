import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import TradeJournal from './pages/TradeJournal';
import TradeHistory from './pages/TradeHistory';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import { SupabaseProvider } from './contexts/SupabaseContext';

function App() {
  return (
    <ThemeProvider>
      <SupabaseProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/journal" element={<TradeJournal />} />
              <Route path="/history" element={<TradeHistory />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        </Router>
      </SupabaseProvider>
    </ThemeProvider>
  );
}

export default App;