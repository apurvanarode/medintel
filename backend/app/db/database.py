import sqlite3
import os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "medintel.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    return conn

def init_db():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS triage_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            urgency_level TEXT,
            red_flag_triggered BOOLEAN,
            timestamp TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS imaging_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prediction TEXT,
            confidence REAL,
            timestamp TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS risk_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT,
            risk_score REAL,
            risk_level TEXT,
            timestamp TEXT
        )
    """)
    conn.commit()
    conn.close()

def log_triage_event(urgency_level: str, red_flag_triggered: bool):
    conn = get_connection()
    conn.execute(
        "INSERT INTO triage_events (urgency_level, red_flag_triggered, timestamp) VALUES (?, ?, ?)",
        (urgency_level, red_flag_triggered, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()

def log_imaging_event(prediction: str, confidence: float):
    conn = get_connection()
    conn.execute(
        "INSERT INTO imaging_events (prediction, confidence, timestamp) VALUES (?, ?, ?)",
        (prediction, confidence, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()

def log_risk_event(patient_id: str, risk_score: float, risk_level: str):
    conn = get_connection()
    conn.execute(
        "INSERT INTO risk_events (patient_id, risk_score, risk_level, timestamp) VALUES (?, ?, ?, ?)",
        (patient_id, risk_score, risk_level, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()