# EpiAlert

### Exploring disease outbreak patterns across Tamil Nadu

EpiAlert is a data science prototype that turns historical disease outbreak reports from Tamil Nadu into structured datasets, trend summaries, and district-level review rankings.

The project explores a practical question: how can historical public-health reports be organised and analysed to help people investigate where outbreaks have been recorded and how reporting patterns change over time?

> **Important:** EpiAlert is an experimental research prototype. It is not a real-time alert system, a clinical tool, or a replacement for official public-health surveillance.

---

## What EpiAlert does

The current prototype brings together three parts:

1. **Data preparation:** Organises historical weekly outbreak reports from India's Integrated Disease Surveillance Programme (IDSP) and the National Centre for Disease Control (NCDC), standardising fields such as district, disease, reporting week, cases, and deaths.
2. **Disease trend exploration:** Examines historical recorded-outbreak patterns for Acute Diarrheal Disease (ADD), Mumps, and Chickenpox across Tamil Nadu.
3. **Experimental district ranking:** Uses Logistic Regression to rank districts each week based on historical ADD reporting patterns, selecting five districts for further review.

A supporting weather-data utility is also included. Weather is being explored as a possible source of context, but it is **not used by the currently evaluated machine-learning model**.

## Dataset at a glance

The current dataset is based on IDSP/NCDC weekly outbreak reports covering **2021–2025**.

| Dataset detail | Current count |
|---|---:|
| Source PDF reports collected | 258 |
| Valid report-weeks retained | 257 |
| Cleaned outbreak records | 516 |
| Tamil Nadu districts represented | 38 |
| Disease categories represented | 36 |

Cleaned records retain source details such as the original PDF filename and page number, report year and week, district, disease, and reported cases and deaths where available.

### Understanding the data

These are records of **reported outbreak events**, not complete disease counts for every district and week.

- A missing report does not mean zero cases or that a district was disease-free.
- Reported cases and deaths describe the available outbreak records, not necessarily all cases or deaths in a district.
- Some source weeks were unavailable or excluded during cleaning.
- The model learns from the available reports, not from a complete picture of disease incidence.

These limitations are important when interpreting the trends and model results.

## Machine-learning approach

The evaluated model focuses on **Acute Diarrheal Disease (ADD)**.

| Component | Current approach |
|---|---|
| Algorithm | Scaled Logistic Regression |
| Class imbalance | Balanced class weights |
| Regularisation | C = 0.1 |
| Training and validation | 2021–2024 |
| Held-out evaluation | 2025 |
| Weekly review capacity | Top 5 ranked districts |
| Features | District, cyclical week features, and previous 4- and 8-week outbreak-report history |

The model produces a relative score for each district-week and ranks districts within each week. The five highest-ranked districts are selected for review.

**The scores are not calibrated probabilities.** They do not estimate future patient counts and are not validated medical or public-health risk scores.

### Retrospective evaluation on 2025 data

| Metric | Result |
|---|---:|
| Test observations | 1,976 |
| Recorded positive observations | 27 |
| True positives | 6 |
| False positives | 254 |
| False negatives | 21 |
| True negatives | 1,695 |
| Precision | 2.31% |
| Recall | 22.22% |
| F1 score | 4.18% |
| Average Precision | 2.28% |

The model selected five districts per week, producing 260 review selections across 52 weeks.

### What the results mean

The current evaluation shows **limited predictive usefulness** on the held-out 2025 reports. The model identified 6 of the 27 recorded positive observations, while many selected district-weeks did not have a corresponding outbreak record.

This is an important finding, not something to hide. Rare events and incomplete reporting make the task difficult. The current model is an experimental baseline that needs better data and further validation before it could support operational use.

## Disease coverage

- **Acute Diarrheal Disease:** machine-learning ranking and retrospective evaluation.
- **Mumps:** historical trend exploration only.
- **Chickenpox:** historical trend exploration only.

Trend outputs count recorded outbreak events; they do not represent total patient cases.

## Current prototype status

The repository includes data-processing scripts, the ADD model evaluation pipeline, dashboard-oriented CSV/JSON exports, district coordinate data, and a supporting weather-fetching utility.

- **Data processing and model evaluation:** implemented in the current Python pipeline.
- **Dashboard data exports:** generated by the pipeline. Frontend/dashboard integration is a separate workstream and remains in progress until verified in the running application.
- **Weather utility:** code is present to retrieve historical weather observations for Tamil Nadu districts. End-to-end execution and dashboard integration still need verification.
- **Live alerts:** not implemented. The project does not currently monitor live surveillance feeds or send operational warnings.

## Generated outputs

The analysis pipeline writes files to the outputs directory:

| File | Description |
|---|---|
| idsp_2021_2025_cleaned.csv | Standardised historical outbreak records |
| weekly_ml_panel.csv | District-, disease-, and week-level panel with report-availability status |
| ml_training_dataset.csv | Candidate observations prepared for retrospective modelling |
| model_scores_2025.csv | 2025 ADD relative scores, district ranks, top-five selections, and evaluation labels |
| historical_trends.csv | Recorded outbreak-event trends for ADD, Mumps, and Chickenpox |
| metrics.json | Model configuration, dataset summary, evaluation metrics, and limitations |

When interpreting these files:

- model_score is a relative model score, not a calibrated probability.
- actual_report_recorded is a retrospective evaluation label, not a live signal.
- historical_trends.csv counts recorded outbreak reports, not patient cases.
- Missing district-week combinations must not be interpreted as zero outbreaks.

## Weather-data utility

The script src/fetch_weather.py uses the [Open-Meteo Archive API](https://open-meteo.com/en/docs/historical-weather-api) and the coordinates in geo/districts.csv to request hourly temperature, relative humidity, and precipitation.

The current script is configured for **1–7 January 2025** and writes the collected records to data/weather.csv.

This utility is separate from the evaluated machine-learning pipeline. Weather variables are not currently used by the ADD model, and the weather workflow still needs end-to-end verification. The data directory must exist before running the script.

## Project structure

~~~text
EpiAlert/
├── geo/
│   └── districts.csv
├── src/
│   ├── clean_data.py
│   ├── prepare_ml_data.py
│   ├── train.py
│   ├── final_test.py
│   ├── export_trends.py
│   ├── risk.py
│   └── fetch_weather.py
├── outputs/
│   ├── idsp_2021_2025_cleaned.csv
│   ├── weekly_ml_panel.csv
│   ├── ml_training_dataset.csv
│   ├── model_scores_2025.csv
│   ├── historical_trends.csv
│   └── metrics.json
├── requirements.txt
└── README.md
~~~

The raw source PDFs and audited extraction file are not included in the Git repository. The preparation scripts expect these inputs to be available locally.

## Running the analysis

Run commands from the repository root in a Python environment with the required packages installed.

### 1. Prepare the cleaned records

Make sure the audited extraction file is available at:

~~~text
outputs/idsp_2021_2025_audit.csv
~~~

Then run:

~~~bash
python src/clean_data.py
~~~

### 2. Prepare the modelling data, evaluate the model, and export trends

The preparation step checks which weekly source PDFs are available under data/. Make sure the required source files are present before running the pipeline.

~~~bash
python src/train.py
~~~

This runs the following scripts in sequence:

1. src/prepare_ml_data.py
2. src/final_test.py
3. src/export_trends.py

The resulting CSV and JSON files are written to outputs/.

### 3. Fetch historical weather data (optional)

Create the data directory and install the dependencies required by the weather utility, then run:

~~~bash
python src/fetch_weather.py
~~~

This step is independent of the machine-learning pipeline and does not change the current model results.

### Dependencies

The repository's requirements.txt is currently empty. The scripts use libraries including NumPy, pandas, requests, and scikit-learn. Install the dependencies needed for the scripts you intend to run. The exact dependency list and installation instructions should be finalised and tested as part of project setup.

## Data sources and provenance

The project uses historical weekly outbreak reports published by:

- **Integrated Disease Surveillance Programme (IDSP), India**
- **National Centre for Disease Control (NCDC), India**

The source collection covers 2021–2025. During cleaning, district and disease names are standardised, duplicate records are handled, and selected records are checked or recovered against source PDF text. Source filenames and page references are retained to support traceability.

The raw PDF collection and audited extraction file are not included in the repository. Processed datasets are maintained under outputs/.

## Limitations and responsible use

EpiAlert is a learning and research prototype. At this stage:

- It analyses historical reports rather than live surveillance data.
- It ranks districts for retrospective review; it does not forecast patient case counts.
- Model scores are relative rankings, not calibrated probabilities.
- Incomplete reporting means that an unrecorded outbreak cannot be treated as proof of no disease.
- The 2025 evaluation shows low precision and recall.
- Mumps and Chickenpox are included for trend exploration, not model-based prediction.
- Weather data is not part of the evaluated model.
- The system has not been prospectively validated or reviewed for operational public-health use.

**EpiAlert should not be used to make clinical decisions, issue public-health warnings, or replace official surveillance and expert assessment.**

## What we plan to improve

Our next steps are to strengthen the prototype and validate its usefulness:

- Complete and verify dashboard integration.
- Test the weather utility end to end and evaluate whether weather features add measurable value.
- Improve data completeness and document report coverage more thoroughly.
- Explore better approaches for rare events and incomplete surveillance records.
- Evaluate future models using carefully separated, time-aware data.
- Seek domain-expert feedback before considering any real-world use.

---

*Built as an experimental data science project focused on historical disease surveillance in Tamil Nadu.*
