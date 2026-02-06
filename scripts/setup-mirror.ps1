param(
  [string]$Owner = "wangmenghua19",
  [string]$KeyName = "id_ed25519_wmh19",
  [switch]$SetAliases
)
$ErrorActionPreference = "Stop"
$sshDir = Join-Path $env:USERPROFILE ".ssh"
if (!(Test-Path $sshDir)) { New-Item -ItemType Directory -Path $sshDir | Out-Null }
$keyPreferred = Join-Path $sshDir $KeyName
$keyDefault = Join-Path $sshDir "id_ed25519"
$identity = $null
if (Test-Path $keyPreferred) { $identity = $keyPreferred } elseif (Test-Path $keyDefault) { $identity = $keyDefault }
$configPath = Join-Path $sshDir "config"
if ($identity) {
$cfgBlock = @"
Host github.com-wmh19
  HostName github.com
  User git
  IdentityFile $identity
  IdentitiesOnly yes
"@
} else {
$cfgBlock = @"
Host github.com-wmh19
  HostName github.com
  User git
  IdentitiesOnly yes
"@
}
if (Test-Path $configPath) {
  $cfg = Get-Content $configPath -Raw
  if ($cfg -notmatch "(?m)^Host\s+github\.com-wmh19") {
    Add-Content -Path $configPath -Value $cfgBlock
  }
} else {
  Set-Content -Path $configPath -Value $cfgBlock -Encoding ascii
}
$repoName = $null
$originUrl = git config --get remote.origin.url 2>$null
if ($originUrl) {
  if ($originUrl -match "/([^/]+?)(\.git)?$") { $repoName = $Matches[1] }
}
if (-not $repoName) {
  $top = git rev-parse --show-toplevel 2>$null
  if ($top) { $repoName = Split-Path -Leaf $top }
}
if (-not $repoName) { Write-Error "Cannot determine repository name" }
$mirrorUrl = ("git@github.com-wmh19:{0}/{1}.git" -f $Owner, $repoName)
$remotes = git remote | Out-String
if ($remotes -match "(?m)^mirror$") {
  git remote set-url mirror $mirrorUrl
} else {
  git remote add mirror $mirrorUrl
}
if ($SetAliases) {
  git config --global alias.sync-origin "push origin --all"
  git config --global alias.sync-origin-tags "push origin --tags"
  git config --global alias.sync-mirror "push mirror --all"
  git config --global alias.sync-mirror-tags "push mirror --tags"
}
git remote -v
Write-Output "SSH alias github.com-wmh19 configured"
