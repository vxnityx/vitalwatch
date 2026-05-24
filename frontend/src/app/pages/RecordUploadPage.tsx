import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AlertCircle, ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, DatabaseZap, FileText, UploadCloud } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

type RecordType = 'student' | 'faculty';

type ParsedPreview = {
  headers: string[];
  rows: string[][];
  delimiter: string;
  rowCount: number;
};

type UploadResult = {
  task_id?: string;
  state?: string;
  message?: string;
  error?: string;
};

type UploadTaskStatus = {
  task_id?: string;
  state?: string;
  percentage?: number;
  info?: {
    processed?: number;
    created?: number;
    total?: number;
    percentage?: number;
  };
  result?: {
    processed?: number;
    created?: number;
    record_type?: string;
    status?: string;
  };
  error?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1';
const PAGE_SIZE = 10;

const studentFields = [
  'College',
  'Course',
  'Year_Level',
  'Month',
  'Day',
  'Year',
  'StudentID',
  'Body_Temperature_C',
  'Blood_Pressure',
  'Heart_Rate_bpm',
  'Emotion',
];

const facultyFields = [
  'College',
  'User_Type',
  'Month',
  'Day',
  'Year',
  'EmployeeID_or_Guest',
  'Body_Temperature_C',
  'Blood_Pressure',
  'Systolic_BP',
  'Diastolic_BP',
  'Heart_Rate_bpm',
  'Emotion',
  'Risk_Level',
  'Alert_Status',
];

const recordFieldMap: Record<RecordType, string[]> = {
  student: studentFields,
  faculty: facultyFields,
};

function detectDelimiter(line: string) {
  const candidates = [',', '\t', ';'];
  let bestDelimiter = ',';
  let bestScore = -1;

  candidates.forEach((candidate) => {
    let score = 0;
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      const nextCharacter = line[index + 1];

      if (character === '"') {
        if (inQuotes && nextCharacter === '"') {
          index += 1;
          continue;
        }

        inQuotes = !inQuotes;
        continue;
      }

      if (!inQuotes && character === candidate) {
        score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = candidate;
    }
  });

  return bestDelimiter;
}

function parseDelimitedText(text: string): ParsedPreview {
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const firstNonEmptyLine = normalizedText.split('\n').find((line) => line.trim().length > 0) ?? '';
  const delimiter = detectDelimiter(firstNonEmptyLine);

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = '';
  let inQuotes = false;

  for (let index = 0; index < normalizedText.length; index += 1) {
    const character = normalizedText[index];
    const nextCharacter = normalizedText[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        currentValue += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && character === delimiter) {
      currentRow.push(currentValue.trim());
      currentValue = '';
      continue;
    }

    if (!inQuotes && character === '\n') {
      currentRow.push(currentValue.trim());
      if (currentRow.some((value) => value.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentValue = '';
      continue;
    }

    currentValue += character;
  }

  currentRow.push(currentValue.trim());
  if (currentRow.some((value) => value.length > 0)) {
    rows.push(currentRow);
  }

  const headers = rows[0] ?? [];
  const dataRows = rows.slice(1);

  return {
    headers,
    rows: dataRows,
    delimiter,
    rowCount: dataRows.length,
  };
}

export function RecordUploadPage() {
  const [recordType, setRecordType] = useState<RecordType>('student');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedPreview | null>(null);
  const [serverResponse, setServerResponse] = useState<UploadResult | null>(null);
  const [taskStatus, setTaskStatus] = useState<UploadTaskStatus | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const requiredFields = recordFieldMap[recordType];

  const previewRows = preview?.rows ?? [];

  const headerSet = useMemo(() => new Set((preview?.headers ?? []).map((header) => header.trim().toLowerCase())), [preview]);

  const missingRequiredFields = requiredFields.filter((field) => !headerSet.has(field.toLowerCase()));
  const extraFields = preview?.headers.filter((header) => !requiredFields.some((field) => field.toLowerCase() === header.trim().toLowerCase())) ?? [];

  const totalPages = Math.max(1, Math.ceil(previewRows.length / PAGE_SIZE));
  const pageIndex = Math.min(currentPage, totalPages);
  const paginatedPreview = previewRows.slice((pageIndex - 1) * PAGE_SIZE, pageIndex * PAGE_SIZE);

  const isPreviewValid = Boolean(preview) && missingRequiredFields.length === 0 && previewRows.length > 0;
  const taskPercentage = taskStatus?.percentage ?? taskStatus?.info?.percentage ?? (taskStatus?.state === 'SUCCESS' ? 100 : 0);
  const taskState = taskStatus?.state ?? serverResponse?.state ?? 'IDLE';
  const taskLabel =
    taskState === 'SUCCESS'
      ? 'Completed'
      : taskState === 'FAILURE'
        ? 'Failed'
        : taskState === 'PROGRESS'
          ? 'Processing'
          : taskState === 'PENDING'
            ? 'Queued'
            : 'Idle';

  useEffect(() => {
    if (!serverResponse?.task_id) {
      setTaskStatus(null);
      return;
    }

    let cancelled = false;

    const pollStatus = async () => {
      try {
        const response = await fetch(`${API_BASE}/record-upload/${serverResponse.task_id}/`);
        const statusPayload = (await response.json()) as UploadTaskStatus;

        if (cancelled) {
          return;
        }

        setTaskStatus(statusPayload);

        if (statusPayload.state === 'SUCCESS' || statusPayload.state === 'FAILURE') {
          return;
        }

        window.setTimeout(pollStatus, 1000);
      } catch {
        if (!cancelled) {
          window.setTimeout(pollStatus, 1500);
        }
      }
    };

    pollStatus();

    return () => {
      cancelled = true;
    };
  }, [serverResponse?.task_id]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setServerResponse(null);
    setFileError(null);
    setCurrentPage(1);

    if (!file) {
      setPreview(null);
      return;
    }

    const text = await file.text();
    const parsed = parseDelimitedText(text);
    setPreview(parsed);
  };

  const handleUpload = async () => {
    if (!selectedFile || !isPreviewValid) {
      return;
    }

    try {
      setIsUploading(true);
      setFileError(null);
      setServerResponse(null);
      setTaskStatus(null);

      const formData = new FormData();
      formData.append('record_type', recordType);
      formData.append('file', selectedFile);

      const response = await fetch(`${API_BASE}/record-upload/`, {
        method: 'POST',
        body: formData,
      });

      const payload = (await response.json()) as UploadResult;

      if (!response.ok) {
        throw new Error(payload.error ?? payload.message ?? 'Unable to queue the upload.');
      }

      setServerResponse(payload);
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Unable to upload the file.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-[#0F6CBD] hover:text-[#0D5AAD]">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">Record Upload</h1>
          <p className="mt-1 max-w-3xl text-gray-600">
            Upload a student or faculty CSV/TSV file, inspect the data before sending it, and queue the import through Celery so large files do not block the UI.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <DatabaseZap className="h-5 w-5 text-[#0F6CBD]" />
          <div>
            <p className="text-sm font-medium text-gray-900">Background import enabled</p>
            <p className="text-xs text-gray-600">Redis broker + Celery worker</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-xl bg-blue-50 p-3 text-[#0F6CBD]">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Upload settings</h2>
              <p className="text-sm text-gray-600">Choose the record type and select your file.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Record type</label>
              <div className="grid grid-cols-2 gap-3">
                {(['student', 'faculty'] as RecordType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setRecordType(type)}
                    className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                      recordType === type
                        ? 'border-[#0F6CBD] bg-blue-50 text-[#0F6CBD]'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-sm font-semibold capitalize">{type} record</p>
                    <p className="text-xs opacity-80">
                      {type === 'student' ? 'StudentID-based rows' : 'Employee or guest rows'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Data file</label>
              <input
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFileChange}
                className="block w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-[#0F6CBD] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:border-gray-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-gray-500">Selected file</p>
                <p className="mt-1 truncate font-medium text-gray-900">{selectedFile?.name ?? 'None selected'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-gray-500">Preview rows</p>
                <p className="mt-1 font-medium text-gray-900">{preview?.rowCount ?? 0}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Required columns</p>
              <div className="flex flex-wrap gap-2">
                {requiredFields.map((field) => (
                  <span key={field} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-[#0F6CBD]">
                    {field}
                  </span>
                ))}
              </div>
            </div>

            {preview && (
              <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4 text-sm text-gray-700">
                <div className="flex items-center gap-2 font-semibold text-gray-900">
                  <FileText className="h-4 w-4" />
                  Parsed preview
                </div>
                <p className="mt-2">Delimiter: {preview.delimiter === '\t' ? 'tab' : preview.delimiter}</p>
                <p>Headers: {preview.headers.length}</p>
              </div>
            )}

            {serverResponse && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  Upload queued
                </div>
                <p className="mt-2">{serverResponse.message}</p>
                <p className="mt-1">Task ID: {serverResponse.task_id}</p>
              </div>
            )}

            {serverResponse?.task_id && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-gray-700 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">Live progress</p>
                    <p className="text-xs text-gray-500">{taskLabel}</p>
                  </div>
                  <p className="text-lg font-semibold text-[#0F6CBD]">{taskPercentage}%</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0F6CBD] to-[#14B8A6] transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, taskPercentage))}%` }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-gray-500">
                  <div>
                    <p className="uppercase tracking-[0.16em]">Processed</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{taskStatus?.info?.processed ?? taskStatus?.result?.processed ?? 0}</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-[0.16em]">Created</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{taskStatus?.info?.created ?? taskStatus?.result?.created ?? 0}</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-[0.16em]">Total</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{taskStatus?.info?.total ?? taskStatus?.result?.processed ?? previewRows.length}</p>
                  </div>
                </div>
              </div>
            )}

            {fileError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="h-4 w-4" />
                  Upload error
                </div>
                <p className="mt-2">{fileError}</p>
              </div>
            )}

            <Button
              type="button"
              onClick={handleUpload}
              disabled={!isPreviewValid || isUploading}
              className="w-full"
            >
              {isUploading ? 'Queuing upload...' : 'Queue upload via Celery'}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
              <p className="text-sm text-gray-600">Page through the first rows before sending the file to the backend.</p>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="rounded-full bg-slate-100 px-3 py-1">Page {pageIndex} of {totalPages}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">{previewRows.length} rows</span>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Status</p>
              <p className="mt-2 text-sm font-medium text-gray-900">
                {isPreviewValid ? 'Preview is valid for upload' : 'Missing required columns or file not loaded'}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Missing fields</p>
              <p className="mt-2 text-sm font-medium text-gray-900">
                {missingRequiredFields.length ? missingRequiredFields.join(', ') : 'None'}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Extra fields</p>
              <p className="mt-2 text-sm font-medium text-gray-900">
                {extraFields.length ? extraFields.join(', ') : 'None'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">#</th>
                  {(preview?.headers.length ? preview.headers : requiredFields).map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {paginatedPreview.length ? (
                  paginatedPreview.map((row, rowIndex) => (
                    <tr key={`${rowIndex}-${row.slice(0, 2).join('-')}`} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-gray-500">{(pageIndex - 1) * PAGE_SIZE + rowIndex + 1}</td>
                      {row.map((cell, cellIndex) => (
                        <td key={`${rowIndex}-${cellIndex}`} className="max-w-[180px] px-4 py-3 text-sm text-gray-900">
                          <span className="block truncate" title={cell}>
                            {cell}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-10 text-center text-sm text-gray-500" colSpan={(preview?.headers.length || requiredFields.length) + 1}>
                      Upload a file to preview its rows here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">Paginate through the preview before queuing the file.</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={pageIndex <= 1}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={pageIndex >= totalPages}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}