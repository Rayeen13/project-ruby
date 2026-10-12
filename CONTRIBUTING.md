# Contributing to Project Ruby

Use lowercase kebab-case branch names, such as `fix/robot-wave` or `feat/new-character`. Use Conventional Commits: `feat(scope):`, `fix(scope):`, `docs:`, `test:`, `refactor:`, `chore:`. Keep commits focused and use imperative descriptions.

Run `npm test` and inspect the affected character in a browser before describing a visual issue as fixed. Test rest, wave, dance, expressions, orbit views and character switching. Geometry assertions alone cannot establish visual quality.

New bodies require a unique catalog ID, semantic animation capabilities and a printable static export. Preserve existing catalog entries. Keep OS/AI/network operations outside the character geometry and animation modules. Follow docs/PLATFORMS.md.

Project licence: GPL-2.0-only. Preserve third-party MIT notices in dist/vendor.

## Branch and release flow

`main` holds accepted stable work. After the initial visual-MVP bootstrap, implement changes on focused `feat/<topic>`, `fix/<topic>` or `docs/<topic>` branches. Use a pull request with the problem, resulting behaviour and relevant validation. Merge tested work through the PR flow rather than pushing unfinished features onto main. Never force-push main.

Use `release/vX.Y.Z` when several features require final integration and release checks. Merge a stable release into `main` only after its acceptance checks pass, then create a matching `vX.Y.Z` tag and release notes. The visual prototype baseline is not a claim that conversation, desktop automation or native mobile hosts work. A tag alone does not make a release stable.

Keep fixes focused and use Conventional Commits. Record known limitations in release notes. Do not silently bypass failing checks. Branch protection is a repository setting and must be verified separately; these written conventions do not enable it automatically.
