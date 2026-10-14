$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class RubyBounds {
  private delegate bool WindowCallback(IntPtr window, IntPtr parameter);
  [DllImport("user32.dll")] private static extern bool EnumWindows(WindowCallback callback, IntPtr parameter);
  [DllImport("user32.dll")] private static extern uint GetWindowThreadProcessId(IntPtr window, out uint processId);
  [DllImport("user32.dll")] private static extern bool IsWindowVisible(IntPtr window);
  public static IntPtr FindCompanion(uint processId) {
    IntPtr found = IntPtr.Zero;
    EnumWindows((window, parameter) => {
      uint owner; GetWindowThreadProcessId(window, out owner);
      Rect bounds;
      if (owner == processId && IsWindowVisible(window) && GetWindowRect(window, out bounds)
          && bounds.Right - bounds.Left >= 280 && bounds.Bottom - bounds.Top >= 340) {
        found = window; return false;
      }
      return true;
    }, IntPtr.Zero);
    return found;
  }
  [StructLayout(LayoutKind.Sequential)] public struct Rect { public int Left, Top, Right, Bottom; }
  [DllImport("user32.dll")] public static extern int GetWindowLong(IntPtr window, int index);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint flags, uint dx, uint dy, uint data, UIntPtr extra);
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
    $rubyHandle = [RubyBounds]::FindCompanion([uint32]$rubyProcess.Id)
    if ($rubyHandle -eq [IntPtr]::Zero) { Start-Sleep -Milliseconds 100; continue }
    if (Test-Path ruby-native-phase.txt) {
      $phase = (Get-Content ruby-native-phase.txt -Raw).Trim()
      if (-not $seen.ContainsKey($phase)) {
        $seen[$phase] = $true
        if ($phase -eq 'recovery') {
          [System.Windows.Forms.SendKeys]::SendWait('^%+r')
        } elseif ($phase -eq 'look') {
          [RubyBounds]::SetCursorPos(20,20) | Out-Null
        } elseif ($phase -eq 'click' -and $rubyHandle -ne [IntPtr]::Zero) {
          $bounds = New-Object RubyBounds+Rect
          [RubyBounds]::GetWindowRect($rubyHandle,[ref]$bounds) | Out-Null
          $cx = [int](($bounds.Left + $bounds.Right) / 2)
          $cy = [int]($bounds.Top + ($bounds.Bottom - $bounds.Top) * 0.45)
          [RubyBounds]::SetCursorPos($cx,$cy) | Out-Null
          [RubyBounds]::mouse_event(2,0,0,0,[UIntPtr]::Zero)
          Start-Sleep -Milliseconds 300
          [RubyBounds]::mouse_event(4,0,0,0,[UIntPtr]::Zero)
        } elseif ($phase -eq 'carry' -and $rubyHandle -ne [IntPtr]::Zero) {
          $before = New-Object RubyBounds+Rect
          if (-not [RubyBounds]::GetWindowRect($rubyHandle,[ref]$before)) { throw 'Cannot read native carry bounds' }
          $cx = [int](($before.Left + $before.Right) / 2)
          $cy = [int]($before.Top + ($before.Bottom - $before.Top) * 0.45)
          [RubyBounds]::SetCursorPos($cx,$cy) | Out-Null
          [RubyBounds]::mouse_event(2,0,0,0,[UIntPtr]::Zero)
          $moved = $false
          $trajectory = @()
          try {
            Start-Sleep -Milliseconds 650
            foreach ($delta in @(60,-60,60,-60,60)) {
              [RubyBounds]::SetCursorPos(($cx + $delta),$cy) | Out-Null
              Start-Sleep -Milliseconds 120
              $sample = New-Object RubyBounds+Rect
              [RubyBounds]::GetWindowRect($rubyHandle,[ref]$sample) | Out-Null
              $trajectory += "($($sample.Left),$($sample.Top))"
              $moved = $moved -or $sample.Left -ne $before.Left -or $sample.Top -ne $before.Top
            }
          } finally { [RubyBounds]::mouse_event(4,0,0,0,[UIntPtr]::Zero) }
          Start-Sleep -Milliseconds 150
          $after = New-Object RubyBounds+Rect
          [RubyBounds]::GetWindowRect($rubyHandle,[ref]$after) | Out-Null
          "Actual native carry: ($($before.Left),$($before.Top)) -> $($trajectory -join ' -> ') -> ($($after.Left),$($after.Top)); movement observed: $moved" | Tee-Object -FilePath ruby-native-carry.txt
          if (-not $moved) {
            for ($reportTick=0; $reportTick -lt 180 -and -not (Test-Path ruby-native-smoke.txt); $reportTick++) { Start-Sleep -Milliseconds 100 }
            if (Test-Path ruby-native-smoke.txt) { Get-Content ruby-native-smoke.txt }
            throw 'Mesh carry did not move the actual native window'
          }
        } elseif ($phase -in @('menu','float','dizzy') -and $rubyHandle -ne [IntPtr]::Zero) {
          $bounds = New-Object RubyBounds+Rect
          if (-not [RubyBounds]::GetWindowRect($rubyHandle,[ref]$bounds)) { throw 'Cannot capture native window bounds' }
          if (([RubyBounds]::GetWindowLong($rubyHandle,-16) -band 0x00C00000) -ne 0) { throw 'Native caption/frame is still present' }
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
  if (-not (Test-Path ruby-native-carry.txt)) { throw 'Missing real native carry evidence' }
  Get-Content ruby-native-smoke.txt
  if ($rubyProcess.ExitCode -ne 0) { throw 'Native WebView smoke checks failed' }
  foreach ($phase in @('menu','float','dizzy')) {
    if (-not (Test-Path "ruby-native-$phase.png")) { throw "Missing native $phase screenshot" }
  }
} finally {
  if (-not $rubyProcess.HasExited) { Stop-Process -Id $rubyProcess.Id -Force }
}
