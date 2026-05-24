import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UserCheck, Heart, TrendingUp, AlertTriangle } from 'lucide-react';
import { KPICard, Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { FacultyRecord, average, getWellnessScore, normalizeRiskLevel, recordDateLabel, wellnessApi } from '../api/wellnessApi';

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
        if (!cancelled) setRecords(facultyRecords);
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load HR wellness data.');
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

  const wellnessTrendData = useMemo(() => {
    const grouped = new Map<string, number[]>();

    records.forEach((record) => {
      const score = getWellnessScore({
        temperature: record.Body_Temperature_C,
        systolic: record.Systolic_BP,
        diastolic: record.Diastolic_BP,
        heartRate: record.Heart_Rate_bpm,
        emotion: record.Emotion,
      });
      const values = grouped.get(record.Month) ?? [];
      values.push(score);
      grouped.set(record.Month, values);
    });

    return Array.from(grouped.entries())
      .map(([month, values]) => ({ month: month.slice(0, 3), monthFull: month, wellness: Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)) }))
      .sort((a, b) => monthOrder.indexOf(a.monthFull) - monthOrder.indexOf(b.monthFull));
  }, [records]);

  const departmentData = useMemo(() => {
    const grouped = new Map<string, { scores: number[]; employees: number }>();

    records.forEach((record) => {
      const score = getWellnessScore({
        temperature: record.Body_Temperature_C,
        systolic: record.Systolic_BP,
        diastolic: record.Diastolic_BP,
        heartRate: record.Heart_Rate_bpm,
        emotion: record.Emotion,
      });
      const key = record.College || 'Unknown';
      const current = grouped.get(key) ?? { scores: [], employees: 0 };
      current.scores.push(score);
      current.employees += 1;
      grouped.set(key, current);
    });

    return Array.from(grouped.entries()).map(([dept, data]) => ({
      dept: dept.length > 18 ? `${dept.slice(0, 18)}...` : dept,
      wellness: Number((data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(1)),
      employees: data.employees,
    }));
  }, [records]);

  const riskDistributionData = useMemo(() => {
    const counts = new Map<string, number>([
      ['Normal', 0],
      ['Moderate', 0],
      ['High', 0],
      ['Critical', 0],
    ]);

    records.forEach((record) => {
      const risk = normalizeRiskLevel(record.Risk_Level);
      counts.set(risk, (counts.get(risk) ?? 0) + 1);
    });

    return Array.from(counts.entries()).map(([name, value]) => ({ name, value, color: riskColors[name] }));
  }, [records]);

  const employeeMonitoring = useMemo(() => {
    return records.slice(0, 12).map((record) => {
      const score = getWellnessScore({
        temperature: record.Body_Temperature_C,
        systolic: record.Systolic_BP,
        diastolic: record.Diastolic_BP,
        heartRate: record.Heart_Rate_bpm,
        emotion: record.Emotion,
      });

      return {
        id: record.id,
        name: record.EmployeeID_or_Guest,
        dept: record.College,
        bp: record.Blood_Pressure,
        temp: `${record.Body_Temperature_C.toFixed(1)}°C`,
        wellness: `${score.toFixed(0)}%`,
        risk: normalizeRiskLevel(record.Risk_Level),
        date: recordDateLabel(record),
      };
    });
  }, [records]);

  const elevatedBpTracking = records.filter((record) => record.Systolic_BP >= 130 || record.Diastolic_BP >= 85).length;
  const wellnessIndex = average(wellnessTrendData.map((item) => item.wellness));
  const activeCases = riskDistributionData.filter((item) => item.name === 'High' || item.name === 'Critical').reduce((total, item) => total + item.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">HR Wellness Dashboard</h1>
        <p className="text-gray-600 mt-1">Employee wellness management and tracking</p>
      </div>

      {error && <Card className="border border-red-200 bg-red-50 text-red-700">Unable to load HR wellness data: {error}</Card>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Employee Health Analytics" value={loading ? '...' : records.length} icon={<UserCheck className="w-6 h-6" />} color="blue" />
        <KPICard title="Elevated BP Tracking" value={loading ? '...' : elevatedBpTracking} icon={<Heart className="w-6 h-6" />} color="red" />
        <KPICard title="Wellness Index" value={loading ? '...' : `${wellnessIndex.toFixed(1)}%`} icon={<TrendingUp className="w-6 h-6" />} color="emerald" />
        <KPICard title="Active Cases" value={loading ? '...' : activeCases} icon={<AlertTriangle className="w-6 h-6" />} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Wellness Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dept" stroke="#6b7280" angle={-15} textAnchor="end" height={80} />
              <YAxis stroke="#6b7280" domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="wellness" fill="#0F6CBD" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Wellness Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={wellnessTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="wellness" stroke="#14B8A6" strokeWidth={2} dot={{ fill: '#14B8A6' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk-Level Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={riskDistributionData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value">
              {riskDistributionData.map((entry, index) => (
                <Cell key={`risk-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Monitoring</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Employee</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Department</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">BP Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Temperature</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Wellness Score</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {employeeMonitoring.map((employee) => (
                <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{employee.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{employee.dept}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{employee.bp}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{employee.temp}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{employee.wellness}</td>
                  <td className="py-3 px-4">
                    <Badge variant={riskVariant(employee.risk)}>{employee.risk}</Badge>
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
