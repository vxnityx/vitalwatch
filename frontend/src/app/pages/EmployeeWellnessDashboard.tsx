import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Briefcase, AlertTriangle, TrendingUp, Heart } from 'lucide-react';
import { KPICard, Card } from '../components/Card';
import { Badge } from '../components/Badge';
import {
  FacultyRecord,
  average,
  getWellnessScore,
  normalizeRiskLevel,
  parseBloodPressure,
  recordDateLabel,
  wellnessApi,
} from '../api/wellnessApi';

const riskColors: Record<string, string> = {
  Normal: '#22C55E',
  Moderate: '#F59E0B',
  High: '#EF4444',
  Critical: '#991B1B',
};

const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function riskVariant(risk: string): 'danger' | 'warning' | 'success' {
  if (risk === 'Critical' || risk === 'High') return 'danger';
  if (risk === 'Moderate') return 'warning';
  return 'success';
}

export function EmployeeWellnessDashboard() {
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
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load faculty records.');
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

    records.forEach((record) => {
      const wellness = getWellnessScore({
        temperature: record.Body_Temperature_C,
        systolic: record.Systolic_BP,
        diastolic: record.Diastolic_BP,
        heartRate: record.Heart_Rate_bpm,
        emotion: record.Emotion,
      });

      const key = record.Month || 'Unknown';
      const values = grouped.get(key) ?? [];
      values.push(wellness);
      grouped.set(key, values);
    });

    return Array.from(grouped.entries())
      .map(([month, values]) => ({ month: month.slice(0, 3), monthFull: month, wellness: Number(average(values).toFixed(1)) }))
      .sort((a, b) => monthOrder.indexOf(a.monthFull) - monthOrder.indexOf(b.monthFull));
  }, [records]);

  const departmentData = useMemo(() => {
    const grouped = new Map<string, number[]>();

    records.forEach((record) => {
      const wellness = getWellnessScore({
        temperature: record.Body_Temperature_C,
        systolic: record.Systolic_BP,
        diastolic: record.Diastolic_BP,
        heartRate: record.Heart_Rate_bpm,
        emotion: record.Emotion,
      });

      const key = record.College || 'Unknown';
      const values = grouped.get(key) ?? [];
      values.push(wellness);
      grouped.set(key, values);
    });

    return Array.from(grouped.entries())
      .map(([dept, values]) => ({ dept: dept.length > 18 ? `${dept.slice(0, 18)}...` : dept, wellness: Number(average(values).toFixed(1)) }))
      .sort((a, b) => b.wellness - a.wellness);
  }, [records]);

  const riskData = useMemo(() => {
    const counts = new Map<string, number>([
      ['Normal', 0],
      ['Moderate', 0],
      ['High', 0],
      ['Critical', 0],
    ]);

    records.forEach((record) => {
      const normalized = normalizeRiskLevel(record.Risk_Level);
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    });

    return Array.from(counts.entries()).map(([name, value]) => ({
      name,
      value,
      color: riskColors[name],
    }));
  }, [records]);

  const employeeRecords = useMemo(() => {
    return records.slice(0, 12).map((record) => ({
      id: record.id,
      name: record.EmployeeID_or_Guest,
      dept: record.College,
      bp: record.Blood_Pressure,
      temp: `${record.Body_Temperature_C.toFixed(1)}°C`,
      emotion: record.Emotion,
      risk: normalizeRiskLevel(record.Risk_Level),
      date: recordDateLabel(record),
    }));
  }, [records]);

  const elevatedCases = useMemo(() => {
    return records.filter((record) => {
      const bp = parseBloodPressure(record.Blood_Pressure);
      return (bp?.systolic ?? record.Systolic_BP) >= 130 || (bp?.diastolic ?? record.Diastolic_BP) >= 85;
    }).length;
  }, [records]);

  const emotionalCases = records.filter((record) => {
    const emotion = record.Emotion.toLowerCase();
    return emotion.includes('stress') || emotion.includes('angry') || emotion.includes('sad');
  }).length;

  const wellnessScore = average(
    records.map((record) =>
      getWellnessScore({
        temperature: record.Body_Temperature_C,
        systolic: record.Systolic_BP,
        diastolic: record.Diastolic_BP,
        heartRate: record.Heart_Rate_bpm,
        emotion: record.Emotion,
      }),
    ),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Wellness Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor employee health and wellness metrics</p>
        </div>
      </div>

      {error && (
        <Card className="border border-red-200 bg-red-50 text-red-700">
          Unable to load employee records from backend: {error}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Wellness Records" value={loading ? '...' : records.length} icon={<Briefcase className="w-6 h-6" />} color="blue" />
        <KPICard title="Elevated BP Cases" value={loading ? '...' : elevatedCases} icon={<Heart className="w-6 h-6" />} color="red" />
        <KPICard title="Emotional Wellness" value={loading ? '...' : emotionalCases} icon={<AlertTriangle className="w-6 h-6" />} color="orange" />
        <KPICard title="Wellness Score" value={loading ? '...' : `${wellnessScore.toFixed(1)}%`} icon={<TrendingUp className="w-6 h-6" />} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Wellness Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={wellnessTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="wellness" stroke="#0F6CBD" strokeWidth={2} dot={{ fill: '#0F6CBD' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Wellness Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dept" stroke="#6b7280" angle={-15} textAnchor="end" height={80} />
              <YAxis stroke="#6b7280" domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="wellness" fill="#14B8A6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Level Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={riskData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value">
              {riskData.map((entry, index) => (
                <Cell key={`risk-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Wellness Records</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Employee ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">College/Department</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">BP</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Temperature</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Emotion</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Risk Level</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Last Check</th>
              </tr>
            </thead>
            <tbody>
              {employeeRecords.map((employee) => (
                <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{employee.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{employee.dept}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{employee.bp}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{employee.temp}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{employee.emotion}</td>
                  <td className="py-3 px-4">
                    <Badge variant={riskVariant(employee.risk)}>{employee.risk}</Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{employee.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
