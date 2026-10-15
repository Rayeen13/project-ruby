$ErrorActionPreference = 'Stop'
$process = Start-Process src-tauri/target/release/project-ruby.exe -ArgumentList '--voice-smoke-test' -PassThru
$clock = [System.Diagnostics.Stopwatch]::StartNew()
$last = ''
try {
  while (-not $process.HasExited -and $clock.Elapsed.TotalMinutes -lt 13) {
    if (Test-Path ruby-native-voice-live.txt) {
      $progress = Get-Content ruby-native-voice-live.txt -Raw
      if ($progress -ne $last) { Write-Host $progress; $last = $progress }
    }
    Start-Sleep -Seconds 2
    $process.Refresh()
  }
  if (-not $process.HasExited) { throw 'Native voice test exceeded 13 minutes; see retained progress.' }
  $process.WaitForExit()
  if (Test-Path ruby-native-voice.txt) { Get-Content ruby-native-voice.txt }
  if ($process.ExitCode -ne 0) { throw 'Native voice generation failed' }
  foreach ($gender in @('female','male')) {
    $bytes = [System.IO.File]::ReadAllBytes("$PWD/ruby-native-$gender.wav")
    if ($bytes.Length -lt 1000 -or [System.Text.Encoding]::ASCII.GetString($bytes,0,4) -ne 'RIFF') { throw "Invalid $gender WAV" }
  }
} finally {
  if (-not $process.HasExited) { Stop-Process -Id $process.Id -Force }
}
