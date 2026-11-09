
"""
EpiAlert AI - Official ML Entry Point

Run from project root:
    python src/train.py

This script runs the evaluated retrospective ML
pipeline and exports the dashboard data.
"""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SCRIPTS = [
    ROOT / "src" / "prepare_ml_data.py",
    ROOT / "src" / "final_test.py",
    ROOT / "src" / "export_trends.py"
]

for script in SCRIPTS:
    print(f"\n========== RUNNING {script.name} ==========")

    subprocess.run(
        [sys.executable, str(script)],
        cwd=ROOT,
        check=True
    )

print("\n========== EPIALERT ML PIPELINE COMPLETE ==========")
print("Outputs generated:")
print("- outputs/ml_training_dataset.csv")
print("- outputs/model_scores_2025.csv")
print("- outputs/metrics.json")
print("- outputs/historical_trends.csv")
print("\nNote: Results are retrospective, not live warnings.")
