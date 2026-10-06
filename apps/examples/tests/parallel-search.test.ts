import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { BaseLlm, type LlmRequest, LlmResponse } from "@iqai/adk";
import {
	answerWithParallelSearch,
	createParallelSearchToolset,
} from "../src/06-mcp-and-integrations/parallel-search-agent";

class ResearchFixture extends BaseLlm {
	private step = 0;

	constructor() {
		super("research-fixture");
	}

	protected async *generateContentAsyncImpl(request: LlmRequest) {
		assert.deepEqual(Object.keys(request.toolsDict).sort(), [
			"web_fetch",
			"web_search",
		]);
		const responses = request.contents.flatMap((content) =>
			(content.parts || []).flatMap((part) =>
				part.functionResponse ? [part.functionResponse] : [],
			),
		);
		const sessionId = request
			.getSystemInstructionText()
			.match(/session_id "([^"]+)"/)?.[1];
		assert.ok(sessionId);
		const call = this.step++;
		if (call < 2) {
			if (call === 1) {
				assert.match(JSON.stringify(responses), /Documentation found/);
			}
			yield new LlmResponse({
				content: {
					role: "model",
					parts: [
						{
							functionCall: {
								name: call === 0 ? "web_search" : "web_fetch",
								args: {
									objective: "Find MCP transport documentation",
									...(call === 0
										? { search_queries: ["MCP transport documentation"] }
										: { urls: ["https://example.com/mcp"] }),
									session_id: sessionId,
									model_name: this.model,
								},
							},
						},
					],
				},
			});
		} else {
			assert.match(JSON.stringify(responses), /Streamable HTTP/);
			const fetched = responses.find(
				(response) => response.name === "web_fetch",
			);
			const text = (fetched?.response?.content as { text: string }[])[0].text;
			yield new LlmResponse({
				content: { role: "model", parts: [{ text }] },
				turnComplete: true,
			});
		}
	}
}

test("remote MCP tools run through the research agent and close the connection", async () => {
	const observed: {
		method: string;
		rpc?: string;
		params?: any;
		headers: Record<string, unknown>;
	}[] = [];
	const server = createServer(async (req, res) => {
		let body = "";
		for await (const chunk of req) body += chunk;
		const message = body ? JSON.parse(body) : {};
		observed.push({
			method: req.method || "",
			rpc: message.method,
			params: message.params,
			headers: req.headers,
		});
		if (req.method === "GET") {
			res.writeHead(405).end();
			return;
		}
		if (req.method === "DELETE" || message.id === undefined) {
			res.writeHead(202).end();
			return;
		}
		let result: unknown;
		if (message.method === "initialize") {
			res.setHeader("mcp-session-id", "fixture-session");
			result = {
				protocolVersion: "2024-11-05",
				capabilities: { tools: {} },
				serverInfo: { name: "parallel-fixture", version: "1" },
			};
		} else if (message.method === "tools/list") {
			result = {
				tools: ["web_search", "web_fetch", "unrelated_tool"].map((name) => ({
					name,
					description: name,
					inputSchema: { type: "object", properties: {} },
				})),
			};
		} else if (message.method === "tools/call") {
			result = {
				content: [
					{
						type: "text",
						text:
							message.params.name === "web_search"
								? "Documentation found: https://example.com/mcp"
								: "MCP supports Streamable HTTP. Source: https://example.com/mcp",
					},
				],
			};
		}
		res.setHeader("Content-Type", "application/json");
		res.end(JSON.stringify({ jsonrpc: "2.0", id: message.id, result }));
	});
	await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
	const address = server.address();
	assert.ok(address && typeof address !== "string");
	try {
		const toolset = createParallelSearchToolset(
			`http://127.0.0.1:${address.port}/mcp`,
		);
		const clientService = await toolset.initialize();
		const answer = await answerWithParallelSearch(
			"Which transport does MCP support?",
			new ResearchFixture(),
			toolset,
		);
		assert.match(answer, /Streamable HTTP.*https:\/\/example.com\/mcp/);
		const calls = observed.filter((request) => request.rpc === "tools/call");
		assert.deepEqual(
			calls.map((request) => request.params.name),
			["web_search", "web_fetch"],
		);
		assert.equal(
			calls[0].params.arguments.session_id,
			calls[1].params.arguments.session_id,
		);
		for (const request of observed) {
			assert.equal(
				request.headers["user-agent"],
				"adk-ts/parallel-search-example",
			);
			assert.equal(request.headers.authorization, undefined);
		}
		assert.ok(observed.some((request) => request.rpc === "tools/list"));
		assert.equal(clientService.isConnected(), false);
		console.log(`Fixture answer: ${answer}`);

		class FailedResearch extends BaseLlm {
			protected async *generateContentAsyncImpl() {
				yield new LlmResponse({ partial: true });
				throw new Error("Research failed");
			}
		}
		const failureToolset = createParallelSearchToolset(
			`http://127.0.0.1:${address.port}/mcp`,
		);
		const failureClient = await failureToolset.initialize();
		await assert.rejects(
			answerWithParallelSearch(
				"Research MCP",
				new FailedResearch("failure-fixture"),
				failureToolset,
			),
			/Research failed/,
		);
		assert.equal(failureClient.isConnected(), false);
		console.log(`MCP request evidence: ${JSON.stringify(observed)}`);
	} finally {
		server.closeAllConnections();
		await new Promise<void>((resolve) => server.close(() => resolve()));
	}
});

test("closes the toolset when discovery fails", async () => {
	const toolset = createParallelSearchToolset();
	let closed = false;
	toolset.getTools = async () => {
		throw new Error("Discovery failed");
	};
	toolset.close = async () => {
		closed = true;
	};
	await assert.rejects(
		answerWithParallelSearch("Research MCP", new ResearchFixture(), toolset),
		/Discovery failed/,
	);
	assert.equal(closed, true);
});
