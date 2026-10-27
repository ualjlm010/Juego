Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

$rootDir = "C:\Users\Javier\Desktop\BlckMkt"
$zipTargets = @(
    "C:\Users\Javier\Desktop\BlckMkt-Completo.zip",
    "C:\Users\Javier\Desktop\BlckMkt.zip"
)

$excludePatterns = @(
    "*.zip",
    "*.log",
    ".git*",
    "node_modules*",
    "*edge-debug*"
)

Write-Host "Iniciando empaquetado normalizado de Pokemon: Black Market..."

$files = Get-ChildItem -Path $rootDir -Recurse -File | Where-Object {
    $item = $_
    $skip = $false
    foreach ($pat in $excludePatterns) {
        if ($item.FullName -like "*$pat*") {
            $skip = $true
            break
        }
    }
    -not $skip
}

Write-Host "Total de archivos a incluir: $($files.Count)"

foreach ($zipPath in $zipTargets) {
    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
    }

    $archive = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        $count = 0
        foreach ($file in $files) {
            $relPath = $file.FullName.Substring($rootDir.Length + 1).Replace("\", "/")
            $entry = [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $file.FullName, $relPath, [System.IO.Compression.CompressionLevel]::Optimal)
            $count++
            if ($count % 300 -eq 0) {
                Write-Host "Empaquetados $count / $($files.Count)..."
            }
        }
    } finally {
        $archive.Dispose()
    }

    $fileItem = Get-Item $zipPath
    $sizeMb = [math]::Round($fileItem.Length / 1MB, 2)
    Write-Host "Archivo creado exitosamente: $zipPath ($sizeMb MB, $count archivos)"
}
