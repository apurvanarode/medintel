import sqlite3
import random
from datetime import datetime, timedelta
import os

DB_PATH = "../backend/app/db/medintel.db"

conn = sqlite3.connect(DB_PATH)
conn.execute("""
    CREATE TABLE IF NOT EXISTS triage_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        urgency_level TEXT, red_flag_triggered BOOLEAN, timestamp TEXT
    )
""")
conn.execute("""
    CREATE TABLE IF NOT EXISTS imaging_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prediction TEXT, confidence REAL, timestamp TEXT
    )
""")
conn.execute("""
    CREATE TABLE IF NOT EXISTS risk_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id TEXT, risk_score REAL, risk_level TEXT, timestamp TEXT
    )
""")

random.seed(42)
now = datetime.now()

# Seed 7 days of realistic triage activity
urgency_weights = [("routine", 0.5), ("urgent", 0.35), ("emergency", 0.15)]
for day in range(7):
    num_events = random.randint(8, 20)
    for _ in range(num_events):
        ts = now - timedelta(days=day, hours=random.randint(0, 23), minutes=random.randint(0, 59))
        level = random.choices([u[0] for u in urgency_weights], weights=[u[1] for u in urgency_weights])[0]
        red_flag = level == "emergency" and random.random() < 0.4
        conn.execute(
            "INSERT INTO triage_events (urgency_level, red_flag_triggered, timestamp) VALUES (?, ?, ?)",
            (level, red_flag, ts.isoformat())
        )

# Seed imaging activity
for day in range(7):
    num_events = random.randint(5, 15)
    for _ in range(num_events):
        ts = now - timedelta(days=day, hours=random.randint(0, 23), minutes=random.randint(0, 59))
        pred = random.choices(["NORMAL", "PNEUMONIA"], weights=[0.65, 0.35])[0]
        conf = round(random.uniform(0.72, 0.99), 3)
        conn.execute(
            "INSERT INTO imaging_events (prediction, confidence, timestamp) VALUES (?, ?, ?)",
            (pred, conf, ts.isoformat())
        )

# Seed risk prediction activity
for day in range(7):
    num_events = random.randint(6, 12)
    for _ in range(num_events):
        ts = now - timedelta(days=day, hours=random.randint(0, 23), minutes=random.randint(0, 59))
        score = round(random.betavariate(2, 5), 3)  # skewed toward lower risk, realistic
        level = "high" if score >= 0.5 else "moderate" if score >= 0.3 else "low"
        pid = f"P{random.randint(1000,9999)}"
        conn.execute(
            "INSERT INTO risk_events (patient_id, risk_score, risk_level, timestamp) VALUES (?, ?, ?, ?)",
            (pid, score, level, ts.isoformat())
        )

conn.commit()
conn.close()
print("Seeded 7 days of realistic historical dashboard data.")