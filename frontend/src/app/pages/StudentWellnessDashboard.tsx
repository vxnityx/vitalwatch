import { useEffect, useMemo, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GraduationCap, AlertTriangle, Thermometer, Heart, Activity, Smile } from 'lucide-react';
import { KPICard, Card } from '../components/Card';
import {
  average,
  groupCount,
  JoinedStudentRecord,
  wellnessApi,
} from '../api/wellnessApi';

const collegeColors = ['#0F6CBD', '#14B8A6', '#8B5CF6', '#F59E0B', '#EF4444', '#22C55E'];

function isHighTemperature(record: JoinedStudentRecord): boolean {
  return record.Body_Temperature_C >= 37.5;
}

function isAbnormalHeartRate(record: JoinedStudentRecord): boolean {
  return record.Heart_Rate_bpm < 60 || record.Heart_Rate_bpm > 100;
}

function formatDateLabel(record: JoinedStudentRecord): string {
  if (!record.timelog) {
    return `${record.month}/${record.day}/${record.year}`;
  }

  const date = new Date(record.timelog);
  return Number.isNaN(date.getTime()) ? `${record.month}/${record.day}/${record.year}` : date.toLocaleDateString();
}

function formatBloodPressure(record: JoinedStudentRecord): string {
  return `${record.systolic}/${record.diastolic}`;
}

export function StudentWellnessDashboard() {
  const [records, setRecords] = useState<JoinedStudentRecord[]>([]);
  const [allRecords, setAllRecords] = useState<JoinedStudentRecord[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<string>('All Colleges');
  const [selectedProgram, setSelectedProgram] = useState<string>('All Programs');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('All Students');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchFiltered = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await wellnessApi.getJoinedStudentRecords();
        if (!cancelled) setRecords(data);
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load joined student records.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFiltered();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      try {
        const data = await wellnessApi.getJoinedStudentRecords();
        if (!cancelled) setAllRecords(data);
      } catch {
        // keep filter options best-effort
      }
    };

    fetchAll();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRecords = useMemo(
    () =>
      records.filter((record) => {
        const collegeName = record.college || 'Unknown';
        const programName = record.program || 'Unknown';
        const studentIdentifier = record.student_id || 'Unknown';

        if (selectedCollege !== 'All Colleges' && collegeName !== selectedCollege) return false;
        if (selectedProgram !== 'All Programs' && programName !== selectedProgram) return false;
        if (selectedStudentId !== 'All Students' && studentIdentifier !== selectedStudentId) return false;
        return true;
      }),
    [records, selectedCollege, selectedProgram, selectedStudentId],
  );

  const collegeDistributionData = useMemo(() => {
    const grouped = new Map<string, number>();

    filteredRecords.forEach((record) => {
      const key = record.college || 'Unknown';
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    });

    return Array.from(grouped.entries())
      .map(([college, count], index) => ({ college, count, color: collegeColors[index % collegeColors.length] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredRecords]);

  const programComparisonData = useMemo(() => {
    const grouped = new Map<string, number>();

    filteredRecords.forEach((record) => {
      const key = record.program || 'Unknown';
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    });

    return Array.from(grouped.entries())
      .map(([program, count]) => ({ program, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredRecords]);

  const avgTemperature = average(filteredRecords.map((record) => record.temperature));
  const avgHeartRate = average(filteredRecords.map((record) => record.heart_rate));
  const uniqueStudents = new Set(filteredRecords.map((record) => record.student_id)).size;
  const highTemperatureCases = filteredRecords.filter(isHighTemperature).length;
  const abnormalHeartRateCases = filteredRecords.filter(isAbnormalHeartRate).length;

  const comparisonWithOtherColleges = useMemo(() => {
    const grouped = new Map<
      string,
      {
        totalRecords: number;
        uniqueStudents: Set<string>;
        temps: number[];
        heartRates: number[];
        highTempCases: number;
        abnormalHrCases: number;
        emotionalConcernCases: number;
      }
    >();

    filteredRecords.forEach((record) => {
      const college = record.college || 'Unknown';
      const current = grouped.get(college) ?? {
        totalRecords: 0,
        uniqueStudents: new Set<string>(),
        temps: [],
        heartRates: [],
        highTempCases: 0,
        abnormalHrCases: 0,
        emotionalConcernCases: 0,
      };

      current.totalRecords += 1;
      current.uniqueStudents.add(record.student_id);
      current.temps.push(record.temperature);
      current.heartRates.push(record.heart_rate);
      if (isHighTemperature(record)) current.highTempCases += 1;
      if (isAbnormalHeartRate(record)) current.abnormalHrCases += 1;
      grouped.set(college, current);
    });

    return Array.from(grouped.entries())
      .map(([college, data]) => ({
        college,
        totalRecords: data.totalRecords,
        uniqueStudents: data.uniqueStudents.size,
        avgTemp: Number(average(data.temps).toFixed(2)),
        avgHeartRate: Number(average(data.heartRates).toFixed(2)),
        highTempCases: data.highTempCases,
        abnormalHrCases: data.abnormalHrCases,
        consentTypes: new Set(filteredRecords.filter((record) => (record.college || 'Unknown') === college).map((record) => record.consent_type)).size,
      }))
      .sort((a, b) => b.totalRecords - a.totalRecords);
  }, [filteredRecords]);

  const latestRecords = [...filteredRecords]
    .sort((a, b) => {
      const left = new Date(a.timelog).getTime();
      const right = new Date(b.timelog).getTime();
      return right - left;
    })
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Wellness Dashboard</h1>
          <p className="text-gray-600 mt-1">Live joined records from Supabase: students, consent, program, and college</p>
        </div>
      </div>

      {error && (
        <Card className="border border-red-200 bg-red-50 text-red-700">
          Unable to load student records from backend: {error}
        </Card>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <select value={selectedCollege} onChange={(e) => setSelectedCollege(e.target.value)} className="p-2 border rounded">
          <option>All Colleges</option>
          {[...new Set(allRecords.map((r) => r.college || 'Unknown'))].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)} className="p-2 border rounded">
          <option>All Programs</option>
          {[...new Set(allRecords.map((r) => r.program || 'Unknown'))].map((program) => (
            <option key={program}>{program}</option>
          ))}
        </select>
        <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} className="p-2 border rounded">
          <option>All Students</option>
          {[...new Set(allRecords.map((r) => r.student_id || 'Unknown'))].map((studentId) => (
            <option key={studentId}>{studentId}</option>
          ))}
        </select>
        <button
          onClick={() => {
            setSelectedCollege('All Colleges');
            setSelectedProgram('All Programs');
            setSelectedStudentId('All Students');
          }}
          className="px-3 py-2 bg-gray-100 rounded"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <KPICard title="Total Records" value={loading ? '...' : records.length} icon={<GraduationCap className="w-6 h-6" />} color="blue" />
        <KPICard title="Unique Students" value={loading ? '...' : uniqueStudents} icon={<Smile className="w-6 h-6" />} color="emerald" />
        <KPICard title="Average Temperature" value={loading ? '...' : `${avgTemperature.toFixed(2)} °C`} icon={<Thermometer className="w-6 h-6" />} color="teal" />
        <KPICard title="Average Heart Rate" value={loading ? '...' : `${avgHeartRate.toFixed(2)} bpm`} icon={<Activity className="w-6 h-6" />} color="orange" />
        <KPICard title="High Temperature" value={loading ? '...' : highTemperatureCases} icon={<AlertTriangle className="w-6 h-6" />} color="red" />
        <KPICard title="Abnormal Heart Rate" value={loading ? '...' : abnormalHeartRateCases} icon={<Heart className="w-6 h-6" />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">College Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={collegeDistributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="count" label>
                {collegeDistributionData.map((entry, index) => (
                  <Cell key={`emotion-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Programs by Records</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={programComparisonData} layout="vertical" margin={{ left: 24, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="program" type="category" stroke="#6b7280" width={140} />
              <Tooltip />
              <Bar dataKey="count" fill="#0F6CBD" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparison with Other Colleges</h3>
        <p className="text-sm text-gray-600 mb-4">Shows college-level comparison based on student wellness indicators from the selected records.</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">College</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Total Records</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Unique Students</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Avg Temp</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Avg Heart Rate</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">High Temp Cases</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Abnormal HR Cases</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Emotional Concern Cases</th>
              </tr>
            </thead>
            <tbody>
              {comparisonWithOtherColleges.map((college) => (
                <tr key={college.college} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{college.college}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{college.totalRecords}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{college.uniqueStudents}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{college.avgTemp.toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{college.avgHeartRate.toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{college.highTempCases}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{college.abnormalHrCases}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{college.emotionalConcernCases}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Joined Student Records</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Student ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">College</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Program</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Consent</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Temp</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">HR</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">BP</th>
              </tr>
            </thead>
            <tbody>
              {latestRecords.map((record) => (
                <tr key={record.vitalid} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">
                    {record.student_id || 'Unknown'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.college || 'Unknown'}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.program || 'Unknown'}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.consent_type}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{formatDateLabel(record)}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{Number(record.temperature).toFixed(2)} °C</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.heart_rate} bpm</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{formatBloodPressure(record)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
