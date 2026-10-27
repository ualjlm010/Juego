Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('C:\Users\Javier\Downloads\pokesurvivor-main.zip')
$cssEntry = $zip.Entries | Where-Object { $_.FullName -eq 'pokesurvivor-main/css/style.css' }
$stream = $cssEntry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$content = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()

# Print first 200 lines
$lines = $content -split "`n"
$lines[0..120] | Out-File -FilePath 'C:\Users\Javier\Desktop\BlckMkt\tools\pokebonk_css_sample.txt' -Encoding utf8
Write-Host "CSS total lines: $($lines.Count)"
