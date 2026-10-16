param([switch]$VisualOnly)
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
          && bounds.Right - bounds.Left >= 220 && bounds.Bottom - bounds.Top >= 272) {
        found = window; return false;
      }
      return true;
    }, IntPtr.Zero);
    return found;
  }
  [StructLayout(LayoutKind.Sequential)] public struct Rect { public int Left, Top, Right, Bottom; }
  [StructLayout(LayoutKind.Sequential)] public struct Point { public int X, Y; }
  [DllImport("user32.dll")] public static extern int GetWindowLong(IntPtr window, int index);
  [DllImport("user32.dll")] public static extern bool GetClientRect(IntPtr window, out Rect rect);
  [DllImport("user32.dll")] public static extern bool ClientToScreen(IntPtr window, ref Point point);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint flags, uint dx, uint dy, uint data, UIntPtr extra);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr window, out Rect rect);
}
'@
foreach ($generated in @('ruby-native-phase.txt','ruby-native-live.json','ruby-native-smoke.txt')) { if (Test-Path $generated) { Remove-Item $generated } }
$launchArguments = @('--native-smoke-test')
if ($VisualOnly) { $launchArguments += '--native-visual-only' }
$rubyProcess = Start-Process src-tauri/target/release/project-ruby.exe -ArgumentList $launchArguments -PassThru
$rubyHandle = [IntPtr]::Zero
$seen = @{}
$elapsed = [System.Diagnostics.Stopwatch]::StartNew()
$lastHeartbeat = -15
try {
  while ($elapsed.Elapsed.TotalMinutes -lt 8) {
    if ($elapsed.Elapsed.TotalSeconds - $lastHeartbeat -ge 15) {
      $lastHeartbeat = $elapsed.Elapsed.TotalSeconds
      Write-Host "Native UI elapsed: $([Math]::Round($lastHeartbeat)) seconds"
      if (Test-Path ruby-native-live.json) { Get-Content ruby-native-live.json -Raw -ErrorAction SilentlyContinue | Write-Host }
    }
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
        } elseif ($phase -in @('pin','unpin')) {
          $topmost = ([RubyBounds]::GetWindowLong($rubyHandle,-20) -band 8) -ne 0
          if ($topmost -ne ($phase -eq 'pin')) { throw "Always-on-top pin state failed: $phase" }
          "${phase}: actual Windows topmost=$topmost" | Out-File ruby-native-pin.txt -Append
        } elseif ($phase -eq 'zoom') {
          $before = New-Object RubyBounds+Rect
          [RubyBounds]::GetWindowRect($rubyHandle,[ref]$before) | Out-Null
          [RubyBounds]::SetCursorPos([int](($before.Left+$before.Right)/2),[int](($before.Top+$before.Bottom)/2)) | Out-Null
          for ($wheel=0; $wheel -lt 6; $wheel++) { [RubyBounds]::mouse_event(0x0800,0,0,120,[UIntPtr]::Zero); Start-Sleep -Milliseconds 140 }
          $after = New-Object RubyBounds+Rect
          [RubyBounds]::GetWindowRect($rubyHandle,[ref]$after) | Out-Null
          if ($after.Right-$after.Left -le $before.Right-$before.Left) { throw 'Mouse wheel did not enlarge native canvas' }
          "Wheel resize: $($before.Right-$before.Left)x$($before.Bottom-$before.Top) -> $($after.Right-$after.Left)x$($after.Bottom-$after.Top)" | Out-File ruby-native-zoom.txt
        } elseif ($phase -in @('gaze_far','gaze_near')) {
          $work = [System.Windows.Forms.Screen]::FromHandle($rubyHandle).WorkingArea
          $gazeX = if ($phase -eq 'gaze_far') { $work.Right-80 } else { $work.Left+80 }
          [RubyBounds]::SetCursorPos($gazeX,($work.Top+300)) | Out-Null
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
        } elseif ($phase -in @('menu','float','dizzy','zoom_view','left','right','chat','chat_lab','setup','opal','languages','opal_classic','opal_rose','opal_evening','opal_work','dizzy_classic','dizzy_cyber','dizzy_chibi','dizzy_office','dizzy_gamer','dizzy_opal') -and $rubyHandle -ne [IntPtr]::Zero) {
          $bounds = New-Object RubyBounds+Rect
          if (-not [RubyBounds]::GetWindowRect($rubyHandle,[ref]$bounds)) { throw 'Cannot capture native window bounds' }
          $clientOrigin = New-Object RubyBounds+Point
          [RubyBounds]::ClientToScreen($rubyHandle,[ref]$clientOrigin) | Out-Null
          $clientBounds = New-Object RubyBounds+Rect
          [RubyBounds]::GetClientRect($rubyHandle,[ref]$clientBounds) | Out-Null
          $topInset = $clientOrigin.Y - $bounds.Top
          "${phase}: visible window ($($bounds.Left),$($bounds.Top)) $($bounds.Right-$bounds.Left)x$($bounds.Bottom-$bounds.Top), client top inset $topInset" | Tee-Object -FilePath ruby-native-frame.txt -Append
          if ($phase -eq 'chat_lab' -and $topInset -lt 20) { throw 'Studio is missing its native Windows title bar' }
          if ($phase -eq 'float' -and $topInset -gt 2) { throw 'Floating Companion has an unwanted native title bar' }
          $screen = [System.Windows.Forms.Screen]::FromHandle($rubyHandle)
          if ($phase -in @('zoom_view','chat_lab') -and ($bounds.Left -lt $screen.WorkingArea.Left -or $bounds.Top -lt $screen.WorkingArea.Top -or $bounds.Right -gt $screen.WorkingArea.Right -or $bounds.Bottom -gt $screen.WorkingArea.Bottom)) { throw 'Zoomed canvas extends beyond usable screen' }
          if ($phase -eq 'left' -and $bounds.Left -ge $screen.WorkingArea.Left) { throw 'Left peek is not at the actual screen edge' }
          if ($phase -eq 'right' -and $bounds.Right -le $screen.WorkingArea.Right) { throw 'Right peek is not at the actual screen edge' }
          $captureLeft = [Math]::Max($bounds.Left,$screen.Bounds.Left)
          $captureTop = [Math]::Max($bounds.Top,$screen.Bounds.Top)
          $width = [Math]::Min($bounds.Right,$screen.Bounds.Right)-$captureLeft
          $height = [Math]::Min($bounds.Bottom,$screen.Bounds.Bottom)-$captureTop
          $bitmap = New-Object System.Drawing.Bitmap($width,$height)
          $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
          try {
            $graphics.CopyFromScreen($captureLeft,$captureTop,0,0,$bitmap.Size)
            $bitmap.Save("$PWD/ruby-native-$phase.png",[System.Drawing.Imaging.ImageFormat]::Png)
          } finally { $graphics.Dispose(); $bitmap.Dispose() }
          if ($phase -in @('float','dizzy','zoom_view','left','right','chat') -and $topInset -gt 8) { throw 'Floating Companion has an unwanted title bar' }
          if ($phase -in @('left','right')) {
            $hoverX = if ($phase -eq 'left') { $screen.WorkingArea.Left+80 } else { $screen.WorkingArea.Right-80 }
            [RubyBounds]::SetCursorPos($hoverX,[int]($bounds.Top+($bounds.Bottom-$bounds.Top)*0.45)) | Out-Null
          }
        }
      }
    }
    Start-Sleep -Milliseconds 100
  }
  $rubyProcess.Refresh()
  if (-not $rubyProcess.HasExited) { throw 'Native smoke test timed out' }
  $rubyProcess.WaitForExit()
  if (-not (Test-Path ruby-native-smoke.txt)) { throw 'Native app did not report smoke results' }
  if (Test-Path ruby-native-smoke.txt) { Get-Content ruby-native-smoke.txt }
  if ($rubyProcess.ExitCode -ne 0) { throw 'Native WebView smoke checks failed' }
  if ($VisualOnly) { return }
  if (-not (Test-Path ruby-native-carry.txt)) { throw 'Missing real native carry evidence' }
  Get-Content ruby-native-smoke.txt
  if ($rubyProcess.ExitCode -ne 0) { throw 'Native WebView smoke checks failed' }
  foreach ($phase in @('menu','float','dizzy','left','right')) {
    if (-not (Test-Path "ruby-native-$phase.png")) { throw "Missing native $phase screenshot" }
  }
  Move-Item ruby-native-smoke.txt ruby-native-first.txt -Force
  $rubyProcess = Start-Process src-tauri/target/release/project-ruby.exe -ArgumentList '--native-smoke-test','--native-smoke-restart' -PassThru
  if (-not $rubyProcess.WaitForExit(30000)) { throw 'Native settings restart check timed out' }
  if ($rubyProcess.ExitCode -ne 0) { Get-Content ruby-native-smoke.txt; throw 'Native settings were not restored' }
  $restartReport = Get-Content ruby-native-smoke.txt -Raw
  Get-Content ruby-native-first.txt | Set-Content ruby-native-smoke.txt
  $restartReport | Add-Content ruby-native-smoke.txt
  Get-Content ruby-native-smoke.txt
} finally {
  if (-not $rubyProcess.HasExited) { Stop-Process -Id $rubyProcess.Id -Force }
}
