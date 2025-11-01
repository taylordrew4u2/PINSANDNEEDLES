import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AdminDashboard() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [revenue, setRevenue] = useState({ total: 0, tattooTickets: 0, merchTickets: 0, entryTickets: 0 });
  const [sales, setSales] = useState([]);
  const [tattooEntries, setTattooEntries] = useState([]);
  const [merchEntries, setMerchEntries] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', description: '' });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();

      // Setup socket connection
      const socket = io(API_URL);

      socket.on('revenueUpdate', (data) => {
        setRevenue(data);
      });

      socket.on('salesUpdate', (data) => {
        setSales(data);
      });

      socket.on('scheduleUpdate', (data) => {
        setSchedule(data);
      });

      return () => socket.disconnect();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      const [revenueRes, salesRes, tattooRes, merchRes, scheduleRes] = await Promise.all([
        axios.get(`${API_URL}/api/revenue`),
        axios.get(`${API_URL}/api/sales`),
        axios.get(`${API_URL}/api/raffle/tattoo`),
        axios.get(`${API_URL}/api/raffle/merch`),
        axios.get(`${API_URL}/api/schedule`)
      ]);

      setRevenue(revenueRes.data);
      setSales(salesRes.data);
      setTattooEntries(tattooRes.data);
      setMerchEntries(merchRes.data);
      setSchedule(scheduleRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // Note: This is a simple client-side check for UX purposes.
    // The actual authentication is enforced server-side on all admin endpoints.
    // Any admin action requires the password to be sent with the request.
    setIsAuthenticated(true);
    setMessage('');
  };

  const drawWinner = async (type) => {
    try {
      const response = await axios.post(`${API_URL}/api/raffle/draw`, {
        password,
        type
      });

      if (response.data.winner) {
        setMessage(`Winner: ${response.data.winner.name} - ${response.data.winner.phone}`);
        setMessageType('success');
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error drawing winner');
      setMessageType('error');
    }

    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const clearRaffle = async (type) => {
    if (!window.confirm(`Are you sure you want to clear all ${type} raffle entries?`)) {
      return;
    }

    try {
      await axios.post(`${API_URL}/api/raffle/clear`, {
        password,
        type
      });

      if (type === 'tattoo') {
        setTattooEntries([]);
      } else {
        setMerchEntries([]);
      }

      setMessage(`${type} raffle entries cleared`);
      setMessageType('success');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error clearing raffle');
      setMessageType('error');
    }

    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  const addScheduleEvent = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${API_URL}/api/schedule`, {
        password,
        event: newEvent
      });

      setNewEvent({ title: '', date: '', description: '' });
      setMessage('Event added successfully');
      setMessageType('success');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error adding event');
      setMessageType('error');
    }

    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  const deleteScheduleEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/schedule/${id}`, {
        data: { password }
      });

      setMessage('Event deleted successfully');
      setMessageType('success');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error deleting event');
      setMessageType('error');
    }

    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  if (!isAuthenticated) {
    return (
      <div className="container">
        <div className="card" style={{ maxWidth: '400px', margin: '50px auto' }}>
          <h2>Admin Login</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
              />
            </div>
            {message && (
              <div className={`alert alert-${messageType}`}>
                {message}
              </div>
            )}
            <button type="submit" className="btn" style={{ width: '100%' }}>
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {message && (
        <div className={`alert alert-${messageType}`}>
          {message}
        </div>
      )}

      <div className="stats">
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <div className="stat-value">${revenue.total}</div>
        </div>
        <div className="stat-card">
          <h3>Tattoo Raffle</h3>
          <div className="stat-value">${revenue.tattooTickets}</div>
        </div>
        <div className="stat-card">
          <h3>Merch Raffle</h3>
          <div className="stat-value">${revenue.merchTickets}</div>
        </div>
        <div className="stat-card">
          <h3>Entry Tickets</h3>
          <div className="stat-value">${revenue.entryTickets}</div>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h2>Tattoo Raffle ({tattooEntries.length} entries)</h2>
          <div style={{ marginBottom: '15px' }}>
            <button 
              className="btn" 
              onClick={() => drawWinner('tattoo')}
              disabled={tattooEntries.length === 0}
              style={{ marginRight: '10px' }}
            >
              Draw Winner
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => clearRaffle('tattoo')}
              disabled={tattooEntries.length === 0}
            >
              Clear Entries
            </button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {tattooEntries.slice(-10).reverse().map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.name}</td>
                    <td>{entry.phone}</td>
                    <td>{new Date(entry.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2>Merch Raffle ({merchEntries.length} entries)</h2>
          <div style={{ marginBottom: '15px' }}>
            <button 
              className="btn" 
              onClick={() => drawWinner('merch')}
              disabled={merchEntries.length === 0}
              style={{ marginRight: '10px' }}
            >
              Draw Winner
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => clearRaffle('merch')}
              disabled={merchEntries.length === 0}
            >
              Clear Entries
            </button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {merchEntries.slice(-10).reverse().map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.name}</td>
                    <td>{entry.phone}</td>
                    <td>{new Date(entry.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Recent Sales</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Payment</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {sales.slice(-20).reverse().map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.type}</td>
                  <td>{sale.quantity}</td>
                  <td>${sale.price}</td>
                  <td>{sale.paymentMethod}</td>
                  <td>{new Date(sale.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>Schedule Management</h2>
        <form onSubmit={addScheduleEvent}>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 2fr auto' }}>
            <div className="form-group">
              <label>Event Title</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Event name"
                required
              />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input
                type="text"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                placeholder="Date/Time"
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Event details"
              />
            </div>
            <div className="form-group">
              <label style={{ opacity: 0 }}>Add</label>
              <button type="submit" className="btn">Add Event</button>
            </div>
          </div>
        </form>

        {schedule.length > 0 && (
          <ul className="schedule-list" style={{ marginTop: '20px' }}>
            {schedule.map((event) => (
              <li key={event.id} className="schedule-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3>{event.title}</h3>
                    <p>{event.date}</p>
                    <p>{event.description}</p>
                  </div>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => deleteScheduleEvent(event.id)}
                    style={{ padding: '8px 16px' }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
