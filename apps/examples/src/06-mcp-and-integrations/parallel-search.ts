import path from "node:path";
import dotenv from "dotenv";
import { DEFAULT_MODEL_STABLE } from "../config";
import { answerWithParallelSearch } from "./parallel-search-agent";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const question = process.argv.slice(2).join(" ").trim();
if (!question) {
	console.error('Usage: pnpm parallel-search "Your research question"');
	process.exitCode = 1;
} else {
	answerWithParallelSearch(
		question,
		process.env.LLM_MODEL || DEFAULT_MODEL_STABLE,
	)
		.then((answer) => console.log(answer))
		.catch((error: unknown) => {
			console.error(error);
			process.exitCode = 1;
		});
}
