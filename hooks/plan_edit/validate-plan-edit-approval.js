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

const CONTROL_FILE = "plan-edit-approved";

const planRoot = normalizePath(path.join(cwd, ".plan"));
const relative = path.relative(planRoot, absolutePath);
const parts = relative.split(path.sep);

// Guard every file inside a plan folder: .plan/<slug>/... (at any depth).
const insidePlanFolder =
	relative.length > 0 &&
	!relative.startsWith("..") &&
	!path.isAbsolute(relative) &&
	parts.length >= 2;

if (!insidePlanFolder) {
	allow();
}

const slug = parts[0];

// The control file itself is guarded by the agent's deniedPaths, not here.
if (parts.length === 2 && parts[1] === CONTROL_FILE) {
	allow();
}

const approvalFile = path.join(planRoot, slug, CONTROL_FILE);

// No control file = no restriction.
if (!fs.existsSync(approvalFile)) {
	allow();
}

const value = fs.readFileSync(approvalFile, "utf8").trim().toLowerCase();
if (value === "true") {
	allow();
}

const approvalRelative = path.join(".plan", slug, CONTROL_FILE);
block(
	`BLOCKED: editing ${relative} requires human approval.\n` +
		`Everything under .plan/${slug}/ is locked. ` +
		`Set ${approvalRelative} to "true" to allow this edit ` +
		`(this file is human-controlled and cannot be written by the agent).\n` +
		`Current value: "${value || "(empty)"}".`,
);
