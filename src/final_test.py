
import csv
import math
from pathlib import Path

import numpy as np
from sklearn.feature_extraction import DictVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score
from sklearn.preprocessing import StandardScaler


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "outputs" / "ml_training_dataset.csv"

DISEASE = "Acute Diarrheal Disease"
TOP_K = 5

NUMERIC_FEATURES = [
    "previous_4_outbreaks",
    "previous_8_outbreaks",
    "week_sin",
    "week_cos"
]


def build_features(row):
    week = int(row["week"])

    return {
        "district": row["district"],
        "previous_4_outbreaks": int(
            row["previous_4_outbreaks"]
        ),
        "previous_8_outbreaks": int(
            row["previous_8_outbreaks"]
        ),
        "week_sin": math.sin(
            2 * math.pi * week / 52
        ),
        "week_cos": math.cos(
            2 * math.pi * week / 52
        )
    }


with SOURCE.open(encoding="utf-8-sig", newline="") as f:
    rows = [
        r for r in csv.DictReader(f)
        if r["disease"] == DISEASE
    ]

# Final training uses 2021-2024.
train = [
    r for r in rows
    if r["split"] in ("train", "validation")
]

# The held-out year is 2025.
test = [
    r for r in rows
    if r["split"] == "test"
]

vectorizer = DictVectorizer(sparse=False)

X_train = vectorizer.fit_transform([
    build_features(r) for r in train
])

X_test = vectorizer.transform([
    build_features(r) for r in test
])

y_train = np.array([
    int(r["outbreak_recorded"])
    for r in train
])

y_test = np.array([
    int(r["outbreak_recorded"])
    for r in test
])

# Scale numerical features using training data only.
indices = [
    vectorizer.vocabulary_[name]
    for name in NUMERIC_FEATURES
]

scaler = StandardScaler()

X_train[:, indices] = scaler.fit_transform(
    X_train[:, indices]
)

X_test[:, indices] = scaler.transform(
    X_test[:, indices]
)

# Our selected model configuration.
model = LogisticRegression(
    class_weight="balanced",
    max_iter=2000,
    C=0.1,
    random_state=42
)

model.fit(X_train, y_train)

probabilities = model.predict_proba(X_test)[:, 1]

# Select five districts with highest scores each week.
predictions = np.zeros(len(test), dtype=int)

weeks = sorted({
    (int(r["year"]), int(r["week"]))
    for r in test
})

for year, week in weeks:
    week_indices = [
        i for i, row in enumerate(test)
        if int(row["year"]) == year
        and int(row["week"]) == week
    ]

    ranked = sorted(
        week_indices,
        key=lambda i: (-probabilities[i], i)
    )

    for i in ranked[:TOP_K]:
        predictions[i] = 1

tp = int(((predictions == 1) & (y_test == 1)).sum())
fp = int(((predictions == 1) & (y_test == 0)).sum())
fn = int(((predictions == 0) & (y_test == 1)).sum())
tn = int(((predictions == 0) & (y_test == 0)).sum())

precision = tp / (tp + fp) if tp + fp else 0
recall = tp / (tp + fn) if tp + fn else 0

f1 = (
    2 * precision * recall / (precision + recall)
    if precision + recall else 0
)

ap = average_precision_score(y_test, probabilities)

print("========== EPIALERT FINAL TEST ==========")
print("Disease:", DISEASE)
print("Model: Scaled Original Logistic Regression")
print("Training years: 2021-2024")
print("Test year: 2025")
print("Weekly alert budget:", TOP_K)

print("\n========== DATA ==========")
print("Training rows:", len(train))
print("Training positives:", int(y_train.sum()))
print("Test rows:", len(test))
print("Test positives:", int(y_test.sum()))
print("Test weeks:", len(weeks))

print("\n========== RESULTS ==========")
print("Correct alerts:", tp)
print("False alerts:", fp)
print("Missed reports:", fn)
print("Correct non-alerts:", tn)

print("Precision:", round(precision, 4))
print("Recall:", round(recall, 4))
print("F1-score:", round(f1, 4))
print("Average Precision:", round(ap, 4))
print("Positive prevalence:", round(y_test.mean(), 4))

print("\nFinal test completed.")
print("These are retrospective reporting predictions.")
print("Public release timing remains unverified.")

# ==========================================
# EPIALERT - FINAL DASHBOARD EXPORT
# ==========================================

import json

OUTPUT_DIR = ROOT / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

SCORES_FILE = OUTPUT_DIR / "model_scores_2025.csv"
METRICS_FILE = OUTPUT_DIR / "metrics.json"

# Rank districts within each test week.
ranks = {}

for year, week in weeks:
    indices = [
        i for i, row in enumerate(test)
        if int(row["year"]) == year
        and int(row["week"]) == week
    ]

    ranked = sorted(
        indices,
        key=lambda i: (-probabilities[i], i)
    )

    for rank, index in enumerate(ranked, start=1):
        ranks[index] = rank

# Export model scores and historical outcomes.
with SCORES_FILE.open(
    "w", newline="", encoding="utf-8"
) as file:

    writer = csv.DictWriter(
        file,
        fieldnames=[
            "district",
            "disease",
            "year",
            "week",
            "model_score",
            "district_rank",
            "top_5_flag",
            "actual_report_recorded"
        ]
    )

    writer.writeheader()

    for i, row in enumerate(test):
        writer.writerow({
            "district": row["district"],
            "disease": row["disease"],
            "year": row["year"],
            "week": row["week"],
            "model_score": round(
                float(probabilities[i]), 6
            ),
            "district_rank": ranks[i],
            "top_5_flag": int(predictions[i]),
            "actual_report_recorded": int(y_test[i])
        })

# Export final evaluation statistics.
metrics = {
    "project": "EpiAlert AI",
    "disease": DISEASE,
    "model": "Scaled Logistic Regression",
    "training_period": "2021-2024",
    "test_period": "2025",
    "evaluation_type": "retrospective",
    "alert_budget_per_week": TOP_K,

    "dataset": {
        "training_rows": len(train),
        "test_rows": len(test),
        "test_positive_observations": int(y_test.sum()),
        "test_weeks": len(weeks)
    },

    "performance": {
        "true_positives": tp,
        "false_positives": fp,
        "true_negatives": tn,
        "false_negatives": fn,
        "accuracy": round(
            (tp + tn) / len(test), 6
        ),
        "precision": round(precision, 6),
        "recall": round(recall, 6),
        "f1_score": round(f1, 6),
        "average_precision": round(ap, 6)
    },

    "limitations": [
        "Model scores are not calibrated outbreak probabilities.",
        "Predictions refer to reported outbreaks, not total disease cases.",
        "No outbreak recorded does not mean disease-free.",
        "Exact publication dates of reports are unverified.",
        "Results must not be used as real-time health warnings."
    ]
}

with METRICS_FILE.open(
    "w", encoding="utf-8"
) as file:
    json.dump(metrics, file, indent=4)

print("\n========== DASHBOARD EXPORT COMPLETE ==========")
print("Scores:", SCORES_FILE)
print("Metrics:", METRICS_FILE)
print("Exported rows:", len(test))
