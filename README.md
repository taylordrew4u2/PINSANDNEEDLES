# PINSANDNEEDLES

App for the monthly event, Pins and Needles Comedy Show

A black/white/red tattoo-themed web application for managing ticket sales, raffles, and events for Pins & Needles Comedy shows.

## Features

### Customer View
- **Ticket Purchasing**: Buy entry tickets, tattoo raffle tickets, and merch raffle tickets
- **Flexible Pricing**:
  - Tattoo Raffle: 1 for $5 or 5 for $20
  - Merch Raffle: 1 for $3 or 3 for $10
  - Entry Tickets: $10 each
- **Payment Options**: Cash App, Venmo, Apple Pay, or Cash (admin password required)
- **Raffle Entry**: Name and phone collection for raffle tickets
- **Live Winner Announcements**: Real-time winner displays when drawn
- **Event Schedule**: View upcoming shows

### Admin Dashboard
- **Revenue Tracking**: Real-time revenue statistics broken down by category
- **Sales Dashboard**: View all recent transactions
- **Random Name Generators**: Separate generators for Tattoo and Merch raffles
- **Raffle Management**: View entries, draw winners, and clear entries
- **Schedule Management**: Add/remove upcoming events
- **Real-time Updates**: All data updates live via WebSockets

## Tech Stack

- **Frontend**: React, Socket.io-client, Axios
- **Backend**: Node.js, Express, Socket.io
- **Styling**: Custom CSS with tattoo theme (black/white/red)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/taylordrew4u2/PINSANDNEEDLES.git
cd PINSANDNEEDLES
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd client
npm install
cd ..
```

4. Create a `.env` file in the root directory (use `.env.example` as template):
```bash
cp .env.example .env
```

5. Update the `.env` file with your configuration:
```
PORT=5000
ADMIN_PASSWORD=your_secure_password
CLIENT_URL=http://localhost:3000
```

## Development

Run both frontend and backend concurrently:
```bash
npm run dev
```

Or run them separately:

Backend only:
```bash
npm run server
```

Frontend only:
```bash
npm run client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Production Build

1. Build the React frontend:
```bash
npm run build
```

2. Set environment variables:
```bash
export NODE_ENV=production
export PORT=5000
export ADMIN_PASSWORD=your_secure_password
```

3. Start the server:
```bash
npm start
```

The server will serve the built React app and API on the same port.

## Usage

### Customer Flow
1. Visit the application
2. Select ticket type (Entry, Tattoo Raffle, or Merch Raffle)
3. Choose quantity (with bundle discounts available)
4. For raffle tickets, enter name and phone number
5. Select payment method
6. If using cash, admin must enter password
7. Complete purchase

### Admin Flow
1. Click "Admin" button in header
2. Enter admin password (default: admin123)
3. View real-time revenue and sales statistics
4. Manage raffle entries:
   - View all entries for each raffle type
   - Draw random winners with one click
   - Clear entries after event
5. Manage schedule:
   - Add upcoming events
   - Remove past events
6. Monitor all sales in real-time

## Default Admin Password

Default password: `admin123`

**Important**: Change this in production by setting the `ADMIN_PASSWORD` environment variable!

## License

ISC
