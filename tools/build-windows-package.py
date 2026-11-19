"""Build a Windows LocalCLI package from a source checkout and verified Electron runtime."""
import argparse, hashlib, json, os, re, shutil, stat, subprocess, zipfile
from pathlib import Path
from datetime import datetime, timezone

BASE = Path(__file__).resolve().parent.parent
TASK = BASE.parent
PROOF_SHA = "cc6c03ccb5f5fe379145b32effe6f2d47180ce09a6daa04b936de8d779bac4de"
NODE = None
NODE_SHA = "e3be0545990c90995d7bf3a7af5d64af1f2e0fc1bbd9b79c27f7abc1e9676e50"
PORTABLE_SHA = "993a046ba9bb6d1953864fca8c5b85be5138b2f2250ae2b38422c5334a97860e"
PYTHON_SHA = "3c48fbdcc2ed5c55290e39bef50bd6b1da76f43f3069a4a2624d0b8876a605f5"
CODEX_SHA = "83f5c2dd2ac2902e0d96ba5d8ccdd27d513f57df4a9ab73e06a5a518028e9a2f"

def digest(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for b in iter(lambda:f.read(1024*1024), b""):
            h.update(b)
    return h.hexdigest()

def regular(path):
    info = path.lstat()
    if not stat.S_ISREG(info.st_mode) or getattr(info, "st_file_attributes", 0) & 1024 or info.st_nlink != 1:
        raise ValueError("Linked/nonregular package input: "+str(path))
    return path

def descendants(root):
    for current, dirs, files in os.walk(root, followlinks=False):
        for d in dirs:
            if (Path(current)/d).is_symlink() or getattr((Path(current)/d).lstat(), "st_file_attributes",0)&1024:
                raise ValueError("Linked package directory")
        for f in files:
            yield regular(Path(current)/f)

def source_pin():
    files={}
    for current, dirs, names in os.walk(BASE, followlinks=False):
        rel=Path(current).relative_to(BASE).as_posix()
        dirs[:]=sorted(d for d in dirs if d not in {".git","node_modules","runtime"} and
                       not (rel=="tools" and d in {"electron","ffmpeg"}) and
                       not (rel=="qa" and d=="profiles") and d not in {"dist","__pycache__"})
        for name in sorted(names):
            if Path(name).suffix.lower() in {".exe",".pyc"}:continue
            p=Path(current)/name
            files[p.relative_to(BASE).as_posix()]=digest(regular(p))
    return files, hashlib.sha256(json.dumps(files,sort_keys=True,separators=(",",":")).encode()).hexdigest()

PUBLIC_METADATA_PATHS = ("integration-build.json", "desktop/mcp/external-runtime.json",
                         "desktop/mcp/terminal-pins.json")

def public_metadata(documents, execution_mode="offline-test"):
    """Minimize only installer-rebound metadata; preserve private source bytes.

    This first group contains only installer-rebound runtime metadata.
    Legacy source proof is checked privately; portable policy is shipped instead.
    """
    if execution_mode not in {"offline-test","user-native"}:raise ValueError("Unknown execution profile")
    values = {name:json.loads(documents[name].decode("utf-8-sig"))
              for name in PUBLIC_METADATA_PATHS}
    build = values["integration-build.json"]
    build.update(codeRoot=".", runtimeRoot="runtime")
    if execution_mode=="user-native":
        build.update(offlineOnly=False,supplierAPIEnabled=True)
        build["distributionExecution"]={"version":1,"mode":"user-native","requiresNativeGenerationConfirmation":True,"realProviderTested":False}

    for key in ("imageContractRepair", "sourceInPlaceProUpdate",
                "imageEndpointRoute", "videoEndpointRepair", "ownerTestIsolation"):
        build.pop(key, None)
    runtime = values["desktop/mcp/external-runtime.json"]
    runtime.update(codeRoot=".", runtimeRoot="runtime", node="tools/node/node.exe",
                   powershell="tools/powershell/pwsh.exe",
                   codexCli="tools/codex/codex.exe", disabled=True,
                   codexSha256=CODEX_SHA, codexVersion="0.167.0-alpha.4.1", pinnedAt="")
    pins = values["desktop/mcp/terminal-pins.json"]
    pins.update(bridge="tools/connect-codex.cjs",
                nativeScript="tools/connect-native-codex.cjs", neutralScript="tools/connect-mcp.cjs")
    return {name:(json.dumps(value,ensure_ascii=False,indent=2)+"\n").encode("utf8")
            for name,value in values.items()}

def public_payload_metadata(documents):
    values={name:json.loads(data.decode("utf-8-sig")) for name,data in documents.items()}
    for name,value in values.items():
        if name=="shared/byteplus-route-contract.json":
            for model in value["models"]:
                model["selectorValue"]=None;model["selectorProvenance"]="INSTALLATION_UNCONFIGURED"
        elif name=="shared/byteplus-image-models.json":
            value["routing"]="Per-install explicit Endpoint configuration; unconfigured requests are rejected; account not verified"
            for model in value["models"]:
                if "endpointRoute" in model:
                    model["endpointRoute"].update(id=None,declaredProject=None)
        elif name=="shared/byteplus-video-route.json":
            value.update(endpointId=None,source="INSTALLATION_UNCONFIGURED")
        elif name=="workbench-source/integration-build.json":
            value.update(source="ARCHIVE_COMPATIBILITY_ONLY",codeRoot="workbench-source",runtimeRoot="runtime/legacy-compat",
                         formalWorkRoot="runtime/legacy-disabled/work",formalBackupRoot="runtime/legacy-disabled/backups",
                         mediaValidationRuntime={"python":"tools/python/python.exe"})
        else:raise ValueError("Unexpected public payload metadata")
    return {name:(json.dumps(value,ensure_ascii=False,indent=2)+"\n").encode("utf8") for name,value in values.items()}

# Only obsolete entries / gated original one-off live approvals are excluded.
# Current c6, native transport, saved DTO/media validation and renderer stay.
OMITTED_FILES={"desktop/main.cjs","desktop/native-main-synthetic.cjs",
 "desktop/codex-registration-rpc.cjs","desktop/codex-registration.cjs",
 "workbench-source/desktop/combined-live-policy.cjs",
 "workbench-source/desktop/video-live-policy.cjs","workbench-source/desktop/video-recovery-policy.cjs",
 "README-ENV-LOCAL.md","API-SPEC-AND-PRICE.md","vite.config.js","tsconfig.json","index.html"}
def omitted_runtime_resource(relative):
    return relative.lower().endswith(".pdb") or (relative.startswith("tools/electron/locales/") and Path(relative).name not in {"en-US.pak", "zh-CN.pak"})
def runtime_input(relative):
    return not omitted_runtime_resource(relative) and not relative.startswith("src/") and relative not in OMITTED_FILES and relative not in {"tools/serve-mcp.cjs", "desktop/mcp/http-transport.cjs"}

def external_runtime_input(relative):
    return runtime_input(relative) and not any(relative.startswith("tools/"+name+"/") for name in ["codex","node","powershell","ffmpeg","python"])

def build(output, electron_dir, execution_mode="offline-test", compression_level=6):
    external=True
    dependency_profile="external"
    codex_bundle=None
    if compression_level not in {1,6,9}: raise ValueError("Unsupported standard ZIP compression level")
    output=output.absolute()
    if output.exists() or output == BASE or output.is_relative_to(BASE):
        raise ValueError("Use a new output directory outside the source checkout")
    # Validate ancestor paths before creating output.
    for p in [output.parent, *output.parents]:
        if p.exists() and getattr(p.lstat(),"st_file_attributes",0)&1024:
            raise ValueError("Linked output ancestor")
    package=json.loads((BASE/"package.json").read_text("utf-8-sig"))
    inputs={}
    omitted_resources=set()
    for pattern in package["files"]+["package.json","package-lock.json","LICENSE","THIRD-PARTY-NOTICES.md","docs/**"]:
        if pattern in {".env.example"}:
            continue
        root=BASE/pattern.removesuffix("/**")
        candidates=descendants(root) if pattern.endswith("/**") and root.is_dir() else ([root] if root.is_file() else [])
        for p in candidates:
            rel=p.relative_to(BASE).as_posix()
            if "runtime" in p.relative_to(BASE).parts or any(x in {".env","Vault","vault","credentials.json","auth.json"} for x in p.parts):
                raise ValueError("Private/runtime input forbidden: "+rel)
            if runtime_input(rel): inputs[rel]=regular(p)
            elif omitted_runtime_resource(rel): omitted_resources.add(rel)
    for rel in ["tools/AICG-MCP.exe","tools/mcp-connections.cjs","docs/MCP-CLIENT-GUIDE.zh-CN.md","docs/AGENT-GUIDE.zh-CN.md","docs/START-HERE.zh-CN.md"]: inputs[rel]=regular(BASE/rel)
    inputs["review/PORTABLE-PROTECTION.json"]=regular(BASE/"review/PORTABLE-PROTECTION.json")
    inputs["workbench-source/desktop/seedance-media-helper.py"]=regular(BASE/"workbench-source/desktop/seedance-media-helper.py")
    # Follow literal CommonJS imports from the actual application and client entries.
    pending=[inputs[n] for n in ["desktop/c6-main.cjs","desktop/c5-preload.cjs",
             "tools/launch-workbench.cjs","tools/connect-codex.cjs","tools/connect-native-codex.cjs","tools/connect-mcp.cjs","tools/mcp-clients.cjs"]]
    visited=set()
    while pending:
        importer=pending.pop()
        if importer in visited or importer.suffix not in {".js",".cjs",".mjs"}: continue
        visited.add(importer)
        rel=importer.relative_to(BASE).as_posix()
        for name in re.findall(r"require\(\s*['\"](\.[^'\"]+)['\"]\s*\)", importer.read_text("utf8")):
            # These historical branches are unreachable in either installed profile:
            # QA flags rejected; live round2 authorization disabled; native terminal uses no autoDelegate.
            excluded={("desktop/c6-main.cjs","../qa/byteplus-http-fixture.cjs"),
                      ("desktop/round2-plan.cjs","../plan/INPUTS.json"),
                      ("desktop/round2-approved-plan.cjs","../plan/INPUTS.json"),
                      ("desktop/mcp/external-host.cjs","./codex-open-pins.json"),
                      ("workbench-source/desktop/runtime-paths.cjs","./video-live-policy.cjs"),
                      ("workbench-source/desktop/runtime-paths.cjs","./video-recovery-policy.cjs")}
            if (rel,name) in excluded: continue
            target=(importer.parent/name).resolve()
            options=[target,Path(str(target)+".cjs"),Path(str(target)+".js"),Path(str(target)+".json"),target/"index.js"]
            found=next((p for p in options if p.is_file()),None)
            if found is None or not found.is_relative_to(BASE) or found.relative_to(BASE).as_posix() not in inputs:
                raise ValueError("Runtime package dependency omitted: "+rel+" -> "+name)
            pending.append(found)

    # Resolve only declared production dependency closure from the installed tree.
    modules={}
    def dependency(name, owner):
        cursor=owner
        while True:
            p=cursor/"node_modules"/name
            if (p/"package.json").is_file():
                break
            if cursor==BASE.parent or cursor.parent==cursor:
                raise ValueError("Missing installed production dependency: "+name)
            cursor=cursor.parent
        if not p.is_relative_to(BASE/"node_modules"):
            raise ValueError("Dependency escaped existing source node_modules")
        key=p.relative_to(BASE).as_posix()
        if key in modules:return
        info=json.loads((p/"package.json").read_text("utf-8-sig"))
        modules[key]={"name":info["name"],"version":info["version"]}
        for f in descendants(p):
            # Nested package trees are handled through resolution, not copied wholesale.
            if "node_modules" in f.relative_to(p).parts:continue
            inputs[f.relative_to(BASE).as_posix()]=f
        for n in info.get("dependencies",{}):
            dependency(n,p)
        for n in info.get("optionalDependencies",{}):
            try:dependency(n,p)
            except ValueError as e:
                if not str(e).startswith("Missing installed production dependency"):raise
    for name in package["dependencies"]:dependency(name,BASE)
    # Only the application runtime is distributed. Other tools remain external.
    for relative in ["tools/colleague-codex.ps1", "tools/get-connection-diagnostics.ps1", "docs/CODEX-GUIDE.zh-CN.md", "tools/check-dependencies.ps1"]:
        inputs[relative] = regular(BASE/relative)
    electron_spec=json.loads((BASE/"tools/electron-runtime.json").read_text("utf8"))
    electron_dir=electron_dir.resolve()
    for rel,expected in electron_spec["files"].items():
        f=regular(electron_dir/rel)
        if digest(f)!=expected:raise ValueError("Electron runtime checksum mismatch: "+rel)
        if runtime_input("tools/electron/"+rel):inputs["tools/electron/"+rel]=f
    pins=json.loads((BASE/"desktop/mcp/terminal-pins.json").read_text("utf-8-sig"))
    native_pins=json.loads((BASE/"desktop/mcp/native-bridge-pins.json").read_text("utf-8-sig"))
    # Newly compiled bridge and entry points, never a stale binary hash manifest.
    native_pins["files"]={rel:digest(inputs[rel]) for rel in native_pins["files"]}
    pipe_options=["CurrentUserSidACL","FirstPipeInstance","RejectRemoteClients","Win32PipePID","DPAPI-CurrentUser","HMAC-challenge"]

    # Preserve the published immutable opaque policy. No private source paths
    # or historical machine files are needed for a new V3 deployment.
    if digest(inputs["review/PORTABLE-PROTECTION.json"])!=PORTABLE_SHA:raise ValueError("Portable policy pin mismatch")
    generated=public_metadata({name:inputs[name].read_bytes() for name in PUBLIC_METADATA_PATHS},execution_mode=execution_mode)
    generated["desktop/mcp/native-bridge-pins.json"]=(json.dumps(native_pins,indent=2)+"\n").encode()
    names=["shared/byteplus-route-contract.json","shared/byteplus-image-models.json","shared/byteplus-video-route.json","workbench-source/integration-build.json"]
    generated.update(public_payload_metadata({name:inputs[name].read_bytes() for name in names}))
    generated["review/SOURCE-BEFORE.json"]=(json.dumps({"version":3,"policy":"review/PORTABLE-PROTECTION.json","policySha256":PORTABLE_SHA,"additionalProtectedRoots":["."]},indent=2)+"\n").encode()
    # Apply the same explicit runtime-resource policy to dependencies added after
    # package.json traversal. Executables, ICU, requested locales and PS7 APIs stay.
    removed_resources = sorted(omitted_resources | {name for name in inputs if omitted_runtime_resource(name)})
    inputs = {name:p for name,p in inputs.items() if (external_runtime_input(name) if external else runtime_input(name))}
    if external:
        generated_build=json.loads(generated["integration-build.json"]);generated_build["externalDependencies"]={"version":1,"tools":{}}
        generated["integration-build.json"]=(json.dumps(generated_build,ensure_ascii=False,indent=2)+"\n").encode("utf8")
        for name in ["desktop/mcp/external-runtime.json","workbench-source/integration-build.json"]:
            doc=json.loads(generated[name])
            if name.startswith("desktop/"):doc.update(node="",powershell="",codexCli="",disabled=not doc.get("nativeBridgeVersion")==1)
            else:doc["mediaValidationRuntime"]={"python":"","external":True}
            generated[name]=(json.dumps(doc,ensure_ascii=False,indent=2)+"\n").encode("utf8")
    files,fingerprint=source_pin()
    output.mkdir(parents=True)
    (output/"SOURCE-PIN.json").write_text(json.dumps({"at":datetime.now(timezone.utc).isoformat(),"count":len(files),"fingerprint":fingerprint,"files":files},ensure_ascii=False,indent=2),"utf8")
    shutil.copyfile(BASE/"tools/windows-lifecycle.ps1",output/"INSTALL.ps1")
    shutil.copyfile(BASE/"review/PORTABLE-PROTECTION.json",output/"PORTABLE-PROTECTION.json")
    for guide in (BASE/"docs").glob("*.md"):
        shutil.copyfile(regular(guide),output/guide.name)
    for name in ["LICENSE","THIRD-PARTY-NOTICES.md","BUILDING.en.md","BUILDING.zh-CN.md"]:
        shutil.copyfile(regular(BASE/name),output/name)
    hashes={};sizes={}
    with zipfile.ZipFile(output/"payload.zip","x",compression=zipfile.ZIP_DEFLATED,compresslevel=compression_level) as z:
        for rel,p in sorted(inputs.items()):
            if rel in generated:
                content=generated[rel]
                hashes[rel]=hashlib.sha256(content).hexdigest();sizes[rel]=len(content)
                z.writestr(rel,content)
            else:
                hashes[rel]=digest(p);sizes[rel]=p.stat().st_size
                z.write(p,rel)
    manifest={"version":1,"product":"AICG-P4-TEST","builtAt":datetime.now(timezone.utc).isoformat(),
      "sourceFingerprint":fingerprint,"sourceCount":len(files),"executionMode":execution_mode,"files":hashes,"sizes":sizes,
      "unpackedBytes":sum(sizes.values()),"payloadSha256":digest(output/"payload.zip"),
      "installerSha256":digest(output/"INSTALL.ps1"),"protectionVersion":3,"protectionSha256":PORTABLE_SHA,
      "legacyMediaPythonSha256":PYTHON_SHA,
      "codex":{"sha256":CODEX_SHA,"version":"0.167.0-alpha.4.1"},"dependencies":modules,
      "powershellSha256":pins["powershellSha256"],"pipeSecurityCapabilities":pipe_options,
      "nodeSha256":NODE_SHA,"packageLockSha256":digest(BASE/"package-lock.json"),
      "scope":("User-native isolated installation, unsigned. Own API requires saved routing, own Vault Key and per-task native confirmation; real Provider NOT_RUN. " if execution_mode=="user-native" else "Offline test installation, unsigned. ")+"Not a formal release; no credentials or project data.",
      "dependencyProfile":dependency_profile,"distributionDependencies":{"version":1,"externalTools":["ffmpeg","ffprobe","python"] if external else [],"codex":{"bundled":codex_bundle is not None,"requiredForLocalWorkbench":False,"requiredForCodexCollaboration":True,"automaticDownload":False,"trust":"explicit named connection + scoped current-user capability; own bridge OS peer identity"},"zipCompressionLevel":compression_level,"requestedUiLocales":["en-US","zh-CN"],"removedResources":removed_resources},
      "metadataMinimization":{"version":2,"status":"PENDING_ARTIFACT_SCAN",
        "removed":"Original machine paths, account Endpoints, raw source proof, obsolete entries and one-off live approvals",
        "retained":"Pinned equivalent opaque protection policy, immutable historical validation and exact tool pins",
        "externalSharingApproved":False}}
    (output/"MANIFEST.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2),"utf8")
    (output/"README.txt").write_text(
      "AICG "+execution_mode+" isolated installation (not a signed release).\n"+
      "Run INSTALL.ps1 with -InstallRoot <new local program dir> -DataRoot <separate new data dir>.\n"
      "Both directories are explicit and independent of existing workspaces. No admin or global MCP registration.\n"
      "Connect a local stdio client through Settings > Agent / MCP; own bridge needs no external Node or PowerShell 7.\n"
      "Start with START-AICG.cmd. Close normally before REMOVE-AICG.ps1. Uninstall retains all data.\n"
      "Reinstall at the same roots preserves app-owned synthetic data. Automatic upgrade is not implemented.\n"
      "Engineering tests used no real Keys or paid API. Native profile users configure their own API in settings and confirm each task.\n"
       "Native user-selected TOS upload and private-asset to expiring HTTPS sources are implemented; no silent upload or destination. Literal asset URI authority is unavailable. Clean Windows10/11, final full GUI and real Provider NOT_RUN.\n","utf8")
    print(json.dumps({"output":str(output),"sourceCount":len(files),"sourceFingerprint":fingerprint,
      "payloadFiles":len(hashes),"unpackedBytes":manifest["unpackedBytes"],"zipBytes":(output/"payload.zip").stat().st_size,"payloadSha256":manifest["payloadSha256"]}))

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",required=True,type=Path)
    parser.add_argument("--electron-dir",required=True,type=Path)
    parser.add_argument("--execution-mode",choices=["offline-test","user-native"],default="offline-test")
    parser.add_argument("--compression-level",type=int,choices=[1,6,9],default=6)
    args=parser.parse_args()
    build(args.output,args.electron_dir,args.execution_mode,args.compression_level)
