export type StudentRecord = {
  id: number;
  College: string;
  Course: string;
  Year_Level: number;
  Month: string;
  Day: number;
  Year: number;
  StudentID: string;
  Body_Temperature_C: number;
  Blood_Pressure: string;
  Heart_Rate_bpm: number;
  Emotion: string;
};

export type FacultyRecord = {
  id: number;
  College: string;
  User_Type: string;
  Month: string;
  Day: number;
  Year: number;
  EmployeeID_or_Guest: string;
  Body_Temperature_C: number;
  Blood_Pressure: string;
  Systolic_BP: number;
  Diastolic_BP: number;
  Heart_Rate_bpm: number;
  Emotion: string;
  Risk_Level: string;
  Alert_Status: string;
};

type ApiListResponse<T> = T[] | { results?: T[] };

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1';

function normalizeList<T>(payload: ApiListResponse<T>): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload.results ?? [];
}

async function getList<T>(path: string): Promise<T[]> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const payload = (await response.json()) as ApiListResponse<T>;
  return normalizeList(payload);
}

export const wellnessApi = {
  getStudentRecords: () => getList<StudentRecord>('/studentrecord/'),
  getFacultyRecords: () => getList<FacultyRecord>('/facultyrecord/'),
};

export function parseBloodPressure(bp: string): { systolic: number; diastolic: number } | null {
  const [systolicRaw, diastolicRaw] = bp.split('/');
  const systolic = Number(systolicRaw);
  const diastolic = Number(diastolicRaw);

  if (Number.isNaN(systolic) || Number.isNaN(diastolic)) {
    return null;
  }

  return { systolic, diastolic };
}

export function normalizeRiskLevel(riskLevel: string): 'Normal' | 'Moderate' | 'High' | 'Critical' {
  const value = riskLevel.toLowerCase();

  if (value.includes('critical') || value.includes('urgent')) {
    return 'Critical';
  }

  if (value.includes('high') || value.includes('severe')) {
    return 'High';
  }

  if (value.includes('elevated') || value.includes('moderate') || value.includes('mild') || value.includes('monitor')) {
    return 'Moderate';
  }

  return 'Normal';
}

export function getStudentRisk(record: StudentRecord): 'Normal' | 'Moderate' | 'High' | 'Critical' {
  const bloodPressure = parseBloodPressure(record.Blood_Pressure);
  const systolic = bloodPressure?.systolic ?? 0;
  const diastolic = bloodPressure?.diastolic ?? 0;

  if (record.Body_Temperature_C >= 38 || systolic >= 160 || diastolic >= 100 || record.Heart_Rate_bpm >= 120) {
    return 'Critical';
  }

  if (record.Body_Temperature_C >= 37.5 || systolic >= 140 || diastolic >= 90 || record.Heart_Rate_bpm >= 100) {
    return 'High';
  }

  if (record.Body_Temperature_C >= 37.1 || systolic >= 130 || diastolic >= 85 || record.Heart_Rate_bpm >= 90) {
    return 'Moderate';
  }

  return 'Normal';
}

export function getWellnessScore(params: {
  temperature: number;
  systolic: number;
  diastolic: number;
  heartRate: number;
  emotion?: string;
}): number {
  let score = 100;

  if (params.temperature >= 38) score -= 25;
  else if (params.temperature >= 37.5) score -= 15;
  else if (params.temperature >= 37.1) score -= 8;

  if (params.systolic >= 160 || params.diastolic >= 100) score -= 25;
  else if (params.systolic >= 140 || params.diastolic >= 90) score -= 15;
  else if (params.systolic >= 130 || params.diastolic >= 85) score -= 8;

  if (params.heartRate >= 120) score -= 20;
  else if (params.heartRate >= 100) score -= 12;
  else if (params.heartRate >= 90) score -= 6;

  const emotion = (params.emotion ?? '').toLowerCase();
  if (emotion.includes('angry') || emotion.includes('stress') || emotion.includes('sad')) {
    score -= 6;
  }

  return Math.max(0, Math.min(100, score));
}

export function groupCount<T>(items: T[], keySelector: (item: T) => string): Array<{ name: string; value: number }> {
  const counter = new Map<string, number>();

  items.forEach((item) => {
    const key = keySelector(item) || 'Unknown';
    counter.set(key, (counter.get(key) ?? 0) + 1);
  });

  return Array.from(counter.entries()).map(([name, value]) => ({ name, value }));
}

export function average(values: number[]): number {
  if (!values.length) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function recordDateLabel(record: { Month: string; Day: number; Year: number }): string {
  return `${record.Month} ${record.Day}, ${record.Year}`;
}
