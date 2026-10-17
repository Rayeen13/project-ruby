# Prismy / Ruby ametrine favicon

The favicon is an AI-polished adaptation of the ametrine gemstone image supplied by the project owner on 2026-10-17 UTC. It preserves the triangular purple/gold gem identity while removing the rectangular background, stray mark and oval shadow. This records provenance, not a warranty of exclusive rights in the supplied reference.

Assets: `dist/branding/ametrine-icon-512.png` is the square transparent master; `ametrine-icon-32.png` is the browser PNG. `dist/favicon.ico` contains 16/32/48-pixel images; `dist/apple-touch-icon.png` is 180 pixels. HTML references include an explicit cache revision. This change does not replace the native Windows executable/installer icon.

Method: built-in image editor followed by deterministic ImageMagick resizing/format conversion. Transparent alpha was preserved. The 32-pixel result was visually inspected on a dark background; actual browser-tab rendering was not inspected in this environment.

Final editing prompt:

> Edit target: attached ametrine gemstone image. Create a polished transparent favicon master for Prismy Studio / Project Ruby. Preserve its distinctive triangular rounded trillion-cut silhouette and violet-purple / warm golden-orange ametrine colors. Remove the entire dark rectangular backdrop, white canvas, bottom stray purple mark and black oval shadow. Refine the gem into a crisp recognizable jewel with fewer broader luminous facets, avoiding tangled noisy hairlike streaks, readable even at 16px. Single centered upright jewel fills 88% of a square canvas, balanced margins, no text, no extra objects, no enclosing square or badge. Actual alpha transparency surrounding the jewel.
