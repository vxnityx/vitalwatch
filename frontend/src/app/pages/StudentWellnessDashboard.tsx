import { useEffect, useMemo, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GraduationCap, AlertTriangle, Smile, Thermometer, Heart, Activity } from 'lucide-react';
import { KPICard, Card } from '../components/Card';
import { Badge } from '../components/Badge';
import {
  StudentRecord,
  average,
  getStudentRisk,
  getWellnessScore,
  groupCount,
  parseBloodPressure,
  recordDateLabel,
  wellnessApi,
} from '../api/wellnessApi';

const emotionColors: Record<string, string> = {
  happy: '#22C55E',
  neutral: '#94A3B8',
  relax: '#14B8A6',
  sad: '#3B82F6',
  angry: '#EF4444',
  stressed: '#F59E0B',
};

const riskOrder = ['Critical', 'High', 'Moderate', 'Normal'];

function riskVariant(risk: string): 'danger' | 'warning' | 'info' | 'success' {
  if (risk === 'Critical') return 'danger';
  if (risk === 'High') return 'warning';
  if (risk === 'Moderate') return 'info';
  return 'success';
}

export function StudentWellnessDashboard() {
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const studentRecords = await wellnessApi.getStudentRecords();
        if (!cancelled) {
          setRecords(studentRecords);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load student records.');
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

  const emotionData = useMemo(
    () =>
      groupCount(records, (record) => record.Emotion).map((item) => ({
        ...item,
        color: emotionColors[item.name.toLowerCase()] ?? '#64748B',
      })),
    [records],
  );

  const riskLevelData = useMemo(() => {
    const riskCounts = new Map<string, number>([
      ['Normal', 0],
      ['Moderate', 0],
      ['High', 0],
      ['Critical', 0],
    ]);

    records.forEach((record) => {
      const risk = getStudentRisk(record);
      riskCounts.set(risk, (riskCounts.get(risk) ?? 0) + 1);
    });

    return Array.from(riskCounts.entries()).map(([level, count]) => ({ level, count }));
  }, [records]);

  const courseComparisonData = useMemo(() => {
    const grouped = new Map<string, number[]>();

    records.forEach((record) => {
      const bloodPressure = parseBloodPressure(record.Blood_Pressure);
      if (!bloodPressure) {
        return;
      }

      const wellness = getWellnessScore({
        temperature: record.Body_Temperature_C,
        systolic: bloodPressure.systolic,
        diastolic: bloodPressure.diastolic,
        heartRate: record.Heart_Rate_bpm,
        emotion: record.Emotion,
      });

      const key = record.Course || 'Unknown';
      const scores = grouped.get(key) ?? [];
      scores.push(wellness);
      grouped.set(key, scores);
    });

    return Array.from(grouped.entries())
      .map(([course, scores]) => ({ course, wellness: Number(average(scores).toFixed(1)) }))
      .sort((a, b) => b.wellness - a.wellness);
  }, [records]);

  const temperatureTrendData = useMemo(() => {
    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const grouped = new Map<string, number[]>();

    records.forEach((record) => {
      const key = record.Month || 'Unknown';
      const temperatures = grouped.get(key) ?? [];
      temperatures.push(record.Body_Temperature_C);
      grouped.set(key, temperatures);
    });

    return Array.from(grouped.entries())
      .map(([month, temperatures]) => ({
        day: month.slice(0, 3),
        month,
        avgTemp: Number(average(temperatures).toFixed(2)),
      }))
      .sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));
  }, [records]);

  const studentAlerts = useMemo(() => {
    return [...records]
      .map((record) => ({
        id: record.id,
        studentId: record.StudentID,
        course: record.Course,
        year: `Year ${record.Year_Level}`,
        bp: record.Blood_Pressure,
        temp: `${record.Body_Temperature_C.toFixed(1)}°C`,
        emotion: record.Emotion,
        risk: getStudentRisk(record),
        date: recordDateLabel(record),
      }))
      .sort((a, b) => riskOrder.indexOf(a.risk) - riskOrder.indexOf(b.risk))
      .slice(0, 10);
  }, [records]);

  const avgBloodPressure = useMemo(() => {
    const parsed = records
      .map((record) => parseBloodPressure(record.Blood_Pressure))
      .filter((value): value is { systolic: number; diastolic: number } => value !== null);

    if (!parsed.length) {
      return 'N/A';
    }

    const systolic = average(parsed.map((value) => value.systolic));
    const diastolic = average(parsed.map((value) => value.diastolic));

    return `${Math.round(systolic)}/${Math.round(diastolic)}`;
  }, [records]);

  const happyStudents = emotionData.find((item) => item.name.toLowerCase().includes('happy'))?.value ?? 0;
  const redFlagCases = riskLevelData.find((item) => item.level === 'Critical' || item.level === 'High');
  const avgTemperature = average(records.map((record) => record.Body_Temperature_C));
  const avgHeartRate = average(records.map((record) => record.Heart_Rate_bpm));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Wellness Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and analyze student health metrics</p>
        </div>
      </div>

      {error && (
        <Card className="border border-red-200 bg-red-50 text-red-700">
          Unable to load student records from backend: {error}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard title="Total Health Checks" value={loading ? '...' : records.length} icon={<GraduationCap className="w-6 h-6" />} color="blue" />
        <KPICard title="Red-Flag Cases" value={loading ? '...' : redFlagCases?.count ?? 0} icon={<AlertTriangle className="w-6 h-6" />} color="red" />
        <KPICard title="Happy Students" value={loading ? '...' : happyStudents} icon={<Smile className="w-6 h-6" />} color="emerald" />
        <KPICard title="Avg Temperature" value={loading ? '...' : `${avgTemperature.toFixed(1)}°C`} icon={<Thermometer className="w-6 h-6" />} color="teal" />
        <KPICard title="Avg Blood Pressure" value={loading ? '...' : avgBloodPressure} icon={<Heart className="w-6 h-6" />} color="purple" />
        <KPICard title="Avg Heart Rate" value={loading ? '...' : `${avgHeartRate.toFixed(0)} bpm`} icon={<Activity className="w-6 h-6" />} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Emotion Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={emotionData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label>
                {emotionData.map((entry, index) => (
                  <Cell key={`emotion-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Level Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={riskLevelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="level" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="count" fill="#0F6CBD" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Wellness Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={courseComparisonData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#6b7280" domain={[0, 100]} />
              <YAxis dataKey="course" type="category" stroke="#6b7280" width={100} />
              <Tooltip />
              <Bar dataKey="wellness" fill="#14B8A6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Temperature Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={temperatureTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis domain={[35.5, 38.5]} stroke="#6b7280" />
              <Tooltip />
              <Line type="monotone" dataKey="avgTemp" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Alerts</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Student ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Course</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Year</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">BP</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Temperature</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Emotion</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Risk Level</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {studentAlerts.map((student) => (
                <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{student.studentId}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{student.course}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{student.year}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{student.bp}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{student.temp}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{student.emotion}</td>
                  <td className="py-3 px-4">
                    <Badge variant={riskVariant(student.risk)}>{student.risk}</Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{student.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
