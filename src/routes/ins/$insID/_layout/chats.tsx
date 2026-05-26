import { LoaderPage } from "@/components/common/Loader";
import { JsonEditor } from "@/components/common/JsonEditor";
import { useCurrentInstance } from "@/hooks/useCurrentInstance";
import { hiddenRequestLoader, showRequestLoader } from "@/lib/loader";
import {
	deleteChatWorkspace,
	getChatWorkspace,
	getChatWorkspaceSettings,
	listChatWorkspaces,
	resetChatWorkspaceSettings,
	type ChatCompletionSource,
	type ChatWorkspace,
	type ChatWorkspaceSettings,
	updateChatWorkspaceSettings,
} from "@/lib/meilisearch-rest";
import { toast } from "@/lib/toast";
import {
	Descriptions,
	Empty,
	Input,
	List,
	Modal,
	Select,
	Skeleton,
	TextArea,
} from "@douyinfe/semi-ui";
import { Button } from "@nextui-org/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const getWorkspaceUid = (workspace: ChatWorkspace) => {
	return workspace.uid;
};

const isValidWorkspaceUid = (uid: string) => {
	return /^[A-Za-z0-9_-]+$/.test(uid) && uid.length <= 512;
};

const CHAT_COMPLETION_SOURCES: ChatCompletionSource[] = [
	"openAi",
	"mistral",
	"azureOpenAi",
	"vLlm",
];
const CHAT_COMPLETION_SOURCE_NONE = "__none__";

type CreateWorkspaceForm = {
	uid: string;
	source: ChatCompletionSource | null;
	orgId: string;
	projectId: string;
	apiVersion: string;
	deploymentId: string;
	baseUrl: string;
	apiKey: string;
	systemPrompt: string;
};

const createWorkspaceInitialForm: CreateWorkspaceForm = {
	uid: "",
	source: "openAi",
	orgId: "",
	projectId: "",
	apiVersion: "",
	deploymentId: "",
	baseUrl: "",
	apiKey: "",
	systemPrompt: "",
};

const emptyToNull = (value: string) => {
	const trimmed = value.trim();
	return trimmed ? trimmed : null;
};

const buildCreateWorkspaceSettings = (
	form: CreateWorkspaceForm,
): ChatWorkspaceSettings => ({
	source: form.source,
	orgId: emptyToNull(form.orgId),
	projectId: emptyToNull(form.projectId),
	apiVersion: emptyToNull(form.apiVersion),
	deploymentId: emptyToNull(form.deploymentId),
	baseUrl: emptyToNull(form.baseUrl),
	apiKey: emptyToNull(form.apiKey),
	prompts: {
		system: emptyToNull(form.systemPrompt),
	},
});

const removeSystemManagedChatFields = (
	settings: ChatWorkspaceSettings,
): ChatWorkspaceSettings => {
	const { prompts, ...rest } = settings;
	if (!prompts) {
		return rest;
	}
	return {
		...rest,
		prompts: {
			system: prompts.system,
		},
	};
};

const Page = () => {
	const { t } = useTranslation("chat");
	const currentInstance = useCurrentInstance();
	const [selectedWorkspaceUid, setSelectedWorkspaceUid] = useState<string>();
	const [isEditing, setIsEditing] = useState(false);
	const [settingsEditorData, setSettingsEditorData] = useState("{}");
	const [createModalVisible, setCreateModalVisible] = useState(false);
	const [createWorkspaceForm, setCreateWorkspaceForm] = useState(
		createWorkspaceInitialForm,
	);

	const updateCreateWorkspaceForm = useCallback(
		(next: Partial<CreateWorkspaceForm>) => {
			setCreateWorkspaceForm((prev) => ({ ...prev, ...next }));
		},
		[],
	);

	const workspacesQuery = useQuery({
		queryKey: ["chatWorkspaces", currentInstance.host],
		queryFn: async () => {
			showRequestLoader();
			return await listChatWorkspaces(currentInstance);
		},
	});

	useEffect(() => {
		if (workspacesQuery.isError) {
			toast.error(String(workspacesQuery.error));
		}
		if (!workspacesQuery.isFetching) {
			hiddenRequestLoader();
		}
	}, [
		workspacesQuery.error,
		workspacesQuery.isError,
		workspacesQuery.isFetching,
	]);

	useEffect(() => {
		if (!selectedWorkspaceUid && workspacesQuery.data?.results.length) {
			const firstValidWorkspace = workspacesQuery.data.results.find((workspace) =>
				isValidWorkspaceUid(getWorkspaceUid(workspace)),
			);
			if (firstValidWorkspace) {
				setSelectedWorkspaceUid(getWorkspaceUid(firstValidWorkspace));
			}
		}
	}, [selectedWorkspaceUid, workspacesQuery.data]);

	useEffect(() => {
		if (selectedWorkspaceUid && !isValidWorkspaceUid(selectedWorkspaceUid)) {
			setSelectedWorkspaceUid(undefined);
			setIsEditing(false);
			toast.error(t("toast.workspace_uid_invalid"));
		}
	}, [selectedWorkspaceUid, t]);

	const workspaceQuery = useQuery({
		queryKey: ["chatWorkspace", currentInstance.host, selectedWorkspaceUid],
		queryFn: async () => {
			return await getChatWorkspace(currentInstance, selectedWorkspaceUid!);
		},
		enabled: !!selectedWorkspaceUid && isValidWorkspaceUid(selectedWorkspaceUid),
	});

	const settingsQuery = useQuery({
		queryKey: [
			"chatWorkspaceSettings",
			currentInstance.host,
			selectedWorkspaceUid,
		],
		queryFn: async () => {
			return await getChatWorkspaceSettings(
				currentInstance,
				selectedWorkspaceUid!,
			);
		},
		enabled: !!selectedWorkspaceUid && isValidWorkspaceUid(selectedWorkspaceUid),
	});

	useEffect(() => {
		if (settingsQuery.isSuccess && !isEditing) {
			setSettingsEditorData(JSON.stringify(settingsQuery.data, null, 2));
		}
	}, [isEditing, settingsQuery.data, settingsQuery.isSuccess]);

	useEffect(() => {
		if (workspaceQuery.isError) {
			toast.error(String(workspaceQuery.error));
		}
		if (settingsQuery.isError) {
			toast.error(String(settingsQuery.error));
		}
	}, [
		settingsQuery.error,
		settingsQuery.isError,
		workspaceQuery.error,
		workspaceQuery.isError,
	]);

	const refreshSelectedWorkspace = useCallback(async () => {
		await Promise.all([workspaceQuery.refetch(), settingsQuery.refetch()]);
	}, [settingsQuery, workspaceQuery]);

	const saveSettingsMutation = useMutation({
		mutationFn: async (settings: ChatWorkspaceSettings) => {
			return await updateChatWorkspaceSettings(
				currentInstance,
				selectedWorkspaceUid!,
				settings,
			);
		},
		onSuccess: async () => {
			toast.success(t("toast.settings_saved"));
			setIsEditing(false);
			await refreshSelectedWorkspace();
		},
		onError: (err) => {
			toast.error(String(err));
		},
	});

	const resetSettingsMutation = useMutation({
		mutationFn: async () => {
			return await resetChatWorkspaceSettings(
				currentInstance,
				selectedWorkspaceUid!,
			);
		},
		onSuccess: async () => {
			toast.success(t("toast.settings_reset"));
			setIsEditing(false);
			await refreshSelectedWorkspace();
		},
		onError: (err) => {
			toast.error(String(err));
		},
	});

	const deleteWorkspaceMutation = useMutation({
		mutationFn: async () => {
			return await deleteChatWorkspace(currentInstance, selectedWorkspaceUid!);
		},
		onSuccess: async () => {
			toast.success(t("toast.workspace_deleted"));
			setSelectedWorkspaceUid(undefined);
			setIsEditing(false);
			await workspacesQuery.refetch();
		},
		onError: (err) => {
			toast.error(String(err));
		},
	});

	const createWorkspaceMutation = useMutation({
		mutationFn: async ({
			uid,
			settings,
		}: {
			uid: string;
			settings: ChatWorkspaceSettings;
		}) => {
			return await updateChatWorkspaceSettings(currentInstance, uid, settings);
		},
		onSuccess: async (_settings, variables) => {
			toast.success(t("toast.workspace_created"));
			setCreateModalVisible(false);
			setCreateWorkspaceForm(createWorkspaceInitialForm);
			setSelectedWorkspaceUid(variables.uid);
			setIsEditing(false);
			await workspacesQuery.refetch();
		},
		onError: (err) => {
			toast.error(String(err));
		},
	});

	const onSaveSettings = useCallback(() => {
		let parsed: ChatWorkspaceSettings;
		try {
			parsed = removeSystemManagedChatFields(
				JSON.parse(settingsEditorData) as ChatWorkspaceSettings,
			);
		} catch (err) {
			toast.error(t("toast.invalid_json", { error: String(err) }));
			return;
		}
		saveSettingsMutation.mutate(parsed);
	}, [saveSettingsMutation, settingsEditorData, t]);

	const onCreateWorkspace = useCallback(() => {
		const uid = createWorkspaceForm.uid.trim();
		if (!uid) {
			toast.error(t("toast.workspace_uid_required"));
			return;
		}
		if (!isValidWorkspaceUid(uid)) {
			toast.error(t("toast.workspace_uid_invalid"));
			return;
		}
		createWorkspaceMutation.mutate({
			uid,
			settings: buildCreateWorkspaceSettings(createWorkspaceForm),
		});
	}, [createWorkspaceForm, createWorkspaceMutation, t]);

	const onResetSettings = useCallback(() => {
		if (!selectedWorkspaceUid) return;
		Modal.confirm({
			title: t("reset.confirm_title"),
			content: t("reset.confirm_content", { uid: selectedWorkspaceUid }),
			centered: true,
			okText: t("common:confirm"),
			cancelText: t("common:cancel"),
			onOk: () => resetSettingsMutation.mutate(),
		});
	}, [resetSettingsMutation, selectedWorkspaceUid, t]);

	const onDeleteWorkspace = useCallback(() => {
		if (!selectedWorkspaceUid) return;
		Modal.confirm({
			title: t("delete.confirm_title"),
			content: t("delete.confirm_content", { uid: selectedWorkspaceUid }),
			centered: true,
			okText: t("common:delete"),
			cancelText: t("common:cancel"),
			onOk: () => deleteWorkspaceMutation.mutate(),
		});
	}, [deleteWorkspaceMutation, selectedWorkspaceUid, t]);

	const selectedWorkspace = workspaceQuery.data;
	const isMutating =
		createWorkspaceMutation.isPending ||
		saveSettingsMutation.isPending ||
		resetSettingsMutation.isPending ||
		deleteWorkspaceMutation.isPending;

	return useMemo(
		() => (
			<div className="flex-1 max-h-fit overflow-hidden">
				<Modal
					visible={createModalVisible}
					title={t("create.title")}
					centered
					width={720}
					okText={t("common:create")}
					cancelText={t("common:cancel")}
					confirmLoading={createWorkspaceMutation.isPending}
					onOk={onCreateWorkspace}
					onCancel={() => setCreateModalVisible(false)}
				>
					<div className="flex max-h-[70vh] flex-col gap-4 overflow-auto pr-2">
						<label className="flex flex-col gap-1">
							<span>{t("create.uid")}</span>
							<Input
								autoFocus
								value={createWorkspaceForm.uid}
								placeholder={t("create.uid_placeholder")}
								onChange={(uid) => updateCreateWorkspaceForm({ uid })}
							/>
						</label>

						<div className="grid grid-cols-2 gap-3">
							<label className="flex flex-col gap-1">
								<span>{t("create.source")}</span>
								<Select
									value={
										createWorkspaceForm.source ?? CHAT_COMPLETION_SOURCE_NONE
									}
									onChange={(source) =>
										updateCreateWorkspaceForm({
											source:
												source === CHAT_COMPLETION_SOURCE_NONE
													? null
													: (source as ChatCompletionSource),
										})
									}
								>
									<Select.Option value={CHAT_COMPLETION_SOURCE_NONE}>
										{t("common:none")}
									</Select.Option>
									{CHAT_COMPLETION_SOURCES.map((source) => (
										<Select.Option value={source} key={source}>
											{source}
										</Select.Option>
									))}
								</Select>
							</label>
							<label className="flex flex-col gap-1">
								<span>{t("create.api_key")}</span>
								<Input
									mode="password"
									value={createWorkspaceForm.apiKey}
									placeholder={t("create.api_key_placeholder")}
									onChange={(apiKey) => updateCreateWorkspaceForm({ apiKey })}
								/>
							</label>
							<label className="flex flex-col gap-1">
								<span>{t("create.base_url")}</span>
								<Input
									value={createWorkspaceForm.baseUrl}
									placeholder={t("create.base_url_placeholder")}
									onChange={(baseUrl) => updateCreateWorkspaceForm({ baseUrl })}
								/>
							</label>
							<label className="flex flex-col gap-1">
								<span>{t("create.org_id")}</span>
								<Input
									value={createWorkspaceForm.orgId}
									placeholder={t("create.org_id_placeholder")}
									onChange={(orgId) => updateCreateWorkspaceForm({ orgId })}
								/>
							</label>
							<label className="flex flex-col gap-1">
								<span>{t("create.project_id")}</span>
								<Input
									value={createWorkspaceForm.projectId}
									placeholder={t("create.project_id_placeholder")}
									onChange={(projectId) =>
										updateCreateWorkspaceForm({ projectId })
									}
								/>
							</label>
							<label className="flex flex-col gap-1">
								<span>{t("create.api_version")}</span>
								<Input
									value={createWorkspaceForm.apiVersion}
									placeholder={t("create.api_version_placeholder")}
									onChange={(apiVersion) =>
										updateCreateWorkspaceForm({ apiVersion })
									}
								/>
							</label>
							<label className="flex flex-col gap-1">
								<span>{t("create.deployment_id")}</span>
								<Input
									value={createWorkspaceForm.deploymentId}
									placeholder={t("create.deployment_id_placeholder")}
									onChange={(deploymentId) =>
										updateCreateWorkspaceForm({ deploymentId })
									}
								/>
							</label>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<label className="col-span-2 flex flex-col gap-1">
								<span>{t("create.system_prompt")}</span>
								<TextArea
									autosize
									value={createWorkspaceForm.systemPrompt}
									placeholder={t("create.system_prompt_placeholder")}
									onChange={(systemPrompt) =>
										updateCreateWorkspaceForm({ systemPrompt })
									}
								/>
							</label>
						</div>
						<div className="text-xs text-amber-600">{t("api_key_notice")}</div>
					</div>
				</Modal>

				<main className="flex h-full flex-col">
					<div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-white px-4 py-3">
						<div className="mr-auto min-w-0">
							<div className="text-base font-semibold">
								{t("workspace_list")}
							</div>
							<div className="text-xs text-neutral-500">
								{t("workspace_count", {
									count:
										workspacesQuery.data?.total ??
										workspacesQuery.data?.results.length ??
										0,
								})}
							</div>
						</div>
						<Button
							size="sm"
							color="primary"
							variant="flat"
							onPress={() => setCreateModalVisible(true)}
						>
							<div className="i-lucide:plus h-4 w-4" />
							{t("common:create")}
						</Button>
						<Button
							size="sm"
							variant="light"
							onPress={() => workspacesQuery.refetch()}
							isLoading={workspacesQuery.isFetching}
						>
							<div className="i-lucide:refresh-cw h-4 w-4" />
							{t("common:refresh")}
						</Button>
					</div>

					<div className="grid min-h-0 flex-1 grid-cols-5 overflow-hidden">
						<aside className="col-span-1 overflow-auto border-r bg-white">
							<Skeleton loading={workspacesQuery.isLoading} active>
								{workspacesQuery.data?.results.length ? (
									<List
										dataSource={workspacesQuery.data.results}
										renderItem={(workspace) => {
											const uid = getWorkspaceUid(workspace);
											const selected = uid === selectedWorkspaceUid;
											const valid = isValidWorkspaceUid(uid);
											return (
												<List.Item
													className={`border-l-2 px-4 py-3 ${valid ? "cursor-pointer" : "cursor-not-allowed opacity-60"} ${selected ? "border-primary bg-primary-50" : "border-transparent"}`}
													onClick={() => {
														if (!valid) {
															toast.error(t("toast.workspace_uid_invalid"));
															return;
														}
														setSelectedWorkspaceUid(uid);
														setIsEditing(false);
													}}
												>
													<div className="flex min-w-0 flex-col gap-1">
														<span className="break-all text-sm font-medium">
															{uid}
														</span>
														{workspace.name && (
															<span className="break-all text-xs text-neutral-500">
																{workspace.name}
															</span>
														)}
													</div>
												</List.Item>
											);
										}}
									/>
								) : (
									<div className="p-6">
										<Empty description={t("empty")} />
									</div>
								)}
							</Skeleton>
						</aside>

						<section className="col-span-4 min-w-0 overflow-hidden bg-white">
							{selectedWorkspaceUid ? (
								<div className="flex h-full flex-col overflow-hidden">
									<div className="flex items-start gap-4 border-b px-4 py-3">
										<div className="mr-auto min-w-0">
											<div className="break-all text-base font-semibold">
												{selectedWorkspaceUid}
											</div>
											{selectedWorkspace?.name && (
												<div className="break-all text-xs text-neutral-500">
													{selectedWorkspace.name}
												</div>
											)}
											<Descriptions
												align="left"
												size="small"
												data={[
													{
														key: "UID",
														value:
															selectedWorkspace?.uid || selectedWorkspaceUid,
													},
												]}
											/>
										</div>
										{!isEditing ? (
											<Button
												size="sm"
												color="primary"
												variant="flat"
												onPress={() => setIsEditing(true)}
												isLoading={settingsQuery.isFetching}
											>
												<div className="i-lucide:pencil h-4 w-4" />
												{t("common:edit")}
											</Button>
										) : (
											<>
												<Button
													size="sm"
													color="success"
													variant="flat"
													onPress={onSaveSettings}
													isLoading={saveSettingsMutation.isPending}
												>
													<div className="i-lucide:save h-4 w-4" />
													{t("common:save")}
												</Button>
												<Button
													size="sm"
													variant="flat"
													onPress={() => {
														setIsEditing(false);
														setSettingsEditorData(
															JSON.stringify(settingsQuery.data ?? {}, null, 2),
														);
													}}
													isDisabled={isMutating}
												>
													<div className="i-lucide:x h-4 w-4" />
													{t("common:cancel")}
												</Button>
											</>
										)}
										<Button
											size="sm"
											color="warning"
											variant="flat"
											onPress={onResetSettings}
											isLoading={resetSettingsMutation.isPending}
										>
											<div className="i-lucide:rotate-ccw h-4 w-4" />
											{t("reset.button")}
										</Button>
										<Button
											size="sm"
											color="danger"
											variant="flat"
											onPress={onDeleteWorkspace}
											isLoading={deleteWorkspaceMutation.isPending}
										>
											<div className="i-lucide:trash-2 h-4 w-4" />
											{t("common:delete")}
										</Button>
									</div>

									<div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
										<div className="flex items-center">
											<div className="text-sm font-semibold">
												{t("settings")}
											</div>
										</div>
										<div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
											{t("api_key_notice")}
										</div>
										<JsonEditor
											className={`min-h-0 flex-1 overflow-hidden ${!isEditing ? "opacity-60" : ""}`}
											value={settingsEditorData}
											readonly={!isEditing}
											onChange={setSettingsEditorData}
										/>
									</div>
								</div>
							) : (
								<div className="flex h-full items-center justify-center">
									<Empty description={t("empty")} />
								</div>
							)}
						</section>
					</div>
				</main>
			</div>
		),
		[
			createModalVisible,
			createWorkspaceMutation.isPending,
			createWorkspaceForm,
			deleteWorkspaceMutation.isPending,
			isEditing,
			isMutating,
			onCreateWorkspace,
			onDeleteWorkspace,
			onResetSettings,
			onSaveSettings,
			resetSettingsMutation.isPending,
			saveSettingsMutation.isPending,
			selectedWorkspace,
			selectedWorkspaceUid,
			settingsEditorData,
			settingsQuery.data,
			settingsQuery.isFetching,
			t,
			updateCreateWorkspaceForm,
			workspacesQuery,
		],
	);
};

export const Route = createFileRoute("/ins/$insID/_layout/chats")({
	component: Page,
	pendingComponent: LoaderPage,
});
