# Database Setup with Docker Compose

This project now uses Redis for session storage and PostgreSQL for persistent data storage, replacing the previous in-memory session management.

## Prerequisites

- Docker and Docker Compose installed on your system
- Node.js and npm for the Next.js application

## Quick Start

### 1. Start Database Services

```bash
# Start Redis and PostgreSQL containers
docker-compose up -d

# Check if services are running
docker-compose ps
```

### 2. Verify Database Connections

```bash
# Test Redis connection
docker exec -it instagram-chat-redis redis-cli ping
# Should return: PONG

# Test PostgreSQL connection
docker exec -it instagram-chat-postgres psql -U instagram_user -d instagram_chat -c "SELECT version();"
```

### 3. Install Dependencies and Start Application

```bash
# Install new database dependencies (if not already done)
npm install redis pg @types/pg ioredis

# Start the Next.js development server
npm run dev
```

## Database Services

### Redis (Session Storage)

- **Port**: 6379
- **Purpose**: Stores user sessions with automatic expiration
- **Data**: Session tokens, user authentication state
- **Persistence**: Data persists across container restarts

### PostgreSQL (Persistent Data)

- **Port**: 5432
- **Database**: `instagram_chat`
- **Username**: `instagram_user`
- **Password**: `instagram_password`
- **Purpose**: Store users, messages, contacts, and session metadata

## Database Schema

The PostgreSQL database includes these tables:

- `users` - Instagram user information
- `sessions` - Session metadata and expiration
- `contacts` - User contact lists
- `messages` - Chat message history

## Environment Variables

The following environment variables are configured in `.env.local`:

```env
# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# PostgreSQL Configuration
DATABASE_URL=postgresql://instagram_user:instagram_password@localhost:5432/instagram_chat
DB_HOST=localhost
DB_PORT=5432
DB_NAME=instagram_chat
DB_USER=instagram_user
DB_PASSWORD=instagram_password
```

## Benefits of This Setup

1. **Session Persistence**: Sessions survive server restarts
2. **Scalability**: Redis can handle high-throughput session operations
3. **Data Integrity**: PostgreSQL ensures reliable data storage
4. **Development**: Easy setup with Docker Compose
5. **Production Ready**: Both databases are production-grade

## Managing Services

```bash
# Stop services
docker-compose down

# Stop and remove volumes (deletes all data)
docker-compose down -v

# View logs
docker-compose logs redis
docker-compose logs postgres

# Restart services
docker-compose restart
```

## Troubleshooting

### Connection Issues

1. **Redis Connection Failed**:

   ```bash
   # Check if Redis is running
   docker-compose ps redis

   # View Redis logs
   docker-compose logs redis
   ```

2. **PostgreSQL Connection Failed**:

   ```bash
   # Check if PostgreSQL is running
   docker-compose ps postgres

   # View PostgreSQL logs
   docker-compose logs postgres
   ```

3. **Port Conflicts**:
   - If ports 6379 or 5432 are already in use, modify the ports in `docker-compose.yml`
   - Update the corresponding environment variables in `.env.local`

### Data Reset

```bash
# Clear all data and restart fresh
docker-compose down -v
docker-compose up -d
```

## Production Considerations

- Change default passwords in `docker-compose.yml`
- Use environment variables for sensitive data
- Configure Redis persistence settings
- Set up database backups
- Use connection pooling for PostgreSQL
- Monitor database performance and storage

## Migration from In-Memory Sessions

The application has been updated to:

- Store session data in Redis instead of memory
- Maintain Instagram client instances in a memory cache
- Provide better error handling for expired sessions
- Support automatic session cleanup and expiration

Existing users will need to log in again after the upgrade.
