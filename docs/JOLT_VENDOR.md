# JoltPhysics.js vendor provenance

Package: jolt-physics 1.1.0 (npm), upstream https://github.com/jrouwe/JoltPhysics.js/tree/1.1.0

Licence: MIT, reproduced unchanged in dist/vendor/JOLT-LICENSE.txt.

Runtime: dist/vendor/jolt-physics.wasm-compat.js, copied unchanged from the package's dist directory. SHA-256: 011233a5fff762d6f0f5b50726b315246bf68cb182f0a10024559d04f4c257de

This single-threaded WebAssembly bundle embeds its WASM data; it adds no service or external runtime download. The application wrapper lazy-loads it for garment physics. Source and upstream build instructions remain available at the linked project. Native CSP permits wasm-unsafe-eval for WebAssembly compilation while retaining script-src self restrictions on JavaScript.
