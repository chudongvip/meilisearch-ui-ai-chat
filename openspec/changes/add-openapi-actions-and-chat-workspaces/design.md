## Context

The admin UI stores Meilisearch instance host and API key in browser local storage and calls Meilisearch directly from the browser. Chat workspace management should follow the same instance-scoped pattern.

The OpenAPI file is an input artifact for tooling and should not be served as a public static file or bundled into runtime code.

## Goals

- Keep OpenAPI-derived permission options synchronized with `components.schemas.Action.enum`.
- Add practical chat workspace management under the current instance route.
- Submit chat workspace provider API keys through the same browser-to-Meilisearch request path used by the rest of the app.
- Surface request failures to the user instead of silently replacing them with fallback data.

## Non-Goals

- Do not implement a conversational chat UI in this change.
- Do not call `POST /chats/{workspace_uid}/chat/completions` in this change.
- Do not add a server-side proxy or secret storage layer.

## Decisions

### OpenAPI file location

The OpenAPI file lives at `openapi/meilisearch-openapi.json`.

This keeps third-party API schema input separate from runtime code, static public files, and OpenSpec project requirements.

### Generated constants

The generator writes `src/generated/meilisearch-openapi-constants.ts` so UI components can import literal readonly arrays without parsing the OpenAPI JSON at runtime.

The drift check script compares generated constants with the current OpenAPI schema and fails when they differ.

### Chat API access

The current `meilisearch` JavaScript client may not expose the new `/chats` endpoints, so the UI uses a small typed REST helper. The helper:

- Resolves paths against the current instance host.
- Adds `Authorization: Bearer <apiKey>` when the current instance has an API key.
- Throws visible errors for non-2xx responses.

### Provider API key handling

The UI allows editing and submitting `apiKey` inside chat workspace settings because the current project stores instance credentials in browser local storage and already sends credentials directly from the browser.

The UI does not persist the provider key separately. It only sends the JSON settings payload to Meilisearch.
