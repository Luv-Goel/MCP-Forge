.PHONY: setup test python-test api-test web-build dev-api dev-web lint help

help:
	@echo "MCP Forge - development commands"
	@echo "  make setup         Install all dependencies (Python + Node)"
	@echo "  make test          Run the full test suite (Python + API)"
	@echo "  make python-test   Run Python tests only"
	@echo "  make api-test      Run API (Fastify) tests only"
	@echo "  make typecheck     Typecheck API and web TypeScript"
	@echo "  make web-build     Build the Next.js web app"
	@echo "  make dev-api       Start the registry API on :8080"
	@echo "  make dev-web       Start the web app dev server"
	@echo "  make validate      Validate all example manifests"
	@echo "  make lint          Lint all example manifests + typecheck"

setup:
	pip install --break-system-packages -r requirements.txt
	cd apps/api && npm install
	cd apps/web && npm install

python-test:
	python3 -m pytest tests/ -q

api-test:
	cd apps/api && npx vitest run

test: python-test api-test

typecheck:
	cd apps/api && npx tsc --noEmit
	cd apps/web && npx tsc --noEmit

web-build:
	cd apps/web && npx next build

validate:
	python3 cli/bin/mcp-validate examples/mcp.package.json
	python3 cli/bin/mcp-validate examples/echo-server.mcp.package.json

lint: validate typecheck

dev-api:
	cd apps/api && npm run dev

dev-web:
	cd apps/web && npm run dev
