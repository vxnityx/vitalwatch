import { KPICard, Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { GraduationCap, AlertTriangle, Smile, Thermometer, Heart, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const emotionData = [
  { name: 'Happy', value: 320, color: '#22C55E' },
  { name: 'Neutral', value: 180, color: '#94A3B8' },
  { name: 'Sad', value: 75, color: '#3B82F6' },
  { name: 'Angry', value: 42, color: '#EF4444' },
  { name: 'Stressed', value: 110, color: '#F59E0B' },
];

const riskLevelData = [
  { level: 'Normal', count: 450 },
  { level: 'Moderate', count: 180 },
  { level: 'High', count: 75 },
  { level: 'Critical', count: 22 },
];

const courseComparisonData = [
  { course: 'CS', wellness: 85 },
  { course: 'Engineering', wellness: 88 },
  { course: 'Business', wellness: 82 },
  { course: 'Medicine', wellness: 90 },
  { course: 'Arts', wellness: 87 },
];

const temperatureTrendData = [
  { day: 'Mon', avgTemp: 36.5 },
  { day: 'Tue', avgTemp: 36.6 },
  { day: 'Wed', avgTemp: 36.7 },
  { day: 'Thu', avgTemp: 36.5 },
  { day: 'Fri', avgTemp: 36.4 },
];

const studentAlerts = [
  { id: 1, name: 'John Doe', course: 'Computer Science', year: '3rd Year', bp: '145/95', temp: '37.2°C', emotion: 'Stressed', risk: 'High', date: '2026-05-23' },
  { id: 2, name: 'Sarah Johnson', course: 'Engineering', year: '2nd Year', bp: '138/88', temp: '36.8°C', emotion: 'Neutral', risk: 'Moderate', date: '2026-05-23' },
  { id: 3, name: 'Mike Williams', course: 'Business', year: '4th Year', bp: '152/98', temp: '37.5°C', emotion: 'Angry', risk: 'Critical', date: '2026-05-23' },
  { id: 4, name: 'Emily Brown', course: 'Medicine', year: '1st Year', bp: '120/80', temp: '36.5°C', emotion: 'Happy', risk: 'Normal', date: '2026-05-23' },
  { id: 5, name: 'David Lee', course: 'Arts', year: '3rd Year', bp: '135/90', temp: '37.0°C', emotion: 'Sad', risk: 'Moderate', date: '2026-05-23' },
];

export function StudentWellnessDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Wellness Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and analyze student health metrics</p>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-teal-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">College</label>
            <select className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]">
              <option>All Colleges</option>
              <option>Engineering</option>
              <option>Business</option>
              <option>Medicine</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
            <select className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]">
              <option>All Courses</option>
              <option>Computer Science</option>
              <option>Engineering</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year Level</label>
            <select className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]">
              <option>All Years</option>
              <option>1st Year</option>
              <option>2nd Year</option>
              <option>3rd Year</option>
              <option>4th Year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Total Health Checks"
          value="2,547"
          icon={<GraduationCap className="w-6 h-6" />}
          color="blue"
        />
        <KPICard
          title="Red-Flag Cases"
          value="47"
          icon={<AlertTriangle className="w-6 h-6" />}
          color="red"
        />
        <KPICard
          title="Happy Students"
          value="320"
          icon={<Smile className="w-6 h-6" />}
          color="emerald"
        />
        <KPICard
          title="Avg Temperature"
          value="36.6°C"
          icon={<Thermometer className="w-6 h-6" />}
          color="teal"
        />
        <KPICard
          title="Avg Blood Pressure"
          value="122/78"
          icon={<Heart className="w-6 h-6" />}
          color="purple"
        />
        <KPICard
          title="Avg Heart Rate"
          value="72 bpm"
          icon={<Activity className="w-6 h-6" />}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Emotion Distribution</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={emotionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {emotionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {emotionData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-700">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
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
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="course" type="category" stroke="#6b7280" />
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
              <YAxis domain={[36, 38]} stroke="#6b7280" />
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
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Student Name</th>
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
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{student.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{student.course}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{student.year}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{student.bp}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{student.temp}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{student.emotion}</td>
                  <td className="py-3 px-4">
                    <Badge variant={student.risk === 'Critical' ? 'danger' : student.risk === 'High' ? 'warning' : student.risk === 'Moderate' ? 'info' : 'success'}>
                      {student.risk}
                    </Badge>
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
