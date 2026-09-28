# kenkenisso.cool

Kensuke Katori's portfolio. Static HTML, CSS and JavaScript; no build step or package installation needed. Works with the repository's existing GitHub Pages setup and `CNAME`.

## Local preview

From this directory, run `python3 -m http.server 4173 --bind 127.0.0.1`, then visit `http://127.0.0.1:4173`.

## Editing

- `index.html`: profile, research, archived design work and contact information.
- `css/main.css`: responsive layout, locally hosted typography, aurora and grain.
- `js/main.js`: aligned four-point star particles, pointer parallax, motion preference, image dialogs and email copy.
- `js/liquid.js`: image-derived 3D chrome sculpture, radial deformation and reflective studio lighting.
- `js/vendor/`: self-hosted Three.js 0.186.1 (MIT), minified with esbuild 0.25.12.
- `assets/chrome-sculpture.png`: the approved artwork, used as baked reflection detail and the loading/WebGL fallback.
- `assets/models/liquid-sculpture.bin`: one closed 3D mesh reconstructed from the artwork silhouette, with rounded thickness and folded depth.
- `design/generate-liquid.py`: offline mesh generation and topology checks (NumPy, SciPy, Pillow and scikit-image 0.25.2). No Python runs in the browser.
- `assets/particle-star.svg`: static star matrix shown when JavaScript/canvas is unavailable.
- `assets/portfolio/`: selected photographs extracted from the user-supplied portfolio PDF. The original PDF is kept local and ignored by Git.
- `assets/fonts/`: Instrument Serif and Manrope, with their SIL Open Font Licenses.
- `design/notes.md`: art direction, asset provenance and content sources.

The hero layers run back to front: CSS aurora and SVG orbits, real-time WebGL chrome, the black star matrix, sparks and grain. The sculpture is a single connected mesh with 42,618 vertices. Its silhouette and baked reflection detail come from the approved artwork; its thickness, folds, live highlights and radial expansion are computed in 3D. This is an image-derived relief sculpture for a shallow viewing angle, not a reconstruction of unseen sides. A single deformation field stretches the body and tips together. Normals follow the deformation. A generated HDR studio environment and two lights add changing reflections. Text remains semantic HTML.

Both animations follow `prefers-reduced-motion` and the manual motion toggle. The liquid pauses in hidden tabs and outside the viewport; touch rendering is capped at 30 fps with a 1.25 pixel ratio (desktop 1.5). Unsupported WebGL, module loading failure and context loss retain the original image. Three.js is pinned and served from this site; no CDN is required.

Portfolio photographs and archived work open in native dialogs (Escape and focus restoration supported); without JavaScript, links open the original images. Research links lead to the original papers, videos and lab pages. No analytics, trackers, third-party scripts or embedded videos are loaded.

The previous site's decorative assets remain in `img/` and older unused CSS/JS remain in the repository history/workspace. This version loads `css/main.css`, `js/main.js`, and the `js/liquid.js` module with its local Three.js dependencies.
