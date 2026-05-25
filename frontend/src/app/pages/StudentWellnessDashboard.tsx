import { useEffect, useMemo, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GraduationCap, AlertTriangle, Smile, Thermometer, Heart, Activity } from 'lucide-react';
import { KPICard, Card } from '../components/Card';
import {
  StudentRecord,
  average,
  groupCount,
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

function isHighTemperature(record: StudentRecord): boolean {
  return record.Body_Temperature_C >= 37.5;
}

function isAbnormalHeartRate(record: StudentRecord): boolean {
  return record.Heart_Rate_bpm < 60 || record.Heart_Rate_bpm > 100;
}

function hasEmotionalConcern(record: StudentRecord): boolean {
  const emotion = record.Emotion.toLowerCase();
  return emotion.includes('sad') || emotion.includes('angry') || emotion.includes('stress') || emotion.includes('anxious') || emotion.includes('worried');
}

export function StudentWellnessDashboard() {
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [allRecords, setAllRecords] = useState<StudentRecord[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<string>('All Colleges');
  const [selectedCourse, setSelectedCourse] = useState<string>('All Courses');
  const [selectedMonth, setSelectedMonth] = useState<string>('All Months');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchFiltered = async () => {
      try {
        setLoading(true);
        setError(null);
        const params: Record<string, string | number> = {};
        if (selectedCollege !== 'All Colleges') params.college = selectedCollege;
        if (selectedCourse !== 'All Courses') params.course = selectedCourse;
        if (selectedMonth !== 'All Months') params.month = selectedMonth;

        const data = await wellnessApi.getStudentRecords(Object.keys(params).length ? params : undefined);
        if (!cancelled) setRecords(data);
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load student records.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFiltered();

    return () => {
      cancelled = true;
    };
  }, [selectedCollege, selectedCourse, selectedMonth]);

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      try {
        const data = await wellnessApi.getStudentRecords();
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

  const emotionData = useMemo(
    () =>
      groupCount(records, (record) => record.Emotion).map((item) => ({
        ...item,
        color: emotionColors[item.name.toLowerCase()] ?? '#64748B',
      })),
    [records],
  );

  const courseComparisonData = useMemo(() => {
    const grouped = new Map<string, number>();

    records.forEach((record) => {
      const key = record.Course || 'Unknown';
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    });

    return Array.from(grouped.entries())
      .map(([course, count]) => ({ course, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [records]);

  const avgTemperature = average(records.map((record) => record.Body_Temperature_C));
  const avgHeartRate = average(records.map((record) => record.Heart_Rate_bpm));
  const uniqueStudents = new Set(records.map((record) => record.StudentID)).size;
  const highTemperatureCases = records.filter(isHighTemperature).length;
  const abnormalHeartRateCases = records.filter(isAbnormalHeartRate).length;
  const emotionalConcernCases = records.filter(hasEmotionalConcern).length;

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

    records.forEach((record) => {
      const college = record.College || 'Unknown';
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
      current.uniqueStudents.add(record.StudentID);
      current.temps.push(record.Body_Temperature_C);
      current.heartRates.push(record.Heart_Rate_bpm);
      if (isHighTemperature(record)) current.highTempCases += 1;
      if (isAbnormalHeartRate(record)) current.abnormalHrCases += 1;
      if (hasEmotionalConcern(record)) current.emotionalConcernCases += 1;
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
        emotionalConcernCases: data.emotionalConcernCases,
      }))
      .sort((a, b) => b.totalRecords - a.totalRecords);
  }, [records]);

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

      <div className="flex flex-wrap gap-3 items-center">
        <select value={selectedCollege} onChange={(e) => setSelectedCollege(e.target.value)} className="p-2 border rounded">
          <option>All Colleges</option>
          {[...new Set(allRecords.map((r) => r.College || 'Unknown'))].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="p-2 border rounded">
          <option>All Courses</option>
          {[...new Set(allRecords.map((r) => r.Course || 'Unknown'))].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="p-2 border rounded">
          <option>All Months</option>
          {[...new Set(allRecords.map((r) => r.Month || 'Unknown'))].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <button
          onClick={() => {
            setSelectedCollege('All Colleges');
            setSelectedCourse('All Courses');
            setSelectedMonth('All Months');
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
        <KPICard title="Emotional Concern" value={loading ? '...' : emotionalConcernCases} icon={<Smile className="w-6 h-6" />} color="red" />
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Courses by Records</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={courseComparisonData} layout="vertical" margin={{ left: 24, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="course" type="category" stroke="#6b7280" width={120} />
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
    </div>
  );
}
