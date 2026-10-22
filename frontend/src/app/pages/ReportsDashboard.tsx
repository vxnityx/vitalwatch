import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { FileText, Download, Printer, Calendar, Filter } from 'lucide-react';
import { Pagination, pageCount, paginate } from '../components/Pagination';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EmployeeJoinedRecord, JoinedStudentRecord, wellnessApi } from '../api/wellnessApi';

const reportCategories = [
  { id: 1, title: 'Daily Health Reports', description: 'Comprehensive daily health check summaries', icon: <FileText className="w-6 h-6" />, count: 547 },
  { id: 2, title: 'Monthly Wellness Reports', description: 'Monthly wellness trends and analytics', icon: <FileText className="w-6 h-6" />, count: 18 },
  { id: 3, title: 'Red Flag Summaries', description: 'Critical cases and urgent health alerts', icon: <FileText className="w-6 h-6" />, count: 23 },
  { id: 4, title: 'Emotional Wellness Reports', description: 'Mental health and emotional wellness tracking', icon: <FileText className="w-6 h-6" />, count: 127 },
  { id: 5, title: 'College-Based Analytics', description: 'Department and college comparison reports', icon: <FileText className="w-6 h-6" />, count: 12 },
  { id: 6, title: 'Employee Wellness Reports', description: 'Employee health and wellness summaries', icon: <FileText className="w-6 h-6" />, count: 84 },
];

const recentReports = [
  { id: 1, name: 'May 2026 Wellness Summary', type: 'Monthly Report', date: '2026-05-23', status: 'Ready' },
  { id: 2, name: 'Student Critical Cases - Week 20', type: 'Red Flag Report', date: '2026-05-22', status: 'Ready' },
  { id: 3, name: 'Engineering College Analytics', type: 'College Report', date: '2026-05-21', status: 'Ready' },
  { id: 4, name: 'Daily Health Check - May 23', type: 'Daily Report', date: '2026-05-23', status: 'Ready' },
  { id: 5, name: 'Emotional Wellness - Q2 2026', type: 'Quarterly Report', date: '2026-05-20', status: 'Ready' },
];

export function ReportsDashboard() {
  const [reportPage, setReportPage] = useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState(1);
  const [students, setStudents] = useState<JoinedStudentRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeJoinedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accountStorage = localStorage.getItem('vitalwatch_account') ?? sessionStorage.getItem('vitalwatch_account');
    const account = accountStorage ? JSON.parse(accountStorage) as { role?: string } : {};
    const role = account.role?.toLowerCase() ?? '';

    const loadRecords = async () => {
      try {
        setLoading(true);
        const [studentRecords, employeeRecords] = await Promise.all([
          role === 'hr' || role === 'human-resource' || role === 'human resource'
            ? Promise.resolve([] as JoinedStudentRecord[])
            : wellnessApi.getJoinedStudentRecords(),
          role === 'guidance'
            ? Promise.resolve([] as EmployeeJoinedRecord[])
            : wellnessApi.getJoinedEmployeeRecords(),
        ]);
        setStudents(studentRecords);
        setEmployees(employeeRecords);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load report data.');
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, []);

  const selectedCategory = reportCategories.find((category) => category.id === selectedCategoryId) ?? reportCategories[0];

  const getCategoryRecords = () => {
    const isAbnormal = (temperature: number, heartRate: number, systolic: number, diastolic: number) =>
      temperature >= 37.5 || heartRate < 60 || heartRate > 100 || systolic >= 140 || diastolic >= 90;
    const isConcern = (mood: number | null) => mood !== null && mood <= 3;

    if (selectedCategoryId === 3) {
      return {
        students: students.filter((record) => isAbnormal(record.temperature, record.heart_rate, record.systolic, record.diastolic)),
        employees: employees.filter((record) => isAbnormal(record.temperature, record.heart_rate, record.systolic, record.diastolic)),
      };
    }
    if (selectedCategoryId === 4) {
      return {
        students: students.filter((record) => isConcern(record.mood_level)),
        employees: employees.filter((record) => isConcern(record.mood_level)),
      };
    }
    if (selectedCategoryId === 5) return { students, employees: [] as EmployeeJoinedRecord[] };
    if (selectedCategoryId === 6) return { students: [] as JoinedStudentRecord[], employees };
    return { students, employees };
  };

  const exportPdf = () => {
    const categoryRecords = getCategoryRecords();
    const reportStudents = categoryRecords.students;
    const reportEmployees = categoryRecords.employees;
    const document = new jsPDF();
    const generatedAt = new Date();
    const dateLabel = generatedAt.toISOString().slice(0, 10);
    const abnormalStudentHr = reportStudents.filter((record) => record.heart_rate < 60 || record.heart_rate > 100).length;
    const abnormalEmployeeHr = reportEmployees.filter((record) => record.heart_rate < 60 || record.heart_rate > 100).length;
    const highStudentBp = reportStudents.filter((record) => record.systolic >= 140 || record.diastolic >= 90).length;
    const highEmployeeBp = reportEmployees.filter((record) => record.systolic >= 140 || record.diastolic >= 90).length;

    document.setFontSize(18);
    document.text(`VitalWatch+ ${selectedCategory.title}`, 14, 18);
    document.setFontSize(10);
    document.text(`Generated: ${generatedAt.toLocaleString()}`, 14, 25);
    autoTable(document, {
      startY: 32,
      head: [['Category', 'Records', 'Abnormal HR', 'High BP']],
      body: [
        ['Students', String(reportStudents.length), String(abnormalStudentHr), String(highStudentBp)],
        ['Employees', String(reportEmployees.length), String(abnormalEmployeeHr), String(highEmployeeBp)],
      ],
    });

    let nextY = ((document as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 32) + 10;
    if (reportStudents.length) {
      autoTable(document, {
        startY: nextY,
        head: [['Student ID', 'Date', 'Temp', 'HR', 'BP', 'College', 'Program']],
        body: reportStudents.map((record) => [
          record.student_id,
          record.timelog ? new Date(record.timelog).toLocaleDateString() : `${record.month}/${record.day}/${record.year}`,
          `${record.temperature} C`,
          `${record.heart_rate} bpm`,
          record.blood_pressure,
          record.college ?? 'Unknown',
          record.program ?? 'Unknown',
        ]),
      });
      nextY = ((document as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? nextY) + 10;
    }
    if (reportEmployees.length) {
      autoTable(document, {
        startY: nextY,
        head: [['Employee ID', 'Date', 'Temp', 'HR', 'BP', 'Office', 'College']],
        body: reportEmployees.map((record) => [
          String(record.employee_id),
          record.timelog ? new Date(record.timelog).toLocaleDateString() : `${record.month}/${record.day}/${record.year}`,
          `${record.temperature} C`,
          `${record.heart_rate} bpm`,
          record.blood_pressure,
          record.office,
          record.college,
        ]),
      });
    }

    document.save(`vitalwatch-report-${dateLabel}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports Dashboard</h1>
          <p className="text-gray-600 mt-1">Generate and manage wellness reports</p>
        </div>
          <Button variant="primary" onClick={exportPdf} disabled={loading}>
          <FileText className="w-4 h-4 mr-2" />
          Generate New Report
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-teal-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
                <option>Custom Range</option>
              </select>
            </div>
          </div>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]">
              <option>All Departments</option>
              <option>IT</option>
              <option>HR</option>
              <option>Finance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
            <select className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]">
              <option>All Levels</option>
              <option>Normal</option>
              <option>Moderate</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>
        </div>
      </Card>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportCategories.map((category) => (
            <Card
              key={category.id}
              className={`cursor-pointer transition-shadow hover:shadow-lg ${selectedCategoryId === category.id ? 'border-2 border-[#0F6CBD] shadow-md' : ''}`}
              onClick={() => setSelectedCategoryId(category.id)}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 text-[#0F6CBD] rounded-xl">
                  {category.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{category.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                  <p className="text-xs text-gray-500">
                    {category.id === 3
                      ? `${students.filter((record) => record.temperature >= 37.5 || record.heart_rate < 60 || record.heart_rate > 100 || record.systolic >= 140 || record.diastolic >= 90).length + employees.filter((record) => record.temperature >= 37.5 || record.heart_rate < 60 || record.heart_rate > 100 || record.systolic >= 140 || record.diastolic >= 90).length} records available`
                      : category.id === 4
                        ? `${students.filter((record) => record.mood_level !== null && record.mood_level <= 3).length + employees.filter((record) => record.mood_level !== null && record.mood_level <= 3).length} records available`
                        : category.id === 5
                          ? `${students.length} records available`
                          : category.id === 6
                            ? `${employees.length} records available`
                            : `${students.length + employees.length} records available`}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Export Options</h3>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={exportPdf} disabled={loading}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />
              Print Report
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download Analytics
            </Button>
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">{loading ? 'Loading live records...' : 'Generate a PDF from the currently available wellness records.'}</p>
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          <Button variant="primary" onClick={exportPdf} disabled={loading}>Generate Preview</Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Report Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Generated Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginate(recentReports, reportPage, 5).map((report) => (
                <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{report.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{report.type}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{report.date}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {report.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button className="text-[#0F6CBD] hover:text-[#0D5AAD] text-sm font-medium">
                        View
                      </button>
                      <button className="text-[#0F6CBD] hover:text-[#0D5AAD] text-sm font-medium">
                        Download
                      </button>
                      <button className="text-[#0F6CBD] hover:text-[#0D5AAD] text-sm font-medium">
                        Share
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination currentPage={reportPage} pageCount={pageCount(recentReports.length, 5)} onPageChange={setReportPage} />
        </div>
      </Card>
    </div>
  );
}
