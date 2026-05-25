import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Briefcase, AlertTriangle, TrendingUp, Heart, Users } from 'lucide-react';
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
  const [selectedCollege, setSelectedCollege] = useState<string>('All Colleges');
  const [selectedUserType, setSelectedUserType] = useState<string>('All User Types');
  const [selectedMonth, setSelectedMonth] = useState<string>('All Months');
  const [selectedRisk, setSelectedRisk] = useState<string>('All Risk Levels');
  const [selectedAlertStatus, setSelectedAlertStatus] = useState<string>('All Alert Status');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const params: Record<string, string | number> = {};
        if (selectedCollege !== 'All Colleges') params.college = selectedCollege;
        if (selectedUserType !== 'All User Types') params.user_type = selectedUserType;
        if (selectedMonth !== 'All Months') params.month = selectedMonth;
        if (selectedRisk !== 'All Risk Levels') params.risk_level = selectedRisk;
        if (selectedAlertStatus !== 'All Alert Status') params.alert_status = selectedAlertStatus;

        const facultyRecords = await wellnessApi.getFacultyRecords(Object.keys(params).length ? params : undefined);
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

  const filteredRecords = records;

  const departmentData = useMemo(() => {
    const grouped = new Map<string, number>();

    filteredRecords.forEach((record) => {
      const key = record.College || 'Unknown';
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    });

    return Array.from(grouped.entries())
      .map(([dept, count]) => ({ dept: dept.length > 18 ? `${dept.slice(0, 18)}...` : dept, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredRecords]);

  const riskData = useMemo(() => {
    const counts = new Map<string, number>([
      ['Elevated', 0], // map to Moderate
      ['Red Flag', 0], // map to High + Critical
      ['Normal to Mild', 0], // map to Normal
    ]);

    filteredRecords.forEach((record) => {
      const norm = normalizeRiskLevel(record.Risk_Level);
      if (norm === 'Moderate') counts.set('Elevated', (counts.get('Elevated') ?? 0) + 1);
      else if (norm === 'High' || norm === 'Critical') counts.set('Red Flag', (counts.get('Red Flag') ?? 0) + 1);
      else counts.set('Normal to Mild', (counts.get('Normal to Mild') ?? 0) + 1);
    });

    return [
      { name: 'Elevated', value: counts.get('Elevated') ?? 0, color: '#F59E0B' },
      { name: 'Red Flag', value: counts.get('Red Flag') ?? 0, color: '#EF4444' },
      { name: 'Normal to Mild', value: counts.get('Normal to Mild') ?? 0, color: '#22C55E' },
    ];
  }, [records]);

  const employeeRecords = useMemo(() => {
    return filteredRecords.slice(0, 12).map((record) => ({
      id: record.id,
      name: record.EmployeeID_or_Guest,
      dept: record.College,
      bp: record.Blood_Pressure,
      temp: `${record.Body_Temperature_C.toFixed(1)}°C`,
      emotion: record.Emotion,
      risk: normalizeRiskLevel(record.Risk_Level),
      date: recordDateLabel(record),
    }));
  }, [filteredRecords]);

  const elevatedCases = useMemo(() => {
    return filteredRecords.filter((record) => {
      const bp = parseBloodPressure(record.Blood_Pressure);
      return (bp?.systolic ?? record.Systolic_BP) >= 130 || (bp?.diastolic ?? record.Diastolic_BP) >= 85;
    }).length;
  }, [filteredRecords]);

  const emotionalCases = filteredRecords.filter((record) => {
    const emotion = record.Emotion.toLowerCase();
    return emotion.includes('stress') || emotion.includes('angry') || emotion.includes('sad');
  }).length;

  const wellnessScore = average(
    filteredRecords.map((record) =>
      getWellnessScore({
        temperature: record.Body_Temperature_C,
        systolic: record.Systolic_BP,
        diastolic: record.Diastolic_BP,
        heartRate: record.Heart_Rate_bpm,
        emotion: record.Emotion,
      }),
    ),
  );

  // KPIs
  const totalRecords = filteredRecords.length;
  const uniqueEmployees = new Set(filteredRecords.map((r) => r.EmployeeID_or_Guest)).size;
  const avgTemperature = average(filteredRecords.map((r) => r.Body_Temperature_C));
  const avgHeartRate = average(filteredRecords.map((r) => r.Heart_Rate_bpm));
  const highTempCount = filteredRecords.filter((r) => r.Body_Temperature_C >= 37.5).length;
  const abnormalHrCount = filteredRecords.filter((r) => r.Heart_Rate_bpm < 60 || r.Heart_Rate_bpm > 100).length;
  const immediateAttentionCount = filteredRecords.filter((r) => (r.Alert_Status ?? '').toLowerCase().includes('immediate')).length;

  const alertStatusData = useMemo(() => {
    const counts = new Map<string, number>([
      ['For Monitoring', 0],
      ['Needs Immediate Attention', 0],
      ['No Immediate Alert', 0],
    ]);

    filteredRecords.forEach((r) => {
      const s = (r.Alert_Status ?? '').toLowerCase();
      if (s.includes('immediate') || s.includes('needs')) counts.set('Needs Immediate Attention', (counts.get('Needs Immediate Attention') ?? 0) + 1);
      else if (s.includes('monitor')) counts.set('For Monitoring', (counts.get('For Monitoring') ?? 0) + 1);
      else counts.set('No Immediate Alert', (counts.get('No Immediate Alert') ?? 0) + 1);
    });

    return [
      { name: 'For Monitoring', value: counts.get('For Monitoring') ?? 0 },
      { name: 'Needs Immediate Attention', value: counts.get('Needs Immediate Attention') ?? 0 },
      { name: 'No Immediate Alert', value: counts.get('No Immediate Alert') ?? 0 },
    ];
  }, [filteredRecords]);

  const comparisonWithOtherColleges = useMemo(() => {
    const grouped = new Map<string, { totalRecords: number; unique: Set<string>; temps: number[]; heartRates: number[]; highTemp: number; abnormalHr: number; elevatedBp: number; immediateAlerts: number }>();

    filteredRecords.forEach((r) => {
      const college = r.College || 'Unknown';
      const cur = grouped.get(college) ?? { totalRecords: 0, unique: new Set<string>(), temps: [], heartRates: [], highTemp: 0, abnormalHr: 0, elevatedBp: 0, immediateAlerts: 0 };
      cur.totalRecords += 1;
      cur.unique.add(r.EmployeeID_or_Guest);
      cur.temps.push(r.Body_Temperature_C);
      cur.heartRates.push(r.Heart_Rate_bpm);
      if (r.Body_Temperature_C >= 37.5) cur.highTemp += 1;
      if (r.Heart_Rate_bpm < 60 || r.Heart_Rate_bpm > 100) cur.abnormalHr += 1;
      const bp = parseBloodPressure(r.Blood_Pressure);
      if ((bp?.systolic ?? r.Systolic_BP) >= 130 || (bp?.diastolic ?? r.Diastolic_BP) >= 85) cur.elevatedBp += 1;
      if ((r.Alert_Status ?? '').toLowerCase().includes('immediate')) cur.immediateAlerts += 1;
      grouped.set(college, cur);
    });

    return Array.from(grouped.entries()).map(([college, data]) => ({
      college,
      totalRecords: data.totalRecords,
      uniqueEmployees: data.unique.size,
      avgTemp: Number(average(data.temps).toFixed(2)),
      avgHeartRate: Number(average(data.heartRates).toFixed(2)),
      highTempCases: data.highTemp,
      abnormalHrCases: data.abnormalHr,
      elevatedBpCases: data.elevatedBp,
      immediateAlerts: data.immediateAlerts,
    }));
  }, [filteredRecords]);

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

      <div className="flex gap-3 items-center">
        <select value={selectedCollege} onChange={(e) => setSelectedCollege(e.target.value)} className="p-2 border rounded">
          <option>All Colleges</option>
          {[...new Set(records.map((r) => r.College || 'Unknown'))].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select value={selectedUserType} onChange={(e) => setSelectedUserType(e.target.value)} className="p-2 border rounded">
          <option>All User Types</option>
          {[...new Set(records.map((r) => r.User_Type || 'Unknown'))].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="p-2 border rounded">
          <option>All Months</option>
          {[...new Set(records.map((r) => r.Month || 'Unknown'))].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select value={selectedRisk} onChange={(e) => setSelectedRisk(e.target.value)} className="p-2 border rounded">
          <option>All Risk Levels</option>
          <option>Normal</option>
          <option>Moderate</option>
          <option>High</option>
          <option>Critical</option>
        </select>
        <select value={selectedAlertStatus} onChange={(e) => setSelectedAlertStatus(e.target.value)} className="p-2 border rounded">
          <option>All Alert Status</option>
          <option>For Monitoring</option>
          <option>Needs Immediate Attention</option>
          <option>No Immediate Alert</option>
        </select>
        <button onClick={() => { setSelectedCollege('All Colleges'); setSelectedUserType('All User Types'); setSelectedMonth('All Months'); setSelectedRisk('All Risk Levels'); setSelectedAlertStatus('All Alert Status'); }} className="ml-2 px-3 py-2 bg-gray-100 rounded">Reset</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
        <KPICard title="Total Records" value={loading ? '...' : totalRecords} icon={<Briefcase className="w-6 h-6" />} color="blue" />
        <KPICard title="Unique Employees/Guests" value={loading ? '...' : uniqueEmployees} icon={<Users className="w-6 h-6" />} color="teal" />
        <KPICard title="Average Temperature" value={loading ? '...' : `${avgTemperature.toFixed(2)} °C`} icon={<Heart className="w-6 h-6" />} color="emerald" />
        <KPICard title="Average Heart Rate" value={loading ? '...' : `${avgHeartRate.toFixed(2)} bpm`} icon={<Heart className="w-6 h-6" />} color="orange" />
        <KPICard title="High Temperature" value={loading ? '...' : highTempCount} icon={<AlertTriangle className="w-6 h-6" />} color="red" />
        <KPICard title="Abnormal Heart Rate" value={loading ? '...' : abnormalHrCount} icon={<AlertTriangle className="w-6 h-6" />} color="red" />
        <KPICard title="Immediate Attention" value={loading ? '...' : immediateAttentionCount} icon={<AlertTriangle className="w-6 h-6" />} color="red" />
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
