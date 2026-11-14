# Farm stills for the pitch

Decorative images for slides, the demo video and the README header. They carry no data and no numbers, so they are not `Sourced` values.

## Files

| Folder | What | Use |
|---|---|---|
| `scenes/farm-hero.png`, `farm-hero-transparent.png` | Farm diorama: house, barn, silo, greenhouse, corn and wheat, tractor, animals | Title slide, README header |
| `scenes/farm-rotation.png`, `farm-rotation-transparent.png` | Four plots in a row: corn, wheat, sunflower, pumpkin | Slide about crop rotation |
| `scenes/farm-yard.png` | Yard close-up: house, fence, cow, sheep, dog, farmer, well | Closing slide, "for the farmer" slide |
| `icons/*.png` | House, barn, silo, tractor, greenhouse, windpump, corn, wheat, sunflower, pumpkin on a transparent background, 1024 x 1024 | Slide icons, step markers |

Scenes are 1920 x 1080. The `-transparent` versions have no sky, so they sit on any slide background.

## Credit (required, CC BY 4.0)

Put this line on a slide (footer is fine) and in the References list:

> 3D models: Cozy Farm kit by Polyfork (polyfork.dev), CC BY 4.0. Arranged into scenes and rendered to images; models not otherwise changed.

Licence terms: https://polyfork.dev/licensing (retrieved 14 Nov 2026). Do not use the Polyfork name or logo to suggest endorsement. No NASA logos appear in these images.

## Models used

All from the Cozy Farm kit, file pattern `https://polyfork.dev/cdn/<slug>.glb`. The GLB files are not in the repo.

`gabled-farmhouse-c7534f`, `red-barn-d41683`, `grain-silo-58ca67`, `compact-tractor-35b84b`, `greenhouse-53ab6d`, `corn-crop-b71f2f`, `wheat-crop-7e08e6`, `sunflower-80ce15`, `pumpkin-crop-7de137`, `turnip-crop-a5b3b7`, `tilled-soil-tile-d9152e`, `grass-tile-37e1a7`, `dirt-tile-6f4470`, `cow-c61a66`, `sheep-7b0187`, `farmer-304a43`, `farm-dog-723730`, `apple-tree-ef0ba0`, `windpump-tower-1633a9`, `hay-bale-079e8c`, `scarecrow-334079`, `wooden-fence-section-d72055`, `farm-gate-8ab320`, `stone-well-b2dfcd`, `seedling-tray-116925`.

## Re-render

`render-src/` holds the scene page (three.js 0.180.0) and the screenshot script. To change a scene:

1. Make a working folder outside the repo. Put `scene.html` in it, run `npm install three@0.180.0`, and download the GLBs above into `glb/`.
2. Serve the folder on port 8765 (`python3 -m http.server 8765 --bind 127.0.0.1`).
3. `node shoot.mjs <hero|rotation|yard|house|barn|...> out.png [none] [w] [h]`. The script expects Playwright 1.58.2 under `~/.cache/fun-isometric`; change the `createRequire` path to your own Playwright install.

The animals and the farmer use their `Idle` and `Walk` clips frozen at one time, so the picture is deterministic.
