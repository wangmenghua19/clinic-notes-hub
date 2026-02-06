param(
  [switch]$MirrorOnly
)
$ErrorActionPreference = "Stop"
$remotes = git remote | Out-String
if ($MirrorOnly) {
  if ($remotes -match "(?m)^mirror$") {
    git push mirror --all
    git push mirror --tags
  }
} else {
  if ($remotes -match "(?m)^origin$") {
    git push origin --all
    git push origin --tags
  }
  if ($remotes -match "(?m)^mirror$") {
    git push mirror --all
    git push mirror --tags
  }
}
