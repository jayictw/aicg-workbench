"""QA-only synthetic media preparation. Never invokes provider APIs or product state."""
from pathlib import Path
import ctypes as C
from ctypes import wintypes as W
import hashlib, json, os, struct, subprocess, time, sys

ROOT = None
FFMPEG = Path(__file__).resolve().parents[2] / 'tools/ffmpeg/ffmpeg.exe'
FFPROBE = Path(__file__).resolve().parents[2] / 'tools/ffmpeg/ffprobe.exe'
MAX_BYTES = 32 * 1024 * 1024
_BOX_COUNT = 0
MAX_BOXES_PER_LEVEL = 4096
MAX_BOXES_TOTAL = 8192
HASH = lambda b: hashlib.sha256(b).hexdigest()

class STARTUPINFO(C.Structure):
    _fields_ = [('cb', W.DWORD), ('lpReserved', W.LPWSTR), ('lpDesktop', W.LPWSTR),
                ('lpTitle', W.LPWSTR), ('dwX', W.DWORD), ('dwY', W.DWORD),
                ('dwXSize', W.DWORD), ('dwYSize', W.DWORD), ('dwXCountChars', W.DWORD),
                ('dwYCountChars', W.DWORD), ('dwFillAttribute', W.DWORD),
                ('dwFlags', W.DWORD), ('wShowWindow', W.WORD), ('cbReserved2', W.WORD),
                ('lpReserved2', C.POINTER(C.c_byte)), ('hStdInput', W.HANDLE),
                ('hStdOutput', W.HANDLE), ('hStdError', W.HANDLE)]

class PROCESS_INFORMATION(C.Structure):
    _fields_ = [('hProcess', W.HANDLE), ('hThread', W.HANDLE), ('dwProcessId', W.DWORD), ('dwThreadId', W.DWORD)]

class BASIC_LIMIT(C.Structure):
    _fields_ = [('PerProcessUserTimeLimit', C.c_longlong), ('PerJobUserTimeLimit', C.c_longlong),
                ('LimitFlags', W.DWORD), ('MinimumWorkingSetSize', C.c_size_t),
                ('MaximumWorkingSetSize', C.c_size_t), ('ActiveProcessLimit', W.DWORD),
                ('Affinity', C.c_size_t), ('PriorityClass', W.DWORD), ('SchedulingClass', W.DWORD)]

class IO_COUNTERS(C.Structure):
    _fields_ = [(name, C.c_ulonglong) for name in ['ReadOperationCount','WriteOperationCount',
                'OtherOperationCount','ReadTransferCount','WriteTransferCount','OtherTransferCount']]

class EXTENDED_LIMIT(C.Structure):
    _fields_ = [('BasicLimitInformation', BASIC_LIMIT), ('IoInfo', IO_COUNTERS),
                ('ProcessMemoryLimit', C.c_size_t), ('JobMemoryLimit', C.c_size_t),
                ('PeakProcessMemoryUsed', C.c_size_t), ('PeakJobMemoryUsed', C.c_size_t)]

K = C.WinDLL('kernel32', use_last_error=True)
K.CreateJobObjectW.argtypes = [W.LPVOID, W.LPCWSTR]; K.CreateJobObjectW.restype = W.HANDLE
K.SetInformationJobObject.argtypes = [W.HANDLE, C.c_int, W.LPVOID, W.DWORD]; K.SetInformationJobObject.restype = W.BOOL
K.AssignProcessToJobObject.argtypes = [W.HANDLE, W.HANDLE]; K.AssignProcessToJobObject.restype = W.BOOL
K.CreateProcessW.argtypes = [W.LPCWSTR, W.LPWSTR, W.LPVOID, W.LPVOID, W.BOOL, W.DWORD,
                            W.LPVOID, W.LPCWSTR, C.POINTER(STARTUPINFO), C.POINTER(PROCESS_INFORMATION)]
K.CreateProcessW.restype = W.BOOL
K.ResumeThread.argtypes = [W.HANDLE]; K.ResumeThread.restype = W.DWORD
K.WaitForSingleObject.argtypes = [W.HANDLE, W.DWORD]; K.WaitForSingleObject.restype = W.DWORD
K.TerminateJobObject.argtypes = [W.HANDLE, W.UINT]; K.TerminateJobObject.restype = W.BOOL
K.TerminateProcess.argtypes = [W.HANDLE, W.UINT]; K.TerminateProcess.restype = W.BOOL
K.GetExitCodeProcess.argtypes = [W.HANDLE, C.POINTER(W.DWORD)]; K.GetExitCodeProcess.restype = W.BOOL
K.QueryInformationJobObject.argtypes = [W.HANDLE, C.c_int, W.LPVOID, W.DWORD, W.LPVOID]; K.QueryInformationJobObject.restype = W.BOOL
K.CloseHandle.argtypes = [W.HANDLE]; K.CloseHandle.restype = W.BOOL

def check(value):
    if not value: raise C.WinError(C.get_last_error())

class SECURITY_ATTRIBUTES(C.Structure):
    _fields_=[('nLength',W.DWORD),('lpSecurityDescriptor',W.LPVOID),('bInheritHandle',W.BOOL)]
K.CreatePipe.argtypes=[C.POINTER(W.HANDLE),C.POINTER(W.HANDLE),C.POINTER(SECURITY_ATTRIBUTES),W.DWORD]; K.CreatePipe.restype=W.BOOL
K.SetHandleInformation.argtypes=[W.HANDLE,W.DWORD,W.DWORD]; K.SetHandleInformation.restype=W.BOOL
K.PeekNamedPipe.argtypes=[W.HANDLE,W.LPVOID,W.DWORD,W.LPVOID,C.POINTER(W.DWORD),W.LPVOID]; K.PeekNamedPipe.restype=W.BOOL
K.ReadFile.argtypes=[W.HANDLE,W.LPVOID,W.DWORD,C.POINTER(W.DWORD),W.LPVOID]; K.ReadFile.restype=W.BOOL

def bounded(args, tag, wall=10, cpu=5, memory_mib=256):
    import msvcrt
    job=K.CreateJobObjectW(None,None); check(job)
    pi=PROCESS_INFORMATION(); pipes=[]; start=time.monotonic(); timed_out=False
    limits=EXTENDED_LIMIT(); limits.BasicLimitInformation.PerProcessUserTimeLimit=int(cpu*10000000)
    limits.BasicLimitInformation.LimitFlags=0x2|0x8|0x100|0x200|0x2000
    limits.BasicLimitInformation.ActiveProcessLimit=1
    limits.ProcessMemoryLimit=memory_mib*1024*1024; limits.JobMemoryLimit=memory_mib*1024*1024
    def drain(handle, output):
        while True:
            available=W.DWORD()
            if not K.PeekNamedPipe(handle,None,0,None,C.byref(available),None):
                if C.get_last_error()==109: return
                raise C.WinError(C.get_last_error())
            if not available.value: return
            remaining=1024*1024-len(output)
            if remaining<=0: raise ValueError('MEDIA_PROCESS_OUTPUT_LIMIT')
            amount=min(4096,available.value,remaining); buffer=C.create_string_buffer(amount); received=W.DWORD()
            check(K.ReadFile(handle,buffer,amount,C.byref(received),None)); output.extend(buffer.raw[:received.value])
    try:
        check(K.SetInformationJobObject(job,9,C.byref(limits),C.sizeof(limits)))
        sa=SECURITY_ATTRIBUTES(C.sizeof(SECURITY_ATTRIBUTES),None,True)
        for unused in range(2):
            read,write=W.HANDLE(),W.HANDLE(); check(K.CreatePipe(C.byref(read),C.byref(write),C.byref(sa),0))
            pipes.append([read,write]); check(K.SetHandleInformation(read,1,0))
        with open(os.devnull,'rb') as stdin:
            input_handle=msvcrt.get_osfhandle(stdin.fileno()); os.set_handle_inheritable(input_handle,True)
            si=STARTUPINFO(); si.cb=C.sizeof(si); si.dwFlags=0x100|0x1; si.wShowWindow=0
            si.hStdInput=input_handle; si.hStdOutput=pipes[0][1]; si.hStdError=pipes[1][1]
            cmd=C.create_unicode_buffer(subprocess.list2cmdline([str(x) for x in args]))
            env=C.create_unicode_buffer('SystemRoot=C:\\Windows\0TEMP='+str(ROOT)+'\0TMP='+str(ROOT)+'\0\0')
            check(K.CreateProcessW(str(args[0]),cmd,None,None,True,0x4|0x400|0x8000000,env,str(ROOT),C.byref(si),C.byref(pi)))
            try:
                for pair in pipes: K.CloseHandle(pair[1]); pair[1]=None
                check(K.AssignProcessToJobObject(job,pi.hProcess))
                if K.ResumeThread(pi.hThread)==0xffffffff: raise C.WinError(C.get_last_error())
                outputs=[bytearray(),bytearray()]
                while True:
                    for pair,output in zip(pipes,outputs): drain(pair[0],output)
                    wait=K.WaitForSingleObject(pi.hProcess,20)
                    if wait==0: break
                    if wait!=258: raise C.WinError(C.get_last_error())
                    if time.monotonic()-start>=wall:
                        timed_out=True; check(K.TerminateJobObject(job,124)); K.WaitForSingleObject(pi.hProcess,3000); break
                for pair,output in zip(pipes,outputs): drain(pair[0],output)
                code=W.DWORD(); check(K.GetExitCodeProcess(pi.hProcess,C.byref(code)))
                measured=EXTENDED_LIMIT(); check(K.QueryInformationJobObject(job,9,C.byref(measured),C.sizeof(measured),None))
            except BaseException:
                K.TerminateJobObject(job,125); K.TerminateProcess(pi.hProcess,125); K.WaitForSingleObject(pi.hProcess,3000); raise
            finally: K.CloseHandle(pi.hThread); K.CloseHandle(pi.hProcess)
        return {'code':code.value,'wallSeconds':round(time.monotonic()-start,3),'timedOut':timed_out,
                'hardLimits':{'memoryMiB':memory_mib,'processCpuUserSeconds':cpu,'wallSeconds':wall,'activeProcesses':1,'assignedBeforeResume':True,
                              'stdoutMaxBytes':1048576,'stderrMaxBytes':1048576},
                'peakProcessMemoryBytes':measured.PeakProcessMemoryUsed,
                'stdout':outputs[0].decode('utf-8',errors='replace'),'stderr':outputs[1].decode('utf-8',errors='replace')}
    finally:
        for pair in pipes:
            for handle in pair:
                if handle: K.CloseHandle(handle)
        K.CloseHandle(job)

def boxes(data, start, end):
    global _BOX_COUNT
    out = []
    while start < end:
        if end-start < 8: raise ValueError('MP4_BOX_HEADER')
        size, kind = struct.unpack_from('>I4s',data,start); header=8
        if size == 1:
            if end-start < 16: raise ValueError('MP4_BOX_HEADER')
            size = struct.unpack_from('>Q',data,start+8)[0]; header=16
        if size == 0: size=end-start
        if size < header or size > end-start: raise ValueError('MP4_BOX_BOUNDS')
        if len(out)>=MAX_BOXES_PER_LEVEL or _BOX_COUNT>=MAX_BOXES_TOTAL: raise ValueError('MP4_BOX_LIMIT')
        _BOX_COUNT+=1
        out.append((kind,start+header,start+size)); start+=size
    return out

def container_validate(data):
    top=boxes(data,0,len(data))
    if len([x for x in top if x[0]==b'ftyp']) != 1 or len([x for x in top if x[0]==b'moov']) != 1:
        raise ValueError('MP4_REQUIRED_BOX')
    ftyp=next(x for x in top if x[0]==b'ftyp')
    if ftyp[2]-ftyp[1]>136: raise ValueError('MP4_BRAND_LIMIT')
    brand=data[ftyp[1]:ftyp[2]]
    allowed={b'isom',b'iso2',b'iso5',b'iso6',b'avc1',b'mp41',b'mp42'}
    if len(brand)<8 or (len(brand)-8)%4 or brand[:4] not in allowed or any(brand[i:i+4] not in allowed for i in range(8,len(brand),4)):
        raise ValueError('MP4_BRAND')
    mdats=[(a,b) for k,a,b in top if k==b'mdat']
    if not mdats: raise ValueError('MP4_MDAT')
    moov=next(x for x in top if x[0]==b'moov')
    if moov[2]-moov[1]>2*1024*1024: raise ValueError('MP4_METADATA_LIMIT')
    traks=[x for x in boxes(data,moov[1],moov[2]) if x[0]==b'trak']
    if len(traks)!=1: raise ValueError('MP4_TRACK_COUNT')
    branch=traks[0]
    for key in [b'mdia',b'minf',b'stbl']:
        selected=[x for x in boxes(data,branch[1],branch[2]) if x[0]==key]
        if len(selected)!=1: raise ValueError('MP4_SAMPLE_TABLE')
        branch=selected[0]
        if key==b'minf': minf=branch
    dinf=[x for x in boxes(data,minf[1],minf[2]) if x[0]==b'dinf']
    if len(dinf)!=1: raise ValueError('MP4_DATA_REFERENCE')
    drefs=[x for x in boxes(data,dinf[0][1],dinf[0][2]) if x[0]==b'dref']
    if len(drefs)!=1: raise ValueError('MP4_DATA_REFERENCE')
    dref=drefs[0]
    if dref[2]-dref[1]<8 or data[dref[1]:dref[1]+8]!=b'\0\0\0\0\0\0\0\1': raise ValueError('MP4_DATA_REFERENCE')
    refs=boxes(data,dref[1]+8,dref[2])
    if len(refs)!=1 or refs[0][0]!=b'url ' or data[refs[0][1]:refs[0][2]]!=b'\0\0\0\1': raise ValueError('MP4_EXTERNAL_REFERENCE')
    entries=boxes(data,branch[1],branch[2]); critical={b'stsz',b'stsc',b'stco',b'co64',b'stts',b'stsd',b'stss',b'ctts'}
    names=[k for k,a,b in entries]
    if any(names.count(k)>1 for k in critical) or b'stco' in names and b'co64' in names: raise ValueError('MP4_DUPLICATE_TABLE')
    tables={k:data[a:b] for k,a,b in entries}
    def u32(payload,at):
        if at+4>len(payload): raise ValueError('MP4_TABLE_BOUNDS')
        return struct.unpack_from('>I',payload,at)[0]
    size=tables.get(b'stsz',b''); fixed=u32(size,4); count=u32(size,8)
    if not 0<count<=1000: raise ValueError('MP4_SAMPLE_LIMIT')
    if len(size)!=(12 if fixed else 12+count*4): raise ValueError('MP4_TABLE_BOUNDS')
    sizes=[fixed]*count if fixed else [u32(size,12+i*4) for i in range(count)]
    if not all(sizes): raise ValueError('MP4_EMPTY_SAMPLE')
    offsets=tables.get(b'stco',tables.get(b'co64',b'')); wide=b'stco' not in tables; chunks=u32(offsets,4)
    unit=8 if wide else 4
    if not 0<chunks<=1000 or len(offsets)!=8+chunks*unit: raise ValueError('MP4_CHUNK_LIMIT')
    offs=[struct.unpack_from('>Q' if wide else '>I',offsets,8+i*unit)[0] for i in range(chunks)]
    mapping=tables.get(b'stsc',b''); entries=u32(mapping,4)
    if not 0<entries<=chunks or len(mapping)!=8+entries*12: raise ValueError('MP4_CHUNK_MAP')
    rows=[struct.unpack_from('>III',mapping,8+i*12) for i in range(entries)]
    if rows[0][0]!=1 or any(not r[1] or r[2]!=1 or r[0]>chunks for r in rows) or any(rows[i][0]>=rows[i+1][0] for i in range(len(rows)-1)):
        raise ValueError('MP4_CHUNK_MAP')
    index=0; spans=[]
    for n,offset in enumerate(offs,1):
        per=next(r[1] for r in reversed(rows) if r[0]<=n)
        if index+per>count: raise ValueError('MP4_SAMPLE_MAP')
        length=sum(sizes[index:index+per]); index+=per
        if not any(a<=offset and offset+length<=b for a,b in mdats): raise ValueError('MP4_SAMPLE_BOUNDS')
        spans.append((offset,offset+length))
    if index!=count or any(a[1]>b[0] for a,b in zip(sorted(spans),sorted(spans)[1:])): raise ValueError('MP4_SAMPLE_MAP')
    stts=tables.get(b'stts',b''); entries=u32(stts,4)
    if not 0<entries<=1000 or len(stts)!=8+entries*8 or any(u32(stts,8+i*8)==0 or u32(stts,12+i*8)==0 for i in range(entries)) or sum(u32(stts,8+i*8) for i in range(entries))!=count:
        raise ValueError('MP4_TIME_TABLE')
    return {'topLevelBoxes':[x[0].decode('ascii','replace') for x in top],'tracks':1,'sampleCount':count,'chunks':chunks}

def validate(file, tag, model="doubao-seedance-2-0-mini-260615"):
    global _BOX_COUNT
    _BOX_COUNT=0
    st=file.lstat()
    if file.is_symlink() or getattr(st,'st_file_attributes',0)&0x400 or st.st_nlink!=1 or not 0<st.st_size<=MAX_BYTES:
        raise ValueError('MEDIA_SIZE')
    with file.open('rb') as stream: raw=stream.read(MAX_BYTES+1)
    if len(raw)!=st.st_size or not 0<len(raw)<=MAX_BYTES: raise ValueError('MEDIA_SIZE')
    structure=container_validate(raw)
    probe=bounded([FFPROBE,'-v','error','-protocol_whitelist','file,pipe','-threads','1',
                   '-show_streams','-show_format','-print_format','json',file],tag+'-probe')
    if probe['code'] or probe['timedOut'] or probe['stderr']: raise ValueError('MEDIA_PROBE')
    metadata=json.loads(probe['stdout']); streams=metadata['streams']
    if len(streams)!=1 or streams[0]['codec_type']!='video': raise ValueError('MEDIA_TRACKS')
    s=streams[0]
    if s['codec_name']!='h264' or s['pix_fmt']!='yuv420p': raise ValueError('MEDIA_CODEC')
    if model not in ('doubao-seedance-2-0-mini-260615','doubao-seedance-2-5-260628'): raise ValueError('MEDIA_MODEL')
    if (s['width'],s['height'])!=((854,480) if model=='doubao-seedance-2-5-260628' else (864,496)): raise ValueError('MEDIA_DIMENSIONS')
    if s['avg_frame_rate']!='24/1': raise ValueError('MEDIA_FRAMERATE')
    duration=round(float(s['duration'])*1000)
    if not 3900<=duration<=4100: raise ValueError('MEDIA_DURATION')
    decode=bounded([FFMPEG,'-nostdin','-hide_banner','-v','error','-xerror','-err_detect','explode',
                    '-protocol_whitelist','file,pipe','-threads','1','-max_alloc','67108864',
                    '-i',file,'-map','0:v:0','-an','-threads','1','-f','null','-',
                    '-progress','pipe:1','-nostats'],tag+'-decode')
    if decode['code'] or decode['timedOut'] or decode['stderr']: raise ValueError('MEDIA_DECODE')
    progress=dict(line.split('=',1) for line in decode['stdout'].splitlines() if '=' in line)
    if progress.get('progress')!='end' or int(progress.get('frame','0'))!=structure['sampleCount']:
        raise ValueError('MEDIA_DECODE_INCOMPLETE')
    return {'sha256':HASH(raw),'byteSize':len(raw),'structure':structure,
            'actual':{'codec':s['codec_name'],'pixelFormat':s['pix_fmt'],'width':s['width'],'height':s['height'],
                      'durationMs':duration,'frameRate':s['avg_frame_rate'],'audio':'absent','decodedFrames':int(progress['frame'])},
            'probe':probe,'decode':decode,'source':'offline-synthetic; QA only, not official result'}


def main():
    global ROOT
    base=Path(json.loads((Path(__file__).parent.parent/'integration-build.json').read_text(encoding='utf8'))['runtimeRoot'])/'media-validation'
    if len(sys.argv) not in (2,3,5): raise ValueError('MEDIA_HELPER_ARGUMENT')
    global FFMPEG, FFPROBE
    if len(sys.argv)==5:
        FFMPEG, FFPROBE=Path(sys.argv[3]),Path(sys.argv[4])
        if not FFMPEG.is_absolute() or not FFPROBE.is_absolute(): raise ValueError('MEDIA_HELPER_TOOL')
    ROOT=Path(sys.argv[1])
    if not ROOT.is_absolute() or ROOT.parent!=base or not ROOT.name.startswith('verify-'):
        raise ValueError('MEDIA_HELPER_PATH')
    for p in [ROOT,*ROOT.parents]:
        st=p.lstat()
        if p.is_symlink() or getattr(st,'st_file_attributes',0)&0x400: raise ValueError('MEDIA_HELPER_LINK')
    file=ROOT/'original.mp4'
    st=file.lstat()
    if file.is_symlink() or getattr(st,'st_file_attributes',0)&0x400 or st.st_nlink!=1 or st.st_size>MAX_BYTES:
        raise ValueError('MEDIA_HELPER_INPUT')
    value=validate(file,'media',sys.argv[2] if len(sys.argv)>=3 else 'doubao-seedance-2-0-mini-260615')
    a=value['actual']
    print(json.dumps({'sha256':value['sha256'],'size':value['byteSize'],'width':a['width'],'height':a['height'],
        'detail':{'kind':'video','container':'mp4','width':a['width'],'height':a['height'],
        'durationMs':a['durationMs'],'codec':a['codec'],'frameRate':{'numerator':24,'denominator':1},'audio':'absent'}}))

if __name__=='__main__':
    try: main()
    except Exception as error:
        # Stable error codes only. No raw media paths, metadata, or external locators in failure output.
        message=str(error)
        print(json.dumps({'error':message if message.startswith(('MEDIA_','MP4_')) and len(message)<80 else 'MEDIA_VALIDATION_FAILED'}))
        sys.exit(1)
