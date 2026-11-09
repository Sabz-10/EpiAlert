
import csv
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUTPUTS = ROOT / "outputs"

SOURCE = OUTPUTS / "idsp_2021_2025_cleaned.csv"
PANEL = OUTPUTS / "weekly_ml_panel.csv"
TRAINING = OUTPUTS / "ml_training_dataset.csv"

DISEASES = [
    "Acute Diarrheal Disease",
    "Mumps",
    "Chickenpox"
]

INVALID_WEEKS = {(2021, 26)}

with SOURCE.open(encoding="utf-8-sig", newline="") as f:
    records = list(csv.DictReader(f))

districts = sorted({r["district"] for r in records})

# Historical reporting periods
timeline = [
    (year, week)
    for year in range(2021, 2026)
    for week in range(1, 53)
]

# A PDF existing does not prove full surveillance coverage.
available = {
    (year, week): (
        (year, week) not in INVALID_WEEKS
        and (DATA / f"idsp_week{week}_{year}.pdf").exists()
    )
    for year, week in timeline
}

outbreaks = Counter()

for row in records:
    if row["disease"] in DISEASES:
        key = (
            int(row["year"]),
            int(row["week"]),
            row["district"],
            row["disease"]
        )
        outbreaks[key] += 1

columns = [
    "district", "disease", "year", "week",
    "previous_4_outbreaks",
    "previous_8_outbreaks",
    "previous_8_available_weeks",
    "outbreak_recorded",
    "observation_status",
    "split",
    "previous_12_outbreaks",
    "statewide_4_outbreaks",
    "statewide_8_outbreaks",
]

panel = []
training = []

for district in districts:
    for disease in DISEASES:
        for index, (year, week) in enumerate(timeline):

            previous_4 = timeline[max(0, index - 4):index]
            previous_8 = timeline[max(0, index - 8):index]
            
            # Additional historical features
            previous_12 = timeline[max(0, index - 12):index]

            previous_12_count = sum(
                outbreaks[(y, w, district, disease)]
                for y, w in previous_12
                if available[(y, w)]
            )

            statewide_4_count = sum(
                outbreaks[(y, w, d, disease)]
                for y, w in previous_4
                for d in districts
                if available[(y, w)]
            )

            statewide_8_count = sum(
                outbreaks[(y, w, d, disease)]
                for y, w in previous_8
                for d in districts
                if available[(y, w)]
            )


            previous_4_count = sum(
                outbreaks[(y, w, district, disease)]
                for y, w in previous_4
                if available[(y, w)]
            )

            previous_8_count = sum(
                outbreaks[(y, w, district, disease)]
                for y, w in previous_8
                if available[(y, w)]
            )

            history_coverage = sum(
                available[(y, w)]
                for y, w in previous_8
            )

            report_available = available[(year, week)]

            if report_available:
                target = int(
                    outbreaks[(year, week, district, disease)] > 0
                )
                status = (
                    "OUTBREAK_RECORDED"
                    if target else "NO_OUTBREAK_RECORDED"
                )
            else:
                target = ""
                status = "REPORT_UNAVAILABLE"

            split = (
                "train" if year <= 2023
                else "validation" if year == 2024
                else "test"
            )

            row = {
                "district": district,
                "disease": disease,
                "year": year,
                "week": week,
                "previous_4_outbreaks": previous_4_count,
                "previous_8_outbreaks": previous_8_count,
                "previous_8_available_weeks": history_coverage,
                "outbreak_recorded": target,
                "observation_status": status,
                "split": split,
                "previous_12_outbreaks": previous_12_count,
                "statewide_4_outbreaks": statewide_4_count,
                "statewide_8_outbreaks": statewide_8_count,
            }

            panel.append(row)

            if (
                report_available
                and len(previous_8) == 8
                and history_coverage == 8
            ):
                training.append(row)

def save_csv(path, rows):
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=columns)
        writer.writeheader()
        writer.writerows(rows)

OUTPUTS.mkdir(exist_ok=True)

save_csv(PANEL, panel)
save_csv(TRAINING, training)

print("\n========== ML DATASET PREPARATION ==========")
print("Cleaned records:", len(records))
print("Districts:", len(districts))
print("Selected diseases:", len(DISEASES))
print("Valid PDF weeks:", sum(available.values()))
print("Total panel rows:", len(panel))
print("Candidate training rows:", len(training))

print("\n========== SPLIT SUMMARY ==========")

for disease in DISEASES:
    print(f"\n{disease}")

    for split in ["train", "validation", "test"]:
        subset = [
            r for r in training
            if r["disease"] == disease
            and r["split"] == split
        ]

        positive = sum(
            int(r["outbreak_recorded"])
            for r in subset
        )

        print(
            f"  {split}: {len(subset)} rows, "
            f"{positive} positive, "
            f"{len(subset) - positive} unreported"
        )

print("\nSaved:", PANEL)
print("Saved:", TRAINING)
print("\nNote: Unreported is not confirmed disease-free.")
print("This dataset is for retrospective experimentation.")
