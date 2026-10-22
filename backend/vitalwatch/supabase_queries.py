import json
import os
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime


def _parse_iso_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


def _supabase_get(table):
    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not supabase_url or not service_role_key:
        raise RuntimeError("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to query Supabase.")

    request = urllib.request.Request(
        f"{supabase_url}/rest/v1/{table}?{urllib.parse.urlencode({'select': '*'})}",
        headers={"apikey": service_role_key, "Authorization": f"Bearer {service_role_key}"},
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"Supabase request for {table} failed with status {exc.code}.") from exc
    except (urllib.error.URLError, TimeoutError) as exc:
        raise RuntimeError("Supabase could not be reached.") from exc


def _within_date_range(timelog, start_date, end_date):
    if not timelog:
        return True
    try:
        record_date = datetime.fromisoformat(str(timelog).replace("Z", "+00:00")).date()
    except ValueError:
        return True
    return (not start_date or record_date >= start_date) and (not end_date or record_date <= end_date)


def _mood_level(value):
    if isinstance(value, int):
        return value
    return {"anxious": 1, "worried": 2, "sad": 3, "neutral": 4, "happy": 5}.get(
        str(value or "").strip().lower()
    )


def _record_date_parts(timelog):
    parsed = datetime.fromisoformat(str(timelog).replace("Z", "+00:00"))
    return parsed.month, parsed.day, parsed.year


def _find_lookup_row(rows, value, id_key, name_key):
    text = str(value or "").strip()
    if not text:
        return {}

    for row in rows.values():
        if str(row.get(id_key, "")).strip() == text or str(row.get(name_key, "")).strip().lower() == text.lower():
            return row

    return {}


def fetch_joined_student_records(params=None):
    params = params or {}
    start_date = _parse_iso_date(params.get("start_date"))
    end_date = _parse_iso_date(params.get("end_date"))
    student_id = str(params.get("student_id")) if params.get("student_id") else None
    program_id = str(params.get("program_id")) if params.get("program_id") else None
    college_id = str(params.get("college_id")) if params.get("college_id") else None
    consent_type = params.get("consent_type")

    vitals = _supabase_get("vitals")
    students = {str(row["student_id"]): row for row in _supabase_get("students")}
    programs = {str(row["program_id"]): row for row in _supabase_get("program")}
    colleges = {str(row["college_id"]): row for row in _supabase_get("college")}
    consents = {str(row["consent_id"]): row for row in _supabase_get("consent")}
    records = []

    for vital in vitals:
        if str(vital.get("role", "")).lower() != "student":
            continue
        consent = consents.get(str(vital.get("consent_id")))
        current_student_id = str((consent or {}).get("student_id") or vital.get("user_id") or "")
        student = students.get(current_student_id, {})
        program_value = vital.get("program") or student.get("program_id")
        program = _find_lookup_row(programs, program_value, "program_id", "program")
        current_program_id = str(program.get("program_id") or program_value or "")
        college_value = vital.get("college") or program.get("college_id")
        college = _find_lookup_row(colleges, college_value, "college_id", "college")
        current_college_id = str(college.get("college_id") or college_value or "")

        if student_id and current_student_id != student_id:
            continue
        if program_id and current_program_id != program_id:
            continue
        if college_id and current_college_id != college_id:
            continue
        if consent_type and str((consent or {}).get("consent_type", "")).lower() != str(consent_type).lower():
            continue
        if not _within_date_range(vital.get("timelog"), start_date, end_date):
            continue

        month, day, year = _record_date_parts(vital["timelog"])
        records.append({
            "vitalid": vital.get("vital_id"), "consent_id": vital.get("consent_id"),
            "timelog": vital.get("timelog"), "month": month, "day": day, "year": year,
            "temperature": vital.get("temperature"), "heart_rate": vital.get("heart_rate"),
            "systolic": vital.get("systolic"), "diastolic": vital.get("diastolic"),
            "blood_pressure": f"{vital.get('systolic')}/{vital.get('diastolic')}",
            "student_id": current_student_id, "consent_timelog": (consent or {}).get("timelog"),
            "consent_type": (consent or {}).get("consent_type", ""),
            "mood_level": _mood_level(vital.get("mood")), "first_name": student.get("first_name", ""),
            "last_name": student.get("last_name", ""), "email": student.get("email"),
            "contact_number": student.get("contact_number"), "last_update": student.get("last_update"),
            "year_level_id": vital.get("year_level") or student.get("year_level_id"),
            "student_program_id": student.get("program_id"), "program_id": program.get("program_id"),
                "program": vital.get("program") if isinstance(vital.get("program"), str) and not vital.get("program", "").isdigit() else program.get("program"),
                "college_id": college.get("college_id"),
                "college": vital.get("college") if isinstance(vital.get("college"), str) and not vital.get("college", "").isdigit() else college.get("college"),
            "full_name": " ".join(filter(None, [student.get("first_name"), student.get("last_name")])),
        })

    return sorted(records, key=lambda record: (record["timelog"], record["vitalid"]), reverse=True)


def fetch_joined_employee_records(params=None):
    params = params or {}
    start_date = _parse_iso_date(params.get("start_date"))
    end_date = _parse_iso_date(params.get("end_date"))
    employee_id = str(params.get("employee_id")) if params.get("employee_id") else None
    records = []

    for vital in _supabase_get("vitals"):
        if str(vital.get("role", "")).lower() == "student":
            continue
        if employee_id and str(vital.get("user_id", "")) != employee_id:
            continue
        if not _within_date_range(vital.get("timelog"), start_date, end_date):
            continue

        month, day, year = _record_date_parts(vital["timelog"])
        records.append({
            "id": vital.get("vital_id"),
            "employee_id": int(vital["user_id"]) if str(vital.get("user_id", "")).isdigit() else None,
            "timelog": vital.get("timelog"), "month": month, "day": day, "year": year,
            "temperature": vital.get("temperature"), "mood_level": _mood_level(vital.get("mood")),
            "heart_rate": vital.get("heart_rate"), "systolic": vital.get("systolic"),
            "diastolic": vital.get("diastolic"),
            "blood_pressure": f"{vital.get('systolic')}/{vital.get('diastolic')}",
            "office": vital.get("college") or "Unknown", "role": vital.get("role") or "Unknown",
            "is_active": True, "college": vital.get("college") or "Unknown",
            "full_name": str(vital.get("user_id") or "Unknown"),
        })

    return sorted(records, key=lambda record: (record["timelog"], record["id"]), reverse=True)
