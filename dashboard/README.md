# EpiAlert · Refined navigation-first dashboard

This version preserves the earlier purple dashboard and its real-data charts, but gives it a **new spacious Home page**. Nothing has been pushed to GitHub.

## Local preview (Windows / VS Code PowerShell)

1. Extract this ZIP, then open the `epialert-dashboard` folder (the folder containing `package.json`) in VS Code.
2. Open a terminal in that folder.
3. Run `npm.cmd install`.
4. Run `npm.cmd run dev`.
5. Open the localhost URL shown by Vite, typically `http://127.0.0.1:5173/`.

Use `npm.cmd`, not `npm`, if PowerShell blocks `npm.ps1`.

## Navigation

- **Home:** A brief explanation and six navigation cards. No dense charts on the landing screen.
- **Dashboard:** Your **original screenshot-style dashboard**, preserved intact.
- **Trends:** A dedicated place for the existing weekly trend chart, disease mix, heatmap, and insight panel.
- **Forecasts:** Retrospective 2025 ADD model rankings, evaluations, and downloads.
- **Districts:** District explorer, counts, and reporting pattern.
- **Reports:** CSV exports, provenance, methodology.
- **Insights:** Disease rankings, year charts, and interpretation.

The original Python ML pipeline is unchanged. The Vite startup script synchronizes data from your existing publicly accessible EpiAlert repository into `public/data/` as needed. It does **not** upload or push anything.

**Data honesty:** 2025 model rankings are retrospective research outputs, not live disease warnings. The model scores are not calibrated probabilities. The decorative home radar does not plot genuine hotspots.

# EpiAlert — Purple Dashboard (local preview)

This React/Vite frontend recreates the supplied **dark-purple, card-based dashboard**. It reads your **actual** IDSP Tamil Nadu CSV exports and 2025 retrospective model ranking data; no dataset values are fabricated. **Nothing in this preview writes to GitHub.**

## Run on Windows (VS Code PowerShell)

1. Unzip the archive.
2. Open the **extracted folder** (the one directly containing `package.json`) in VS Code.
3. Open Terminal → New Terminal.
4. Run the commands, one at a time:

```powershell
npm.cmd install
npm.cmd run dev
```

5. Open the `http://127.0.0.1:5173/` link shown in the terminal.

**Use `npm.cmd` rather than `npm` in PowerShell** to avoid the `npm.ps1` execution-policy error encountered earlier.

## Where data comes from

When started, `scripts/prepare-data.cjs` checks for an existing `outputs/` folder in the enclosing EpiAlert repository. If no local repo files are found, it downloads the committed source files from https://github.com/Sabz-10/EpiAlert (`main`) to `public/data/` (once, then cached). Internet access is needed only for first download or dependency installation. It uses:

- `outputs/idsp_2021_2025_cleaned.csv` — verified historical outbreak reports
- `outputs/historical_trends.csv` — historical district/disease report counts
- `outputs/model_scores_2025.csv` — 2025 retrospective model district rankings
- `outputs/metrics.json` — held-out evaluation, methodology, and limitations

To refresh the cached data after updating the public GitHub files, remove the four files inside `public/data/` and restart (or put the dashboard folder inside your repo so local files take priority).

**Research limitations:** model scores are not calibrated probabilities, case count estimates, live alerts, or forecasts of future incidence. Report absence is not proof of disease absence. The user-interface visual components reflect these limits.

## What is clickable?

- Top tabs: Overview, Forecasts (retrospective), Districts, Reports, Insights
- Filters: districts, diseases, year, event/case graph metric
- Weekly outbreak trend line; week slider/dropdown for model rankings
- Heatmap: click a cell to filter to that district and disease
- Dataset report export (.csv); model rankings export (.csv)
- Search: type a district and press Enter; account menu; information modal

## Build before deployment

```powershell
npm.cmd run build
```

If you like the preview, we can copy this folder as `dashboard/` in the existing EpiAlert repository, keeping `src/train.py`, your `outputs/`, and `app.py` intact. Deploy just `dashboard/` as a frontend project (e.g. Vercel), with build command `npm run build` and output directory `dist`.

## November 10 update — About, map, diseases and accuracy

The **About & Method** tab recreates the six-step research timeline, limitations and glossary shown in Surya's screenshot, matching the current EpiAlert purple theme.

The **Districts** tab now contains a clickable/keyboard-accessible geographic district map with report counts filtered by disease and year. The boundary file is cached automatically at `public/data/tn_districts.geojson` on first successful start. The upstream public GeoJSON contains **37** district outlines and omits **Mayiladuthurai**; the interface explicitly discloses this. Mayiladuthurai can still be selected through the district list/filter. Source: [udit-001/india-maps-data](https://github.com/udit-001/india-maps-data), `geojson/states/tamil-nadu.geojson`. Boundaries are visual aids, not official administrative or clinical risk information.

Every **weekly graph** displays the chosen disease name. The donut legend spells out Acute Diarrheal Disease (ADD).

The **Forecasts**, **Dashboard model cards**, **rankings table**, **model reports**, **methodology**, and **model information dialog** put **2025 held-out accuracy first: 86.08%**, followed immediately by precision **2.31%** and recall **22.22%**. Due to many district-weeks without reported outbreaks, the accuracy value on its own can exaggerate performance; do not claim the model provides reliable real-time alerts.

No changes to existing ML code, historical CSVs or GitHub are made by this package.

## November 10 simplified About page

The About & Method page now focuses on the six-step **How the project works** timeline. The former limitations-in-plain-words panel and glossary were removed from that page. Research methodology and evaluation metrics remain accessible elsewhere in the dashboard.

This archive places `package.json` at the **top level**, so open the extracted `EpiAlert_Dashboard_Ready` folder in VS Code and run `npm.cmd install` there.


## Real model inference demo (two terminals)

The **Forecasts → Run Model Demo** panel calls a real local Python API. It retrains the exact historical Logistic Regression configuration from `src/final_test.py` on the same 2021–2024 training rows and runs inference for the selected held-out 2025 week. It does not just reveal saved scores.

**First-time setup** (PowerShell in this project folder):

```powershell
npm.cmd install
npm.cmd run sync:data
py -m pip install -r requirements-model.txt
```

**Terminal 1** (keep running):

```powershell
py backend/server.py
```

**Terminal 2** (keep running):

```powershell
npm.cmd run dev
```

Open `http://127.0.0.1:5173/`, select **Forecasts**, choose a week, and click **Generate district rankings**. The backend listens at `127.0.0.1:8000` and Vite proxies `/api` to it. Test backend status at `http://127.0.0.1:8000/api/health`.

**Important:** Data sync needs access to the public EpiAlert GitHub repository unless you place the dataset files in `public/data/`. `ml_training_dataset.csv` is now also synced. Results are retrospective 2025 classifications, not 2026 forecasts or live outbreak warnings.
