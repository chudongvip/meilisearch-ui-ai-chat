## 1. OpenAPI input and generated constants

- [x] 1.1 Move `meilisearch-openapi.json` into `openapi/meilisearch-openapi.json`.
- [x] 1.2 Add a script that generates shared enum constants from the OpenAPI file.
- [x] 1.3 Generate `src/generated/meilisearch-openapi-constants.ts`.
- [x] 1.4 Add a drift check script for generated constants.

## 2. API key action selector

- [x] 2.1 Replace the hardcoded key action options with generated OpenAPI action values.
- [x] 2.2 Preserve existing default behavior where empty actions submit `["*"]`.

## 3. Chat workspace management

- [x] 3.1 Add a small REST helper for `/chats` endpoints.
- [x] 3.2 Add an instance-level `/ins/$insID/chats` route.
- [x] 3.3 Display chat workspace list and selected workspace details.
- [x] 3.4 Support workspace settings JSON editing and saving.
- [x] 3.5 Support workspace settings reset.
- [x] 3.6 Support workspace deletion with confirmation.
- [x] 3.7 Add an instance dashboard entry for Chats.
- [x] 3.8 Add a create workspace entry based on `PATCH /chats/{workspace_uid}/settings`.

## 4. Internationalization and docs

- [x] 4.1 Add English chat locale strings.
- [x] 4.2 Add Chinese chat locale strings.
- [x] 4.3 Register the `chat` i18n namespace.
- [x] 4.4 Update English OpenAPI coverage audit.
- [x] 4.5 Update Chinese OpenAPI coverage audit.

## 5. Verification

- [x] 5.1 Run the OpenAPI constants generator.
- [x] 5.2 Run the OpenAPI constants drift check.
- [x] 5.3 Run TypeScript checking.
- [x] 5.4 Run lint checking.
