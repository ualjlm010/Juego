Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('C:\Users\Javier\Downloads\pokesurvivor-main.zip')
$zip.Entries | Where-Object { $_.FullName -notmatch '^[^/]+/assets/pokemon/' } | Select-Object -ExpandProperty FullName
$zip.Dispose()
