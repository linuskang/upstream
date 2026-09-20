#!/bin/sh
set -e

echo "Running database migrations..."
NODE_PATH=/usr/local/lib/node_modules prisma migrate deploy --config packages/db/prisma.config.ts

echo "Starting Upstream Server..."
exec node apps/web/server.js
