.PHONY: dev dev-backend dev-frontend build lint test test-coverage docker-up docker-up-prod docker-down db-reset db-migrate db-studio deploy ci

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

test-coverage:
	npm run test:coverage

ci: lint build test

docker-up:
	docker compose up --build -d

docker-up-prod:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

docker-down:
	docker compose down

db-reset:
	cd backend && npm run db:reset

db-migrate:
	cd backend && npm run db:migrate

db-studio:
	cd backend && npm run db:studio

deploy:
	bash scripts/deploy.sh
