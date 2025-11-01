const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (replace with database in production)
let sales = [];
let tattooRaffleEntries = [];
let merchRaffleEntries = [];
let schedule = [];
let revenue = {
  total: 0,
  tattooTickets: 0,
  merchTickets: 0,
  entryTickets: 0
};

// Admin password (must be set in env variable)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error('ERROR: ADMIN_PASSWORD environment variable is not set!');
  console.error('Please set ADMIN_PASSWORD before starting the server.');
  process.exit(1);
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get revenue stats
app.get('/api/revenue', (req, res) => {
  res.json(revenue);
});

// Get sales data
app.get('/api/sales', (req, res) => {
  res.json(sales);
});

// Get schedule
app.get('/api/schedule', (req, res) => {
  res.json(schedule);
});

// Add schedule event (admin only)
app.post('/api/schedule', (req, res) => {
  const { password, event } = req.body;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const newEvent = {
    id: crypto.randomUUID(),
    ...event,
    createdAt: new Date()
  };
  
  schedule.push(newEvent);
  io.emit('scheduleUpdate', schedule);
  res.json(newEvent);
});

// Delete schedule event (admin only)
app.delete('/api/schedule/:id', (req, res) => {
  const { password } = req.body;
  const { id } = req.params;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  schedule = schedule.filter(event => event.id !== id);
  io.emit('scheduleUpdate', schedule);
  res.json({ success: true });
});

// Process purchase
app.post('/api/purchase', (req, res) => {
  const { type, quantity, paymentMethod, name, phone, password } = req.body;
  
  // Validate cash payment requires admin password
  if (paymentMethod === 'cash' && password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Cash payments require admin password' });
  }
  
  let price = 0;
  let itemType = '';
  
  // Calculate price based on type and quantity
  if (type === 'tattoo') {
    itemType = 'Tattoo Raffle';
    if (quantity === 5) {
      price = 20;
    } else {
      price = quantity * 5;
    }
    
    // Add raffle entries
    for (let i = 0; i < quantity; i++) {
      tattooRaffleEntries.push({
        id: crypto.randomUUID(),
        name,
        phone,
        timestamp: new Date()
      });
    }
  } else if (type === 'merch') {
    itemType = 'Merch Raffle';
    if (quantity === 3) {
      price = 10;
    } else {
      price = quantity * 3;
    }
    
    // Add raffle entries
    for (let i = 0; i < quantity; i++) {
      merchRaffleEntries.push({
        id: crypto.randomUUID(),
        name,
        phone,
        timestamp: new Date()
      });
    }
  } else if (type === 'entry') {
    itemType = 'Entry Ticket';
    price = quantity * 10; // Assuming $10 per entry ticket
  }
  
  // Record sale
  const sale = {
    id: crypto.randomUUID(),
    type: itemType,
    quantity,
    price,
    paymentMethod,
    timestamp: new Date()
  };
  
  sales.push(sale);
  
  // Update revenue
  revenue.total += price;
  if (type === 'tattoo') {
    revenue.tattooTickets += price;
  } else if (type === 'merch') {
    revenue.merchTickets += price;
  } else if (type === 'entry') {
    revenue.entryTickets += price;
  }
  
  // Emit real-time updates
  io.emit('revenueUpdate', revenue);
  io.emit('salesUpdate', sales);
  
  res.json({ 
    success: true, 
    sale,
    message: 'Purchase successful!'
  });
});

// Get raffle entries
app.get('/api/raffle/tattoo', (req, res) => {
  res.json(tattooRaffleEntries);
});

app.get('/api/raffle/merch', (req, res) => {
  res.json(merchRaffleEntries);
});

// Draw random winner (admin only)
app.post('/api/raffle/draw', (req, res) => {
  const { password, type } = req.body;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  let entries = type === 'tattoo' ? tattooRaffleEntries : merchRaffleEntries;
  
  if (entries.length === 0) {
    return res.status(400).json({ error: 'No entries available' });
  }
  
  const randomIndex = Math.floor(Math.random() * entries.length);
  const winner = entries[randomIndex];
  
  // Emit winner to all connected clients
  io.emit('winnerDrawn', { type, winner });
  
  res.json({ winner });
});

// Clear raffle entries (admin only)
app.post('/api/raffle/clear', (req, res) => {
  const { password, type } = req.body;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (type === 'tattoo') {
    tattooRaffleEntries = [];
  } else if (type === 'merch') {
    merchRaffleEntries = [];
  }
  
  res.json({ success: true });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Send initial data
  socket.emit('revenueUpdate', revenue);
  socket.emit('salesUpdate', sales);
  socket.emit('scheduleUpdate', schedule);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
