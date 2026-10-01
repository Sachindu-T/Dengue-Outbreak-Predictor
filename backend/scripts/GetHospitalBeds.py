# import pdfplumber
# import pandas as pd
# import re

# def parse_number(value):
#     if value is None:
#         return None
#     cleaned = re.sub(r'[^\d]', '', str(value))
#     if cleaned:
#         return int(cleaned)
#     return None

# def normalize_text(value):
#     if value is None:
#         return None
#     return str(value).strip()

# path = 'D:/Data science-SUSL/Projects/Capstone Weather/PDFs/Bed-Data-2025-Updated.pdf'

# normal_beds = []
# icu_beds = []

# with pdfplumber.open(path) as pdf:
#     page6 = pdf.pages[5]
#     tables = page6.extract_tables()
    
#     current_category = ''
#     for row in tables[0]:
#         if len(row) < 4:
#             continue
        
#         col0 = normalize_text(row[0])
#         col1 = normalize_text(row[1])
        
#         if col1 in ('National Hospitals', 'Teaching Hospitals'):
#             current_category = col1
#             continue
        
#         if col1 is None or col1 == '':
#             continue
        
#         if parse_number(col1) is not None:
#             continue
        
#         location = 'National Hospitals' if 'National' in current_category else 'Teaching Hospitals'
        
#         total_beds = parse_number(row[2])
#         inpatient_beds = parse_number(row[3])
        
#         if col1 and ('Hospital' in col1 or 'MCH' in col1):
#             if '\n' in col1:
#                 names = [n.strip() for n in col1.split('\n')]
#                 total_values = str(row[2]).split('\n') if row[2] else []
#                 inpatient_values = str(row[3]).split('\n') if row[3] else []
                
#                 for i, name in enumerate(names):
#                     if not name or 'Hospital' not in name:
#                         continue
#                     t = parse_number(total_values[i]) if i < len(total_values) else total_beds
#                     ip = parse_number(inpatient_values[i]) if i < len(inpatient_values) else inpatient_beds
                    
#                     if t is not None:
#                         normal_beds.append({
#                             'district': location,
#                             'hospital_name': name,
#                             'bed_count': t
#                         })
                    
#                     if ip is not None:
#                         icu_beds.append({
#                             'district': location,
#                             'hospital_name': name,
#                             'bed_count': ip
#                         })
#             else:
#                 if total_beds is not None:
#                     normal_beds.append({
#                         'district': location,
#                         'hospital_name': col1,
#                         'bed_count': total_beds
#                     })
                
#                 if inpatient_beds is not None:
#                     icu_beds.append({
#                         'district': location,
#                         'hospital_name': col1,
#                         'bed_count': inpatient_beds
#                     })

#     page16 = pdf.pages[15]
#     page_tables = page16.extract_tables()
    
#     current_district = ''
#     for row in page_tables[0]:
#         if len(row) < 10:
#             continue
        
#         col0 = normalize_text(row[0])
#         col3 = normalize_text(row[3])
        
#         if col0 and col0 != '' and parse_number(col0) is None and col0 not in ('District', '', None):
#             current_district = col0
        
#         if col3 is None or col3 == '':
#             continue
        
#         if parse_number(col3) is not None:
#             continue
        
#         if col3.lower() in ('name of institution', 'institution'):
#             continue
        
#         if 'Name Of the Institution' in col3 or 'Inpatient beds as at' in col3:
#             continue
        
#         total_beds = parse_number(row[6])
#         inpatient_beds = parse_number(row[9])
        
#         if total_beds is not None:
#             normal_beds.append({
#                 'district': current_district,
#                 'hospital_name': col3,
#                 'bed_count': total_beds
#             })
        
#         if inpatient_beds is not None:
#             icu_beds.append({
#                 'district': current_district,
#                 'hospital_name': col3,
#                 'bed_count': inpatient_beds
#             })

# df_normal = pd.DataFrame(normal_beds)
# print("=== Normal Beds (Total hospital beds) ===")
# print(df_normal.dtypes)
# print(df_normal.head(50))
# print(f"Total rows: {len(df_normal)}")
# df_normal.to_csv('hospital_beds.csv', index=False)

# df_icu = pd.DataFrame(icu_beds)
# print("\n=== ICU Beds (Inpatient beds as at 31.12.2025) ===")
# print(df_icu.dtypes)
# print(df_icu.head(50))
# print(f"Total rows: {len(df_icu)}")
# df_icu.to_csv('icu_beds.csv', index=False)

import pdfplumber
import pandas as pd
import re


# -----------------------------
# District helpers
# -----------------------------

KNOWN_DISTRICT_ALIASES = {
    "ampara": "Ampara",
    "anuradhapura": "Anuradhapura",
    "badulla": "Badulla",
    "batticaloa": "Batticaloa",
    "colombo": "Colombo",
    "galle": "Galle",
    "gampaha": "Gampaha",
    "hambantota": "Hambantota",
    "jaffna": "Jaffna",
    "kalmunai": "Kalmunai",
    "kalutara": "Kalutara",
    "kandy": "Kandy",
    "kegalle": "Kegalle",
    "kilinochchi": "Kilinochchi",
    "killinochchi": "Kilinochchi",
    "kurunegala": "Kurunegala",
    "mannar": "Mannar",
    "matale": "Matale",
    "matara": "Matara",
    "monaragala": "Monaragala",
    "moneragala": "Monaragala",
    "mullaitivu": "Mullaitivu",
    "mulativu": "Mullaitivu",
    "nuwara eliya": "Nuwara Eliya",
    "nuwaraeliya": "Nuwara Eliya",
    "polonnaruwa": "Polonnaruwa",
    "puttlam": "Puttlam",
    "puttalam": "Puttlam",
    "ratnapura": "Ratnapura",
    "trincomalee": "Trincomalee",
    "vavuniya": "Vavuniya",
}


# Line Ministry table does NOT contain a District column.
# These rules infer district from hospital name/location.
LM_DISTRICT_RULES = [
    (r"national hospital.*sri lanka", "Colombo"),
    (r"national hospital.*kandy", "Kandy"),
    (r"national hospital.*galle", "Galle"),

    (r"teaching hospital.*anuradhapura", "Anuradhapura"),
    (r"teaching hospital.*batticaloa", "Batticaloa"),
    (r"teaching hospital.*badulla", "Badulla"),
    (r"teaching hospital.*colombo south|kalubowila", "Colombo"),
    (r"teaching hospital.*colombo north|ragama", "Gampaha"),
    (r"teaching hospital.*jaffna", "Jaffna"),
    (r"teaching hospital.*kuliyapitiya", "Kurunegala"),
    (r"teaching hospital.*kalutara mch", "Kalutara"),
    (r"teaching hospital.*kalutara", "Kalutara"),
    (r"teaching hospital.*kurunegala", "Kurunegala"),
    (r"teaching hospital.*peradeniya", "Kandy"),
    (r"teaching hospital.*ratnapura", "Ratnapura"),

    (r"castle street", "Colombo"),
    (r"de soysa", "Colombo"),
    (r"apeksha", "Colombo"),
    (r"german.*friendship|mahamodara", "Galle"),
    (r"lady ridgeway", "Colombo"),
    (r"dental", "Colombo"),
    (r"sirimavo|sbsch", "Kandy"),
    (r"national eye", "Colombo"),
    (r"respiratory.*welisara|welisara", "Gampaha"),

    (r"china.*polonnaruwa", "Polonnaruwa"),
    (r"nephrology.*maligawattha|maligawattha", "Colombo"),
    (r"rheumatology.*ragama", "Gampaha"),
    (r"mental health.*angoda|infectious disease.*angoda|angoda", "Colombo"),
    (r"leprosy.*hendala|hendala", "Gampaha"),

    (r"kamburugamuwa", "Matara"),
    (r"chilaw", "Puttlam"),
    (r"embilipitiya", "Hambantota"),
    (r"negombo", "Gampaha"),
    (r"nawalapitiya", "Kandy"),
    (r"sri jayewardenepura", "Colombo"),
    (r"wijaya|seeduwa", "Gampaha"),

    (r"akkaraipattu", "Ampara"),
    (r"beruwala", "Kalutara"),
    (r"colombo east|mulleriyawa", "Colombo"),
    (r"gampola", "Kandy"),
    (r"kalmunai", "Ampara"),
    (r"kanthale", "Trincomalee"),
    (r"potuvil", "Ampara"),
    (r"kadana", "Kalutara"),
    (r"dharga", "Kalutara"),
    (r"aluthgama", "Kalutara"),
]


# Known merged-row fixes from the PDF
BED_NUMBER_FIX = {
    ("2037", "1955"): ("Teaching Hospital- Anuradhapura", "Anuradhapura"),
    ("1257", "1205"): ("Teaching Hospital- Batticaloa", "Batticaloa"),
}


# -----------------------------
# Cleaning helpers
# -----------------------------

def norm(x):
    if x is None:
        return ""
    x = str(x)
    x = x.replace("\u2013", "-").replace("\u2014", "-")
    return re.sub(r"\s+", " ", x).strip()


def is_number_like(x):
    s = norm(x).replace(",", "").replace("*", "")
    if s == "" or s in {"-", "--", "?", "NA", "N/A"}:
        return False
    return bool(re.fullmatch(r"[-+]?\d+(\.\d+)?", s))


def canonical_number(x):
    s = norm(x).replace(",", "").replace("*", "")
    if not is_number_like(s):
        return ""
    try:
        f = float(s)
        if f.is_integer():
            return str(int(f))
        return str(f)
    except Exception:
        return s


def num_to_str(x):
    if x == "" or x is None:
        return ""
    try:
        f = float(x)
        if f.is_integer():
            return str(int(f))
        return str(f)
    except Exception:
        return str(x)


def to_nullable_int(series):
    """Convert a Series to a nullable Int64 column.

    Handles missing/non-numeric values (-> NA) and any stray fractional
    values that leak in from neighbouring PDF columns (e.g. occupancy
    rates) by rounding to the nearest whole number, since bed counts are
    always integers. pandas >= 2.0 refuses the direct float64->Int64
    cast when NaN or fractional floats are present.
    """
    s = pd.to_numeric(series, errors="coerce")
    return s.round().astype("Int64")


def is_index_like(x):
    s = norm(x)
    if not s:
        return False
    return bool(re.fullmatch(r"(?:\d+\.?\s*)+", s))


SECTION_KEYWORDS = [
    "national hospitals",
    "teaching hospitals",
    "specialized teaching hospitals",
    "district general hospitals",
    "base hospitals",
    "divisional hospitals",
    "section iv",
    "board managed hospitals",
    "statutory boards",
    "total",
    "name of the institution",
    "district",
    "description",
]


def is_section_noise(x):
    s = norm(x).lower()
    if not s:
        return True
    if s in SECTION_KEYWORDS:
        return True
    for k in SECTION_KEYWORDS:
        if s.startswith(k):
            return True
    return False


VALUE_NOISE = {
    "yes",
    "no",
    "na",
    "n/a",
    "nil",
    "-",
    "--",
    "?",
    "functioning as pmcu",
    "function as pmcu",
    "data not received",
    "data not recieved",
    "data not available",
    "etu only",
    "pmcu",
    "not submitted officially",
}


def is_value_noise(x):
    s = norm(x).lower().strip(".")
    if s in VALUE_NOISE:
        return True

    if re.fullmatch(r"\d+(\.\d+)?\s*(%|days?|d)?", s):
        return True

    if re.fullmatch(r"\d+\s*-\s*\d+", s):
        return True

    if re.search(r"^(functioning|function)\s+as", s):
        return True

    if re.search(r"^data not", s):
        return True

    if re.search(r"^et[u]?\b", s):
        return True

    return False


def is_plausible_name(x, allow_district=False):
    s = norm(x)

    if len(s) < 3:
        return False

    if not re.search(r"[A-Za-z]{3,}", s):
        return False

    if is_number_like(s):
        return False

    if is_index_like(s):
        return False

    if is_section_noise(s):
        return False

    if is_value_noise(s):
        return False

    if not allow_district and s.lower() in KNOWN_DISTRICT_ALIASES:
        return False

    return True


def find_name(cells, allow_district=False):
    for i, c in enumerate(cells):
        if is_plausible_name(c, allow_district=allow_district):
            return i, c
    return None, None


def normalize_for_match(x):
    return re.sub(r"[^a-z0-9]+", " ", norm(x).lower()).strip()


def infer_line_ministry_district(name):
    n = normalize_for_match(name)

    for pattern, district in LM_DISTRICT_RULES:
        if re.search(pattern, n):
            return district

    # Fallback: if a known district word appears in the hospital name
    for alias, canonical in KNOWN_DISTRICT_ALIASES.items():
        if alias in n:
            return canonical

    return "Line Ministry"


# -----------------------------
# Numeric selection helpers
# -----------------------------

def get_numeric_cells(cells, start=0):
    nums = []
    for c in cells[start:]:
        v = canonical_number(c)
        if v != "":
            try:
                nums.append(float(v))
            except Exception:
                pass
    return nums


def choose_bed_values(nums):
    """
    Select Total Hospital Beds and Inpatient Beds from numeric cells.
    Handles duplicated columns caused by PDF merged cells.
    """
    if not nums:
        return "", ""

    if len(nums) == 1:
        return num_to_str(nums[0]), ""

    L = min(len(nums), 8)

    best_score = -1000
    best_total = nums[0]
    best_inp = nums[1] if len(nums) > 1 else ""

    for i in range(L):
        total = nums[i]

        for j in range(i + 1, L):
            inp = nums[j]
            score = 0

            # Inpatient beds should usually be <= total beds
            if inp <= total * 1.05 + 1:
                score += 2
            else:
                score -= 2

            # If we skipped cells, only allow it when skipped cells look like duplicates
            if j > i + 1:
                skip_ok = any(
                    abs(nums[k] - total) < 0.001 or abs(nums[k] - inp) < 0.001
                    for k in range(i + 1, j)
                )
                if not skip_ok:
                    score -= 10

            # Occupancy rate should be plausible
            if j + 1 < L:
                occ = nums[j + 1]
                if 0 <= occ <= 200:
                    score += 3
                else:
                    score -= 5

                # Average duration of stay should usually be small
                if j + 2 < L:
                    avg = nums[j + 2]
                    if 0 <= avg <= 50:
                        score += 2
                    else:
                        score -= 3

            if score > best_score:
                best_score = score
                best_total = total
                best_inp = inp

    return num_to_str(best_total), num_to_str(best_inp)


def choose_icu_values(nums):
    """
    Select ICU Beds and HDU Beds.
    Handles duplicated ICU columns.
    """
    if not nums:
        return "", ""

    icu = nums[0]

    if len(nums) == 1:
        return num_to_str(icu), ""

    hdu = nums[1]

    # If first two numbers are equal, the second may be a duplicated ICU column.
    # Example: 45,45,27 -> ICU=45, HDU=27
    if len(nums) >= 3 and abs(nums[0] - nums[1]) < 0.001 and nums[2] <= nums[0]:
        hdu = nums[2]

    return num_to_str(icu), num_to_str(hdu)


# -----------------------------
# PDF table metadata
# -----------------------------

def build_meta(header):
    hl = [h.lower() for h in header]

    has_institution = any("institution" in h for h in hl)
    has_district = any("district" in h for h in hl)

    is_bed = (
        any("total hospital beds" in h for h in hl)
        and any("inpatient beds" in h for h in hl)
    )

    is_icu = any("number of icu beds" in h for h in hl)

    valid = has_institution and (is_bed or is_icu)

    return {
        "valid": valid,
        "has_district": has_district,
        "is_bed": is_bed,
        "is_icu": is_icu,
    }


# -----------------------------
# Main extraction
# -----------------------------

def extract_hospital_data(pdf_path):
    bed_records = []
    icu_records = []
    skipped = []

    last_district = {
        "bed": "",
        "icu": "",
    }

    active_meta = None

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables() or []

            for table in tables:
                if not table:
                    continue

                first_row = [norm(x) for x in table[0]]
                first_txt = " | ".join(first_row).lower()

                looks_like_header = (
                    "institution" in first_txt
                    and (
                        "total hospital beds" in first_txt
                        or "number of icu beds" in first_txt
                    )
                )

                if looks_like_header:
                    meta = build_meta(first_row)
                    if meta["valid"]:
                        active_meta = meta
                        data_rows = table[1:]
                    else:
                        active_meta = None
                        continue
                else:
                    if active_meta is None or not active_meta["valid"]:
                        continue
                    meta = active_meta
                    data_rows = table

                for raw_row in data_rows:
                    cells = [norm(x) for x in raw_row]

                    if not any(cells):
                        continue

                    lower_cells = [c.lower() for c in cells]

                    # Skip total rows
                    if "total" in lower_cells:
                        continue

                    # Skip repeated header rows if they appear inside data
                    row_txt = " | ".join(cells).lower()
                    if "institution" in row_txt and (
                        "total hospital beds" in row_txt
                        or "number of icu beds" in row_txt
                    ):
                        continue

                    scope = "icu" if meta["is_icu"] else "bed"

                    # District extraction for Provincial Council tables
                    if meta["has_district"]:
                        district_found = ""

                        for c in cells:
                            key = c.lower()
                            if key in KNOWN_DISTRICT_ALIASES:
                                district_found = KNOWN_DISTRICT_ALIASES[key]
                                break

                        if district_found:
                            last_district[scope] = district_found

                        district = district_found or last_district[scope]

                        name_idx, name = find_name(cells, allow_district=False)

                    # Line Ministry tables have no district column
                    else:
                        district = ""
                        name_idx, name = find_name(cells, allow_district=True)

                    # -----------------------------
                    # BED TABLE
                    # -----------------------------
                    if meta["is_bed"]:
                        start = name_idx + 1 if name_idx is not None else 0
                        nums = get_numeric_cells(cells, start)
                        total_val, inpatient_val = choose_bed_values(nums)

                        # Fix known merged Teaching Hospital rows
                        fix_key = (total_val, inpatient_val)
                        if fix_key in BED_NUMBER_FIX:
                            name, fixed_district = BED_NUMBER_FIX[fix_key]
                            district = fixed_district

                        if not name:
                            if total_val or inpatient_val:
                                skipped.append(cells)
                            continue

                        if is_section_noise(name) or not is_plausible_name(name, allow_district=True):
                            if fix_key not in BED_NUMBER_FIX:
                                if total_val or inpatient_val:
                                    skipped.append(cells)
                                continue

                        # Known PDF split-name fixes
                        if name:
                            lname = name.lower()

                            # Mannar DHC Periyapandivirichan split issue
                            if (
                                district == "Mannar"
                                and lname in {"dhc", "d h c"}
                                and total_val == "17"
                                and inpatient_val == "8"
                            ):
                                name = "DHC Periyapandivirichan"

                            # China-Sri Lanka Friendship National Nephrology split issue
                            if "china" in lname and "polonnaruwa" not in lname:
                                name = name + " Specialized Hospital- Polonnaruwa"
                                if not meta["has_district"] and not district:
                                    district = "Polonnaruwa"

                        # Infer district for Line Ministry hospitals
                        if not meta["has_district"] and not district:
                            district = infer_line_ministry_district(name)

                        bed_records.append(
                            {
                                "District": district,
                                "Hospital Name": name,
                                "Total Hospital Beds": total_val,
                                "Inpatient Beds": inpatient_val,
                            }
                        )

                    # -----------------------------
                    # ICU TABLE
                    # -----------------------------
                    elif meta["is_icu"]:
                        start = name_idx + 1 if name_idx is not None else 0
                        nums = get_numeric_cells(cells, start)
                        icu_val, hdu_val = choose_icu_values(nums)

                        if not name:
                            if icu_val or hdu_val:
                                skipped.append(cells)
                            continue

                        if is_section_noise(name) or not is_plausible_name(name, allow_district=True):
                            if icu_val or hdu_val:
                                skipped.append(cells)
                            continue

                        # Known PDF split-name fix
                        if name:
                            lname = name.lower()
                            if "china" in lname and "polonnaruwa" not in lname:
                                name = name + " Specialized Hospital- Polonnaruwa"
                                if not meta["has_district"] and not district:
                                    district = "Polonnaruwa"

                        # Infer district for Line Ministry hospitals
                        if not meta["has_district"] and not district:
                            district = infer_line_ministry_district(name)

                        icu_records.append(
                            {
                                "District": district,
                                "Hospital Name": name,
                                "ICU Beds": icu_val,
                                "HDU Beds": hdu_val,
                            }
                        )

    # -----------------------------
    # Create CSV outputs
    # -----------------------------

    df_beds = pd.DataFrame(
        bed_records,
        columns=["District", "Hospital Name", "Total Hospital Beds", "Inpatient Beds"],
    )

    df_icu = pd.DataFrame(
        icu_records,
        columns=["District", "Hospital Name", "ICU Beds", "HDU Beds"],
    )

    # Remove exact duplicates caused by repeated table sections
    df_beds = df_beds.drop_duplicates().reset_index(drop=True)
    df_icu = df_icu.drop_duplicates().reset_index(drop=True)

    # Convert numeric columns to nullable integer type
    for col in ["Total Hospital Beds", "Inpatient Beds"]:
        df_beds[col] = to_nullable_int(df_beds[col])

    for col in ["ICU Beds", "HDU Beds"]:
        df_icu[col] = to_nullable_int(df_icu[col])

    df_beds.to_csv("Hospital_Bed_Counts.csv", index=False)
    df_icu.to_csv("Hospital_ICU_Bed_Counts.csv", index=False)

    print("Extraction completed.")
    print(f"Bed count rows: {len(df_beds)}")
    print(f"ICU count rows: {len(df_icu)}")
    print("Saved files: Hospital_Bed_Counts.csv and Hospital_ICU_Bed_Counts.csv")

    if skipped:
        print(f"Note: {len(skipped)} numeric rows could not be matched to a hospital name.")


if __name__ == "__main__":
    extract_hospital_data("D:/Data science-SUSL/Projects/Capstone Project/Bed-Data-2025-Updated.pdf")