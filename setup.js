#!/usr/bin/env node

// Symlink this repo's Kiro config into ~/.kiro/.
// Each of agents/, steering/, hooks/ is linked as a whole directory. Individual
// files listed in FILES (e.g. settings/cli.json) are linked one file at a time
// because they live inside a directory that also holds Kiro's own runtime data
// (settings/, sessions/, extensions/, ...), which must never be touched.
//
// Skills are no longer managed here — they live in the my-agent-skills repo
// and are installed via `npx skills` into ~/.kiro/skills/.
//
// Usage: node setup.js

import {
	existsSync,
	lstatSync,
	mkdirSync,
	readlinkSync,
	symlinkSync,
	unlinkSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const home = process.env.HOME;

const TARGET = resolve(home, ".kiro");
const DIRS = ["agents", "steering", "hooks"];
// Individual files to symlink. Unlike DIRS, these live inside a directory that
// holds Kiro runtime data (e.g. settings/), so we link the single file rather
// than the whole directory to avoid clobbering that data.
const FILES = ["settings/cli.json"];

function ensureTarget() {
	if (!existsSync(TARGET)) {
		mkdirSync(TARGET, { recursive: true });
		console.log(`  created ${TARGET}`);
	}
}

// Returns: { linked: number, skipped: number }
function linkDir(name) {
	const src = resolve(__dirname, name);
	const dest = resolve(TARGET, name);

	if (!existsSync(src)) {
		console.error(`  ✗ ${name}: source missing in repo (${src})`);
		return { linked: 0, skipped: 1 };
	}

	let current;
	try {
		current = lstatSync(dest);
	} catch {
		// dest doesn't exist — safe to create
	}

	if (current) {
		if (!current.isSymbolicLink()) {
			// Refuse to clobber a real directory/file — could be Kiro runtime data.
			console.error(
				`  ✗ ${name}: ${dest} exists and is NOT a symlink — refusing to overwrite. Move it aside manually.`,
			);
			return { linked: 0, skipped: 1 };
		}
		// Existing symlink (likely pointing at an old location) — safe to replace.
		const previous = readlinkSync(dest);
		unlinkSync(dest);
		if (previous !== src) {
			console.log(`  ↻ ${name}: was -> ${previous}`);
		}
	}

	try {
		symlinkSync(src, dest);
		console.log(`  ✓ ${name} -> ${src}`);
		return { linked: 1, skipped: 0 };
	} catch (err) {
		console.error(`  ✗ ${name}: ${err.message}`);
		return { linked: 0, skipped: 1 };
	}
}

// Returns: { linked: number, skipped: number }
function linkFile(name) {
	const src = resolve(__dirname, name);
	const dest = resolve(TARGET, name);

	if (!existsSync(src)) {
		console.error(`  ✗ ${name}: source missing in repo (${src})`);
		return { linked: 0, skipped: 1 };
	}

	// Ensure the parent directory (e.g. ~/.kiro/settings) exists.
	mkdirSync(dirname(dest), { recursive: true });

	let current;
	try {
		current = lstatSync(dest);
	} catch {
		// dest doesn't exist — safe to create
	}

	if (current) {
		if (!current.isSymbolicLink()) {
			// Refuse to clobber a real file — could be Kiro runtime data.
			console.error(
				`  ✗ ${name}: ${dest} exists and is NOT a symlink — refusing to overwrite. Move it aside manually.`,
			);
			return { linked: 0, skipped: 1 };
		}
		const previous = readlinkSync(dest);
		unlinkSync(dest);
		if (previous !== src) {
			console.log(`  ↻ ${name}: was -> ${previous}`);
		}
	}

	try {
		symlinkSync(src, dest);
		console.log(`  ✓ ${name} -> ${src}`);
		return { linked: 1, skipped: 0 };
	} catch (err) {
		console.error(`  ✗ ${name}: ${err.message}`);
		return { linked: 0, skipped: 1 };
	}
}

function main() {
	console.log(`Linking Kiro config into ${TARGET}`);
	ensureTarget();

	let linked = 0;
	let skipped = 0;
	for (const name of DIRS) {
		const result = linkDir(name);
		linked += result.linked;
		skipped += result.skipped;
	}
	for (const name of FILES) {
		const result = linkFile(name);
		linked += result.linked;
		skipped += result.skipped;
	}

	const parts = [`✓ ${linked} linked`];
	if (skipped > 0) parts.push(`✗ ${skipped} skipped`);
	console.log(`\n${parts.join(", ")}`);

	if (skipped > 0) process.exit(1);
}

main();
