"""Windows CPU experiment. Downloads stay outside Git and never enter the app bundle."""
import ctypes
import hashlib
import json
import os
from pathlib import Path
import platform
import subprocess
import time
import urllib.error
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / 'models/evaluation.json').read_text(encoding='utf-8'))
CACHE = ROOT / 'model-eval-cache'
OUT = ROOT / 'model-evaluation-results'
CACHE.mkdir(exist_ok=True)
OUT.mkdir(exist_ok=True)


def request_json(url, data=None):
    headers = {'User-Agent': 'Project-Ruby-model-evaluation'}
    if url.startswith('https://api.github.com/') and os.getenv('GH_TOKEN'):
        headers['Authorization'] = 'Bearer ' + os.environ['GH_TOKEN']
    if data is not None:
        headers['Content-Type'] = 'application/json'
    request = urllib.request.Request(url, data=json.dumps(data).encode() if data is not None else None, headers=headers)
    with urllib.request.urlopen(request, timeout=180) as response:
        return json.load(response)


def download(url, path, expected_hash, limit):
    request = urllib.request.Request(url, headers={'User-Agent': 'Project-Ruby-model-evaluation'})
    digest, size = hashlib.sha256(), 0
    with urllib.request.urlopen(request, timeout=180) as response, path.open('wb') as target:
        while chunk := response.read(1024 * 1024):
            size += len(chunk)
            if size > limit:
                raise RuntimeError('Download exceeds configured experiment limit')
            digest.update(chunk)
            target.write(chunk)
    actual = digest.hexdigest()
    if actual != expected_hash:
        raise RuntimeError('Downloaded bytes do not match the expected SHA256')
    return {'bytes': size, 'sha256': actual}


class MemoryCounters(ctypes.Structure):
    _fields_ = [('cb', ctypes.c_ulong), ('PageFaultCount', ctypes.c_ulong)] + [
        (name, ctypes.c_size_t) for name in ['PeakWorkingSetSize', 'WorkingSetSize', 'QuotaPeakPagedPoolUsage',
        'QuotaPagedPoolUsage', 'QuotaPeakNonPagedPoolUsage', 'QuotaNonPagedPoolUsage', 'PagefileUsage', 'PeakPagefileUsage']]


def memory(pid):
    kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    kernel.OpenProcess.restype = ctypes.c_void_p
    kernel.CloseHandle.argtypes = [ctypes.c_void_p]
    handle = kernel.OpenProcess(0x0410, False, pid)
    if not handle:
        return None
    try:
        counters = MemoryCounters()
        counters.cb = ctypes.sizeof(counters)
        api = ctypes.WinDLL('psapi').GetProcessMemoryInfo
        api.argtypes = [ctypes.c_void_p, ctypes.POINTER(MemoryCounters), ctypes.c_ulong]
        if not api(handle, ctypes.byref(counters), counters.cb):
            return None
        return counters.PeakWorkingSetSize
    finally:
        kernel.CloseHandle(handle)


def main():
    if platform.system() != 'Windows':
        raise RuntimeError('This experiment measures the Windows CPU host')
    candidate, runtime = CONFIG['candidate'], CONFIG['runtime']
    # A reused results directory must not inherit another model's licence evidence.
    for old in OUT.glob('upstream-*'):
        if old.is_file():
            old.unlink()
    metadata = {}
    for role, repo in [('upstream', candidate['upstream']), ('conversion', candidate['conversion'])]:
        item = request_json('https://huggingface.co/api/models/' + repo)
        metadata[role] = {'repository': repo, 'revision': item['sha'], 'declaredLicense': item.get('cardData', {}).get('license')}
        if metadata[role]['declaredLicense'] != 'mit':
            raise RuntimeError('MIT metadata gate failed: ' + repo)
    upstream_revision = metadata['upstream']['revision']
    if candidate.get('upstreamRevision') and upstream_revision != candidate['upstreamRevision']:
        raise RuntimeError('Upstream revision changed; review the new publisher assets first')
    for filename in ['LICENSE', 'README.md', 'tokenizer_config.json', 'tokenizer.json', 'tokenizer.model', 'special_tokens_map.json', 'added_tokens.json', 'vocab.json', 'merges.txt']:
        url = f"https://huggingface.co/{candidate['upstream']}/resolve/{upstream_revision}/{filename}"
        try:
            with urllib.request.urlopen(url, timeout=60) as response:
                data = response.read(20_000_001)
            if len(data) > 20_000_000:
                raise RuntimeError('Tokenizer metadata exceeds audit bound')
            (OUT / ('upstream-' + filename)).write_bytes(data)
        except urllib.error.HTTPError as error:
            if error.code != 404:
                raise
    license_path = OUT / 'upstream-LICENSE'
    notice_present = license_path.exists() and 'MIT License' in license_path.read_text(encoding='utf-8')
    if not notice_present:
        # This explicit research exception does not approve shipping or replace a copyright notice.
        readme = (OUT / 'upstream-README.md').read_text(encoding='utf-8')
        if candidate.get('licenseEvidence') != 'publisher-declaration-research-only' or 'license: mit' not in readme:
            raise RuntimeError('Actual upstream MIT notice missing')
    revision = metadata['conversion']['revision']
    model = CACHE / candidate['filename']
    model_info = download(f"https://huggingface.co/{candidate['conversion']}/resolve/{revision}/{candidate['filename']}",
                          model, candidate['sha256'], CONFIG['maxModelDownloadBytes'])
    release = request_json(f"https://api.github.com/repos/{runtime['repository']}/releases/tags/{runtime['release']}")
    assets = [asset for asset in release['assets'] if asset['name'].endswith(runtime['assetSuffix'])]
    if len(assets) != 1 or not assets[0].get('digest', '').startswith('sha256:'):
        raise RuntimeError('A unique official CPU runtime and published SHA256 are required')
    asset = assets[0]
    if asset['digest'] != 'sha256:' + runtime['sha256']:
        raise RuntimeError('Official runtime digest differs from the audited configuration')
    archive = CACHE / 'runtime.zip'
    runtime_info = download(asset['browser_download_url'], archive, asset['digest'].split(':')[1], 200_000_000)
    runtime_dir = CACHE / 'runtime'
    with zipfile.ZipFile(archive) as package:
        for member in package.infolist():
            target = (runtime_dir / member.filename).resolve()
            if not target.is_relative_to(runtime_dir.resolve()):
                raise RuntimeError('Unexpected archive path')
        package.extractall(runtime_dir)
    executables = list(runtime_dir.rglob('llama-server.exe'))
    if len(executables) != 1:
        raise RuntimeError('Runtime archive must contain one llama-server.exe')
    with urllib.request.urlopen(f"https://raw.githubusercontent.com/{runtime['repository']}/{runtime['release']}/LICENSE", timeout=60) as response:
        (OUT / 'runtime-LICENSE').write_bytes(response.read(100_000))
    native_bytes = sum(file.stat().st_size for file in runtime_dir.rglob('*') if file.is_file() and file.suffix in ['.exe', '.dll'])
    base = 'http://127.0.0.1:18889'
    results = []
    with (OUT / 'server.log').open('w', encoding='utf-8') as log:
        start = time.perf_counter()
        server = subprocess.Popen([str(executables[0]), '-m', str(model), '-c', str(CONFIG['contextTokens']),
                                   '-t', str(CONFIG['threads']), '-ngl', '0', '--host', '127.0.0.1', '--port', '18889', '--slots'],
                                  stdout=log, stderr=log)
        try:
            for _ in range(600):
                if server.poll() is not None:
                    raise RuntimeError('Inference server exited during loading; inspect server.log')
                try:
                    request_json(base + '/health')
                    break
                except (urllib.error.URLError, TimeoutError):
                    time.sleep(.1)
            else:
                raise RuntimeError('Model load timed out')
            cold_load = time.perf_counter() - start
            props = request_json(base + '/props')
            (OUT / 'server-properties.json').write_text(json.dumps(props, indent=2), encoding='utf-8')
            tokenizer_config = json.loads((OUT / 'upstream-tokenizer_config.json').read_text(encoding='utf-8'))
            if any('messages' in case for case in CONFIG['prompts']):
                if props.get('chat_template') != tokenizer_config.get('chat_template'):
                    raise RuntimeError('GGUF chat template differs from the archived upstream template')
            for case in CONFIG['prompts']:
                prompt = request_json(base + '/apply-template', {'messages': case['messages']})['prompt'] if 'messages' in case else case['text']
                payload = {'prompt': prompt, 'n_predict': CONFIG['maxReplyTokens'], 'stream': True,
                           'temperature': 0, 'seed': 42, 'cache_prompt': False, 'stop': CONFIG.get('stop', ['\nUser:'])}
                request = urllib.request.Request(base + '/completion', data=json.dumps(payload).encode(),
                                                 headers={'Content-Type': 'application/json'})
                begin, first, output, final = time.perf_counter(), None, '', {}
                with urllib.request.urlopen(request, timeout=120) as stream:
                    for line in stream:
                        if not line.startswith(b'data: '):
                            continue
                        part = json.loads(line[6:])
                        text = part.get('content', '')
                        if text and first is None:
                            first = time.perf_counter() - begin
                        output += text
                        if part.get('stop'):
                            final = part
                results.append({'id': case['id'], 'prompt': prompt, 'messages': case.get('messages'), 'reply': output, 'reviewCriterion': case['review'],
                                'firstTextSeconds': first, 'totalSeconds': time.perf_counter() - begin,
                                'timings': final.get('timings'), 'peakWorkingSetBytes': memory(server.pid)})
            report = {'schemaVersion': 1, 'dateUtc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                      'host': {'system': platform.platform(), 'cpu': platform.processor(), 'logicalCPUs': os.cpu_count()},
                      'candidate': candidate, 'metadata': metadata, 'model': model_info,
                      'licenseNoticePresent': notice_present, 'redistributionApproved': False,
                      'runtime': {**runtime_info, 'release': runtime['release'], 'asset': asset['name'], 'extractedExecutableBytes': native_bytes},
                      'configuration': {'threads': CONFIG['threads'], 'contextTokens': CONFIG['contextTokens'], 'gpuLayers': 0},
                      'coldLoadSeconds': cold_load, 'samples': results, 'defaultApproved': False,
                      'limitations': ['Hosted CPU is not the user laptop or an iGPU benchmark.',
                                      'Quality requires human review; instruction tuning does not imply passing.',
                                      'Cancellation, browser inference, tokenizer conversion correspondence and complete product size remain unverified.']}
            (OUT / 'results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            print(json.dumps({'coldLoadSeconds': cold_load, 'modelBytes': model_info['bytes'], 'samples': len(results)}))
        finally:
            server.terminate()
            try:
                server.wait(timeout=10)
            except subprocess.TimeoutExpired:
                server.kill()
                server.wait()


if __name__ == '__main__':
    main()
