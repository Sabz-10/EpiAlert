# EpiAlert

An experimental Tamil Nadu outbreak-report analytics prototype using historical IDSP data, disease trend exploration, and retrospective district ranking.

## Project Overview

EpiAlert is an experimental outbreak-report analytics prototype focused on Tamil Nadu.

The project uses historical outbreak reports published by India's Integrated Disease Surveillance Programme (IDSP) and the National Centre for Disease Control (NCDC), covering 2021–2025.

It aims to:
- Organize historical outbreak reports into a structured dataset.
- Explore recorded disease trends across Tamil Nadu districts.
- Experiment with machine learning to rank districts for review based on historical Acute Diarrheal Disease (ADD) reports.
- Present historical patterns and model results through a dashboard.

## Dataset

EpiAlert uses historical IDSP/NCDC weekly outbreak-report PDFs covering 2021–2025.

### Dataset summary

| Description | Count |
|---|---:|
| Source PDF reports collected | 258 |
| Valid report-weeks retained | 257 |
| Cleaned outbreak records | 516 |
| Tamil Nadu districts | 38 |
| Disease categories | 36 |

### Data limitations

- The dataset contains recorded outbreak events, not complete weekly disease counts for every district.
- Reported cases and deaths describe the available outbreak records, not necessarily all cases or deaths in a district.
- A missing report does not mean zero cases or that a district was disease-free.
- Some source weeks were unavailable or excluded during data cleaning.

## Machine Learning Approach

The project evaluates an experimental Logistic Regression model for Acute Diarrheal Disease (ADD).

### Disease coverage

- **Acute Diarrheal Disease (ADD):** Machine-learning ranking and evaluation.
- **Mumps:** Historical trend exploration only.
- **Chickenpox:** Historical trend exploration only.

### Model details

- Algorithm: Scaled Original Logistic Regression.
- Class weighting: Balanced.
- Regularization parameter: C = 0.1.
- Features include district, cyclical week information, and historical activity over the preceding 4 and 8 weeks.
- Training and model selection: 2021–2024.
- Retrospective evaluation: Held-out 2025 data.
- Review budget: Top 5 ranked districts per week.

The model produces relative ranking scores. These scores are not calibrated probabilities, patient case forecasts, or validated medical-risk classifications.
## Model Evaluation (2025)

The model was evaluated retrospectively on held-out 2025 data.

| Metric | Result |
|---|---:|
| Test observations | 1,976 |
| Recorded positive observations | 27 |
| True Positives (TP) | 6 |
| False Positives (FP) | 254 |
| False Negatives (FN) | 21 |
| True Negatives (TN) | 1,695 |
| Precision | 2.31% |
| Recall | 22.22% |
| F1 Score | 4.18% |
| Average Precision | 2.28% |

The model selected five districts per week, producing 260 review selections across 52 weeks.

### Interpreting the results

The evaluation shows that the model has limited predictive usefulness:

- Precision of 2.31% means only a small proportion of selected district-weeks had a recorded outbreak.
- Recall of 22.22% means the model identified 6 of the 27 recorded positive observations.
- The results demonstrate the difficulty of ranking rare events using incomplete historical outbreak reports.

These results are experimental and should not be interpreted as evidence of a validated early-warning system.

## Limitations

- The system is a retrospective experimental prototype, not a real-time early-warning system.
- The model ranks districts using historical ADD outbreak-report patterns; it does not forecast patient case counts.
- Model scores are relative ranking scores, not calibrated probabilities.
- The dataset contains incomplete outbreak reporting. Missing records cannot be interpreted as zero cases or disease absence.
- The model's 2025 evaluation shows low precision and recall.
- Mumps and Chickenpox are included for historical trend exploration only.
- Weather data is not used by the evaluated machine-learning model.
- The system is not intended for clinical diagnosis or public-health decision-making without further validation.

## Generated Outputs

The project generates the following files:

| File | Description |
|---|---|
| `outputs/idsp_2021_2025_cleaned.csv` | Cleaned historical outbreak records |
| `outputs/weekly_ml_panel.csv` | District, disease and week-level ML panel |
| `outputs/ml_training_dataset.csv` | Prepared candidate training data |
| `outputs/model_scores_2025.csv` | 2025 ADD district ranking scores and evaluation labels |
| `outputs/historical_trends.csv` | Recorded outbreak-event trends for ADD, Mumps and Chickenpox |
| `outputs/metrics.json` | Model evaluation metrics |

### Important interpretation notes

- `model_scores_2025.csv` contains relative model scores and retrospective evaluation labels.
- `historical_trends.csv` counts recorded outbreak events, not patient cases.
- Missing district-week combinations in the trends file must not be interpreted as zero outbreaks.
- The `actual_report_recorded` field is for retrospective evaluation, not live prediction.

## Data Sources and Provenance

The project uses historical weekly outbreak reports published by:

- Integrated Disease Surveillance Programme (IDSP), India.
- National Centre for Disease Control (NCDC), India.

The source collection covers 2021–2025 and consists of 258 PDF reports. After validation and cleaning, 257 valid report-weeks were retained.

Each cleaned outbreak record preserves source information, including:
- Source PDF filename.
- Source page number.
- Report year and week.
- District and disease.
- Reported cases and deaths, where available.

The raw PDF collection is not included in the Git repository. The processed datasets are available in the `outputs/` directory.

## Project Structure

```text
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
├── app.py
├── requirements.txt
└── README.md

## Reproducibility

Run commands from the repository root with the project's Python environment activated.

To regenerate the prepared ML datasets, run the retrospective ADD evaluation, and export historical trends:

python src/train.py
The pipeline runs these scripts in order:

1. `src/prepare_ml_data.py`
2. `src/final_test.py`
3. `src/export_trends.py`

### Dependencies

The `requirements.txt` file is maintained by the dashboard and deployment owner. Installation instructions will be updated after the dependency list is finalized and verified.

## Future Scope

- Improve data completeness by incorporating more consistent surveillance records.
- Explore additional features and modelling approaches to improve retrospective ranking performance.
- Conduct prospective evaluation using appropriately time-stamped surveillance data.
- Investigate weather and environmental factors as potential future research features.
- Improve district-level visualization and historical trend exploration.
- Validate the system with public-health experts before considering operational use.
