import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/home'; // Create a Home component for your homepage
import './App.css'; // Import your CSS file

function App() {
  return (
    <Router>
      <div className='app-background'>
        <Routes>
          <Route path="/" element={<Home />} /> {/* Home page route */}
        </Routes>
      </div>
    </Router >
  );
}

export default App;
