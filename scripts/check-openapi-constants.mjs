import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const openapiPath = path.join(rootDir, "openapi", "meilisearch-openapi.json");
const generatedPath = path.join(
	rootDir,
	"src",
	"generated",
	"meilisearch-openapi-constants.ts",
);

const spec = JSON.parse(readFileSync(openapiPath, "utf8"));
const generated = readFileSync(generatedPath, "utf8");

const getEnum = (schemaName) => {
	const schema = spec.components?.schemas?.[schemaName];
	if (!Array.isArray(schema?.enum)) {
		throw new Error(`Missing enum schema: ${schemaName}`);
	}
	return schema.enum;
};

const extractArray = (constantName) => {
	const match = generated.match(
		new RegExp(`export const ${constantName} = (\\[[\\s\\S]*?\\]) as const;`),
	);
	if (!match) {
		throw new Error(`Missing generated constant: ${constantName}`);
	}
	return JSON.parse(match[1]);
};

const assertSame = (name, expected, actual) => {
	const expectedJson = JSON.stringify(expected);
	const actualJson = JSON.stringify(actual);
	if (expectedJson !== actualJson) {
		throw new Error(
			`${name} is out of date. Run scripts/generate-openapi-constants.mjs.`,
		);
	}
};

assertSame(
	"MEILISEARCH_ACTIONS",
	getEnum("Action"),
	extractArray("MEILISEARCH_ACTIONS"),
);
assertSame(
	"CHAT_COMPLETION_SOURCES",
	getEnum("ChatCompletionSource"),
	extractArray("CHAT_COMPLETION_SOURCES"),
);

console.log("OpenAPI generated constants are up to date.");
