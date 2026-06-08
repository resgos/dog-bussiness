# Презентация «Лапка помощи — что готово»

Слайд-дек о текущем статусе продукта. Исходник — `index.html` (слайды A4-landscape,
фирменный стиль, реальная Шуня). Картинки инлайнятся в base64, PDF собирается через
headless-Chrome — без внешних зависимостей.

## Пересобрать PDF (PowerShell, Windows)

```powershell
$root = "C:\Users\rusgr\Downloads\dog-bussiness"
$html = Get-Content "$root\presentation\index.html" -Raw -Encoding UTF8
function DataUri($p,$m){ "data:$m;base64," + [Convert]::ToBase64String([IO.File]::ReadAllBytes($p)) }
$html = $html.Replace("__LOGO__",         (DataUri "$root\public\brand\logo.png" "image/png"))
$html = $html.Replace("__SHUNYA_WAVE__",  (DataUri "$root\public\shunya\pose-wave-cut.png" "image/png"))
$html = $html.Replace("__SHUNYA_HAPPY__", (DataUri "$root\public\shunya\pose-happy-cut.png" "image/png"))
$built = "$env:TEMP\lapka-pres.built.html"
[IO.File]::WriteAllText($built, $html, (New-Object System.Text.UTF8Encoding($false)))
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new `
  --user-data-dir="$env:TEMP\chrome-pres-profile" --no-first-run --no-sandbox --disable-gpu `
  --run-all-compositor-stages-before-draw --virtual-time-budget=10000 --no-pdf-header-footer `
  --print-to-pdf="$root\presentation\Лапка-помощи-презентация.pdf" ("file:///" + ($built -replace '\\','/'))
```

Важно: `--user-data-dir` обязателен, иначе новый Chrome конфликтует с уже запущенным
(singleton) и PDF не создаётся. Собранный `*.pdf` в git не коммитится (см. `.gitignore`).
