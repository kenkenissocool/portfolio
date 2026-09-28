# Design and content notes

Approved direction: September 27, 2026. Y2K / acid / hyperpop; pearlescent aurora, sharply tapered iridescent chrome, a large black four-point star made from aligned smaller four-point stars, fine grain. Editorial serif headings and restrained sans-serif navigation/body copy.

## Artwork

The hero chrome is a single image-derived 3D sculpture in `js/liquid.js`. Its outline comes from the approved transparent artwork. The offline generator constructs a closed volume with rounded thickness, shallow folds and the image's negative spaces, then verifies one connected component and two faces per edge. The original artwork supplies baked reflection detail, blended with live iridescent lighting. This preserves the reference's detailed highlights rather than replacing them with generic procedural chrome. The reconstruction is designed for the hero's shallow viewing angle; it does not infer hidden geometry from the image.

Animation expands and contracts the shared body and tips in a continuous radial field (roughly 15–25% at the longest tips), with a smaller central breath and minimal overall rotation. It does not animate independent tubes. The black four-point star stays in front. The original raster remains the loading/WebGL fallback.

The four-point star matrix and orbital lines are native code/SVG. No reference music-video frames are reused in the site.

Asset: `assets/chrome-sculpture.png`.

Prompt: see `chrome-asset-prompt.txt` for the full production prompt.

Visual references: the four user-provided screenshots; isshin's [nostalmic](https://www.youtube.com/watch?v=PM0LnzSSsLE) for grain and color bleed; [Giga's Beyond the way](https://ototoy.jp/_/default/p/1940136) for sharp reflective metal. These are inspiration references, not incorporated media.

## Profile

Current employer, role, education, program award and the short personal introduction are based on the user's September 27, 2026 update. The public-facing biography is a concise editorial adaptation. Only professionally relevant information and the user's broad creative interests have been included. The full autobiographical source has not been copied into the repository.

## Research sources and media credits

- **Vestibular Stimulation Enhances Hand Redirection**: Kensuke Katori, Yudai Tanaka, Yoichi Ochiai, Pedro Lopes. ACM UIST 2025. [Paper](https://lab.plopes.org/published/2025-UIST-GVSHandRedirection.pdf), [lab publication listing](https://lab.plopes.org/), [video](https://www.youtube.com/watch?v=tpcovBqYYAo). Thumbnail: `https://lab.plopes.org/project-thumbnails/UIST25-GVSHandRedirection.jpg`, stored at `assets/research/hand-redirection.jpg`.
- **Crossed half-silvered Mirror Array**: Kensuke Katori, Kenta Yamamoto, Ippei Suzuki, Tatsuki Fushimi, Yoichi Ochiai. ACM SIGGRAPH 2023 Posters. [Official project and award](https://digitalnature.slis.tsukuba.ac.jp/2023/06/crossed-half-silvered-mirror-array/). Photograph: `https://digitalnature.slis.tsukuba.ac.jp/wp-content/uploads/2023/06/Posters_repimage.jpg`, stored at `assets/research/crossed-mirror-array.jpg`.
- **2024 University of Chicago fellowship**: [official program alumni listing](https://cs-www.uchicago.edu/academics/undergraduate/summer-research/student-summer-research-fellowship-program/).

Research images are credited to the respective research teams and used to describe the user's own coauthored work. They are not licensed as general stock imagery. Archived Web work comes from the existing `kenkenissocool/portfolio` repository; no client outcomes, links or new project dates have been invented.

Fonts: Instrument Serif and Manrope, distributed through Google Fonts under SIL OFL; license files accompany the local fonts.

## Portfolio PDF integration

The user supplied `Portfolio2024.pdf` on September 27, 2026. Selected original embedded photographs were extracted (without the PDF's decorative overlays): cover portrait (page 1), Mirrored Human prototype (page 4), JFA blue-ing! Dream Theater and the Digital Nature and Mingei exhibition installation (page 6). These are saved in `assets/portfolio/`. The source document remains local and is excluded from publication.

Project descriptions follow pages 4 and 6: Mirrored Human is described as a prototype, not a validated finished system. The exhibition and JFA work are explicitly credited as contributions within collaborative projects. Current profile and final UIST publication information supersede the older PDF's student status and working paper title.

The revised star uses deeply concave cubic curves, slightly elongated vertical tips, and a tighter silhouette with separate aligned particle forms.
