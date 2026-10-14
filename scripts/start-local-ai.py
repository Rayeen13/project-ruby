"""Opt-in Windows CPU candidate. Downloads are separate from Ruby's installer."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import subprocess
import time
import urllib.request
import zipfile


def verified_download(url, path, expected, limit):
    if path.exists():
        with path.open('rb') as cached:
            if hashlib.file_digest(cached, 'sha256').hexdigest() == expected:
                return
    temporary = path.with_suffix(path.suffix + '.part')
    digest, size = hashlib.sha256(), 0
    try:
        with urllib.request.urlopen(url, timeout=120) as response, temporary.open('wb') as target:
            while chunk := response.read(1024 * 1024):
                size += len(chunk)
                if size > limit:
                    raise RuntimeError('Download exceeds the configured size limit')
                target.write(chunk)
                digest.update(chunk)
        if digest.hexdigest() != expected:
            raise RuntimeError('Download checksum mismatch; nothing will be executed')
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--verify', action='store_true', help='Run live provider and Windows WebView checks, then unload')
    args = parser.parse_args()
    if platform.system() != 'Windows':
        raise RuntimeError('This pinned runtime is Windows x64 only. Other platforms can use their own llama.cpp server.')
    try:
        with urllib.request.urlopen('http://127.0.0.1:8081/health', timeout=1):
            pass
    except OSError:
        pass
    else:
        raise RuntimeError('Port 8081 already has a model server. Use Talk / Connect, or close that server first.')
    cache = Path(os.getenv('LOCALAPPDATA', Path.home())) / 'ProjectRuby' / 'experimental-ai'
    cache.mkdir(parents=True, exist_ok=True)
    model = cache / 'qwen2.5-0.5b-instruct-q4_k_m.gguf'
    print('Experimental Qwen candidate: separate 491 MB model + CPU runtime. First setup needs internet.', flush=True)
    verified_download('https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/9217f5db79a29953eb74d5343926648285ec7e67/' + model.name,
                      model, '74a4da8c9fdbcd15bd1f6d01d621410d31c6fc00986f5eb687824e7b93d7a9db', 500000000)
    archive = cache / 'llama-b11433.zip'
    verified_download('https://github.com/ggml-org/llama.cpp/releases/download/b11433/llama-b11433-bin-win-cpu-x64.zip',
                      archive, '301943380e45deae3991d42dddd03fae65c6a4963a5d882328a60208b43aa9e0', 25000000)
    runtime = cache / 'runtime'
    # Re-extract verified bytes on each start so altered cached executables are not trusted.
    with zipfile.ZipFile(archive) as package:
        for entry in package.infolist():
            if not (runtime / entry.filename).resolve().is_relative_to(runtime.resolve()):
                raise RuntimeError('Unexpected runtime archive path')
        package.extractall(runtime)
    upstream = 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct/resolve/7ae557604adf67be50417f59c2c2f167def9a775/'
    # Licence and tokenizer assets remain with the user's separate model cache.
    for filename, url in [('Qwen-LICENSE', upstream + 'LICENSE'), ('llama-LICENSE', 'https://raw.githubusercontent.com/ggml-org/llama.cpp/b11433/LICENSE'), ('tokenizer_config.json', upstream + 'tokenizer_config.json')]:
        path = cache / filename
        if not path.exists():
            with urllib.request.urlopen(url, timeout=60) as response:
                data = response.read(2000000)
            path.write_bytes(data)
    if 'Apache License' not in (cache / 'Qwen-LICENSE').read_text(encoding='utf-8') or 'MIT' not in (cache / 'llama-LICENSE').read_text(encoding='utf-8'):
        raise RuntimeError('Upstream licence notice is missing')
    template = json.loads((cache / 'tokenizer_config.json').read_text(encoding='utf-8'))['chat_template']
    if hashlib.sha256(template.encode()).hexdigest() != 'cd8e9439f0570856fd70470bf8889ebd8b5d1107207f67a5efb46e342330527f':
        raise RuntimeError('Publisher chat template changed or is corrupt')
    template_path = cache / 'chat-template.jinja'
    template_path.write_text(template, encoding='utf-8')
    executables = list(runtime.rglob('llama-server.exe'))
    if len(executables) != 1:
        raise RuntimeError('Expected one CPU inference server')
    # No OS tools, shell execution or public bind is enabled in the model server.
    command = [str(executables[0]), '-m', str(model), '-c', '2048', '-t', '2', '-ngl', '0', '--host', '127.0.0.1', '--port', '8081', '--alias', 'ruby-local', '--jinja', '--chat-template-file', str(template_path)]
    with (cache / 'server.log').open('w', encoding='utf-8') as log:
        server = subprocess.Popen(command, stdout=log, stderr=log)
        try:
            for _ in range(300):
                if server.poll() is not None:
                    raise RuntimeError('Local AI exited. Check ' + str(cache / 'server.log'))
                try:
                    with urllib.request.urlopen('http://127.0.0.1:8081/health', timeout=1) as response:
                        if response.status == 200:
                            break
                except OSError:
                    time.sleep(.2)
            else:
                raise RuntimeError('Local AI startup timed out')
            print('Local AI ready. Open Ruby / Talk / Connect. Ctrl+C unloads the model.', flush=True)
            if args.verify:
                root = Path(__file__).resolve().parents[1]
                subprocess.run(['node', 'tests/chat-live.mjs'], cwd=root, check=True)
                subprocess.run(['pwsh', '-File', 'scripts/windows-smoke.ps1'], cwd=root, check=True)
            else:
                server.wait()
        finally:
            if server.poll() is None:
                server.terminate()
                try:
                    server.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    server.kill()
                    server.wait()


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('Local model unloaded.')
