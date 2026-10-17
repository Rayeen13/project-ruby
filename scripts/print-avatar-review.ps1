$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$names = @('classic','rose','evening','work')
if (-not (Test-Path 'ruby-native-opal_classic.png')) { Write-Host 'No rendered avatar review is available'; exit 0 }
$sheet = [System.Drawing.Bitmap]::new(1260,1320)
$graphics = [System.Drawing.Graphics]::FromImage($sheet)
$graphics.Clear([System.Drawing.Color]::FromArgb(11,17,27))
$font = [System.Drawing.Font]::new('Arial',18)
try {
  for ($i=0; $i -lt 4; $i++) {
    $path = "ruby-native-opal_$($names[$i]).png"
    if (-not (Test-Path $path)) { continue }
    $image = [System.Drawing.Image]::FromFile((Join-Path $PWD $path))
    try {
      $x = ($i % 2) * 630
      $y = [int][Math]::Floor($i / 2) * 660
      $graphics.DrawString($names[$i],$font,[System.Drawing.Brushes]::White,[float]($x+14),[float]($y+4))
      $source = [System.Drawing.Rectangle]::new(0,95,[Math]::Min(630,$image.Width),[Math]::Min(625,$image.Height-95))
      $destination = [System.Drawing.Rectangle]::new($x,$y+30,630,625)
      $graphics.DrawImage($image,$destination,$source,[System.Drawing.GraphicsUnit]::Pixel)
    } finally { $image.Dispose() }
  }
  $stream = [System.IO.MemoryStream]::new()
  try {
    $sheet.Save($stream,[System.Drawing.Imaging.ImageFormat]::Jpeg)
    $encoded = [Convert]::ToBase64String($stream.ToArray())
    for ($offset=0; $offset -lt $encoded.Length; $offset+=3000) { Write-Host ('RUBY_PREVIEW_DATA '+$encoded.Substring($offset,[Math]::Min(3000,$encoded.Length-$offset))) }
  } finally { $stream.Dispose() }
} finally { $font.Dispose(); $graphics.Dispose(); $sheet.Dispose() }
# A full Lab image supplements the avatar-only sheet for UI review.
if (Test-Path 'ruby-native-opal_classic.png') {
  $labImage = [System.Drawing.Image]::FromFile((Join-Path $PWD 'ruby-native-opal_classic.png'))
  $labStream = [System.IO.MemoryStream]::new()
  try {
    $labImage.Save($labStream,[System.Drawing.Imaging.ImageFormat]::Jpeg)
    $labEncoded = [Convert]::ToBase64String($labStream.ToArray())
    for ($offset=0; $offset -lt $labEncoded.Length; $offset+=3000) { Write-Host ('RUBY_LAB_DATA '+$labEncoded.Substring($offset,[Math]::Min(3000,$labEncoded.Length-$offset))) }
  } finally { $labStream.Dispose(); $labImage.Dispose() }
}
