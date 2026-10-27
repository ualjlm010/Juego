Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('C:\Users\Javier\Downloads\pokesurvivor-main.zip')
$htmlEntry = $zip.Entries | Where-Object { $_.FullName -eq 'pokesurvivor-main/index.html' }
$stream = $htmlEntry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$content = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()

# Print first 200 lines
$lines = $content -split "`n"
$lines[0..200] | Out-File -FilePath 'C:\Users\Javier\Desktop\BlckMkt\tools\pokebonk_html_sample.txt' -Encoding utf8
Write-Host "HTML total lines: $($lines.Count)"
