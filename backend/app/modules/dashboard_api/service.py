from datetime import datetime, timedelta
from collections import defaultdict
from app.db.database import get_connection


def get_dashboard_data():
    conn = get_connection()
    cursor = conn.cursor()

    seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()

    # --- Summary counts ---
    total_triage = cursor.execute("SELECT COUNT(*) FROM triage_events").fetchone()[0]
    total_imaging = cursor.execute("SELECT COUNT(*) FROM imaging_events").fetchone()[0]
    total_risk = cursor.execute("SELECT COUNT(*) FROM risk_events").fetchone()[0]

    emergency_7d = cursor.execute(
        "SELECT COUNT(*) FROM triage_events WHERE urgency_level = 'emergency' AND timestamp >= ?",
        (seven_days_ago,)
    ).fetchone()[0]

    pneumonia_7d = cursor.execute(
        "SELECT COUNT(*) FROM imaging_events WHERE prediction = 'PNEUMONIA' AND timestamp >= ?",
        (seven_days_ago,)
    ).fetchone()[0]

    high_risk_7d = cursor.execute(
        "SELECT COUNT(*) FROM risk_events WHERE risk_level = 'high' AND timestamp >= ?",
        (seven_days_ago,)
    ).fetchone()[0]

    # --- Triage trend by day ---
    triage_rows = cursor.execute(
        "SELECT urgency_level, timestamp FROM triage_events WHERE timestamp >= ?",
        (seven_days_ago,)
    ).fetchall()

    triage_by_day = defaultdict(lambda: {"routine": 0, "urgent": 0, "emergency": 0})
    for urgency, ts in triage_rows:
        day = ts[:10]
        if urgency in triage_by_day[day]:
            triage_by_day[day][urgency] += 1

    triage_trend = [
        {"date": day, **counts} for day, counts in sorted(triage_by_day.items())
    ]

    # --- Imaging trend by day ---
    imaging_rows = cursor.execute(
        "SELECT prediction, timestamp FROM imaging_events WHERE timestamp >= ?",
        (seven_days_ago,)
    ).fetchall()

    imaging_by_day = defaultdict(lambda: {"normal": 0, "pneumonia": 0})
    for pred, ts in imaging_rows:
        day = ts[:10]
        key = "pneumonia" if pred == "PNEUMONIA" else "normal"
        imaging_by_day[day][key] += 1

    imaging_trend = [
        {"date": day, **counts} for day, counts in sorted(imaging_by_day.items())
    ]

    # --- Risk distribution ---
    risk_rows = cursor.execute(
        "SELECT risk_level, COUNT(*) FROM risk_events WHERE timestamp >= ? GROUP BY risk_level",
        (seven_days_ago,)
    ).fetchall()
    risk_distribution = [{"level": level, "count": count} for level, count in risk_rows]

    conn.close()

    return {
        "summary": {
            "total_triage_events": total_triage,
            "total_imaging_events": total_imaging,
            "total_risk_events": total_risk,
            "emergency_count_7d": emergency_7d,
            "pneumonia_count_7d": pneumonia_7d,
            "high_risk_count_7d": high_risk_7d,
        },
        "triage_trend": triage_trend,
        "imaging_trend": imaging_trend,
        "risk_distribution": risk_distribution,
    }