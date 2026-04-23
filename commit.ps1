# commit.ps1 — add, commit y push rapido
$branch = git rev-parse --abbrev-ref HEAD
Write-Host ""
Write-Host "  Rama actual: $branch" -ForegroundColor Cyan
Write-Host ""

$msg = Read-Host "  Mensaje del commit"

if (-not $msg.Trim()) {
    Write-Host "  Mensaje vacio. Cancelado." -ForegroundColor Red
    exit 1
}

git add .
git commit -m $msg
git push origin $branch

Write-Host ""
Write-Host "  Push a '$branch' completado." -ForegroundColor Green
