import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Activity, AlertTriangle, Heart, Brain } from 'lucide-react';
import { KPICard, Card } from '../components/Card';
import { Badge } from '../components/Badge';
import {
  FacultyRecord,
  StudentRecord,
  average,
  getStudentRisk,
  getWellnessScore,
  normalizeRiskLevel,
  parseBloodPressure,
  recordDateLabel,
  wellnessApi,
} from '../api/wellnessApi';

const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function riskVariant(status: string): 'success' | 'warning' | 'danger' {
  if (status === 'Critical') return 'danger';
  if (status === 'High' || status === 'Moderate') return 'warning';
  return 'success';
}

export function AdminDashboard() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [faculty, setFaculty] = useState<FacultyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [studentRecords, facultyRecords] = await Promise.all([
          wellnessApi.getStudentRecords(),
          wellnessApi.getFacultyRecords(),
        ]);

        if (!cancelled) {
          setStudents(studentRecords);
          setFaculty(facultyRecords);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load dashboard data.');
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

  const wellnessTrendData = useMemo(() => {
    const grouped = new Map<string, number[]>();

    students.forEach((record) => {
      const bp = parseBloodPressure(record.Blood_Pressure);
      if (!bp) return;
      const score = getWellnessScore({
        temperature: record.Body_Temperature_C,
        systolic: bp.systolic,
        diastolic: bp.diastolic,
        heartRate: record.Heart_Rate_bpm,
        emotion: record.Emotion,
      });

      const key = record.Month || 'Unknown';
      const values = grouped.get(key) ?? [];
      values.push(score);
      grouped.set(key, values);
    });

    faculty.forEach((record) => {
      const score = getWellnessScore({
        temperature: record.Body_Temperature_C,
        systolic: record.Systolic_BP,
        diastolic: record.Diastolic_BP,
        heartRate: record.Heart_Rate_bpm,
        emotion: record.Emotion,
      });

      const key = record.Month || 'Unknown';
      const values = grouped.get(key) ?? [];
      values.push(score);
      grouped.set(key, values);
    });

    return Array.from(grouped.entries())
      .map(([month, values]) => ({
        month: month.slice(0, 3),
        monthFull: month,
        wellness: Number(average(values).toFixed(1)),
        checks: values.length,
      }))
      .sort((a, b) => monthOrder.indexOf(a.monthFull) - monthOrder.indexOf(b.monthFull));
  }, [students, faculty]);

  const riskDistributionData = useMemo(() => {
    const counts = new Map<string, number>([
      ['Normal', 0],
      ['Moderate', 0],
      ['High', 0],
      ['Critical', 0],
    ]);

    students.forEach((record) => {
      const risk = getStudentRisk(record);
      counts.set(risk, (counts.get(risk) ?? 0) + 1);
    });

    faculty.forEach((record) => {
      const risk = normalizeRiskLevel(record.Risk_Level);
      counts.set(risk, (counts.get(risk) ?? 0) + 1);
    });

    return [
      { name: 'Normal', value: counts.get('Normal') ?? 0, color: '#22C55E' },
      { name: 'Moderate', value: counts.get('Moderate') ?? 0, color: '#F59E0B' },
      { name: 'High', value: counts.get('High') ?? 0, color: '#EF4444' },
      { name: 'Critical', value: counts.get('Critical') ?? 0, color: '#991B1B' },
    ];
  }, [students, faculty]);

  const collegeComparisonData = useMemo(() => {
    const grouped = new Map<string, { scores: number[]; people: number }>();

    students.forEach((record) => {
      const bp = parseBloodPressure(record.Blood_Pressure);
      if (!bp) return;
      const score = getWellnessScore({
        temperature: record.Body_Temperature_C,
        systolic: bp.systolic,
        diastolic: bp.diastolic,
        heartRate: record.Heart_Rate_bpm,
        emotion: record.Emotion,
      });

      const key = record.College || 'Unknown';
      const current = grouped.get(key) ?? { scores: [], people: 0 };
      current.scores.push(score);
      current.people += 1;
      grouped.set(key, current);
    });

    return Array.from(grouped.entries())
      .map(([college, data]) => ({
        college: college.length > 14 ? `${college.slice(0, 14)}...` : college,
        wellness: Number(average(data.scores).toFixed(1)),
        students: data.people,
      }))
      .sort((a, b) => b.wellness - a.wellness)
      .slice(0, 8);
  }, [students]);

  const recentActivities = useMemo(() => {
    const studentActivities = students.slice(-5).map((record) => ({
      id: `s-${record.id}`,
      actor: record.StudentID,
      type: `Student check (${record.Emotion})`,
      time: recordDateLabel(record),
      risk: getStudentRisk(record),
    }));

    const facultyActivities = faculty.slice(-5).map((record) => ({
      id: `f-${record.id}`,
      actor: record.EmployeeID_or_Guest,
      type: `Faculty check (${record.Emotion})`,
      time: recordDateLabel(record),
      risk: normalizeRiskLevel(record.Risk_Level),
    }));

    return [...studentActivities, ...facultyActivities].slice(0, 10);
  }, [students, faculty]);

  const totalChecks = students.length + faculty.length;
  const criticalCases = riskDistributionData.find((item) => item.name === 'Critical')?.value ?? 0;
  const highCases = riskDistributionData.find((item) => item.name === 'High')?.value ?? 0;
  const activeRedFlags = criticalCases + highCases;

  const wellnessScore = average(wellnessTrendData.map((item) => item.wellness));
  const emotionalRiskCases = [...students, ...faculty].filter((record) => {
    const emotion = record.Emotion.toLowerCase();
    return emotion.includes('stress') || emotion.includes('sad') || emotion.includes('angry');
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Live metrics from student and faculty backend records.</p>
        </div>
      </div>

      {error && (
        <Card className="border border-red-200 bg-red-50 text-red-700">
          Unable to load dashboard data from backend: {error}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard title="Total Students" value={loading ? '...' : students.length} icon={<Users className="w-6 h-6" />} color="blue" />
        <KPICard title="Total Employees" value={loading ? '...' : faculty.length} icon={<Users className="w-6 h-6" />} color="teal" />
        <KPICard title="Health Checks" value={loading ? '...' : totalChecks} icon={<Activity className="w-6 h-6" />} color="emerald" />
        <KPICard title="Active Red Flags" value={loading ? '...' : activeRedFlags} icon={<AlertTriangle className="w-6 h-6" />} color="red" />
        <KPICard title="Wellness Score" value={loading ? '...' : `${wellnessScore.toFixed(1)}%`} icon={<Heart className="w-6 h-6" />} color="purple" />
        <KPICard title="Emotional Risk Cases" value={loading ? '...' : emotionalRiskCases} icon={<Brain className="w-6 h-6" />} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Wellness Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={wellnessTrendData}>
              <defs>
                <linearGradient id="colorWellness" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F6CBD" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0F6CBD" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" domain={[0, 100]} />
              <Tooltip />
              <Area type="monotone" dataKey="wellness" stroke="#0F6CBD" fill="url(#colorWellness)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Check Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={wellnessTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="checks" stroke="#14B8A6" strokeWidth={2} dot={{ fill: '#14B8A6' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={riskDistributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                {riskDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">College Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={collegeComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="college" stroke="#6b7280" angle={-15} textAnchor="end" height={80} />
              <YAxis stroke="#6b7280" domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="wellness" fill="#0F6CBD" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#0F6CBD] text-white border-transparent">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-sky-200/80 mb-2">Bulk record import</p>
            <h3 className="text-2xl font-semibold">Upload student or faculty records in one pass</h3>
            <p className="text-slate-200 mt-2 max-w-2xl">
              Send large files to the queued import flow so backend workers process them asynchronously.
            </p>
          </div>
          <Link
            to="/dashboard/record-upload"
            className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-100"
          >
            Open Upload Page
          </Link>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Activity Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.map((activity) => (
                <tr key={activity.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-900">{activity.actor}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{activity.type}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{activity.time}</td>
                  <td className="py-3 px-4">
                    <Badge variant={riskVariant(activity.risk)}>{activity.risk}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
