#!/bin/sh
# Quick Docker health check script
set -e

echo "Checking backend health..."
curl -sf http://localhost:3001/api/health || { echo "Backend health check failed"; exit 1; }

echo "Checking frontend..."
curl -sf http://localhost:80 > /dev/null || { echo "Frontend check failed"; exit 1; }

echo "All checks passed!"
