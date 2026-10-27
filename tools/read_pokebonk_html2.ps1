Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('C:\Users\Javier\Downloads\pokesurvivor-main.zip')
$htmlEntry = $zip.Entries | Where-Object { $_.FullName -eq 'pokesurvivor-main/index.html' }
$stream = $htmlEntry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$content = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()

$lines = $content -split "`n"
$lines[200..320] | Out-File -FilePath 'C:\Users\Javier\Desktop\BlckMkt\tools\pokebonk_html_sample2.txt' -Encoding utf8
Write-Host "Lines 200..320 written"
