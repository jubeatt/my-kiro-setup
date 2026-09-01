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

function normalizePath(value) {
	const absolute = path.resolve(value);
	const parts = absolute.split(path.sep);
	for (let i = parts.length; i > 0; i -= 1) {
		const existing = parts.slice(0, i).join(path.sep) || path.sep;
		if (!fs.existsSync(existing)) continue;
		const rest = parts.slice(i);
		return path.normalize(path.join(fs.realpathSync.native(existing), ...rest));
	}
	return path.normalize(absolute);
}

function allow() {
	process.exit(0);
}

function block(message) {
	console.error(message);
	process.exit(2);
}

const payload = parsePayload(fs.readFileSync(0, "utf8"));
const input = payload.tool_input || {};
// fs_write uses `path`; the code tool (pattern_rewrite) uses `file_path`.
const requestedPath = input.path || input.file_path;
const cwd = payload.cwd || process.cwd();

if (typeof requestedPath !== "string" || requestedPath.length === 0) {
	allow();
}

const absolutePath = path.isAbsolute(requestedPath)
	? normalizePath(requestedPath)
	: normalizePath(path.join(cwd, requestedPath));

const planRoot = normalizePath(path.join(cwd, ".plan"));
const relative = path.relative(planRoot, absolutePath);
const parts = relative.split(path.sep);

// Only guard .plan/<folder>/task.md (exactly two levels under .plan).
const isTaskFile =
	relative.length > 0 &&
	!relative.startsWith("..") &&
	!path.isAbsolute(relative) &&
	parts.length === 2 &&
	parts[1] === "task.md";

if (!isTaskFile) {
	allow();
}

const approvalFile = path.join(
	path.dirname(absolutePath),
	"task-edit-approved",
);

// No control file = no restriction.
if (!fs.existsSync(approvalFile)) {
	allow();
}

const value = fs.readFileSync(approvalFile, "utf8").trim().toLowerCase();
if (value === "true") {
	allow();
}

const approvalRelative = path.join(
	".plan",
	path.dirname(relative),
	"task-edit-approved",
);
block(
	`BLOCKED: editing ${relative} requires human approval.\n` +
		`Set ${approvalRelative} to "true" to allow this edit ` +
		`(this file is human-controlled and cannot be written by the agent).\n` +
		`Current value: "${value || "(empty)"}".`,
);
