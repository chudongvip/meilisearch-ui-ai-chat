import type { Instance } from "@/store";

export type ChatWorkspace = {
	uid: string;
	name?: string | null;
};

export type ChatWorkspaceList = {
	results: ChatWorkspace[];
	offset: number;
	limit: number;
	total: number;
};

export type ChatCompletionSource = "openAi" | "mistral" | "azureOpenAi" | "vLlm";

export type ChatWorkspaceSettings = {
	source?: ChatCompletionSource | null;
	orgId?: string | null;
	projectId?: string | null;
	apiVersion?: string | null;
	deploymentId?: string | null;
	baseUrl?: string | null;
	apiKey?: string | null;
	prompts?: {
		system?: string | null;
		searchDescription?: string | null;
		searchQParam?: string | null;
		searchFilterParam?: string | null;
		searchIndexUidParam?: string | null;
	} | null;
};

export type RuntimeTogglableFeatures = {
	metrics?: boolean | null;
	logsRoute?: boolean | null;
	editDocumentsByFunction?: boolean | null;
	containsFilter?: boolean | null;
	dynamicSearchRules?: boolean | null;
	network?: boolean | null;
	getTaskDocumentsRoute?: boolean | null;
	taskQueueCompactionRoute?: boolean | null;
	compositeEmbedders?: boolean | null;
	chatCompletions?: boolean | null;
	multimodal?: boolean | null;
	foreignKeys?: boolean | null;
};

const buildUrl = (host: string, pathname: string) => {
	return new URL(pathname, host).toString();
};

const getErrorMessage = async (response: Response) => {
	const text = await response.text();
	if (!text) {
		return `${response.status} ${response.statusText}`;
	}
	try {
		const body = JSON.parse(text) as { message?: string; code?: string };
		return body.message || body.code || text;
	} catch {
		return text;
	}
};

export const requestMeilisearch = async <T>(
	instance: Pick<Instance, "host" | "apiKey">,
	pathname: string,
	init: RequestInit = {},
): Promise<T> => {
	const headers = new Headers(init.headers);
	headers.set("Accept", "application/json");
	if (init.body && !headers.has("Content-Type")) {
		headers.set("Content-Type", "application/json");
	}
	if (instance.apiKey) {
		headers.set("Authorization", `Bearer ${instance.apiKey}`);
	}

	const response = await fetch(buildUrl(instance.host, pathname), {
		...init,
		headers,
	});

	if (!response.ok) {
		throw new Error(await getErrorMessage(response));
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return (await response.json()) as T;
};

export const listChatWorkspaces = (instance: Pick<Instance, "host" | "apiKey">) =>
	requestMeilisearch<ChatWorkspaceList>(instance, "/chats");

export const getChatWorkspace = (
	instance: Pick<Instance, "host" | "apiKey">,
	workspaceUid: string,
) =>
	requestMeilisearch<ChatWorkspace>(
		instance,
		`/chats/${encodeURIComponent(workspaceUid)}`,
	);

export const deleteChatWorkspace = (
	instance: Pick<Instance, "host" | "apiKey">,
	workspaceUid: string,
) =>
	requestMeilisearch<void>(instance, `/chats/${encodeURIComponent(workspaceUid)}`, {
		method: "DELETE",
	});

export const getChatWorkspaceSettings = (
	instance: Pick<Instance, "host" | "apiKey">,
	workspaceUid: string,
) =>
	requestMeilisearch<ChatWorkspaceSettings>(
		instance,
		`/chats/${encodeURIComponent(workspaceUid)}/settings`,
	);

export const updateChatWorkspaceSettings = (
	instance: Pick<Instance, "host" | "apiKey">,
	workspaceUid: string,
	settings: ChatWorkspaceSettings,
) =>
	requestMeilisearch<ChatWorkspaceSettings>(
		instance,
		`/chats/${encodeURIComponent(workspaceUid)}/settings`,
		{
			method: "PATCH",
			body: JSON.stringify(settings),
		},
	);

export const resetChatWorkspaceSettings = (
	instance: Pick<Instance, "host" | "apiKey">,
	workspaceUid: string,
) =>
	requestMeilisearch<ChatWorkspaceSettings>(
		instance,
		`/chats/${encodeURIComponent(workspaceUid)}/settings`,
		{ method: "DELETE" },
	);

export const getExperimentalFeatures = (
	instance: Pick<Instance, "host" | "apiKey">,
) =>
	requestMeilisearch<RuntimeTogglableFeatures>(
		instance,
		"/experimental-features",
	);

export const updateExperimentalFeatures = (
	instance: Pick<Instance, "host" | "apiKey">,
	features: RuntimeTogglableFeatures,
) =>
	requestMeilisearch<RuntimeTogglableFeatures>(
		instance,
		"/experimental-features",
		{
			method: "PATCH",
			body: JSON.stringify(features),
		},
	);
