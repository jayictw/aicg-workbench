# AICG Workbench V1.0

[中文](README.md) · English

**Discounted Seedance API access: contact the developer.**

AICG Workbench lets people and Agents create images and videos together on one canvas through an open local MCP interface. You direct the work and review results visually; an authorized Agent reads the canvas, organizes tasks, edits prompts and settings, and helps stage shots and arrange results and clips. This Windows release supports same-machine standard stdio MCP without a specific Agent brand requirement; actual connections depend on client compatibility and the access you grant.

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

## Open MCP: people and Agents working on one canvas

AICG does more than ask an Agent to write a prompt. Its local **stdio MCP** interface lets an authorized Agent read the current workbench and make changes through the workbench's own operations. You keep using the visual interface; the Agent works with the same tasks, media, model settings, and results rather than a separate plan disconnected from your canvas.

**There is no Codex-only or other brand lock-in.** Clients that can run a local stdio MCP program on the same Windows computer can configure the bundled `AICG-MCP.exe`. This does not mean every Agent has been tested. A cloud-only connector that cannot launch a local program cannot connect directly to this release.

### Implemented collaboration interfaces

These are implemented interface capabilities, not a promise of end-to-end verification for every client or model. Available operations still depend on the granted access, current project, model capabilities, and media state.

| Your goal | How an Agent can help |
| --- | --- |
| Understand the project | Query workbench status; list, create, and open authorized projects; read applied canvas, task, and media state, with paged access to longer fields. |
| Organize tasks | Edit prompts, text, node positions, connections, and selected inputs. Discover the task's actual available models and settings before updating it. Undo supported canvas edits. |
| Inspect and import media | Read validated media information, PNG previews, or paged original bytes. Ask you to choose local files or import explicitly requested inputs. Importing into the workbench is not uploading to a generation service. |
| Prepare generation | Preview the applied model, prompt, parameters, and inputs; request generation for your local confirmation. Inspect original task history, recover downloads, or stop waiting without automatically resubmitting an unknown outcome. |
| Set up a scene | Adjust poses, positions, joints, cameras, and lights for up to four mannequins; render a local reference image; read or save poses. |
| Organize results and clips | Inspect and accept a specific result version, order video tasks, and strictly join compatible existing clips with their audio. Media operations require the relevant external tools. |
| Save and configure | Save, back up, or restore a new copy within the granted scope; manage non-secret model connection settings. Whole-library operations require library-wide authority; a project-scoped connection cannot silently save the whole library. |

Entry points include `aicg_workbench_status`, `canvas_context_read`, `canvas_context_execute`, `canvas_context_undo`, `canvas_task_models`, `canvas_workbench_catalog`, and studio/strict-merge tools. Agents can query the current operation catalog and should read actual state and capabilities instead of guessing project IDs, media versions, or parameters.

### Practical ways to work together

These examples illustrate usage, not completed tests of every client:

- **You direct; the Agent organizes:** “Read the canvas and make these three video prompts consistent in style. Keep their existing media and models. Do not generate yet.” Review the changes on the canvas and undo them if needed.
- **You select inputs; the Agent prepares:** “Prepare this video task using my selected first and last frames. Check that the model supports them, then show a preview.” You still review and approve any real generation locally.
- **You review the shot; the Agent stages it:** “Move the selected character to the front left, adjust the camera, and render a reference image for review.” This is a local studio reference operation, not an automatic provider generation request.
- **You choose the cut; the Agent checks the clips:** “Arrange the finished clips in this order and check whether they can be joined directly. Tell me if they are incompatible.” Strict joining does not silently become transcoding, music editing, or regeneration.

### Connect your client

1. Install and open the workbench, then go to **Settings → Agent & MCP connections**.
2. Create a separate connection for your chosen client. Select read-only, undoable editing, or full workbench access, limited to the current project or library. On-demand launch is a separate option.
3. Copy the generated configuration into your client's local stdio MCP settings. `command` points to this installation's `AICG-MCP.exe`; `args` contains `--stdio --connection` and its connection ID; `cwd` is the installation directory. Use the generated values, not someone else's paths or ID.
4. Start by querying workbench status and reading a test project. For editing, try changing a test prompt and undoing it first.
5. Revoke the connection in the workbench when finished. Do not publish its configuration or share it with an untrusted client.

The connection does not require bundled Codex, Node.js, or PowerShell 7. An Agent cannot read plaintext keys, grant itself a connection, or approve paid generation for you. Enter keys in the local credential dialog. These permissions cannot protect against malware running as the same Windows user, so connect only trusted clients.

See the [client setup guide](docs/MCP-CLIENT-GUIDE.zh-CN.md) and [tools, access scopes, and examples](docs/AGENT-GUIDE.zh-CN.md), currently in Chinese. Historical client results in those guides do not establish that every client was retested against this package.

### What has actually been verified

- **Current V1.0 package:** new-directory installation, installed-file checks, hidden Electron startup, and a native stdio test harness passed. The harness discovered 31 tools using protocol `2025-06-18` and read back `applicationConnected` and `ready`. It was not a branded Agent and did not execute all 31 tools individually.
- **Earlier installation:** a real Codex CLI completed synthetic edit, read-back, and undo regression. That branded-client flow was not rerun against the current package; it does not verify Codex Desktop.
- **Not yet verified:** successful Claude Code tool use against this package, other client combinations, a complete human foreground workflow, and live provider generation. An implemented interface is not a live-generation test.
- **Transport boundary:** this release supports same-machine Windows stdio, not remote HTTPS MCP or a macOS installer.

## Generation and fees

Configure your own generation service account. Enter keys in the local dialog. Check the model, recipient, files, and possible charges before approving generation or uploads in the workbench. Pricing, quotas, and service availability depend on your account. If a submission result is unknown, check the original task before sending another one.

## Verification

The Windows candidate task UI was tested in an isolated Electron instance with synthetic projects. Installation and local startup are documented in `VERIFICATION.md` in the archive. Live providers, real Stable Diffusion generation, clean Windows 10 and 11 systems, and some clients remain unverified. The installer targets Windows and MCP access is local stdio. The reported full-window freeze has not been reproduced.

## License

Project-owned code is licensed under MIT. Copyright © 2026 Jay C. Third-party components retain their own licenses.

[MIT](LICENSE) · [Third-party notices](THIRD-PARTY-NOTICES.md) · [Build from source](BUILDING.en.md)
