import pdfplumber
import pandas as pd

def parse_number(value):
    if value is None:
        return None
    cleaned = value.replace(' ', '').replace(',', '')
    if cleaned.isdigit():
        return int(cleaned)
    return None

def extract_population_data(pdf_path):
    population_data = []

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    if len(row) < 4:
                        continue
                    district = row[0]
                    if district is None or parse_number(district) is not None:
                        continue
                    district = district.strip()
                    total = parse_number(row[1])
                    male = parse_number(row[2])
                    female = parse_number(row[3])
                    if district and total is not None:
                        population_data.append({
                            'district': district,
                            'total': total,
                            'male': male,
                            'female': female
                        })

    return population_data

path = 'D:/Data science-SUSL/Projects/Capstone Project/Mid-year_population_by_district__Sex.pdf'

extracted_data = extract_population_data(path)
df = pd.DataFrame(extracted_data)
print(df.dtypes)
df['total'] = df['total']*1000
df['male'] = df['male']*1000
df['female'] = df['female']*1000
print(df.head())
df.to_csv('population_data.csv', index=False)