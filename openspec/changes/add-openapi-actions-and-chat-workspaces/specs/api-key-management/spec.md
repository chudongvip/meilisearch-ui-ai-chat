## MODIFIED Requirements

### Requirement: API key action options

The API key form SHALL populate permitted action options from the Meilisearch OpenAPI `components.schemas.Action.enum` values generated into shared TypeScript constants.

#### Scenario: Action enum options are shown

- **WHEN** the user opens the create key form
- **THEN** every action value from the generated OpenAPI action constants SHALL be available in the action selector
- **AND** the selector SHALL include wildcard action values such as `*`, `documents.*`, and `chats.*`

#### Scenario: Empty actions preserve all-action behavior

- **WHEN** the user submits the create key form without selecting actions
- **THEN** the submitted key creation payload SHALL use `["*"]` for actions

#### Scenario: OpenAPI action drift is checked

- **WHEN** the OpenAPI action enum changes without regenerating constants
- **THEN** the OpenAPI constants check script SHALL fail
