import type { FC } from "react";
import { useTranslation } from "react-i18next";

export const TaskTotal: FC<{
	total?: number;
}> = ({ total }) => {
	const { t } = useTranslation("task");

	if (total === undefined) {
		return null;
	}

	return (
		<div className="px-4 py-1 text-sm text-gray-600">
			{t("total", { count: total })}
		</div>
	);
};
