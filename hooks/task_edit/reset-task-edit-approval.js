#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

function parsePayload(input) {
	try {
		return JSON.parse(input || "{}");
	} catch (_err) {
		return {};
	}
}

const payload = parsePayload(fs.readFileSync(0, "utf8"));
const cwd = payload.cwd || process.cwd();
const planRoot = path.join(cwd, ".plan");

if (!fs.existsSync(planRoot)) {
	process.exit(0);
}

// Reset every .plan/<folder>/task-edit-approved back to false at end of turn,
// so an approval is valid only for the turn it was granted in.
for (const entry of fs.readdirSync(planRoot)) {
	const folder = path.join(planRoot, entry);
	if (!fs.statSync(folder).isDirectory()) continue;

	const approvalFile = path.join(folder, "task-edit-approved");
	if (!fs.existsSync(approvalFile)) continue;

	const value = fs.readFileSync(approvalFile, "utf8").trim().toLowerCase();
	if (value !== "false") {
		fs.writeFileSync(approvalFile, "false\n");
	}
}

process.exit(0);
