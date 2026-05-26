## ADDED Requirements

### Requirement: Chat workspace route

The application SHALL provide an instance-level chat workspace management page at `/ins/$insID/chats`.

#### Scenario: Navigate to chat workspace management

- **WHEN** a user is viewing an instance dashboard
- **THEN** a Chats navigation action SHALL be available
- **AND** activating it SHALL navigate to `/ins/$insID/chats`

### Requirement: Chat workspace listing

The chat workspace management page SHALL list chat workspaces returned by `GET /chats`.

#### Scenario: Workspace list loads

- **WHEN** the chats page is opened
- **THEN** the system SHALL request `GET /chats` for the current Meilisearch instance
- **AND** available workspace UIDs SHALL be displayed

### Requirement: Chat workspace creation

The chat workspace management page SHALL let users create a workspace by submitting initial settings to `PATCH /chats/{workspace_uid}/settings`.

#### Scenario: Create workspace

- **WHEN** a user enters a workspace UID and initial settings JSON
- **THEN** the system SHALL send the JSON payload to `PATCH /chats/{workspace_uid}/settings`
- **AND** the workspace list SHALL refresh after a successful creation
- **AND** the newly created workspace SHALL become selected

### Requirement: Chat workspace settings management

The chat workspace management page SHALL let users view, edit, save, and reset selected workspace settings.

#### Scenario: View workspace settings

- **WHEN** a user selects a chat workspace
- **THEN** the system SHALL request `GET /chats/{workspace_uid}/settings`
- **AND** the settings SHALL be displayed as editable JSON when edit mode is enabled

#### Scenario: Save workspace settings

- **WHEN** a user edits workspace settings JSON and saves it
- **THEN** the system SHALL send the JSON payload to `PATCH /chats/{workspace_uid}/settings`
- **AND** provider `apiKey` values in the JSON SHALL be submitted when present
- **AND** the page SHALL refresh displayed settings after a successful save

#### Scenario: Reset workspace settings

- **WHEN** a user confirms reset for a selected workspace
- **THEN** the system SHALL call `DELETE /chats/{workspace_uid}/settings`
- **AND** the page SHALL refresh displayed settings after a successful reset

### Requirement: Chat workspace deletion

The chat workspace management page SHALL let users delete a selected workspace after confirmation.

#### Scenario: Delete workspace

- **WHEN** a user confirms deletion for a selected workspace
- **THEN** the system SHALL call `DELETE /chats/{workspace_uid}`
- **AND** the workspace list SHALL refresh after a successful deletion
