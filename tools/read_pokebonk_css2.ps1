Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('C:\Users\Javier\Downloads\pokesurvivor-main.zip')
$cssEntry = $zip.Entries | Where-Object { $_.FullName -eq 'pokesurvivor-main/css/style.css' }
$stream = $cssEntry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$content = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()

$lines = $content -split "`n"
$lines[100..350] | Out-File -FilePath 'C:\Users\Javier\Desktop\BlckMkt\tools\pokebonk_css_sample2.txt' -Encoding utf8
Write-Host "Lines 100..350 written"
