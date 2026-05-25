import { useEffect, useMemo, useState } from 'react';
import { UserCheck, Heart, TrendingUp, AlertTriangle } from 'lucide-react';
import { KPICard, Card } from '../components/Card';
import { FacultyRecord, average, recordDateLabel, wellnessApi } from '../api/wellnessApi';

function parseBloodPressure(bp: string): { systolic: number; diastolic: number } | null {
  const [systolicRaw, diastolicRaw] = bp.split('/');
  const systolic = Number(systolicRaw);
  const diastolic = Number(diastolicRaw);

  if (Number.isNaN(systolic) || Number.isNaN(diastolic)) {
    return null;
  }

  return { systolic, diastolic };
}

function isFever(record: FacultyRecord): boolean {
  return record.Body_Temperature_C >= 37.8;
}

function isElevatedBp(record: FacultyRecord): boolean {
  return record.Systolic_BP >= 130 || record.Diastolic_BP >= 85;
}

function isElevatedPulse(record: FacultyRecord): boolean {
  return record.Heart_Rate_bpm < 60 || record.Heart_Rate_bpm > 100;
}

function isEmotionalConcern(record: FacultyRecord): boolean {
  const emotion = record.Emotion.toLowerCase();
  return emotion.includes('sad') || emotion.includes('angry') || emotion.includes('stress') || emotion.includes('anxious') || emotion.includes('worried');
}

type SummaryRow = {
  college: string;
  subgroup: string;
  totalCases: number;
};

function aggregateRows(
  records: FacultyRecord[],
  predicate: (record: FacultyRecord) => boolean,
  subgroupSelector: (record: FacultyRecord) => string,
): SummaryRow[] {
  const grouped = new Map<string, SummaryRow>();

  records.forEach((record) => {
    if (!predicate(record)) return;
    const college = record.College || 'Unknown';
    const subgroup = subgroupSelector(record) || 'Unknown';
    const key = `${college}||${subgroup}`;
    const current = grouped.get(key) ?? { college, subgroup, totalCases: 0 };
    current.totalCases += 1;
    grouped.set(key, current);
  });

  return Array.from(grouped.values()).sort((a, b) => b.totalCases - a.totalCases).slice(0, 6);
}

function aggregateMonthlyRows(records: FacultyRecord[]): Array<{ month: string; feverCases: number; elevatedBpCases: number; elevatedPulseCases: number }> {
  const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const grouped = new Map<string, { feverCases: number; elevatedBpCases: number; elevatedPulseCases: number }>();

  records.forEach((record) => {
    const month = record.Month || 'Unknown';
    const current = grouped.get(month) ?? { feverCases: 0, elevatedBpCases: 0, elevatedPulseCases: 0 };
    if (isFever(record)) current.feverCases += 1;
    if (isElevatedBp(record)) current.elevatedBpCases += 1;
    if (isElevatedPulse(record)) current.elevatedPulseCases += 1;
    grouped.set(month, current);
  });

  return Array.from(grouped.entries())
    .map(([month, values]) => ({ month, ...values }))
    .sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));
}

function SummaryTable({
  title,
  rows,
  columns,
}: {
  title: string;
  rows: SummaryRow[];
  columns: [string, string, string];
}) {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{columns[0]}</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{columns[1]}</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{columns[2]}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.college}-${row.subgroup}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 text-sm text-gray-900">{row.college}</td>
                <td className="py-3 px-4 text-sm text-gray-700">{row.subgroup}</td>
                <td className="py-3 px-4 text-sm text-gray-700">{row.totalCases}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function HRWellnessDashboard() {
  const [records, setRecords] = useState<FacultyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const facultyRecords = await wellnessApi.getFacultyRecords();
        if (!cancelled) {
          setRecords(facultyRecords);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load HR wellness data.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalWellnessRecords = records.length;
  const averageTemperature = average(records.map((record) => record.Body_Temperature_C));
  const averagePulseRate = average(records.map((record) => record.Heart_Rate_bpm));

  const feverRows = useMemo(() => aggregateRows(records, isFever, (r) => r.User_Type), [records]);
  const bpRows = useMemo(() => aggregateRows(records, isElevatedBp, (r) => r.User_Type), [records]);
  const pulseRows = useMemo(() => aggregateRows(records, isElevatedPulse, (r) => r.User_Type), [records]);
  const emotionalRows = useMemo(() => aggregateRows(records, isEmotionalConcern, (r) => r.User_Type), [records]);
  const monthlyRows = useMemo(() => aggregateMonthlyRows(records), [records]);

  const collegeComparison = useMemo(() => {
    const grouped = new Map<
      string,
      {
        totalRecords: number;
        feverCases: number;
        elevatedBpCases: number;
        elevatedPulseCases: number;
      }
    >();

    records.forEach((record) => {
      const college = record.College || 'Unknown';
      const current = grouped.get(college) ?? {
        totalRecords: 0,
        feverCases: 0,
        elevatedBpCases: 0,
        elevatedPulseCases: 0,
      };

      current.totalRecords += 1;
      if (isFever(record)) current.feverCases += 1;
      if (isElevatedBp(record)) current.elevatedBpCases += 1;
      if (isElevatedPulse(record)) current.elevatedPulseCases += 1;

      grouped.set(college, current);
    });

    return Array.from(grouped.entries())
      .map(([college, values]) => ({
        college,
        totalRecords: values.totalRecords,
        feverCases: values.feverCases,
        elevatedBpCases: values.elevatedBpCases,
        elevatedPulseCases: values.elevatedPulseCases,
      }))
      .sort((a, b) => b.totalRecords - a.totalRecords)
      .slice(0, 6);
  }, [records]);

  const wellnessReportText = [
    'Employee physiological wellness trends',
    'College-based wellness comparison',
    'Elevated blood pressure monitoring',
    'Pulse rate monitoring',
    'Fever surveillance',
    'Workforce physiological wellness monitoring',
    'Emotional wellness analytics',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">HR Module</h1>
        <p className="text-gray-600 mt-1">Employee wellness analytics and occupational wellness monitoring dashboard.</p>
      </div>

      {error && <Card className="border border-red-200 bg-red-50 text-red-700">Unable to load HR wellness data: {error}</Card>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Total Wellness Records" value={loading ? '...' : totalWellnessRecords} icon={<UserCheck className="w-6 h-6" />} color="blue" />
        <KPICard title="Average Temperature" value={loading ? '...' : `${averageTemperature.toFixed(2)}`} icon={<Heart className="w-6 h-6" />} color="orange" />
        <KPICard title="Average Pulse Rate" value={loading ? '...' : `${averagePulseRate.toFixed(2)}`} icon={<TrendingUp className="w-6 h-6" />} color="red" />
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Employee Wellness Overview</h2>
        <p className="text-sm text-gray-600">
          Displays summarized wellness indicators extracted from employee physiological wellness datasets including temperature, blood pressure, pulse rate, and emotional wellness trends.
        </p>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Fever Monitoring</h2>
        <p className="text-sm text-gray-600 mb-4">Columns: College, User Type, Total Cases</p>
        <SummaryTable title="" rows={feverRows} columns={["College", "User Type", "Total Cases"]} />
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Blood Pressure Monitoring</h2>
        <p className="text-sm text-gray-600 mb-4">Columns: College, User Type, Total Cases</p>
        <SummaryTable title="" rows={bpRows} columns={["College", "User Type", "Total Cases"]} />
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Elevated Pulse Rate Monitoring</h2>
        <p className="text-sm text-gray-600 mb-4">Columns: College, User Type, Total Cases</p>
        <SummaryTable title="" rows={pulseRows} columns={["College", "User Type", "Total Cases"]} />
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Emotional Wellness Summary</h2>
        <p className="text-sm text-gray-600 mb-4">Columns: College, User Type, Total Cases</p>
        <SummaryTable title="" rows={emotionalRows} columns={["College", "User Type", "Total Cases"]} />
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">College Based Wellness Comparison</h2>
        <p className="text-sm text-gray-600 mb-4">Columns: College, Total Records, Fever Cases, Elevated BP Cases, Elevated Pulse Cases</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">College</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Total Records</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Fever Cases</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Elevated BP Cases</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Elevated Pulse Cases</th>
              </tr>
            </thead>
            <tbody>
              {collegeComparison.map((row) => (
                <tr key={row.college} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-900">{row.college}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{row.totalRecords}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{row.feverCases}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{row.elevatedBpCases}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{row.elevatedPulseCases}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Monthly Wellness Trends</h2>
        <p className="text-sm text-gray-600 mb-4">Columns: Month, Fever Cases, Elevated BP Cases, Elevated Pulse Cases</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Month</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Fever Cases</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Elevated BP Cases</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Elevated Pulse Cases</th>
              </tr>
            </thead>
            <tbody>
              {monthlyRows.map((row) => (
                <tr key={row.month} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-900">{row.month}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{row.feverCases}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{row.elevatedBpCases}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{row.elevatedPulseCases}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">HR Wellness Reports</h2>
        <p className="text-sm text-gray-600 mb-4">
          The HR Wellness Reports section provides summarized workforce wellness analytics for institutional monitoring, occupational wellness planning, preventive interventions, and wellness program development.
        </p>
        <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
          {wellnessReportText.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
