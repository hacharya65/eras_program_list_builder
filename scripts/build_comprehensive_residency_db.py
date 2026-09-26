import glob, pypdf, re, json, os

CENSUS_REGIONS = {
    'CT': 'New England', 'ME': 'New England', 'MA': 'New England', 'NH': 'New England', 'RI': 'New England', 'VT': 'New England',
    'NJ': 'Middle Atlantic', 'NY': 'Middle Atlantic', 'PA': 'Middle Atlantic',
    'IL': 'East North Central', 'IN': 'East North Central', 'MI': 'East North Central', 'OH': 'East North Central', 'WI': 'East North Central',
    'IA': 'West North Central', 'KS': 'West North Central', 'MN': 'West North Central', 'MO': 'West North Central', 'NE': 'West North Central', 'ND': 'West North Central', 'SD': 'West North Central',
    'DE': 'South Atlantic', 'DC': 'South Atlantic', 'FL': 'South Atlantic', 'GA': 'South Atlantic', 'MD': 'South Atlantic', 'NC': 'South Atlantic', 'PR': 'South Atlantic', 'SC': 'South Atlantic', 'VA': 'South Atlantic', 'WV': 'South Atlantic',
    'AL': 'East South Central', 'KY': 'East South Central', 'MS': 'East South Central', 'TN': 'East South Central',
    'AR': 'West South Central', 'LA': 'West South Central', 'OK': 'West South Central', 'TX': 'West South Central',
    'AZ': 'Mountain', 'CO': 'Mountain', 'ID': 'Mountain', 'MT': 'Mountain', 'NV': 'Mountain', 'NM': 'Mountain', 'UT': 'Mountain', 'WY': 'Mountain',
    'AK': 'Pacific', 'CA': 'Pacific', 'HI': 'Pacific', 'OR': 'Pacific', 'WA': 'Pacific'
}

PDF_MAP = {
    "Anesthesia.pdf": "Anesthesiology",
    "Dermatology.pdf": "Dermatology",
    "Diagnostic Radiology.pdf": "Diagnostic Radiology",
    "ENT.pdf": "Otolaryngology",
    "Emergency Medicine.pdf": "Emergency Medicine",
    "Family Medicine.pdf": "Family Medicine",
    "Internal Medicine.pdf": "Internal Medicine",
    "Internal Medicine:Pediatrics.pdf": "Internal Medicine/Pediatrics",
    "Interventional Radiology Independent.pdf": "Interventional Radiology (Independent)",
    "Interventional Radiology Integrated.pdf": "Interventional Radiology (Integrated)",
    "Neurology.pdf": "Neurology",
    "Neurosurgery.pdf": "Neurological Surgery",
    "OBGYN.pdf": "Obstetrics and Gynecology",
    "Opthalmology.pdf": "Ophthalmology",
    "Orthopaedic Surgery.pdf": "Orthopedic Surgery",
    "PM&R.pdf": "Physical Medicine and Rehabilitation",
    "Pathology.pdf": "Pathology",
    "Pediatrics.pdf": "Pediatrics",
    "Plastic Surgery Integrated.pdf": "Plastic Surgery (Integrated)",
    "Plastic Surgery.pdf": "Plastic Surgery",
    "Psychiatry.pdf": "Psychiatry",
    "RadOnc.pdf": "Radiation Oncology",
    "Surgery.pdf": "General Surgery",
    "Thoracic Surgery Independent.pdf": "Thoracic Surgery (Independent)",
    "Thoracic Surgery Integrated.pdf": "Thoracic Surgery (Integrated)",
    "Transitional Year.pdf": "Transitional Year",
    "Urology.pdf": "Urology",
    "Vascular Surgery Integrated.pdf": "Vascular Surgery (Integrated)",
}

programs = []
seen_ids = set()

for filename, specialty in sorted(PDF_MAP.items()):
    filepath = os.path.join("Context/Residency Programs", filename)
    if not os.path.exists(filepath):
        continue
    reader = pypdf.PdfReader(filepath)
    full_text = "\n".join([page.extract_text() for page in reader.pages])
    
    matches = re.finditer(r"\[\s*(\d{10})\s*\](.*?)(?=\[\s*\d{10}\s*\]|\Z)", full_text, re.DOTALL)
    for m in matches:
        prog_id = m.group(1).strip()
        body = m.group(2).strip()
        
        # Unique identifier by specialty+id
        unique_key = f"{specialty}-{prog_id}"
        if unique_key in seen_ids:
            continue
        seen_ids.add(unique_key)
        
        # Extract program name
        prog_name_match = re.search(r"^(.*?\b(?:Program|Network|Hospital|Center|University|College)\b)", body, re.DOTALL)
        if prog_name_match:
            prog_name = " ".join(prog_name_match.group(1).split())
            rest = body[prog_name_match.end():].strip()
        else:
            first_line = body.split("\n")[0]
            prog_name = " ".join(first_line.split())
            rest = "\n".join(body.split("\n")[1:])
            
        # Clean program name
        prog_name = re.sub(r"\s+", " ", prog_name).strip()
        if len(prog_name) < 3:
            prog_name = f"{specialty} Residency Program #{prog_id}"

        # City, State, Zip
        csz_match = re.search(r"([A-Za-z\s.\-]+),\s*([A-Z]{2})\s*\n?\s*(\d{5}(?:-\d{4})?)", rest)
        if csz_match:
            city_raw = csz_match.group(1).strip().split("\n")[-1].strip()
            city = re.sub(r"\s+", " ", city_raw).strip()
            state = csz_match.group(2).strip()
            zip_code = csz_match.group(3).strip()
            addr_part = rest[:csz_match.end()]
            addr_clean = ", ".join([l.strip() for l in addr_part.split("\n") if l.strip()])
            addr_clean = re.sub(r"\s+", " ", addr_clean).strip()
            rest_after_addr = rest[csz_match.end():]
        else:
            city, state, zip_code = "Unknown", "PA", ""
            addr_clean = f"{city}, {state}"
            rest_after_addr = rest

        # Program director
        pd_match = re.search(r"([A-Z][a-zA-Z\s.,\-]+,\s*(?:MD|DO|MBBS|PhD|MD,\s*PhD)[^\n]*)", rest_after_addr)
        director = " ".join(pd_match.group(1).split()) if pd_match else "Program Director"
        director = re.sub(r"(?:Accreditation|Effective|Ph:).*", "", director, flags=re.I).strip()

        region = CENSUS_REGIONS.get(state, "Middle Atlantic")

        programs.append({
            "id": prog_id,
            "programNumber": prog_id,
            "name": prog_name,
            "specialty": specialty,
            "city": city,
            "state": state,
            "region": region,
            "address": addr_clean,
            "programDirector": director,
            "offersPreliminary": "Preliminary" in body or specialty in ["Internal Medicine", "General Surgery", "Pediatrics", "Transitional Year"],
            "residencyExplorerUrl": "https://www.residencyexplorer.org",
            "doximityUrl": f"https://www.doximity.com/residency/programs/{prog_id}"
        })

print(f"Total programs compiled directly from PDFs: {len(programs)}")

# Output summary by specialty
specs = {}
for p in programs:
    specs[p["specialty"]] = specs.get(p["specialty"], 0) + 1

for s, cnt in sorted(specs.items()):
    print(f"  {s:42}: {cnt:4} programs")

# Save to destination
target_json = "src/data/residency-programs.json"
with open(target_json, "w", encoding="utf-8") as f:
    json.dump(programs, f, indent=2)

print(f"Saved {len(programs)} residency programs to {target_json} successfully.")
