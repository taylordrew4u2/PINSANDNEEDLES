# Deployment Guide

## Deploying to Production

### Environment Variables

Make sure to set these environment variables on your hosting platform:

```
NODE_ENV=production
PORT=5000
ADMIN_PASSWORD=your_very_secure_password_here
CLIENT_URL=https://your-domain.com
```

### Deployment Options

#### Option 1: Traditional Node.js Hosting (Heroku, DigitalOcean, etc.)

1. Build the React app:
```bash
npm run build
```

2. Set environment variables on your platform

3. Deploy the repository

4. The server will automatically serve the built React app from `client/build`

#### Option 2: Vercel / Netlify (Serverless)

For serverless platforms, you'll need to modify the architecture:
- Deploy the React app (`client/build`) to the platform
- Deploy the backend separately or use serverless functions
- Update the `API_URL` in the React app to point to your backend

#### Option 3: Docker

Create a `Dockerfile`:

```dockerfile
FROM node:20

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

COPY client/package*.json ./client/
RUN cd client && npm install

# Copy source
COPY . .

# Build React app
RUN cd client && npm run build

# Expose port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production

CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t pinsandneedles .
docker run -p 5000:5000 -e ADMIN_PASSWORD=your_password pinsandneedles
```

### Database Integration (Optional)

The app currently uses in-memory storage. For production persistence:

1. Install a database driver (MongoDB, PostgreSQL, etc.):
```bash
npm install mongoose
# or
npm install pg
```

2. Update `server.js` to:
   - Connect to your database
   - Replace arrays (`sales`, `tattooRaffleEntries`, etc.) with database models
   - Persist data on each operation

3. Example MongoDB integration:
```javascript
const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE_URL);

const SaleSchema = new mongoose.Schema({
  type: String,
  quantity: Number,
  price: Number,
  paymentMethod: String,
  timestamp: Date
});

const Sale = mongoose.model('Sale', SaleSchema);
```

### Security Recommendations

1. **Use HTTPS** - Always use SSL/TLS in production
2. **Strong Password** - Use a strong, unique admin password
3. **Rate Limiting** - Consider adding rate limiting for production:
```bash
npm install express-rate-limit
```

4. **CORS** - Update CORS settings to only allow your domain:
```javascript
cors({
  origin: process.env.CLIENT_URL,
  methods: ["GET", "POST", "DELETE"]
})
```

5. **Session Management** - For better security, implement proper session management with JWT tokens

### Monitoring

Consider adding:
- Error logging (e.g., Winston, Morgan)
- Performance monitoring (e.g., New Relic, DataDog)
- Uptime monitoring (e.g., UptimeRobot, Pingdom)

### Backup

If using in-memory storage:
- Data is lost on server restart
- Consider periodic exports or use a database

If using a database:
- Set up automated backups
- Test restore procedures regularly
