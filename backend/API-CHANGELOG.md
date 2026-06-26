# API Changelog

## 2026-06-26 - OpenAPI Documentation (Phase 6)

- Added OpenAPI 3.0.3 spec generation via `@asteasolutions/zod-to-openapi`
- Swagger UI mounted at `GET /api/docs`
- Spec available at `GET /api/docs/openapi.json` and `GET /api/docs/openapi.yaml`
- Generated spec covers **all ~158 endpoints** across 28 tags
- Bearer JWT auth documented in security schemes
- Added `npm run docs:generate` — outputs `api-spec.json` and `api-spec.yaml`
- Added `npm run docs:postman` — outputs `sustainalign.postman_collection.json`
