#!/usr/bin/env node

// Symlink this repo's Kiro config directories into ~/.kiro/.
// Each of agents/, skills/, steering/, hooks/ is linked individually so that
// Kiro's own runtime data in ~/.kiro (settings/, sessions/, extensions/, ...)
// is never touched.
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
const DIRS = ["agents", "skills", "steering", "hooks"];

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

	const parts = [`✓ ${linked} linked`];
	if (skipped > 0) parts.push(`✗ ${skipped} skipped`);
	console.log(`\n${parts.join(", ")}`);

	if (skipped > 0) process.exit(1);
}

main();
