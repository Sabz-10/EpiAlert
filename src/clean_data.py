
import csv
from pathlib import Path
from collections import Counter, defaultdict

ROOT = Path(__file__).resolve().parent.parent
OUTPUTS = ROOT / "outputs"

RAW = OUTPUTS / "idsp_2021_2025_audit.csv"
CLEANED = OUTPUTS / "idsp_2021_2025_cleaned.csv"


def normalize_spaces(text):
    return " ".join(str(text or "").split())


def label_key(text):
    return normalize_spaces(text).replace(" ", "").lower()


# ==========================================
# 1. DISTRICT STANDARDIZATION
# ==========================================

district_names = [
    "Ariyalur", "Chengalpattu", "Chennai",
    "Coimbatore", "Cuddalore", "Dharmapuri",
    "Dindigul", "Erode", "Kallakurichi",
    "Kanchipuram", "Kanniyakumari", "Karur",
    "Krishnagiri", "Madurai", "Mayiladuthurai",
    "Nagapattinam", "Namakkal", "Perambalur",
    "Pudukkottai", "Ramanathapuram", "Ranipet",
    "Salem", "Sivaganga", "Tenkasi",
    "Thanjavur", "The Nilgiris", "Theni",
    "Thiruvallur", "Thiruvarur",
    "Tiruchirappalli", "Tirunelveli",
    "Tirupathur", "Tiruppur",
    "Tiruvannamalai", "Tuticorin",
    "Vellore", "Villupuram", "Virudhunagar"
]

district_lookup = {
    label_key(name): name
    for name in district_names
}

district_aliases = {
    "Ariyallur": "Ariyalur",
    "Kancheepuram": "Kanchipuram",
    "Kanyakumari": "Kanniyakumari",
    "Nagapatinam": "Nagapattinam",
    "Pudukottai": "Pudukkottai",
    "Peramballur": "Perambalur",
    "Thirupathur": "Tirupathur",
    "Trichirapalli": "Tiruchirappalli",
    "Thiruvannamalai": "Tiruvannamalai",
    "Tiruvallur": "Thiruvallur",
    "Thoothukudi": "Tuticorin",

    # Subdistrict references assigned to parent district
    "Dindigul Palani": "Dindigul",
    "Thiruvallur - Poonamallee": "Thiruvallur",
    "Tiruvannamalai- Cheyyar": "Tiruvannamalai",
    "Virudhunagar - Sivakasi": "Virudhunagar",
    "Virudhunagar- Sivakasi": "Virudhunagar",
}

for alias, canonical in district_aliases.items():
    district_lookup[label_key(alias)] = canonical


def clean_district(value):
    value = normalize_spaces(value)
    return district_lookup.get(label_key(value), value)


# ==========================================
# 2. DISEASE STANDARDIZATION
# ==========================================

disease_names = [
    "Acute Diarrheal Disease",
    "Acute Encephalitis Syndrome",
    "Acute Febrile Illness",
    "Acute Gastroenteritis",
    "Acute Hepatitis E",
    "Allergic Conjunctivitis",
    "Animal Bite - Dog Bite",
    "Chickenpox",
    "Chikungunya",
    "Cholera",
    "Dengue",
    "Dengue & Chikungunya",
    "Dengue & Leptospirosis",
    "Dengue & Scrub Typhus",
    "Diphtheria",
    "Dysentery",
    "Fever",
    "Fever of Unknown Origin",
    "Fever with Rash",
    "Food Borne Illness",
    "Food Poisoning",
    "Hepatitis A",
    "Hepatitis A & E",
    "Human Rabies",
    "Jaundice",
    "Leptospirosis",
    "Leptospirosis & Dengue",
    "Measles",
    "Mixed Fever",
    "Mumps",
    "Pertussis",
    "Pyrexia of Unknown Origin",
    "Scrub Typhus",
    "Suspected Food Poisoning",
    "Suspected Measles",
    "Typhoid"
]

disease_lookup = {
    label_key(name): name
    for name in disease_names
}

disease_aliases = {
    "Acute Diarrhoeal Disease": "Acute Diarrheal Disease",
    "Acute Diarrheal Diseases": "Acute Diarrheal Disease",
    "Acute Encephalitic Syndrome": "Acute Encephalitis Syndrome",
    "Dengue/Scrub Typhus": "Dengue & Scrub Typhus",
    "Hepatitis A&E": "Hepatitis A & E",
    "Viral Hepatitis A": "Hepatitis A",
}

for alias, canonical in disease_aliases.items():
    disease_lookup[label_key(alias)] = canonical


def clean_disease(value):
    value = normalize_spaces(value)
    return disease_lookup.get(label_key(value), value)


# ==========================================
# 3. LOAD AUDITED DATA
# ==========================================

if not RAW.exists():
    raise FileNotFoundError(f"Audit file not found: {RAW}")

with RAW.open(encoding="utf-8-sig", newline="") as file:
    records = list(csv.DictReader(file))

print("Original extracted records:", len(records))


# ==========================================
# 4. RECOVER VERIFIED PDF RECORDS
# ==========================================

def recovery(year, week, outbreak_id, district,
             disease, cases, deaths, page):
    return {
        "year": str(year),
        "week": str(week),
        "outbreak_id": outbreak_id,
        "district": district,
        "disease": disease,
        "cases": str(cases),
        "deaths": str(deaths),
        "source_pdf": f"idsp_week{week}_{year}.pdf",
        "source_page": str(page)
    }


recovered = [
    
    # 2022: verified records with incorrect source ID prefixes

    recovery(
        2022, 8, "WB/HWR/2022/08/042",
        "Cuddalore", "Food Poisoning",
        29, 0, 4
    ),

    recovery(
        2022, 15, "KN/CKR/2022/15/138",
        "Kanchipuram", "Food Borne Illness",
        15, 0, 4
    ),

    recovery(
        2022, 15, "KN/CKR/2022/15/139",
        "Kallakurichi", "Acute Diarrheal Disease",
        14, 0, 4
    ),

    # 2021: verified against original PDF text

    recovery(
        2021, 1, "TN/DMP/2021/01/0004",
        "Dharmapuri", "Acute Diarrheal Disease",
        17, 0, 3
    ),

    recovery(
        2021, 4, "TN/VIR/2021/04/0033",
        "Virudhunagar", "Dengue",
        7, 0, 4
    ),

    recovery(
        2021, 4, "TN/TRN/2021/04/0038",
        "Tirunelveli", "Acute Encephalitis Syndrome",
        1, 1, 5
    ),

    recovery(
        2021, 9, "TN/PER/2021/09/0106",
        "Perambalur", "Acute Diarrheal Disease",
        14, 0, 3
    ),

    recovery(
        2021, 43, "TN/DDG/2021/43/0597",
        "Dindigul", "Dengue",
        5, 0, 4
    ),

    # 2025: previously verified corrections

    recovery(
        2025, 20, "RJ/SIR/2025/20/859",
        "Erode", "Dengue",
        8, 0, 13
    ),

    recovery(
        2025, 36, "TN/MAY/2025/36/1671",
        "Mayiladuthurai", "Fever",
        14, 0, 17
    ),

    recovery(
        2025, 36, "TN/TIR/2025/36/1672",
        "Tirupathur", "Dysentery",
        33, 0, 17
    )
]


def record_key(row):
    return (
        Path(str(row.get("source_pdf", ""))).name,
        normalize_spaces(row.get("outbreak_id")),
        str(row.get("source_page", "")).strip()
    )


existing = {
    record_key(row): row
    for row in records
}

recovered_count = 0
corrected_count = 0
recovered_keys = set()

for record in recovered:
    key = record_key(record)
    recovered_keys.add(key)

    if key in existing:
        # Correct incomplete rows instead of duplicating them.
        existing[key].update(record)
        corrected_count += 1
    else:
        records.append(record)
        existing[key] = record
        recovered_count += 1

print("Recovered records added:", recovered_count)
print("Existing records corrected:", corrected_count)


# ==========================================
# 5. CLEAN AND VALIDATE
# ==========================================

cleaned = []
seen = set()

prefix_mismatches = {
    "WB/HWR/2022/08/042",
    "KN/CKR/2022/15/138",
    "KN/CKR/2022/15/139",
    "RJ/SIR/2025/20/859"
}

conflicting_id = "TN/PUD/2025/02/29"

for record in records:
    key = record_key(record)

    # Entire 2021 Week 26 PDF is actually a 2022 report.
    if (
        record["source_pdf"] == "idsp_week26_2021.pdf"
    ):
        continue
    
    # Avoid duplicate copies of the same source row.
    if key in seen:
        continue

    seen.add(key)

    row = record.copy()

    row["district"] = clean_district(row.get("district"))
    row["disease"] = clean_disease(row.get("disease"))

    for field in ["year", "week", "cases", "deaths"]:
        value = str(row.get(field, "")).strip()

        if value and value.isdigit():
            row[field] = str(int(value))
        else:
            row[field] = value

    flags = []

    if row["outbreak_id"] == conflicting_id:
        flags.append("SOURCE_ID_CONFLICT")

    if row["outbreak_id"] in prefix_mismatches:
        flags.append("SOURCE_ID_PREFIX_MISMATCH")

    if key in recovered_keys:
        flags.append("PDF_TEXT_RECOVERED")

    row["validation_flag"] = ";".join(flags)

    cleaned.append(row)


# Keep records in chronological order.
cleaned.sort(
    key=lambda r: (
        int(r["year"]),
        int(r["week"]),
        r["outbreak_id"],
        r["source_page"]
    )
)

for index, row in enumerate(cleaned, start=1):
    row["record_id"] = f"EPI-{index:04d}"


# ==========================================
# 6. SAVE CLEANED DATASET
# ==========================================

columns = [
    "record_id",
    "year",
    "week",
    "outbreak_id",
    "district",
    "disease",
    "cases",
    "deaths",
    "source_pdf",
    "source_page",
    "validation_flag"
]

OUTPUTS.mkdir(parents=True, exist_ok=True)

with CLEANED.open("w", encoding="utf-8", newline="") as file:
    writer = csv.DictWriter(
        file,
        fieldnames=columns,
        extrasaction="ignore"
    )

    writer.writeheader()
    writer.writerows(cleaned)


# ==========================================
# 7. FINAL DATA QUALITY REPORT
# ==========================================

districts = Counter(r["district"] for r in cleaned)
diseases = Counter(r["disease"] for r in cleaned)
years = Counter(r["year"] for r in cleaned)
flags = Counter()

for row in cleaned:
    for flag in row["validation_flag"].split(";"):
        if flag:
            flags[flag] += 1

unknown_districts = [
    district for district in districts
    if district not in district_names
]

unknown_diseases = [
    disease for disease in diseases
    if disease not in disease_names
]

invalid_rows = []

for row in cleaned:
    if (
        not row["district"]
        or not row["disease"]
        or not row["cases"].isdigit()
        or not row["deaths"].isdigit()
    ):
        invalid_rows.append(row)


print("\n========== FIVE-YEAR CLEANING RESULTS ==========")

print("Cleaned records:", len(cleaned))
print("District labels:", len(districts))
print("Disease labels:", len(diseases))

print("\n=== YEAR COUNTS ===")

for year, count in sorted(years.items()):
    print(f"{year}: {count}")

print("\n=== TOP 10 DISEASES ===")

for disease, count in diseases.most_common(10):
    print(f"{disease}: {count}")

print("\n=== VALIDATION FLAGS ===")

for flag, count in flags.items():
    print(f"{flag}: {count}")

print("\n=== UNKNOWN DISTRICT LABELS ===")
print(unknown_districts)

print("\n=== UNMAPPED DISEASE LABELS ===")
print(unknown_diseases)

print("\n=== INCOMPLETE RECORDS ===")
print(len(invalid_rows))

for row in invalid_rows:
    print(
        row["year"],
        row["week"],
        row["outbreak_id"]
    )

print("\nSaved:", CLEANED)