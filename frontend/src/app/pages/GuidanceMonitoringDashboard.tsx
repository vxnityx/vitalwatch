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
import { JoinedStudentRecord, average, moodLabel, wellnessApi } from '../api/wellnessApi';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function moodBucket(level: number | null | undefined): 'Anxious' | 'Worried' | 'Sad' | 'Neutral' | 'Happy' {
  if (level === 1) return 'Anxious';
  if (level === 2) return 'Worried';
  if (level === 3) return 'Sad';
  if (level === 5) return 'Happy';
  return 'Neutral';
}

export function GuidanceMonitoringDashboard() {
  const [allRecords, setAllRecords] = useState<JoinedStudentRecord[]>([]);
  const [records, setRecords] = useState<JoinedStudentRecord[]>([]);
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
        const data = await wellnessApi.getJoinedStudentRecords();
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
        if (selectedCourse !== 'All Courses') params.program = selectedCourse;
        if (selectedYearLevel !== 'All Year Levels') params.year_level_id = selectedYearLevel;

        const data = await wellnessApi.getJoinedStudentRecords(Object.keys(params).length ? params : undefined);
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
  const totalStudents = new Set(records.map((r) => r.student_id)).size;

  const moodBuckets = useMemo(() => {
    const buckets = { Anxious: 0, Worried: 0, Sad: 0, Neutral: 0, Happy: 0 } as Record<string, number>;
    records.forEach((r) => {
      const b = moodBucket(r.mood_level);
      buckets[b] = (buckets[b] ?? 0) + 1;
    });
    return buckets;
  }, [records]);

  const anxiousCases = moodBuckets['Anxious'] ?? 0;
  const worriedCases = moodBuckets['Worried'] ?? 0;
  const sadCases = moodBuckets['Sad'] ?? 0;
  const happyCases = moodBuckets['Happy'] ?? 0;

  const overallEmotionData = useMemo(() => {
    return [
      { name: 'Anxious', value: moodBuckets['Anxious'] ?? 0, color: '#EF4444' },
      { name: 'Worried', value: moodBuckets['Worried'] ?? 0, color: '#F59E0B' },
      { name: 'Sad', value: moodBuckets['Sad'] ?? 0, color: '#3B82F6' },
      { name: 'Neutral', value: moodBuckets['Neutral'] ?? 0, color: '#14B8A6' },
      { name: 'Happy', value: moodBuckets['Happy'] ?? 0, color: '#22C55E' },
    ];
  }, [moodBuckets]);

  function monthlyTrendDataForMood(targetLevels: number[]) {
    const months = MONTHS.map((m) => ({ month: m, value: 0 }));
    records.forEach((r) => {
      if (!targetLevels.includes(Number(r.mood_level))) return;
      const m = String(r.month ?? r.Month ?? '').trim();
      const idx = MONTHS.findIndex((mm) => mm.toLowerCase().startsWith(m.toLowerCase()));
      const index = idx >= 0 ? idx : MONTHS.findIndex((mm) => mm.toLowerCase() === m.toLowerCase());
      const useIndex = index >= 0 ? index : null;
      if (useIndex !== null) months[useIndex].value += 1;
    });
    return months;
  }

  const concernTrend = useMemo(() => monthlyTrendDataForMood([1, 2, 3]), [records]);
  const happyTrend = useMemo(() => monthlyTrendDataForMood([5]), [records]);

  // filter option lists
  const collegeOptions = useMemo(() => ['All Colleges', ...Array.from(new Set(allRecords.map((r) => r.college || 'Unknown')))], [allRecords]);
  const courseOptions = useMemo(() => ['All Programs', ...Array.from(new Set(allRecords.map((r) => r.program || 'Unknown')))], [allRecords]);
  const yearLevelOptions = useMemo(() => ['All Year Levels', ...Array.from(new Set(allRecords.map((r) => String(r.year_level_id ?? 'Unknown'))))], [allRecords]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Guidance Module</h1>
          <p className="text-gray-600 mt-1">Overall student mood analytics with filters by College, Program, and Year Level.</p>
        </div>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Mood Level Reference</h3>
        <p className="text-sm text-gray-600">1: Anxious, 2: Worried, 3: Sad, 4: Neutral, 5: Happy</p>
      </Card>

      {error && <Card className="border border-red-200 bg-red-50 text-red-700">Unable to load records: {error}</Card>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Mood Records" value={loading ? '...' : String(totalRecords)} icon={<Brain className="w-6 h-6" />} color="blue" />
        <KPICard title="Total Students" value={loading ? '...' : String(totalStudents)} icon={<Brain className="w-6 h-6" />} color="emerald" />
        <KPICard title="Anxious Cases" value={loading ? '...' : String(anxiousCases)} icon={<Frown className="w-6 h-6" />} color="orange" />
        <KPICard title="Worried Cases" value={loading ? '...' : String(worriedCases)} icon={<AngryIcon className="w-6 h-6" />} color="red" />
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Concern Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={concernTrend} margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Happy Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={happyTrend} margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#22C55E" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Mood Records</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">StudentID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Mood</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">College</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Program</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Year Level</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Month</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 200).map((record) => (
                <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{record.student_id}</td>
                  <td className="py-3 px-4">
                    <Badge variant={moodLabel(record.mood_level) === 'Happy' ? 'success' : moodLabel(record.mood_level) === 'Sad' ? 'info' : moodLabel(record.mood_level) === 'Anxious' || moodLabel(record.mood_level) === 'Worried' ? 'danger' : 'neutral'}>
                      {moodLabel(record.mood_level)}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.college || 'Unknown'}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.program || 'Unknown'}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.year_level_id ?? 'Unknown'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{record.month}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
