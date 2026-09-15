# Agent Command Center — approval demo

A single self-contained file: `demo/index.html` (~550KB, Three.js bundled inline).
Open it directly in a browser — no server, no network, no build step required.

## Controls
| Input | Action |
|---|---|
| `W A S D` / arrows | move the agent |
| `E` | access the nearest station |
| `R` | Recruiter Mode — full resume, instantly |
| `T` | auto tour (drives itself through all 9 stations) |
| `Esc` | back to the 3D scene |

## Rebuilding
Source lives in `demo/src/main.js`; `demo/index.tpl.html` is the shell.

```bash
npm install
npm run demo
```

All content is drawn from the resume. Nothing is invented.
