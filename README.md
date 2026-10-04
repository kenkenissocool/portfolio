# kenkenisso.cool

Kensuke Katori's portfolio. Static HTML, CSS and JavaScript; no build step or package installation needed. Works with the repository's existing GitHub Pages setup and `CNAME`.

## Local preview

From this directory, run `python3 -m http.server 4173 --bind 127.0.0.1`, then visit `http://127.0.0.1:4173`.

## Editing

- `index.html`: profile, research, archived design work and contact information.
- `css/main.css`: responsive layout, locally hosted typography, aurora and grain.
- `js/main.js`: aligned four-point star particles, pointer parallax, motion preference, image dialogs and email copy.
- `assets/chrome-sculpture.png`: the original chrome artwork displayed behind the black star matrix.
- `assets/particle-star.svg`: static star matrix shown when JavaScript/canvas is unavailable.
- `assets/portfolio/`: selected photographs extracted from the user-supplied portfolio PDF. The original PDF is kept local and ignored by Git.
- `assets/fonts/`: Instrument Serif and Manrope, with their SIL Open Font Licenses.
- `design/notes.md`: art direction, asset provenance and content sources.

The hero layers run back to front: CSS aurora and SVG orbits, the original chrome image, the black star matrix, sparks and grain. Text remains semantic HTML.

The star particles and image parallax follow `prefers-reduced-motion` and the manual motion toggle. The image is visible without JavaScript. The experimental 3D implementation (`js/liquid.js`, `js/vendor/`, `assets/models/liquid-sculpture.bin` and `design/generate-liquid.py`) is retained for reference but is not loaded by the site.

Portfolio photographs and archived work open in native dialogs (Escape and focus restoration supported); without JavaScript, links open the original images. Research links lead to the original papers, videos and lab pages. No analytics, trackers, third-party scripts or embedded videos are loaded.

The previous site's decorative assets remain in `img/` and older unused CSS/JS remain in the repository history/workspace. This version loads `css/main.css` and `js/main.js`.
