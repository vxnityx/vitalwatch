
import os
import tempfile

from celery.result import AsyncResult
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import StudentRecord, FacultyRecord
from .serializers import StudentRecordSerializer, FacultyRecordSerializer, RecordUploadSerializer
from .tasks import import_records_from_file


class StudentRecordListCreateAPIView(ListCreateAPIView):
    queryset = StudentRecord.objects.all()
    serializer_class = StudentRecordSerializer


class StudentRecordRetrieveUpdateDestroyAPIView(RetrieveUpdateDestroyAPIView):
    queryset = StudentRecord.objects.all()
    serializer_class = StudentRecordSerializer


class FacultyRecordListCreateAPIView(ListCreateAPIView):
    queryset = FacultyRecord.objects.all()
    serializer_class = FacultyRecordSerializer


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

class StudentRecordListCreateAPIView(ListCreateAPIView):
    queryset = StudentRecord.objects.all()
    serializer_class = StudentRecordSerializer

class StudentRecordRetrieveUpdateDestroyAPIView(RetrieveUpdateDestroyAPIView):
    queryset = StudentRecord.objects.all()
    serializer_class = StudentRecordSerializer

class FacultyRecordListCreateAPIView(ListCreateAPIView):
    queryset = FacultyRecord.objects.all()
    serializer_class = FacultyRecordSerializer

class FacultyRecordRetrieveUpdateDestroyAPIView(RetrieveUpdateDestroyAPIView):
    queryset = FacultyRecord.objects.all()
    serializer_class = FacultyRecordSerializer




