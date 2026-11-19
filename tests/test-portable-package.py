import importlib.util,pathlib,tempfile,json,unittest
p=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('builder',p/'tools/build-windows-package.py'); m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class PackagingTests(unittest.TestCase):
 def test_policy_pinned(self):
  self.assertEqual(m.digest(p/'review/PORTABLE-PROTECTION.json'),m.PORTABLE_SHA)
 def test_no_external_bundles(self):
  for n in ['node','python','powershell','codex','ffmpeg']:
   self.assertFalse(m.external_runtime_input('tools/'+n+'/sample.exe'))
  self.assertTrue(m.external_runtime_input('tools/electron/electron.exe'))
 def test_output_checkout_rejected(self):
  with self.assertRaisesRegex(ValueError,'outside the source checkout'):m.build(p/'artifacts/test',p/'tools/electron')
 def test_existing_output_rejected(self):
  with tempfile.TemporaryDirectory() as d:
   with self.assertRaisesRegex(ValueError,'new output'):m.build(pathlib.Path(d),p/'tools/electron')
 def test_invalid_mode(self):
  docs={n:(p/n).read_bytes() for n in m.PUBLIC_METADATA_PATHS}
  with self.assertRaisesRegex(ValueError,'execution profile'):m.public_metadata(docs,'unrestricted')
 def test_user_native_confirmation_preserved(self):
  docs={n:(p/n).read_bytes() for n in m.PUBLIC_METADATA_PATHS}
  b=json.loads(m.public_metadata(docs,'user-native')['integration-build.json'])
  self.assertTrue(b['distributionExecution']['requiresNativeGenerationConfirmation'])
  self.assertFalse(b['engineeringRealAPITestsApproved'])
 def test_installer_rebound_runtime_fields(self):
  docs={n:(p/n).read_bytes() for n in m.PUBLIC_METADATA_PATHS}
  r=json.loads(m.public_metadata(docs,'user-native')['desktop/mcp/external-runtime.json'])
  self.assertTrue({'codexSha256','codexVersion','pinnedAt'} <= r.keys())
  self.assertEqual(r['nativeBridgeVersion'],1)
 def test_electron_spec(self):
  s=json.loads((p/'tools/electron-runtime.json').read_text())
  self.assertEqual(s['version'],'45.0.0')
  for n in ['LICENSE','LICENSES.chromium.html','electron.exe','locales/en-US.pak','locales/zh-CN.pak']:self.assertIn(n,s['files'])
if __name__=='__main__': unittest.main(verbosity=2)
