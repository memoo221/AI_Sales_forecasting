import csv
import random
import math
from datetime import date, timedelta

random.seed(42)

products = [
    {"name": "Laptop Pro 15",      "category": "Electronics",   "base": 1800, "trend": 0.0003,  "seasonal_amp": 0.25},
    {"name": "Wireless Mouse",     "category": "Accessories",   "base": 45,   "trend": 0.0001,  "seasonal_amp": 0.20},
    {"name": "USB-C Hub 7-Port",   "category": "Accessories",   "base": 75,   "trend": 0.0002,  "seasonal_amp": 0.18},
    {"name": "Mechanical Keyboard","category": "Accessories",   "base": 130,  "trend": 0.00015, "seasonal_amp": 0.22},
    {"name": "Monitor 27 4K",      "category": "Electronics",   "base": 550,  "trend": 0.0002,  "seasonal_amp": 0.28},
    {"name": "Webcam HD 1080p",    "category": "Electronics",   "base": 90,   "trend": 0.0004,  "seasonal_amp": 0.15},
    {"name": "Desk Lamp LED",      "category": "Office",        "base": 40,   "trend": 0.00005, "seasonal_amp": 0.12},
    {"name": "Ergonomic Chair",    "category": "Furniture",     "base": 420,  "trend": 0.00025, "seasonal_amp": 0.30},
    {"name": "Standing Desk",      "category": "Furniture",     "base": 680,  "trend": 0.0003,  "seasonal_amp": 0.25},
    {"name": "Noise Cancelling Headphones", "category": "Electronics", "base": 220, "trend": 0.00035, "seasonal_amp": 0.35},
]

start = date(2022, 1, 1)
end   = date(2024, 12, 31)

rows = []
day_index = 0
current = start

while current <= end:
    day_of_year = current.timetuple().tm_yday
    # Seasonal factor: peaks in Nov-Dec (holidays) and slight dip in summer
    seasonal = math.sin(2 * math.pi * (day_of_year - 80) / 365)  # peaks ~Nov
    holiday_boost = 1.0
    # Black Friday / Christmas boost (Nov 20 - Dec 31)
    if current.month == 11 and current.day >= 20:
        holiday_boost = 1.6
    if current.month == 12:
        holiday_boost = 1.8
    # New Year dip (Jan 1-15)
    if current.month == 1 and current.day <= 15:
        holiday_boost = 0.7
    # Summer dip (Jul-Aug)
    if current.month in (7, 8):
        holiday_boost = 0.85

    for p in products:
        trend_factor = 1 + p["trend"] * day_index
        base_revenue = p["base"] * trend_factor
        season_factor = 1 + p["seasonal_amp"] * seasonal
        adjusted = base_revenue * season_factor * holiday_boost

        # Daily quantity: 1-20 units depending on price
        max_qty = max(1, int(800 / p["base"]))
        quantity = random.randint(1, max_qty + 2)

        # Add noise ±15%
        noise = random.uniform(0.85, 1.15)
        revenue = round(adjusted * quantity * noise, 2)

        rows.append({
            "date": current.isoformat(),
            "product_name": p["name"],
            "category": p["category"],
            "quantity": quantity,
            "revenue": revenue,
        })

    day_index += 1
    current += timedelta(days=1)

output_path = "sales_test_data.csv"
with open(output_path, "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["date", "product_name", "category", "quantity", "revenue"])
    writer.writeheader()
    writer.writerows(rows)

print(f"Generated {len(rows):,} rows across {day_index} days for {len(products)} products")
print(f"Saved to: {output_path}")
