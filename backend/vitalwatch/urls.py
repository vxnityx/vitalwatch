from django.contrib import admin
from django.urls import path, include
from .views import (
    StudentRecordListCreateAPIView,
    StudentRecordRetrieveUpdateDestroyAPIView,
    FacultyRecordListCreateAPIView,
    FacultyRecordRetrieveUpdateDestroyAPIView,
    RecordUploadAPIView,
    RecordUploadStatusAPIView,
    StudentVitalListCreateAPIView,
    StudentVitalRetrieveUpdateDestroyAPIView,
    StudentFilterOptionsAPIView,
    StudentChartsAPIView,
    StudentJoinedRecordsAPIView,
    EmployeeJoinedRecordsAPIView,
)


urlpatterns = [
    path("studentrecord/", StudentRecordListCreateAPIView.as_view(), name='studentrecord-list-create'),
    path("studentrecord/<int:pk>/", StudentRecordRetrieveUpdateDestroyAPIView.as_view(), name='studentrecord-retrieve-update-destroy'),
    path("facultyrecord/", FacultyRecordListCreateAPIView.as_view(), name='facultyrecord-list-create'),
    path("facultyrecord/<int:pk>/", FacultyRecordRetrieveUpdateDestroyAPIView.as_view(), name='facultyrecord-retrieve-update-destroy'),
    path("record-upload/", RecordUploadAPIView.as_view(), name="record-upload"),
    path("record-upload/<str:task_id>/", RecordUploadStatusAPIView.as_view(), name="record-upload-status"),
    path("student/vitals/", StudentVitalListCreateAPIView.as_view(), name="student-vitals-list-create"),
    path("student/vitals/<int:pk>/", StudentVitalRetrieveUpdateDestroyAPIView.as_view(), name="student-vitals-rud"),
    path("student/filters/", StudentFilterOptionsAPIView.as_view(), name="student-filter-options"),
    path("student/charts/", StudentChartsAPIView.as_view(), name="student-charts"),
    path("student/records/", StudentJoinedRecordsAPIView.as_view(), name="student-records"),
    path("employee/records/", EmployeeJoinedRecordsAPIView.as_view(), name="employee-records"),
]
