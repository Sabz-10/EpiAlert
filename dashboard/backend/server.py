"""Local research inference API. Retrains the exact 2021–2024 model at startup.
Run: python backend/server.py (after npm run sync:data).
"""
import csv
import json
import math
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import numpy as np
from sklearn.feature_extraction import DictVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "data" / "ml_training_dataset.csv"
DISEASE = "Acute Diarrheal Disease"
NUMERIC = ["previous_4_outbreaks", "previous_8_outbreaks", "week_sin", "week_cos"]

def features(row):
    week = int(row["week"])
    return {"district": row["district"],
            "previous_4_outbreaks": int(row["previous_4_outbreaks"]),
            "previous_8_outbreaks": int(row["previous_8_outbreaks"]),
            "week_sin": math.sin(2 * math.pi * week / 52),
            "week_cos": math.cos(2 * math.pi * week / 52)}

def load_model():
    if not SOURCE.exists():
        raise FileNotFoundError(f"{SOURCE} missing. Run npm.cmd run sync:data first.")
    with SOURCE.open(encoding="utf-8-sig", newline="") as f:
        rows = [r for r in csv.DictReader(f) if r["disease"] == DISEASE]
    train = [r for r in rows if r["split"] in ("train", "validation")]
    test = [r for r in rows if r["split"] == "test"]
    if not train or not test:
        raise ValueError("Training or 2025 test rows missing")
    vectorizer = DictVectorizer(sparse=False)
    x_train = vectorizer.fit_transform([features(r) for r in train])
    indices = [vectorizer.vocabulary_[name] for name in NUMERIC]
    scaler = StandardScaler()
    x_train[:, indices] = scaler.fit_transform(x_train[:, indices])
    model = LogisticRegression(class_weight="balanced", max_iter=2000, C=0.1, random_state=42)
    model.fit(x_train, np.array([int(r["outbreak_recorded"]) for r in train]))
    return test, vectorizer, scaler, model, indices

TEST, VECTORIZER, SCALER, MODEL, INDICES = load_model()
WEEKS = sorted({int(r["week"]) for r in TEST})

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        route = urlparse(self.path)
        if route.path == "/api/health":
            return self.respond(200, {"status":"ready", "model":"Scaled Logistic Regression", "weeks": WEEKS})
        if route.path != "/api/predict":
            return self.respond(404, {"error": "Unknown endpoint"})
        params = parse_qs(route.query)
        try:
            week = int(params.get("week", [""])[0])
        except ValueError:
            return self.respond(400, {"error": "Week must be an integer"})
        if week not in WEEKS:
            return self.respond(400, {"error": "No held-out observations for that week", "available_weeks": WEEKS})
        rows = [r for r in TEST if int(r["year"]) == 2025 and int(r["week"]) == week]
        x = VECTORIZER.transform([features(r) for r in rows])
        x[:, INDICES] = SCALER.transform(x[:, INDICES])
        probabilities = MODEL.predict_proba(x)[:, 1]
        ranked = sorted(range(len(rows)), key=lambda i: (-probabilities[i], i))
        results = [{"rank": rank, "district": rows[i]["district"],
                    "model_score": round(float(probabilities[i]), 6),
                    "actual_report_recorded": int(rows[i]["outbreak_recorded"]),
                    "previous_4_outbreaks": int(rows[i]["previous_4_outbreaks"]),
                    "previous_8_outbreaks": int(rows[i]["previous_8_outbreaks"])}
                   for rank, i in enumerate(ranked, start=1)]
        self.respond(200, {"disease": DISEASE, "year": 2025, "week": week,
                           "model": "Scaled Logistic Regression", "training_period": "2021–2024",
                           "evaluation": "2025 held-out retrospective", "run_timestamp": datetime.now(timezone.utc).isoformat(),
                           "district_count": len(results), "top_five": results[:5], "all_rankings": results,
                           "correct_top_five": sum(r["actual_report_recorded"] for r in results[:5]),
                           "note": "Scores are ranking signals, not calibrated outbreak probabilities."})
    def respond(self, status, payload):
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

if __name__ == "__main__":
    print(f"EpiAlert model ready: {len(TEST)} held-out rows, {len(WEEKS)} weeks")
    print("Inference API: http://127.0.0.1:8000/api/health")
    ThreadingHTTPServer(("127.0.0.1", 8000), Handler).serve_forever()
