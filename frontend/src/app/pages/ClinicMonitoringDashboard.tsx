import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Thermometer, Heart, Activity } from 'lucide-react';
import { KPICard, Card } from '../components/Card';
import { EmployeeJoinedRecord, JoinedStudentRecord, wellnessApi } from '../api/wellnessApi';

function isStudentRedFlag(record: JoinedStudentRecord): boolean {
  return record.temperature >= 37.8 || record.heart_rate < 60 || record.heart_rate > 100 || record.systolic >= 130 || record.diastolic >= 85;
}

function isStudentFever(record: JoinedStudentRecord): boolean {
  return record.temperature >= 37.8;
}

function isStudentHighBp(record: JoinedStudentRecord): boolean {
  return record.systolic >= 130 || record.diastolic >= 85;
}

function isStudentHighHr(record: JoinedStudentRecord): boolean {
  return record.heart_rate < 60 || record.heart_rate > 100;
}

function isEmployeeRedFlag(record: EmployeeJoinedRecord): boolean {
  return record.temperature >= 37.8 || record.heart_rate < 60 || record.heart_rate > 100 || record.systolic >= 130 || record.diastolic >= 85;
}

function isEmployeeFever(record: EmployeeJoinedRecord): boolean {
  return record.temperature >= 37.8;
}

function isEmployeeHighBp(record: EmployeeJoinedRecord): boolean {
  return record.systolic >= 130 || record.diastolic >= 85;
}

function isEmployeeHighHr(record: EmployeeJoinedRecord): boolean {
  return record.heart_rate < 60 || record.heart_rate > 100;
}

type TopCaseCard = {
  title: string;
  value: number;
  label: string;
  color: 'red' | 'orange' | 'purple' | 'teal' | 'blue';
};

type SummaryRow = {
  college: string;
  subgroup: string;
  totalCases: number;
};

function aggregateSummary<T>(
  records: T[],
  predicate: (record: T) => boolean,
  collegeSelector: (record: T) => string,
  subgroupSelector: (record: T) => string,
): SummaryRow[] {
  const grouped = new Map<string, SummaryRow>();

  records.forEach((record) => {
    if (!predicate(record)) return;
    const college = collegeSelector(record) || 'Unknown';
    const subgroup = subgroupSelector(record) || 'Unknown';
    const key = `${college}||${subgroup}`;
    const current = grouped.get(key) ?? { college, subgroup, totalCases: 0 };
    current.totalCases += 1;
    grouped.set(key, current);
  });

  return Array.from(grouped.values()).sort((a, b) => b.totalCases - a.totalCases).slice(0, 6);
}

function highestSummary(rows: SummaryRow[]): { label: string; value: number } {
  const top = rows[0];
  if (!top) return { label: 'No cases', value: 0 };
  return { label: `${top.college} - ${top.subgroup}`, value: top.totalCases };
}

function SummaryTable({ title, rows, columns }: { title: string; rows: SummaryRow[]; columns: [string, string, string] }) {
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

export function ClinicMonitoringDashboard() {
  const [studentRecords, setStudentRecords] = useState<JoinedStudentRecord[]>([]);
  const [employeeRecords, setEmployeeRecords] = useState<EmployeeJoinedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [students, employees] = await Promise.all([
          wellnessApi.getJoinedStudentRecords(),
          wellnessApi.getJoinedEmployeeRecords({ college: 'CITC' }),
        ]);

        if (!cancelled) {
          setStudentRecords(students);
          setEmployeeRecords(employees);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load clinic records.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  const studentRedFlagRows = useMemo(
    () => aggregateSummary(studentRecords, isStudentRedFlag, (r) => r.college || 'CITC', (r) => r.program || 'Unknown'),
    [studentRecords],
  );
  const studentFeverRows = useMemo(
    () => aggregateSummary(studentRecords, isStudentFever, (r) => r.college || 'CITC', (r) => r.program || 'Unknown'),
    [studentRecords],
  );
  const studentBpRows = useMemo(
    () => aggregateSummary(studentRecords, isStudentHighBp, (r) => r.college || 'CITC', (r) => r.program || 'Unknown'),
    [studentRecords],
  );
  const studentHrRows = useMemo(
    () => aggregateSummary(studentRecords, isStudentHighHr, (r) => r.college || 'CITC', (r) => r.program || 'Unknown'),
    [studentRecords],
  );

  const employeeRedFlagRows = useMemo(
    () => aggregateSummary(employeeRecords, isEmployeeRedFlag, (r) => r.college || 'CITC', (r) => r.office || 'Unknown'),
    [employeeRecords],
  );
  const employeeFeverRows = useMemo(
    () => aggregateSummary(employeeRecords, isEmployeeFever, (r) => r.college || 'CITC', (r) => r.office || 'Unknown'),
    [employeeRecords],
  );
  const employeeBpRows = useMemo(
    () => aggregateSummary(employeeRecords, isEmployeeHighBp, (r) => r.college || 'CITC', (r) => r.office || 'Unknown'),
    [employeeRecords],
  );
  const employeeHrRows = useMemo(
    () => aggregateSummary(employeeRecords, isEmployeeHighHr, (r) => r.college || 'CITC', (r) => r.office || 'Unknown'),
    [employeeRecords],
  );

  const topCards: TopCaseCard[] = [
    {
      title: 'Highest Student Red-Flag Cases',
      ...highestSummary(studentRedFlagRows),
      color: 'red',
    },
    {
      title: 'Highest Employee Red-Flag Cases',
      ...highestSummary(employeeRedFlagRows),
      color: 'red',
    },
    {
      title: 'Highest Student Fever Cases',
      ...highestSummary(studentFeverRows),
      color: 'orange',
    },
    {
      title: 'Highest Employee Fever Cases',
      ...highestSummary(employeeFeverRows),
      color: 'orange',
    },
    {
      title: 'Highest Student BP Cases',
      ...highestSummary(studentBpRows),
      color: 'purple',
    },
    {
      title: 'Highest Employee BP Cases',
      ...highestSummary(employeeBpRows),
      color: 'purple',
    },
    {
      title: 'Highest Student HR Cases',
      ...highestSummary(studentHrRows),
      color: 'teal',
    },
    {
      title: 'Highest Employee HR Cases',
      ...highestSummary(employeeHrRows),
      color: 'teal',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Clinic Module</h1>
        <p className="text-gray-600 mt-1">Clinic monitoring analytics organized separately for Students and Employees by College and Program/Office.</p>
      </div>

      {error && <Card className="border border-red-200 bg-red-50 text-red-700">Unable to load clinic records: {error}</Card>}

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Description of Red-Flag Cases</h3>
        <p className="text-sm text-gray-700">
          Red-flag cases refer to students or employees who exhibit abnormal physiological wellness indicators based on the collected USTP-VitalWatch+ monitoring data.
        </p>
        <p className="text-sm text-gray-700 mt-3">These cases are automatically identified based on the following indicators:</p>
        <ul className="list-disc pl-6 mt-2 text-sm text-gray-700 space-y-1">
          <li>Body temperature greater than or equal to 37.8°C</li>
          <li>Heart rate below 60 bpm or above 100 bpm</li>
          <li>Elevated blood pressure readings</li>
        </ul>
        <div className="mt-4 rounded-2xl border-l-4 border-orange-400 bg-orange-50 p-4 text-sm text-gray-700">
          <strong>Highlight:</strong> The system highlights the colleges, programs, and employee offices with the highest number of red-flag cases for priority clinic monitoring and possible intervention.
        </div>
        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-gray-700">
          <strong>Mood Level Reference:</strong> 1: Anxious, 2: Worried, 3: Sad, 4: Neutral, 5: Happy
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {topCards.map((card) => (
          <KPICard
            key={card.title}
            title={card.title}
            value={loading ? '...' : card.value}
            trend={card.label}
            icon={card.color === 'red' ? <AlertTriangle className="w-6 h-6" /> : card.color === 'orange' ? <Thermometer className="w-6 h-6" /> : card.color === 'purple' ? <Heart className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
            color={card.color}
          />
        ))}
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Student Clinic Monitoring</h2>
        <p className="text-sm text-gray-600 mb-6">Student cases are organized by College and Program.</p>
        <div className="space-y-6">
          <SummaryTable title="Student Red-Flag Cases" rows={studentRedFlagRows} columns={["College", "Program", "Total Cases"]} />
          <SummaryTable title="Student Fever Monitoring" rows={studentFeverRows} columns={["College", "Program", "Total Cases"]} />
          <SummaryTable title="Student High Blood Pressure Cases" rows={studentBpRows} columns={["College", "Program", "Total Cases"]} />
          <SummaryTable title="Student Elevated Heart Monitoring" rows={studentHrRows} columns={["College", "Program", "Total Cases"]} />
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Employee Clinic Monitoring</h2>
        <p className="text-sm text-gray-600 mb-6">Employee cases are organized by College and Office.</p>
        <div className="space-y-6">
          <SummaryTable title="Employee Red-Flag Cases" rows={employeeRedFlagRows} columns={["College", "Office", "Total Cases"]} />
          <SummaryTable title="Employee Fever Monitoring" rows={employeeFeverRows} columns={["College", "Office", "Total Cases"]} />
          <SummaryTable title="Employee High Blood Pressure Cases" rows={employeeBpRows} columns={["College", "Office", "Total Cases"]} />
          <SummaryTable title="Employee Elevated Heart Monitoring" rows={employeeHrRows} columns={["College", "Office", "Total Cases"]} />
        </div>
      </Card>
    </div>
  );
}
