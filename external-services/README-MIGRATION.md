# Database Migration with Docker Compose

This project includes a Docker Compose service for running database migrations easily and consistently.

## Migration Service

The `migrate` service is configured to:
- Use Node.js 18 Alpine image
- Connect to the PostgreSQL database service
- Wait for PostgreSQL to be healthy before running
- Install dependencies and run migrations automatically

## Usage

### Run Migrations

To run all pending migrations:

```bash
docker-compose --profile migrate up migrate
```

### Check Migration Status

To check the status of migrations:

```bash
docker-compose --profile migrate run --rm migrate npm run migrate:status
```

### Run Specific Migration Commands

You can run any migration command using:

```bash
# Run migrations up
docker-compose --profile migrate run --rm migrate npm run migrate:up

# Run migrations down (rollback)
docker-compose --profile migrate run --rm migrate npm run migrate:down

# Rollback one migration
docker-compose --profile migrate run --rm migrate npm run migrate:rollback

# Create a new migration
docker-compose --profile migrate run --rm migrate npm run migrate:create
```

## Environment Variables

The migration service uses the same environment variables as defined in `.env.local`:

- `DB_HOST`: Database host (automatically set to `postgres` service)
- `DB_PORT`: Database port (5432)
- `DB_NAME`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password

## Dependencies

The migration service will automatically:
1. Wait for the PostgreSQL service to be healthy
2. Install npm dependencies
3. Run the specified migration command

## Notes

- The migration service uses the `migrate` profile, so it won't start with regular `docker-compose up`
- The service is configured to remove itself after completion (`--rm` flag recommended)
- All migration files should be placed in the `migrations/` directory