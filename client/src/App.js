import React, { useState } from 'react';
import './App.css';
import CustomerView from './components/CustomerView';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎭 Pins & Needles Comedy 🎭</h1>
        <div className="view-toggle">
          <button 
            className={!isAdmin ? 'active' : ''} 
            onClick={() => setIsAdmin(false)}
          >
            Customer
          </button>
          <button 
            className={isAdmin ? 'active' : ''} 
            onClick={() => setIsAdmin(true)}
          >
            Admin
          </button>
        </div>
      </header>
      
      {isAdmin ? <AdminDashboard /> : <CustomerView />}
    </div>
  );
}

export default App;
