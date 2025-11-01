import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function CustomerView() {
  const [ticketType, setTicketType] = useState('tattoo');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cashapp');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [schedule, setSchedule] = useState([]);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    // Fetch schedule
    axios.get(`${API_URL}/api/schedule`)
      .then(res => setSchedule(res.data))
      .catch(err => console.error('Error fetching schedule:', err));

    // Setup socket connection
    const socket = io(API_URL);

    socket.on('scheduleUpdate', (data) => {
      setSchedule(data);
    });

    socket.on('winnerDrawn', (data) => {
      setWinner(data);
      setTimeout(() => setWinner(null), 10000); // Clear after 10 seconds
    });

    return () => socket.disconnect();
  }, []);

  const calculatePrice = () => {
    if (ticketType === 'tattoo') {
      if (quantity === 5) return 20;
      return quantity * 5;
    } else if (ticketType === 'merch') {
      if (quantity === 3) return 10;
      return quantity * 3;
    } else if (ticketType === 'entry') {
      return quantity * 10;
    }
    return 0;
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    
    // Validation
    if ((ticketType === 'tattoo' || ticketType === 'merch') && (!name || !phone)) {
      setMessage('Name and phone are required for raffle tickets');
      setMessageType('error');
      return;
    }

    if (paymentMethod === 'cash' && !adminPassword) {
      setMessage('Admin password required for cash payments');
      setMessageType('error');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/purchase`, {
        type: ticketType,
        quantity,
        paymentMethod,
        name,
        phone,
        password: adminPassword
      });

      if (response.data.success) {
        setMessage(`Purchase successful! Total: $${calculatePrice()}`);
        setMessageType('success');
        
        // Reset form
        setName('');
        setPhone('');
        setAdminPassword('');
        setQuantity(1);
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'Purchase failed');
      setMessageType('error');
    }

    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const getTicketOptions = () => {
    if (ticketType === 'tattoo') {
      return [
        { value: 1, label: '1 Ticket - $5' },
        { value: 5, label: '5 Tickets - $20 (Best Deal!)' }
      ];
    } else if (ticketType === 'merch') {
      return [
        { value: 1, label: '1 Ticket - $3' },
        { value: 3, label: '3 Tickets - $10 (Best Deal!)' }
      ];
    } else {
      return [
        { value: 1, label: '1 Ticket - $10' },
        { value: 2, label: '2 Tickets - $20' },
        { value: 3, label: '3 Tickets - $30' }
      ];
    }
  };

  return (
    <div className="container">
      {winner && (
        <div className="winner-display">
          <h2>🎉 WINNER! 🎉</h2>
          <div className="winner-name">{winner.winner.name}</div>
          <p>{winner.type === 'tattoo' ? 'Tattoo Raffle' : 'Merch Raffle'} Winner!</p>
        </div>
      )}

      <div className="grid">
        <div className="card">
          <h2>Purchase Tickets</h2>
          
          {message && (
            <div className={`alert alert-${messageType}`}>
              {message}
            </div>
          )}

          <form onSubmit={handlePurchase}>
            <div className="form-group">
              <label>Ticket Type</label>
              <select 
                value={ticketType} 
                onChange={(e) => {
                  setTicketType(e.target.value);
                  setQuantity(1);
                }}
              >
                <option value="entry">Entry Ticket</option>
                <option value="tattoo">Tattoo Raffle</option>
                <option value="merch">Merch Raffle</option>
              </select>
            </div>

            <div className="form-group">
              <label>Quantity</label>
              <select 
                value={quantity} 
                onChange={(e) => setQuantity(parseInt(e.target.value))}
              >
                {getTicketOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {(ticketType === 'tattoo' || ticketType === 'merch') && (
              <>
                <div className="form-group">
                  <label>Your Name *</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Payment Method</label>
              <select 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cashapp">Cash App</option>
                <option value="venmo">Venmo</option>
                <option value="applepay">Apple Pay</option>
                <option value="cash">Cash (Admin Only)</option>
              </select>
            </div>

            {paymentMethod === 'cash' && (
              <div className="form-group">
                <label>Admin Password *</label>
                <input 
                  type="password" 
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                />
              </div>
            )}

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#ff0000', marginBottom: '15px' }}>
                Total: ${calculatePrice()}
              </div>
              <button type="submit" className="btn">
                Complete Purchase
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <h2>Upcoming Shows</h2>
          {schedule.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              No upcoming shows scheduled
            </p>
          ) : (
            <ul className="schedule-list">
              {schedule.map((event) => (
                <li key={event.id} className="schedule-item">
                  <h3>{event.title}</h3>
                  <p>{event.date}</p>
                  <p>{event.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card">
        <h2>About Pins & Needles Comedy</h2>
        <p style={{ lineHeight: '1.6', color: '#ccc' }}>
          Welcome to Pins & Needles Comedy! Purchase your entry tickets to join us for a night of 
          laughs. Don't miss out on our exciting raffles - win tattoo sessions or exclusive merch!
        </p>
        <p style={{ lineHeight: '1.6', color: '#ccc', marginTop: '10px' }}>
          <strong style={{ color: '#ff0000' }}>Raffle Pricing:</strong><br/>
          Tattoo Raffle: 1 for $5 or 5 for $20<br/>
          Merch Raffle: 1 for $3 or 3 for $10
        </p>
      </div>
    </div>
  );
}

export default CustomerView;
