# YunTech HCI LAB

入口是 `index.html`。可直接用瀏覽器開啟，也可以把本資料夾內容部署到原本的 GitHub Pages。新版不需要 Bootstrap、前端執行環境或常駐伺服器。

## 檔案與維護

- `content/lab.json`：成員、論文、計畫、得獎、課程及最後更新日期。
- `build.mjs`：語意化頁面、SEO 中繼資料、結構化資料及元件範本。
- `styles.css`：CSS Layers、Grid、響應式版型及減少動態效果設定。
- `app.js`：導覽、成員篩選、研究搜尋、課程切換及原生 dialog 作品燈箱。
- `assets/`：本機圖示、壓縮過的主視覺與成員照片。
- `img/`：保留原始照片、作品與 Logo。

更新 `content/lab.json` 後，使用 Node.js 22 或更新版本執行：

```sh
node build.mjs
```

這會更新 `index.html` 和 `sitemap.xml`。部署時必須一併上傳產生的 HTML、CSS、JavaScript、assets 與 img。GitHub Pages 不需要執行 Node.js。原有 Google 驗證檔與 robots.txt 已保留。

成員依資料陣列順序顯示；王家恩位於碩士生第一位。`group` 可用 `pi`、`graduate` 或 `alumni`。成員照片目前對應 `assets/members/{id}.webp`，原圖路徑保留在 `image` 欄位。若新增照片，可提供壓縮版至上述路徑；或使用 `tools/prepare-assets.cjs` 批次產生，需要開發用的 sharp 套件與網路連線。沒有照片的成員請填 `image: null`。

`updated` 請填寫實際內容修改日期，頁尾與 sitemap 會同步更新。課程 `url: null` 會顯示「課綱尚未提供」，不會產生無效連結。新增頁面或變更正式網域時，也要同步調整 build.mjs 的 canonical、社群分享 URL 和 sitemap。

## SEO 與可及性

所有主要內容都在產生的 HTML 中，不依賴 JavaScript 載入。Google 亦建議考慮預先產生內容，讓使用者與搜尋引擎取得內容更直接：[Google JavaScript SEO 基礎](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)。

已包含單一 H1、分層標題、繁體中文語系、canonical、description、Open Graph、Twitter Card，以及 ResearchOrganization、WebSite、WebPage、Person JSON-LD。主視覺預載，其餘照片與地圖延遲載入；照片轉為 WebP，圖示存於本機，沒有外部字型依賴。

導覽與按鈕支援鍵盤，作品燈箱可用左右方向鍵及 Escape，並會還原焦點。保留原成員與課程錨點，關閉 JavaScript 時仍可讀取各類內容。提供減少動態效果與列印樣式。

原 Google Analytics `G-QHQ4JMPK49` 只在 `yuntech-hci.github.io` 正式網域執行，本機預覽不會送出流量。SEO 調整已完成於本機檔案；搜尋收錄與實際 Core Web Vitals 仍須於正式部署後，以 Search Console 與實際流量驗證。

## 檢查

`tools/verify.cjs` 使用 Playwright 與本機 Microsoft Edge，驗證 1920、1440、1024、768、390、320px 版型、篩選、搜尋、燈箱、舊錨點、無 JavaScript 及減少動態效果。開發環境須可載入 playwright 套件。

```sh
node tools/verify.cjs
```

預設檢查輸出位於本資料夾上一層的 `redesign-preview`，不會混入正式網站。截圖檢查以測試內容代替 Google Maps iframe，沒有驗證第三方地圖的即時回應。課綱與 Scholar 保留原站目的地，未驗證登入後內容。`tools/import-legacy.cjs` 是一次性舊版匯入工具，日常維護不需要再次執行。

## 視覺來源

主視覺由內建 imagegen 生成，屬於人機互動概念插畫，並非實驗室成果紀錄。產出為 `assets/hero.webp`、`assets/hero-small.webp`，社群分享圖為 `assets/social-cover.jpg`。原始成果影像及成員照片沿用原站。圖示為 Bootstrap Icons 1.10.4，MIT 授權位於 `assets/icons/LICENSE`，不依賴 Bootstrap 的 CSS 或 JavaScript。

主視覺生成提示：

> Use case: stylized-concept. Create a high-end futuristic editorial website hero background for a university human-computer interaction and game design laboratory. Wide 16:9 composition. The LEFT 52% must be clean nearly white #f3f5f2 negative space for dark website text. On the RIGHT half an arresting large sculptural translucent glass human hand reaches upward, interacting with a single flowing folded ribbon made of fine metallic wire mesh and bright acid-lime translucent glass, like a spatial interface. Small vivid pink accent on one edge. Crisp 3D raytraced render, intricate fine mesh, silver reflections, soft realistic contact shadows, bright neutral studio background, tactile experimental design aesthetic, museum exhibition quality. Hand and ribbon fully readable, right-centered, filling height but no cropping at outer edges. No text, no letters, no logos, no UI, no rounded cards, no spheres, no floating orbs, no gradients, no bokeh. This is a conceptual illustration, not a photograph of an actual lab.

重新設計前的入口備份在本資料夾上一層的 `index.before-redesign-20260909.html`。舊版 navbar.html、navbar.js 保留但新版入口不再載入。
