<#
.SYNOPSIS
    Builds both Docker images and pushes them to Amazon ECR.

.EXAMPLE
    Copy-Item deploy/.env.deploy.example deploy/.env.deploy
    # edit deploy/.env.deploy
    Get-Content deploy/.env.deploy | ForEach-Object {
      if ($_ -match '^\s*([^#][^=]+)=(.*)$') { Set-Item "Env:$($Matches[1].Trim())" $Matches[2].Trim() }
    }
    .\deploy\build-and-push.ps1            # builds + pushes both
    .\deploy\build-and-push.ps1 -Target client
    .\deploy\build-and-push.ps1 -Target server
#>

[CmdletBinding()]
param(
    [ValidateSet('all','client','server')]
    [string]$Target = 'all'
)

$ErrorActionPreference = 'Stop'

# Move to repo root (parent of /deploy)
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $RepoRoot

foreach ($v in 'AWS_ACCOUNT_ID','AWS_REGION','ECR_REPO_CLIENT','ECR_REPO_SERVER') {
    if (-not (Get-Item "Env:$v" -ErrorAction SilentlyContinue)) {
        throw "$v is required (source deploy/.env.deploy first)."
    }
}
if (-not $env:IMAGE_TAG) { $env:IMAGE_TAG = 'latest' }

$Registry = "$($env:AWS_ACCOUNT_ID).dkr.ecr.$($env:AWS_REGION).amazonaws.com"

Write-Host "[1/3] Logging in to ECR $Registry"
aws ecr get-login-password --region $env:AWS_REGION |
    docker login --username AWS --password-stdin $Registry
if ($LASTEXITCODE -ne 0) { throw "docker login failed" }

function Invoke-BuildAndPush {
    param(
        [Parameter(Mandatory)] [string]$Name,
        [Parameter(Mandatory)] [string]$Dockerfile
    )
    $Image = "$Registry/$($Name):$($env:IMAGE_TAG)"

    Write-Host "[2/3] Building $Image"
    $buildArgs = @('build', '-f', $Dockerfile, '-t', $Image)
    if ($Name -eq $env:ECR_REPO_CLIENT) {
        $buildArgs += @('--build-arg', "NEXT_PUBLIC_API_URL=$($env:NEXT_PUBLIC_API_URL)")
        $buildArgs += @('--build-arg', "NEXT_PUBLIC_WS_URL=$($env:NEXT_PUBLIC_WS_URL)")
    }
    $buildArgs += '.'
    & docker @buildArgs
    if ($LASTEXITCODE -ne 0) { throw "docker build failed for $Name" }

    Write-Host "[3/3] Pushing $Image"
    docker push $Image
    if ($LASTEXITCODE -ne 0) { throw "docker push failed for $Name" }
    Write-Host "    pushed: $Image"
}

if ($Target -in 'all','client') { Invoke-BuildAndPush -Name $env:ECR_REPO_CLIENT -Dockerfile 'client/Dockerfile' }
if ($Target -in 'all','server') { Invoke-BuildAndPush -Name $env:ECR_REPO_SERVER -Dockerfile 'server/Dockerfile' }

Write-Host ""
Write-Host "Done. Update your ECS services to pick up the new images:"
Write-Host "  aws ecs update-service --cluster arcado --service arcado-client --force-new-deployment --region $env:AWS_REGION"
Write-Host "  aws ecs update-service --cluster arcado --service arcado-server --force-new-deployment --region $env:AWS_REGION"
