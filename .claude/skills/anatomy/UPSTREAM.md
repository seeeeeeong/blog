# Upstream

| Field | Value |
|---|---|
| Name | Anatomy |
| URL | https://github.com/wheresryan22/anatomy |
| Version | v1.1.0 and 53 commits (unreleased) |
| Revision | 1482e8469b0a9e0d8cc18ea2740a01423d29ae80 |
| Date | 2026-10-18 |
| License | MIT |
| License File | LICENSE |
| Update Mechanism | Manual |
| Shipped | The skill: no. Its React kit, copied to `web/src/features/widgets/iso/`: yes |

## What it is

A Claude Code skill that builds interactive isometric SVG figures from a pure model of the idea. The blog uses it at dev time to draw a post's figures; the server never runs it.

## Local modifications

Files are byte-for-byte upstream. Left out of this folder:

- `scripts/publish.mjs`, `scripts/session.mjs`, `scripts/fingerprint.mjs` and `references/publish.md`: they read Claude Code session logs and push to the community gallery with `gh`. `SKILL.md` still names `references/publish.md`; the blog never publishes there.
- `scripts/*.test.mjs`, `tests/`, `evals/`, `agents/`, `.github/`, and the README, changelog and contributing files.
- Six of the nine examples (arcade-cabinet, desk-computer, push-button, raptor-engine, ripple-tank, turning-dial; about 24MB). `SKILL.md` still mentions them; read them upstream at https://github.com/wheresryan22/anatomy/tree/1482e8469b0a9e0d8cc18ea2740a01423d29ae80/examples

In `web/src/features/widgets/iso/`, `iso-kit.ts` starts with `// @ts-nocheck`, since the web project type-checks with `noUncheckedIndexedAccess`. `upstream.json` there records each file's source and hash, and a test checks them.

## Updating

1. Review what changed before copying anything, since the scripts start Chrome:
   `gh api repos/wheresryan22/anatomy/compare/<old>...<new>`, reading `kit/`, `scripts/` and `SKILL.md`.
2. Fetch the new revision into a new, empty directory outside the repo, without running anything in it.
3. Replace this folder with the same subset, copy the four kit files to `web/src/features/widgets/iso/`, and add the `// @ts-nocheck` line again.
4. Update this file and `upstream.json`, then run `pnpm check` in `web/` and capture each figure at 1440 and 390 pixels.
