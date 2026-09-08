param([switch]$RequireSignature)
$ErrorActionPreference = 'Stop'
# npm may inherit PowerShell 7's module search path while this runs in Windows PowerShell.
Import-Module (Join-Path $PSHOME 'Modules\Microsoft.PowerShell.Security\Microsoft.PowerShell.Security.psd1') -ErrorAction Stop
Import-Module (Join-Path $PSHOME 'Modules\Microsoft.PowerShell.Utility\Microsoft.PowerShell.Utility.psd1') -ErrorAction Stop
$desktopRoot = Split-Path -Parent $PSScriptRoot
$package = Get-Content -Raw -LiteralPath (Join-Path $desktopRoot 'package.json') | ConvertFrom-Json
$distPath = Join-Path $desktopRoot 'dist'
$files = @(
    (Join-Path $distPath "Vibe-Setup-$($package.version)-x64.exe"),
    (Join-Path $distPath 'win-unpacked\Vibe.exe')
)
$results = foreach ($file in $files) {
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { throw "Missing package file: $file" }
    $signature = Get-AuthenticodeSignature -LiteralPath $file
    [pscustomobject]@{
        File = Split-Path -Leaf $file
        Bytes = (Get-Item -LiteralPath $file).Length
        SHA256 = (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash
        Signature = [string]$signature.Status
        Publisher = if ($signature.SignerCertificate) { $signature.SignerCertificate.Subject } else { $null }
    }
}
$reportPath = Join-Path $distPath "Vibe-$($package.version)-windows-report.json"
$results | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath $reportPath -Encoding UTF8
$results | Format-Table File, Signature, Publisher -AutoSize
if (@($results | Where-Object Signature -ne 'Valid').Count -gt 0) {
    if ($RequireSignature) { throw 'Release verification failed: the installer and application must both have valid signatures.' }
    Write-Warning 'This is an unsigned local test build. Signing and testing on a clean Windows PC are still required before public release.'
}
Write-Output "Package report: $reportPath"
