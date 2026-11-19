# AICG Workbench V1.0

[中文](README.md) · English

**Discounted Seedance API access: contact the developer.**

AICG Workbench brings image and video tasks, media, scene layout, and clip assembly onto one Windows canvas. A local Agent can work alongside you with the access you grant.

## Install and start

1. Download the Windows x64 package and `SHA256SUMS.txt` from GitHub Releases. Verify SHA-256 and extract the archive.
2. Follow `START-HERE.zh-CN.md` in the package. Use separate directories for the program and project data. Keep your existing projects.
3. Run `START-AICG.cmd`. Start a test project, import a test image, set up a task, and save.
4. See `DEPENDENCIES.md` for the optional media tools. Video probing, decoding, and merging use FFmpeg and ffprobe installed separately. Python may be needed for legacy media validation. The package does not download tools or models.

## What you can do

- Edit the prompt, model, and common parameters in the task card. Use Sources for inputs, results, and history. Switch between Simplified Chinese and English in Settings.
- Use adapted image and video models. Video modes include text, first frame, first and last frames, multiple references, and a reference video. Available operations and settings depend on the model, account, and official API.
- Connect to AUTOMATIC1111 Stable Diffusion WebUI v1.10.1 at a local unauthenticated `http://127.0.0.1` address. You can list models and request one PNG from text. This connection does not support image references or video. Save settings for unknown protocols as drafts. Ollama and LM Studio are not executable connections in this release.
- Stage up to four mannequins using poses and camera controls, then send a local reference image back to the canvas. Order and join compatible video clips while preserving their audio tracks.
- Grant and revoke Agent access to a project or library in Agent & MCP settings. Use a standard stdio MCP client on the same Windows computer. See `MCP-CLIENT-GUIDE.zh-CN.md` for setup and `AGENT-GUIDE.zh-CN.md` for tools, scopes, and examples. Start by reading status, changing a synthetic prompt, and undoing the edit.

## Generation and fees

Configure your own generation service account. Enter keys in the local dialog. Check the model, recipient, files, and possible charges before approving generation or uploads in the workbench. Pricing, quotas, and service availability depend on your account. If a submission result is unknown, check the original task before sending another one.

## Verification

The Windows candidate task UI was tested in an isolated Electron instance with synthetic projects. Installation and local startup are documented in `VERIFICATION.md` in the archive. Live providers, real Stable Diffusion generation, clean Windows 10 and 11 systems, and some clients remain unverified. The installer targets Windows and MCP access is local stdio. The reported full-window freeze has not been reproduced.

## License

Project-owned code is licensed under MIT. Copyright © 2026 Jay C. Third-party components retain their own licenses.

[MIT](LICENSE) · [Third-party notices](THIRD-PARTY-NOTICES.md) · [Build from source](BUILDING.en.md)
