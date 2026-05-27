import os
from datetime import datetime

import psycopg2
from psycopg2.extras import RealDictCursor


def _parse_iso_date(value):
    if not value:
        return None

    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


def _get_supabase_dsn():
    return os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")


def fetch_joined_student_records(params=None):
    params = params or {}
    dsn = _get_supabase_dsn()

    if not dsn:
        raise RuntimeError("Set SUPABASE_DB_URL (or DATABASE_URL) to query Supabase.")

    conditions = []
    values = []

    student_id = params.get("student_id")
    program_id = params.get("program_id")
    college_id = params.get("college_id")
    consent_type = params.get("consent_type")
    start_date = _parse_iso_date(params.get("start_date"))
    end_date = _parse_iso_date(params.get("end_date"))

    if student_id:
        conditions.append("c.student_id = %s")
        values.append(student_id)

    if program_id:
        conditions.append("p.program_id = %s")
        values.append(program_id)

    if college_id:
        conditions.append("co.college_id = %s")
        values.append(college_id)

    if consent_type:
        conditions.append("c.consent_type ILIKE %s")
        values.append(consent_type)

    if start_date:
        conditions.append("v.timelog::date >= %s")
        values.append(start_date)

    if end_date:
        conditions.append("v.timelog::date <= %s")
        values.append(end_date)

    query = """
        SELECT DISTINCT ON (v.vitals_id)
            v.vitals_id AS vitalid,
            v.consent_id,
            v.timelog,
            EXTRACT(MONTH FROM v.timelog)::int AS month,
            EXTRACT(DAY FROM v.timelog)::int AS day,
            EXTRACT(YEAR FROM v.timelog)::int AS year,
            v.temperature,
            v.heart_rate,
            v.systolic,
            v.diastolic,
            (v.systolic::text || '/' || v.diastolic::text) AS blood_pressure,
            c.student_id,
            c.timelog AS consent_timelog,
            c.consent_type,
            m.mood_level,
            s.first_name,
            s.last_name,
            s.email,
            s.contact_number,
            s.last_update,
            s.year_level_id,
            s.program_id AS student_program_id,
            p.program_id,
            p.program,
            co.college_id,
            co.college,
            CONCAT_WS(' ', s.first_name, s.last_name) AS full_name
        FROM vitals v
        JOIN consent c ON c.consent_id = v.consent_id
        LEFT JOIN mood m ON m.consent_id = c.consent_id
        LEFT JOIN students s ON s.student_id = c.student_id
        LEFT JOIN program p ON p.program_id = s.program_id
        LEFT JOIN college co ON co.college_id = p.college_id
    """

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY v.vitals_id DESC, v.timelog DESC"

    with psycopg2.connect(dsn, sslmode="require", connect_timeout=10) as connection:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, values)
            return cursor.fetchall()


def fetch_joined_employee_records(params=None):
    params = params or {}
    dsn = _get_supabase_dsn()

    if not dsn:
        raise RuntimeError("Set SUPABASE_DB_URL (or DATABASE_URL) to query Supabase.")

    conditions = []
    values = []

    employee_id = params.get("employee_id")
    college = params.get("college")
    office = params.get("office")
    role = params.get("role")
    start_date = _parse_iso_date(params.get("start_date"))
    end_date = _parse_iso_date(params.get("end_date"))

    if employee_id:
        conditions.append("ev.employee_id = %s")
        values.append(employee_id)

    if office:
        conditions.append("us.office ILIKE %s")
        values.append(office)

    if role:
        conditions.append("us.role ILIKE %s")
        values.append(role)

    if college:
        conditions.append("'CITC' ILIKE %s")
        values.append(college)

    if start_date:
        conditions.append("ev.timelog::date >= %s")
        values.append(start_date)

    if end_date:
        conditions.append("ev.timelog::date <= %s")
        values.append(end_date)

    query = """
        SELECT
            ev.employee_vital_id AS id,
            ev.employee_id,
            ev.timelog,
            EXTRACT(MONTH FROM ev.timelog)::int AS month,
            EXTRACT(DAY FROM ev.timelog)::int AS day,
            EXTRACT(YEAR FROM ev.timelog)::int AS year,
            ev.temperature,
            ev.mood_level,
            ev.heart_rate,
            ev.systolic,
            ev.diastolic,
            (ev.systolic::text || '/' || ev.diastolic::text) AS blood_pressure,
            COALESCE(us.office, 'Unknown') AS office,
            COALESCE(us.role, 'Unknown') AS role,
            COALESCE(us.is_active, false) AS is_active,
            'CITC' AS college,
            CONCAT_WS(' ', us.first_name, us.last_name) AS full_name
        FROM employee_vitals ev
        LEFT JOIN university_staff us ON us.staff_id = ev.employee_id
    """

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY ev.timelog DESC, ev.employee_vital_id DESC"

    with psycopg2.connect(dsn, sslmode="require", connect_timeout=10) as connection:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, values)
            return cursor.fetchall()


def fetch_joined_employee_records(params=None):
    params = params or {}
    dsn = _get_supabase_dsn()

    if not dsn:
        raise RuntimeError("Set SUPABASE_DB_URL (or DATABASE_URL) to query Supabase.")

    conditions = []
    values = []

    employee_id = params.get("employee_id")
    college = params.get("college")
    office = params.get("office")
    start_date = _parse_iso_date(params.get("start_date"))
    end_date = _parse_iso_date(params.get("end_date"))

    if employee_id:
        conditions.append("ev.employee_id = %s")
        values.append(employee_id)

    if office:
        conditions.append("us.office ILIKE %s")
        values.append(office)

    if college:
        conditions.append("'CITC' ILIKE %s")
        values.append(college)

    if start_date:
        conditions.append("ev.timelog::date >= %s")
        values.append(start_date)

    if end_date:
        conditions.append("ev.timelog::date <= %s")
        values.append(end_date)

    query = """
        SELECT
            ev.employee_vital_id AS id,
            ev.employee_id,
            ev.timelog,
            EXTRACT(MONTH FROM ev.timelog)::int AS month,
            EXTRACT(DAY FROM ev.timelog)::int AS day,
            EXTRACT(YEAR FROM ev.timelog)::int AS year,
            ev.temperature,
            ev.mood_level,
            ev.heart_rate,
            ev.systolic,
            ev.diastolic,
            (ev.systolic::text || '/' || ev.diastolic::text) AS blood_pressure,
            COALESCE(us.office, 'Unknown') AS office,
            COALESCE(us.role, 'Unknown') AS role,
            COALESCE(us.is_active, false) AS is_active,
            'CITC' AS college,
            CONCAT_WS(' ', us.first_name, us.last_name) AS full_name
        FROM employee_vitals ev
        LEFT JOIN university_staff us ON us.staff_id = ev.employee_id
    """

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY ev.timelog DESC, ev.employee_vital_id DESC"

    with psycopg2.connect(dsn, sslmode="require", connect_timeout=10) as connection:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, values)
            return cursor.fetchall()