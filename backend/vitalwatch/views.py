
import os
import tempfile
from datetime import datetime

from celery.result import AsyncResult
from django.db.models import Avg, Count
from django.db.models.functions import TruncMonth
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import StudentRecord, FacultyRecord, College, Program, Consent, Vital
from .serializers import (
    StudentRecordSerializer,
    FacultyRecordSerializer,
    RecordUploadSerializer,
    CollegeSerializer,
    ProgramSerializer,
    VitalSerializer,
    VitalJoinedSerializer,
)
from .tasks import import_records_from_file
from .supabase_queries import fetch_joined_student_records, fetch_joined_employee_records


def _parse_iso_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


def _filter_student_vitals(queryset, params):
    college_id = params.get("college_id")
    college = params.get("college")
    program_id = params.get("program_id")
    program = params.get("program")
    student_id = params.get("student_id")
    consent_type = params.get("consent_type")
    start_date = _parse_iso_date(params.get("start_date"))
    end_date = _parse_iso_date(params.get("end_date"))

    if college_id:
        queryset = queryset.filter(program__college__college_id=college_id)
    if college:
        queryset = queryset.filter(program__college__college__iexact=college)
    if program_id:
        queryset = queryset.filter(program__program_id=program_id)
    if program:
        queryset = queryset.filter(program__program__iexact=program)
    if student_id:
        queryset = queryset.filter(consent__student_id__iexact=student_id)
    if consent_type:
        queryset = queryset.filter(consent__consent_type__iexact=consent_type)
    if start_date:
        queryset = queryset.filter(timestamp__gte=start_date)
    if end_date:
        queryset = queryset.filter(timestamp__lte=end_date)

    return queryset


class StudentRecordListCreateAPIView(ListCreateAPIView):
    queryset = StudentRecord.objects.all()
    serializer_class = StudentRecordSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        college = self.request.GET.get('college')
        course = self.request.GET.get('course')
        month = self.request.GET.get('month')
        year_level = self.request.GET.get('year_level')

        if college:
            qs = qs.filter(College__iexact=college)
        if course:
            qs = qs.filter(Course__iexact=course)
        if month:
            qs = qs.filter(Month__iexact=month)
        if year_level:
            try:
                qs = qs.filter(Year_Level=int(year_level))
            except ValueError:
                pass

        return qs


class StudentRecordRetrieveUpdateDestroyAPIView(RetrieveUpdateDestroyAPIView):
    queryset = StudentRecord.objects.all()
    serializer_class = StudentRecordSerializer


class FacultyRecordListCreateAPIView(ListCreateAPIView):
    queryset = FacultyRecord.objects.all()
    serializer_class = FacultyRecordSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        college = self.request.GET.get('college')
        user_type = self.request.GET.get('user_type')
        month = self.request.GET.get('month')
        risk_level = self.request.GET.get('risk_level')
        alert_status = self.request.GET.get('alert_status')

        if college:
            qs = qs.filter(College__iexact=college)
        if user_type:
            qs = qs.filter(User_Type__iexact=user_type)
        if month:
            qs = qs.filter(Month__iexact=month)
        if risk_level:
            qs = qs.filter(Risk_Level__iexact=risk_level)
        if alert_status:
            qs = qs.filter(Alert_Status__icontains=alert_status)

        return qs


class FacultyRecordRetrieveUpdateDestroyAPIView(RetrieveUpdateDestroyAPIView):
    queryset = FacultyRecord.objects.all()
    serializer_class = FacultyRecordSerializer


class RecordUploadAPIView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        serializer = RecordUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uploaded_file = serializer.validated_data["file"]
        record_type = serializer.validated_data["record_type"]
        suffix = os.path.splitext(uploaded_file.name)[1] or ".csv"

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            for chunk in uploaded_file.chunks():
                temp_file.write(chunk)
            temp_file_path = temp_file.name

        task = import_records_from_file.delay(temp_file_path, record_type)
        return Response(
            {
                "task_id": task.id,
                "state": task.state,
                "message": "Upload queued for background processing.",
            },
            status=202,
        )


class RecordUploadStatusAPIView(APIView):
    def get(self, request, task_id, *args, **kwargs):
        task = AsyncResult(task_id)
        payload = {
            "task_id": task.id,
            "state": task.state,
        }

        if task.state == "SUCCESS":
            payload["result"] = task.result
            payload["percentage"] = 100
        elif task.state == "FAILURE":
            payload["error"] = str(task.result)
        elif task.info:
            payload["info"] = task.info
            if isinstance(task.info, dict) and "percentage" in task.info:
                payload["percentage"] = task.info["percentage"]

        return Response(payload)


class StudentVitalListCreateAPIView(ListCreateAPIView):
    queryset = Vital.objects.select_related("consent", "program__college").all()

    def get_serializer_class(self):
        if self.request.method == "GET":
            return VitalJoinedSerializer
        return VitalSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        return _filter_student_vitals(queryset, self.request.query_params)


class StudentVitalRetrieveUpdateDestroyAPIView(RetrieveUpdateDestroyAPIView):
    queryset = Vital.objects.select_related("consent", "program__college").all()
    serializer_class = VitalSerializer


class StudentFilterOptionsAPIView(APIView):
    def get(self, request, *args, **kwargs):
        colleges = College.objects.all().order_by("college")
        programs = Program.objects.select_related("college").all().order_by("program")
        college_id = request.query_params.get("college_id")
        if college_id:
            programs = programs.filter(college_id=college_id)

        consent_types = Consent.objects.values_list("consent_type", flat=True).distinct().order_by("consent_type")
        student_ids = Consent.objects.values_list("student_id", flat=True).distinct().order_by("student_id")

        return Response(
            {
                "colleges": CollegeSerializer(colleges, many=True).data,
                "programs": ProgramSerializer(programs, many=True).data,
                "consent_types": list(consent_types),
                "student_ids": list(student_ids),
            }
        )


class StudentChartsAPIView(APIView):
    def get(self, request, *args, **kwargs):
        queryset = Vital.objects.select_related("consent", "program__college").all()
        queryset = _filter_student_vitals(queryset, request.query_params)

        summary = queryset.aggregate(
            total_vitals=Count("vitals_id"),
            total_students=Count("consent__student_id", distinct=True),
            avg_temperature=Avg("temperature"),
            avg_heart_rate=Avg("heart_rate"),
            avg_systolic=Avg("systolic"),
            avg_diastolic=Avg("diastolic"),
        )

        by_college = list(
            queryset.values("program__college__college_id", "program__college__college")
            .annotate(total=Count("vitals_id"), avg_temperature=Avg("temperature"))
            .order_by("program__college__college")
        )

        by_program = list(
            queryset.values("program__program_id", "program__program")
            .annotate(total=Count("vitals_id"), avg_temperature=Avg("temperature"))
            .order_by("program__program")
        )

        monthly = list(
            queryset.exclude(timestamp__isnull=True)
            .annotate(month=TruncMonth("timestamp"))
            .values("month")
            .annotate(total=Count("vitals_id"), avg_temperature=Avg("temperature"), avg_heart_rate=Avg("heart_rate"))
            .order_by("month")
        )

        return Response(
            {
                "summary": summary,
                "by_college": by_college,
                "by_program": by_program,
                "monthly": monthly,
            }
        )


class StudentJoinedRecordsAPIView(APIView):
    """Read-only joined student wellness records from Supabase tables."""

    def get(self, request, *args, **kwargs):
        records = fetch_joined_student_records(request.query_params)
        return Response(records)


class EmployeeJoinedRecordsAPIView(APIView):
    """Read-only joined employee wellness records from Supabase tables."""

    def get(self, request, *args, **kwargs):
        records = fetch_joined_employee_records(request.query_params)
        return Response(records)




