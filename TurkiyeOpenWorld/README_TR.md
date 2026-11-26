# Türkiye Open World — Windows x64 prototype

Godot 4.3 project. The main character is procedurally modeled to follow the supplied reference: short dark hair, thick joined eyebrow, black tracksuit with light stripes, white shirt and shoes, silver chain, and Turkish flag patches. This is a stylized low-poly prototype rather than a production-quality rigged character model.

## Controls
- WASD: walk / drive
- Shift: run
- Space: jump / handbrake
- E: interact / enter or exit a car
- Tab: inventory panel
- P: phone panel
- M: map panel
- F5 / F9: save / load
- Esc: release or capture mouse

## Windows build
The repository-level workflow downloads Godot 4.3 and the matching export templates on a Windows runner, imports the project, runs a headless smoke test, exports Windows x86_64 EXE + PCK, verifies both files are inside the ZIP, and uploads the ZIP as a GitHub Actions artifact. Do not call a build successful until the workflow run succeeds and the artifact is present.
