import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

const LoginPage = lazy(() => import('./pages/login'));
const AccessDeniedPage = lazy(() => import('./pages/AccessDenied'));
const Home = lazy(() => import('./pages/home'));
const Dashboard = lazy(() => import('./component/Dashboard'));
const SubcriptionPage = lazy(() => import('./component/Subcription'));

function App() {
  return (
    <Router>
      <div className='app-background'>
        <Suspense fallback={
          <div className="flex items-center justify-center h-screen bg-[#181817]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A294F9]" />
          </div>
        }>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/access-denied" element={<AccessDeniedPage />} />
            <Route path="/home" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/subcription" element={<SubcriptionPage />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
