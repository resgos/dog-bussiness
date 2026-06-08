# Презентация «Лапка помощи — что готово»

Слайд-дек о текущем статусе продукта (15 слайдов). Исходник — `index.html`:
слайды A4-landscape в фирменном стиле «Лапки» (Comfortaa+Nunito, реальная Шуня),
**реальные скриншоты экранов приложения** в браузерных рамках. Картинки (логотип,
позы Шуни, скрины) инлайнятся в base64, PDF собирается headless-Chrome — без зависимостей.

## Пересобрать PDF (PowerShell, Windows)

Нужен запущенный dev-сервер на `:3002` (`npm run dev -- -p 3002`) — с него снимаются скрины.

```powershell
$root = "C:\Users\rusgr\Downloads\dog-bussiness"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$sh = "$env:TEMP\lapka-shots"; New-Item -ItemType Directory -Force -Path $sh | Out-Null

# 1) снять публичные экраны приложения (вьюпорт 1280x900)
$pages = [ordered]@{ home="/"; map="/map"; feed="/feed/lost"; passport="/p/<ID-питомца>";
  chip="/chip"; guide="/guide/lost"; shop="/shop/addressniki"; adoption="/adoption" }
foreach ($k in $pages.Keys) {
  & $chrome --headless=new --user-data-dir="$env:TEMP\chrome-shot" --no-first-run --no-sandbox `
    --disable-gpu --hide-scrollbars --force-device-scale-factor=1.25 --window-size=1280,900 `
    --virtual-time-budget=9000 --screenshot="$sh\$k.png" "http://localhost:3002$($pages[$k])"
}

# 2) инлайн картинок в base64
$html = Get-Content "$root\presentation\index.html" -Raw -Encoding UTF8
function D($p,$m){ "data:$m;base64," + [Convert]::ToBase64String([IO.File]::ReadAllBytes($p)) }
$html = $html.Replace("__LOGO__",         (D "$root\public\brand\logo.png" "image/png"))
$html = $html.Replace("__SHUNYA_WAVE__",  (D "$root\public\shunya\pose-wave-cut.png" "image/png"))
$html = $html.Replace("__SHUNYA_HAPPY__", (D "$root\public\shunya\pose-happy-cut.png" "image/png"))
foreach ($n in "home","map","feed","passport","chip","guide","shop","adoption") {
  $html = $html.Replace("__SHOT_$($n.ToUpper())__", (D "$sh\$n.png" "image/png"))
}
$built = "$env:TEMP\lapka-pres.built.html"
[IO.File]::WriteAllText($built, $html, (New-Object System.Text.UTF8Encoding($false)))

# 3) HTML -> PDF
& $chrome --headless=new --user-data-dir="$env:TEMP\chrome-pres" --no-first-run --no-sandbox `
  --disable-gpu --run-all-compositor-stages-before-draw --virtual-time-budget=12000 --no-pdf-header-footer `
  --print-to-pdf="$root\presentation\Лапка-помощи-презентация.pdf" ("file:///" + ($built -replace '\\','/'))
```

Важно: `--user-data-dir` обязателен, иначе новый Chrome конфликтует с уже запущенным
(singleton) и PDF/скрин не создаётся. Собранный `*.pdf` в git не коммитим (см. `.gitignore`).
