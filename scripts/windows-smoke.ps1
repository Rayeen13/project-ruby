$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class RubyBounds {
  [StructLayout(LayoutKind.Sequential)] public struct Rect { public int Left, Top, Right, Bottom; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr window, out Rect rect);
}
'@
$rubyProcess = Start-Process src-tauri/target/release/project-ruby.exe -ArgumentList '--native-smoke-test' -PassThru
$rubyHandle = [IntPtr]::Zero
$seen = @{}
try {
  for ($tick = 0; $tick -lt 1200; $tick++) {
    $rubyProcess.Refresh()
    if ($rubyProcess.HasExited) { break }
    if ($rubyHandle -eq [IntPtr]::Zero) { $rubyHandle = $rubyProcess.MainWindowHandle }
    if (Test-Path ruby-native-phase.txt) {
      $phase = (Get-Content ruby-native-phase.txt -Raw).Trim()
      if (-not $seen.ContainsKey($phase)) {
        $seen[$phase] = $true
        if ($phase -eq 'recovery') {
          [System.Windows.Forms.SendKeys]::SendWait('^%+r')
        } elseif ($phase -in @('menu','float') -and $rubyHandle -ne [IntPtr]::Zero) {
          $bounds = New-Object RubyBounds+Rect
          if (-not [RubyBounds]::GetWindowRect($rubyHandle,[ref]$bounds)) { throw 'Cannot capture native window bounds' }
          $width = $bounds.Right - $bounds.Left
          $height = $bounds.Bottom - $bounds.Top
          $bitmap = New-Object System.Drawing.Bitmap($width,$height)
          $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
          try {
            $graphics.CopyFromScreen($bounds.Left,$bounds.Top,0,0,$bitmap.Size)
            $bitmap.Save("$PWD/ruby-native-$phase.png",[System.Drawing.Imaging.ImageFormat]::Png)
          } finally { $graphics.Dispose(); $bitmap.Dispose() }
        }
      }
    }
    Start-Sleep -Milliseconds 100
  }
  $rubyProcess.Refresh()
  if (-not $rubyProcess.HasExited) { throw 'Native smoke test timed out' }
  $rubyProcess.WaitForExit()
  if (-not (Test-Path ruby-native-smoke.txt)) { throw 'Native app did not report smoke results' }
  Get-Content ruby-native-smoke.txt
  if ($rubyProcess.ExitCode -ne 0) { throw 'Native WebView smoke checks failed' }
  foreach ($phase in @('menu','float')) {
    if (-not (Test-Path "ruby-native-$phase.png")) { throw "Missing native $phase screenshot" }
  }
} finally {
  if (-not $rubyProcess.HasExited) { Stop-Process -Id $rubyProcess.Id -Force }
}
