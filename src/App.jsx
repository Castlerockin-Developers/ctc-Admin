import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './component/Dashboard'; // Import the Dashboard component
import SubcriptionPage from './component/Subcription'; // Import the SubscriptionPage component
import Home from './pages/home'; // Import Home page component
import './App.css'; // Import your CSS file
import LoginPage from './pages/login';

function App() {
  return (
    <Router>
      <div className='app-background'>
        <Routes>
          {/* Home page route */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/home" element={<Home />} />
          {/* Dashboard page route */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Subscription page route */}
          <Route path="/subcription" element={<SubcriptionPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
