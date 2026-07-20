param(
  [int]$Runs = 30,
  [string]$Binary = ".\target\release\taml.exe",
  [string]$Fixture = "fixtures\native-parity\basic.taml"
)

$samples = for ($i = 1; $i -le $Runs; $i++) {
  $elapsed = Measure-Command { & $Binary check $Fixture *> $null }
  [Math]::Round($elapsed.TotalMilliseconds, 3)
}
$ordered = $samples | Sort-Object
$average = ($samples | Measure-Object -Average).Average
[PSCustomObject]@{
  Runs = $Runs
  MinMs = $ordered[0]
  MedianMs = $ordered[[int]($Runs / 2)]
  P95Ms = $ordered[[int][Math]::Floor($Runs * 0.95) - 1]
  MeanMs = [Math]::Round($average, 3)
  MaxMs = $ordered[$Runs - 1]
} | Format-List
