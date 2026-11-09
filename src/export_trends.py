
import csv
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SOURCE = ROOT / "outputs" / "idsp_2021_2025_cleaned.csv"
OUTPUT = ROOT / "outputs" / "historical_trends.csv"

SELECTED_DISEASES = {
    "Acute Diarrheal Disease",
    "Mumps",
    "Chickenpox"
}

with SOURCE.open(
    "r", encoding="utf-8-sig", newline=""
) as f:
    reader = csv.DictReader(f)

    print("Available columns:", reader.fieldnames)

    required = {"district", "disease", "year", "week"}

    missing = required - set(reader.fieldnames or [])

    if missing:
        raise ValueError(
            f"Missing columns: {sorted(missing)}. "
            "Check the cleaned CSV headers."
        )

    rows = list(reader)

counts = defaultdict(int)

for row in rows:
    disease = row["disease"].strip()

    if disease not in SELECTED_DISEASES:
        continue

    district = row["district"].strip()
    year = int(row["year"])
    week = int(row["week"])

    key = (district, disease, year, week)
    counts[key] += 1

OUTPUT.parent.mkdir(parents=True, exist_ok=True)

with OUTPUT.open(
    "w", encoding="utf-8", newline=""
) as f:
    writer = csv.writer(f)

    writer.writerow([
        "district",
        "disease",
        "year",
        "week",
        "outbreak_reports"
    ])

    for (district, disease, year, week), count in sorted(
        counts.items()
    ):
        writer.writerow([
            district,
            disease,
            year,
            week,
            count
        ])

print("\n========== HISTORICAL TRENDS EXPORT ==========")
print("Cleaned source records:", len(rows))
print("Selected diseases:", len(SELECTED_DISEASES))
print("District-disease-week combinations:", len(counts))
print("Saved:", OUTPUT)
print("\nNote: Counts represent recorded outbreak events,")
print("not total patient cases or confirmed disease-free weeks.")
