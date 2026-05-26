import { JsonEditor } from "@/components/common/JsonEditor";
import { LoaderPage } from "@/components/common/Loader";
import { useCurrentInstance } from "@/hooks/useCurrentInstance";
import { hiddenRequestLoader, showRequestLoader } from "@/lib/loader";
import {
	getExperimentalFeatures,
	type RuntimeTogglableFeatures,
	updateExperimentalFeatures,
} from "@/lib/meilisearch-rest";
import { toast } from "@/lib/toast";
import { Empty, Skeleton, Switch, Tag } from "@douyinfe/semi-ui";
import { Button } from "@nextui-org/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const FEATURE_KEYS = [
	"metrics",
	"logsRoute",
	"editDocumentsByFunction",
	"containsFilter",
	"dynamicSearchRules",
	"network",
	"getTaskDocumentsRoute",
	"taskQueueCompactionRoute",
	"compositeEmbedders",
	"chatCompletions",
	"multimodal",
	"foreignKeys",
] as const satisfies readonly (keyof RuntimeTogglableFeatures)[];

const normalizeFeatures = (
	features: RuntimeTogglableFeatures = {},
): RuntimeTogglableFeatures =>
	FEATURE_KEYS.reduce<RuntimeTogglableFeatures>((acc, key) => {
		acc[key] = features[key] === true;
		return acc;
	}, {});

const Page = () => {
	const { t } = useTranslation("experimentalFeature");
	const currentInstance = useCurrentInstance();
	const [draft, setDraft] = useState<RuntimeTogglableFeatures>({});

	const featuresQuery = useQuery({
		queryKey: ["experimentalFeatures", currentInstance.host],
		queryFn: async () => {
			showRequestLoader();
			return await getExperimentalFeatures(currentInstance);
		},
	});

	useEffect(() => {
		if (featuresQuery.isSuccess) {
			setDraft(normalizeFeatures(featuresQuery.data));
		}
	}, [featuresQuery.data, featuresQuery.isSuccess]);

	useEffect(() => {
		if (featuresQuery.isError) {
			toast.error(String(featuresQuery.error));
		}
		if (!featuresQuery.isFetching) {
			hiddenRequestLoader();
		}
	}, [
		featuresQuery.error,
		featuresQuery.isError,
		featuresQuery.isFetching,
	]);

	const updateMutation = useMutation({
		mutationFn: async (features: RuntimeTogglableFeatures) => {
			return await updateExperimentalFeatures(currentInstance, features);
		},
		onSuccess: async (features) => {
			toast.success(t("toast.saved"));
			setDraft(normalizeFeatures(features));
			await featuresQuery.refetch();
		},
		onError: (err) => {
			toast.error(String(err));
		},
	});

	const hasChanges = useMemo(() => {
		const current = normalizeFeatures(featuresQuery.data);
		return FEATURE_KEYS.some(
			(key) =>
				featuresQuery.data &&
				Object.prototype.hasOwnProperty.call(featuresQuery.data, key) &&
				current[key] !== draft[key],
		);
	}, [draft, featuresQuery.data]);

	const featureList = useMemo(
		() =>
			FEATURE_KEYS.filter(
				(key) =>
					featuresQuery.data &&
					Object.prototype.hasOwnProperty.call(featuresQuery.data, key),
			),
		[featuresQuery.data],
	);

	const patchPayload = useMemo(
		() =>
			featureList.reduce<RuntimeTogglableFeatures>((acc, key) => {
				acc[key] = draft[key] === true;
				return acc;
			}, {}),
		[draft, featureList],
	);

	return (
		<div className="flex-1 max-h-fit overflow-hidden">
			<main className="flex h-full flex-col">
				<div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-white px-4 py-3">
					<div className="mr-auto min-w-0">
						<div className="text-base font-semibold">{t("title")}</div>
						<div className="text-xs text-neutral-500">{t("subtitle")}</div>
					</div>
					<Button
						size="sm"
						variant="light"
						onPress={() => featuresQuery.refetch()}
						isLoading={featuresQuery.isFetching}
					>
						<div className="i-lucide:refresh-cw h-4 w-4" />
						{t("common:refresh")}
					</Button>
					<Button
						size="sm"
						color="primary"
						variant="flat"
						onPress={() => updateMutation.mutate(patchPayload)}
						isLoading={updateMutation.isPending}
						isDisabled={!hasChanges}
					>
						<div className="i-lucide:save h-4 w-4" />
						{t("save")}
					</Button>
				</div>

				<Skeleton loading={featuresQuery.isLoading} active>
					{featureList.length ? (
						<div className="grid min-h-0 flex-1 grid-cols-5 overflow-hidden bg-white">
							<section className="col-span-3 overflow-auto border-r">
								{featureList.map((key) => (
									<div
										className="flex items-center gap-4 border-b px-4 py-3"
										key={key}
									>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<div className="text-sm font-medium">
													{t(`features.${key}.label`)}
												</div>
												<Tag color={draft[key] ? "green" : "grey"}>
													{draft[key]
														? t("common:enable")
														: t("common:disable")}
												</Tag>
											</div>
											<div className="mt-1 text-xs text-neutral-500">
												{t(`features.${key}.description`)}
											</div>
										</div>
										<Switch
											checked={draft[key] === true}
											onChange={(checked) => {
												setDraft((prev) => ({
													...prev,
													[key]: checked,
												}));
											}}
										/>
									</div>
								))}
							</section>
							<aside className="col-span-2 flex min-w-0 flex-col gap-3 p-4">
								<div className="text-sm font-semibold">
									{t("json_preview")}
								</div>
								<JsonEditor
									className="min-h-0 flex-1 overflow-hidden opacity-60"
									value={JSON.stringify(draft, null, 2)}
									readonly
									onChange={() => undefined}
								/>
							</aside>
						</div>
					) : (
						<div className="flex flex-1 items-center justify-center">
							<Empty description={t("empty")} />
						</div>
					)}
				</Skeleton>
			</main>
		</div>
	);
};

export const Route = createFileRoute(
	"/ins/$insID/_layout/experimental-features",
)({
	component: Page,
	pendingComponent: LoaderPage,
});
