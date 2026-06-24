.PHONY: dev dev-backend dev-frontend build lint test docker-up docker-down db-reset db-migrate

dev:
	@echo "Run 'make dev-backend' and 'make dev-frontend' in separate terminals."

dev-backend:
	npm run dev:backend

dev-frontend:
	npm run dev:frontend

build:
	npm run build

lint:
	npm run lint

test:
	npm run test

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

db-reset:
	cd backend && npm run db:reset

db-migrate:
	cd backend && npm run db:migrate

db-studio:
	cd backend && npm run db:studio
