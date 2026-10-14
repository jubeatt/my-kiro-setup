#!/usr/bin/env node

// Symlink this repo's Kiro config into ~/.kiro/.
// Each of agents/, steering/, hooks/ is linked as a whole directory.
// Settings and Kiro runtime data are managed directly in ~/.kiro/.
//
// If a target already exists as a real file/directory,
// it is renamed to `<name>.bak-<timestamp>`
// before linking, so nothing is ever deleted.
//
// Skills live in the my-agent-skills repo
// and are installed via `npx skills` into ~/.kiro/skills/.
//
// Usage: node setup.js

import {
	existsSync,
	lstatSync,
	mkdirSync,
	readlinkSync,
	renameSync,
	symlinkSync,
	unlinkSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const home = process.env.HOME;

const TARGET = resolve(home, ".kiro");
const DIRS = ["agents", "steering", "hooks"];

// Timestamp suffix for backups, e.g. 20251014-112300.
function timestamp() {
	const d = new Date();
	const pad = (n) => String(n).padStart(2, "0");
	return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

// Links ~/.kiro/<name> -> <repo>/<name>.
// Returns: { linked: number, skipped: number }
function link(name) {
	const src = resolve(__dirname, name);
	const dest = resolve(TARGET, name);

	if (!existsSync(src)) {
		console.error(`  ✗ ${name}: source missing in repo (${src})`);
		return { linked: 0, skipped: 1 };
	}

	// Ensure the parent directory exists.
	mkdirSync(dirname(dest), { recursive: true });

	let current;
	try {
		current = lstatSync(dest);
	} catch {
		// dest doesn't exist — safe to create
	}

	try {
		if (current?.isSymbolicLink()) {
			// Existing symlink (possibly pointing at an old location) — replace it.
			const previous = readlinkSync(dest);
			unlinkSync(dest);
			if (previous !== src) {
				console.log(`  ↻ ${name}: was -> ${previous}`);
			}
		} else if (current) {
			// Real file/directory — move it aside instead of deleting it.
			const backup = `${dest}.bak-${timestamp()}`;
			renameSync(dest, backup);
			console.log(`  ⚠ ${name}: existing ${dest} backed up to ${backup}`);
		}

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
	if (!existsSync(TARGET)) {
		mkdirSync(TARGET, { recursive: true });
		console.log(`  created ${TARGET}`);
	}

	let linked = 0;
	let skipped = 0;
	for (const name of DIRS) {
		const result = link(name);
		linked += result.linked;
		skipped += result.skipped;
	}

	const parts = [`✓ ${linked} linked`];
	if (skipped > 0) parts.push(`✗ ${skipped} skipped`);
	console.log(`\n${parts.join(", ")}`);

	if (skipped > 0) process.exit(1);
}

main();
