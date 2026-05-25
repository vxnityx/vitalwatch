import { useEffect, useMemo, useState } from 'react';
import { KPICard, Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Brain, Frown, Angry as AngryIcon } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { StudentRecord, wellnessApi, groupCount, average } from '../api/wellnessApi';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function mapEmotionBucket(raw: string) {
  const v = (raw || '').toLowerCase();
  if (v.includes('sad') || v.includes('depressed') || v.includes('stressed') || v.includes('anx')) return 'Sad';
  if (v.includes('angry') || v.includes('mad')) return 'Angry';
  if (v.includes('happy') || v.includes('joy')) return 'Happy';
  // treat neutral/relax/calm as Relax
  if (v.includes('relax') || v.includes('neutral') || v.includes('calm')) return 'Relax';
  return 'Relax';
}

export function GuidanceMonitoringDashboard() {
  const [allRecords, setAllRecords] = useState<StudentRecord[]>([]);
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filter UI state (temp) and applied
  const [tempCollege, setTempCollege] = useState<string>('All Colleges');
  const [tempCourse, setTempCourse] = useState<string>('All Courses');
  const [tempYearLevel, setTempYearLevel] = useState<string>('All Year Levels');

  const [selectedCollege, setSelectedCollege] = useState<string>('All Colleges');
  const [selectedCourse, setSelectedCourse] = useState<string>('All Courses');
  const [selectedYearLevel, setSelectedYearLevel] = useState<string>('All Year Levels');

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      try {
        const data = await wellnessApi.getStudentRecords();
        if (!cancelled) {
          setAllRecords(data);
        }
      } catch (e) {
        // ignore - used only for filter options
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchFiltered = async () => {
      try {
        setLoading(true);
        setError(null);
        const params: Record<string, string | number> = {};
        if (selectedCollege !== 'All Colleges') params.college = selectedCollege;
        if (selectedCourse !== 'All Courses') params.course = selectedCourse;
        if (selectedYearLevel !== 'All Year Levels') params.year_level = selectedYearLevel;

        const data = await wellnessApi.getStudentRecords(Object.keys(params).length ? params : undefined);
        if (!cancelled) setRecords(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load records');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFiltered();
    return () => {
      cancelled = true;
    };
  }, [selectedCollege, selectedCourse, selectedYearLevel]);

  // KPI computations
  const totalRecords = records.length;
  const totalStudents = new Set(records.map((r) => r.StudentID)).size;

  const emotionBuckets = useMemo(() => {
    const buckets = { Relax: 0, Happy: 0, Sad: 0, Angry: 0 } as Record<string, number>;
    records.forEach((r) => {
      const b = mapEmotionBucket(r.Emotion);
      buckets[b] = (buckets[b] ?? 0) + 1;
    });
    return buckets;
  }, [records]);

  const sadCases = emotionBuckets['Sad'] ?? 0;
  const angryCases = emotionBuckets['Angry'] ?? 0;

  const overallEmotionData = useMemo(() => {
    return [
      { name: 'Relax', value: emotionBuckets['Relax'] ?? 0, color: '#14B8A6' },
      { name: 'Happy', value: emotionBuckets['Happy'] ?? 0, color: '#22C55E' },
      { name: 'Sad', value: emotionBuckets['Sad'] ?? 0, color: '#3B82F6' },
      { name: 'Angry', value: emotionBuckets['Angry'] ?? 0, color: '#EF4444' },
    ];
  }, [emotionBuckets]);

  function monthlyTrendDataForEmotion(target: string) {
    const months = MONTHS.map((m) => ({ month: m, value: 0 }));
    records.forEach((r) => {
      const b = mapEmotionBucket(r.Emotion);
      if (b !== target) return;
      const m = (r.Month || '').trim();
      const idx = MONTHS.findIndex((mm) => mm.toLowerCase().startsWith(m.toLowerCase()));
      const index = idx >= 0 ? idx : MONTHS.findIndex((mm) => mm.toLowerCase() === m.toLowerCase());
      const useIndex = index >= 0 ? index : null;
      if (useIndex !== null) months[useIndex].value += 1;
    });
    return months;
  }

  const sadTrend = useMemo(() => monthlyTrendDataForEmotion('Sad'), [records]);
  const angryTrend = useMemo(() => monthlyTrendDataForEmotion('Angry'), [records]);

  // filter option lists
  const collegeOptions = useMemo(() => ['All Colleges', ...Array.from(new Set(allRecords.map((r) => r.College || 'Unknown')))], [allRecords]);
  const courseOptions = useMemo(() => ['All Courses', ...Array.from(new Set(allRecords.map((r) => r.Course || 'Unknown')))], [allRecords]);
  const yearLevelOptions = useMemo(() => ['All Year Levels', ...Array.from(new Set(allRecords.map((r) => String(r.Year_Level || 'Unknown'))))], [allRecords]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Guidance Module</h1>
          <p className="text-gray-600 mt-1">Overall student emotional wellness analytics with filters by College, Course, and Year Level.</p>
        </div>
      </div>

      {error && <Card className="border border-red-200 bg-red-50 text-red-700">Unable to load records: {error}</Card>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Emotion Records" value={loading ? '...' : String(totalRecords)} icon={<Brain className="w-6 h-6" />} color="blue" />
        <KPICard title="Total Students" value={loading ? '...' : String(totalStudents)} icon={<Brain className="w-6 h-6" />} color="emerald" />
        <KPICard title="Sad Cases" value={loading ? '...' : String(sadCases)} icon={<Frown className="w-6 h-6" />} color="orange" />
        <KPICard title="Angry Cases" value={loading ? '...' : String(angryCases)} icon={<AngryIcon className="w-6 h-6" />} color="red" />
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <select value={tempCollege} onChange={(e) => setTempCollege(e.target.value)} className="p-2 border rounded">
          {collegeOptions.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select value={tempCourse} onChange={(e) => setTempCourse(e.target.value)} className="p-2 border rounded">
          {courseOptions.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select value={tempYearLevel} onChange={(e) => setTempYearLevel(e.target.value)} className="p-2 border rounded">
          {yearLevelOptions.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
        <button
          onClick={() => {
            setSelectedCollege(tempCollege);
            setSelectedCourse(tempCourse);
            setSelectedYearLevel(tempYearLevel);
          }}
          className="px-3 py-2 bg-blue-600 text-white rounded"
        >
          Apply Filter
        </button>
        <button
          onClick={() => {
            setTempCollege('All Colleges');
            setTempCourse('All Courses');
            setTempYearLevel('All Year Levels');
            setSelectedCollege('All Colleges');
            setSelectedCourse('All Courses');
            setSelectedYearLevel('All Year Levels');
          }}
          className="px-3 py-2 bg-gray-100 rounded"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Emotion Analytics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={overallEmotionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="value">
                {overallEmotionData.map((entry, idx) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sad Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={sadTrend} margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Angry Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={angryTrend} margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#EF4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sample Student Emotional Records</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">StudentID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Emotion</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">College</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Course</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Year Level</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Month</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 200).map((record) => (
                <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{record.StudentID}</td>
                  <td className="py-3 px-4">
                    <Badge variant={mapEmotionBucket(record.Emotion) === 'Happy' ? 'success' : mapEmotionBucket(record.Emotion) === 'Sad' ? 'info' : mapEmotionBucket(record.Emotion) === 'Angry' ? 'danger' : 'neutral'}>
                      {record.Emotion}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.College}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.Course}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.Year_Level}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{record.Month}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
