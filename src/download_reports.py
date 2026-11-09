
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.parse import urljoin
from html.parser import HTMLParser
import re
import time

BASE = "https://ncdc.mohfw.gov.in/uploads/weekly_outbreaks/"
ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"


class PDFParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        if tag != "a":
            return

        href = dict(attrs).get("href", "")
        filename = href.split("/")[-1].split("?")[0]

        if re.fullmatch(r"week\d+(?:_\d+)?\.pdf", filename, re.I):
            self.links.append(href)


def download_year(year):
    url = f"{BASE}{year}/"

    print(f"\n========== {year} ==========")

    request = Request(url, headers={
        "User-Agent": "EpiAlertResearch/1.0"
    })

    with urlopen(request, timeout=30) as response:
        html = response.read().decode("utf-8")

    parser = PDFParser()
    parser.feed(html)

    reports = {}

    for href in parser.links:
        filename = href.split("/")[-1].split("?")[0]
        match = re.match(r"week(\d+)", filename, re.I)

        if match:
            week = int(match.group(1))

            if 1 <= week <= 53:
                reports[week] = href

    print("Reports found:", len(reports))

    missing = sorted(set(range(1, 53)) - set(reports))
    print("Weeks not found in archive:", missing)

    downloaded = 0
    skipped = 0
    failed = []

    for week, href in sorted(reports.items()):
        destination = DATA / f"idsp_week{week}_{year}.pdf"

        if destination.exists():
            with destination.open("rb") as file:
                if file.read(5) == b"%PDF-":
                    print(f"Week {week}: already exists")
                    skipped += 1
                    continue

        try:
            request = Request(
                urljoin(url, href),
                headers={"User-Agent": "EpiAlertResearch/1.0"}
            )

            with urlopen(request, timeout=45) as response:
                content = response.read()

            if not content.startswith(b"%PDF-"):
                raise ValueError("Invalid PDF")

            temporary = destination.with_suffix(".tmp")
            temporary.write_bytes(content)
            temporary.replace(destination)

            downloaded += 1
            print(f"Week {week}: downloaded")

        except Exception as error:
            failed.append(week)
            print(f"Week {week}: FAILED - {error}")

        time.sleep(0.5)

    print(f"\n{year} summary:")
    print("Downloaded:", downloaded)
    print("Already present:", skipped)
    print("Failed:", failed)


if __name__ == "__main__":
    DATA.mkdir(exist_ok=True)

for year in [2021, 2022]:
    download_year(year)

    print("\nFinished downloading historical reports!")
