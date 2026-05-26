# Change: Add OpenAPI-generated actions and chat workspace management

## Why

The API key form hardcodes Meilisearch action values and silently falls behind the OpenAPI schema when new permissions are added. The admin UI also lacks management screens for Meilisearch chat workspaces even though the OpenAPI file exposes workspace and workspace settings endpoints.

## What Changes

- Move the Meilisearch OpenAPI file into a dedicated `openapi/` input directory.
- Generate shared TypeScript constants from OpenAPI enum schemas.
- Replace the API key action selector's hardcoded options with the generated `Action` enum values.
- Add an instance-level chat workspace management route at `/ins/$insID/chats`.
- Allow users to view chat workspaces, inspect workspace details, edit/reset workspace settings, and delete workspaces.
- Allow provider API keys to be entered and submitted through the browser UI as part of workspace settings.
- Update OpenAPI coverage audit documents to reflect the new coverage.

## Impact

- Affected specs: `api-key-management`, `chat-workspace-management`
- Affected code:
  - `openapi/meilisearch-openapi.json`
  - `scripts/generate-openapi-constants.mjs`
  - `scripts/check-openapi-constants.mjs`
  - `src/generated/meilisearch-openapi-constants.ts`
  - `src/components/biz/KeyForm.tsx`
  - `src/lib/meilisearch-rest.ts`
  - `src/routes/ins/$insID/_layout/chats.tsx`
  - `src/routes/ins/$insID/_layout/index.tsx`
  - `src/lib/i18n.ts`
  - `src/locales/en/chat.json`
  - `src/locales/zh/chat.json`
  - `OPENAPI_COVERAGE_AUDIT.md`
  - `OPENAPI_COVERAGE_AUDIT_CN.md`
