param([switch]$AnimeOnly)
$ErrorActionPreference = 'Stop'
$arguments = @('--voice-smoke-test'); if ($AnimeOnly) { $arguments += '--anime-voice-smoke-test' }
$process = Start-Process src-tauri/target/release/project-ruby.exe -ArgumentList $arguments -PassThru
$clock = [System.Diagnostics.Stopwatch]::StartNew()
$last = ''
try {
  while (-not $process.HasExited -and $clock.Elapsed.TotalMinutes -lt 13) {
    if (Test-Path ruby-native-voice-live.txt) {
      $progress = Get-Content ruby-native-voice-live.txt -Raw -ErrorAction SilentlyContinue
      if ($progress -ne $last) { Write-Host $progress; $last = $progress }
    }
    Start-Sleep -Seconds 2
    $process.Refresh()
  }
  if (-not $process.HasExited) { throw 'Native voice test exceeded 13 minutes; see retained progress.' }
  $process.WaitForExit()
  if (Test-Path ruby-native-voice.txt) { Get-Content ruby-native-voice.txt }
  if ($process.ExitCode -ne 0) { throw 'Native voice generation failed' }
  $names = if ($AnimeOnly) { @('anime-opal-gentle','anime-opal-playful','anime-saph-calm') } else { @('female','male','zh-female','ja-female','ja-male') }
  foreach ($gender in $names) {
    $bytes = [System.IO.File]::ReadAllBytes("$PWD/ruby-native-$gender.wav")
    if ($bytes.Length -lt 1000 -or [System.Text.Encoding]::ASCII.GetString($bytes,0,4) -ne 'RIFF') { throw "Invalid $gender WAV" }
  }
  if ($AnimeOnly) { Copy-Item ruby-native-voice.txt ruby-native-anime-voice.txt -Force }
} finally {
  if (-not $process.HasExited) { Stop-Process -Id $process.Id -Force }
}
