$ErrorActionPreference = 'Stop'
$cache = Join-Path $PWD '.voice-audition-cache'
$out = Join-Path $PWD 'voice-audition'
New-Item -ItemType Directory -Force $cache,$out | Out-Null
function Verified-Download($url,$path,$sha) {
  if (!(Test-Path $path) -or (Get-FileHash $path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $sha) {
    Invoke-WebRequest $url -OutFile "$path.part"
    if ((Get-FileHash "$path.part" -Algorithm SHA256).Hash.ToLowerInvariant() -ne $sha) { throw 'Download checksum mismatch' }
    Move-Item "$path.part" $path -Force
  }
}
$model = Join-Path $cache 'Irodori-TTS-866M-MF-v4.1-Q4_K.gguf'
Verified-Download 'https://huggingface.co/sakasegawa/Irodori-TTS-v4.1-Small-MF-GGUF/resolve/205ab071cb54e46509a84d3a48535df283bc3b0f/Irodori-TTS-866M-MF-v4.1-Q4_K.gguf' $model '1913bf74000a3300c703eb91c985a4e5c4d7a2bbeb0cc7fe07d1583c4fea9729'
$zip = Join-Path $cache 'speech-0810.zip'
Verified-Download 'https://github.com/nyosegawa/speech.cpp/releases/download/v0.8.10/speech-0.8.10-windows-x64-vulkan.zip' $zip '2904dd54de7f18cf438338c28216ebffc205d29c6a2de3e645af40dd136b92f2'
Expand-Archive $zip (Join-Path $cache 'runtime') -Force
$exe = (Get-ChildItem (Join-Path $cache 'runtime') -Recurse -Filter speech.exe | Select-Object -First 1).FullName
if (!$exe) { throw 'speech.cpp executable missing' }
$profiles = @(
 @{id='opal-gentle';seed='13013';style='成人女性のアニメキャラクター。上品なメイドの声。柔らかく落ち着いて、自然な会話のように。';text='おかえりなさい。今日はゆっくり、お話ししましょう。'},
 @{id='opal-playful';seed='13013';style='成人女性のアニメキャラクター。上品なメイドの声。少し皮肉っぽく、楽しそうに、明るく話してください。';text='ふふ、また無理をしていたんですね。少し休んだらどうですか。'},
 @{id='saph-calm';seed='24024';style='成人男性のアニメキャラクター。優しく落ち着いた低めの声で、親しみやすく自然に話してください。';text='おかえり。今日もお疲れさま。何か一緒に考えようか。'}
)
$report = @()
foreach ($profile in $profiles) {
 $wav = Join-Path $out ($profile.id+'.wav')
 $start = [System.Diagnostics.ProcessStartInfo]::new($exe)
 $start.WorkingDirectory = Split-Path $exe
 $start.UseShellExecute = $false
 $start.RedirectStandardError = $true
 $start.RedirectStandardOutput = $true
 foreach ($arg in @('tts',$model,'--device','cpu','--threads','2','--voice','none','--language','ja','--steps','4','--seed',$profile.seed,'--instructions',$profile.style,'-o',$wav,'--',$profile.text)) { $start.ArgumentList.Add($arg) }
 $timer = [System.Diagnostics.Stopwatch]::StartNew()
 $process = [System.Diagnostics.Process]::Start($start)
 $stderr = $process.StandardError.ReadToEndAsync()
 $stdout = $process.StandardOutput.ReadToEndAsync()
 if (!$process.WaitForExit(180000)) { $process.Kill($true); throw 'CPU audition timed out' }
 $log = $stderr.GetAwaiter().GetResult()
 $log | Set-Content (Join-Path $out ($profile.id+'.log')) -Encoding utf8
 if ($process.ExitCode -ne 0) { throw "Synthesis failed: $log" }
 $bytes = [System.IO.File]::ReadAllBytes($wav)
 if ($bytes.Length -lt 48044 -or [System.Text.Encoding]::ASCII.GetString($bytes,0,4) -ne 'RIFF') { throw 'Invalid or too-short WAV' }
 $report += @{id=$profile.id;device='CPU audition; GPU requires physical-device trial';elapsedSeconds=$timer.Elapsed.TotalSeconds;bytes=$bytes.Length;sha256=(Get-FileHash $wav -Algorithm SHA256).Hash;instructions=$profile.style;text=$profile.text}
}
$report | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $out 'audition.json') -Encoding utf8
'Original caption-designed adult character voices. No actor reference recording. Code/model MIT; upstream additional ethical restrictions and codec notices apply. This CPU audition does not establish RTX 2050 latency or human-rated anime voice quality.' | Set-Content (Join-Path $out 'README.txt') -Encoding utf8
