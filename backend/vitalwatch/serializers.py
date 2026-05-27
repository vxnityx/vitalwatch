from rest_framework import serializers
from .models import StudentRecord, FacultyRecord, College, Program, Consent, Vital

class StudentRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentRecord
        fields = '__all__'

class FacultyRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacultyRecord
        fields = '__all__'


class CollegeSerializer(serializers.ModelSerializer):
    class Meta:
        model = College
        fields = ["college_id", "college"]


class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = ["program_id", "program", "college"]


class ConsentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consent
        fields = ["consent_id", "student_id", "timelog", "consent_type"]


class VitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vital
        fields = [
            "vitals_id",
            "consent",
            "timelog",
            "timestamp",
            "temperature",
            "heart_rate",
            "systolic",
            "diastolic",
            "program",
        ]


class VitalJoinedSerializer(serializers.ModelSerializer):
    consent_id = serializers.IntegerField(source="consent.consent_id", read_only=True)
    student_id = serializers.CharField(source="consent.student_id", read_only=True)
    consent_type = serializers.CharField(source="consent.consent_type", read_only=True)
    program_id = serializers.IntegerField(source="program.program_id", read_only=True)
    program = serializers.CharField(source="program.program", read_only=True)
    college_id = serializers.IntegerField(source="program.college.college_id", read_only=True)
    college = serializers.CharField(source="program.college.college", read_only=True)

    class Meta:
        model = Vital
        fields = [
            "vitals_id",
            "consent_id",
            "student_id",
            "consent_type",
            "timelog",
            "timestamp",
            "temperature",
            "heart_rate",
            "systolic",
            "diastolic",
            "program_id",
            "program",
            "college_id",
            "college",
        ]


class RecordUploadSerializer(serializers.Serializer):
    record_type = serializers.ChoiceField(choices=(("student", "Student"), ("faculty", "Faculty")))
    file = serializers.FileField()

    def validate_file(self, uploaded_file):
        file_name = uploaded_file.name.lower()
        if not file_name.endswith((".csv", ".tsv", ".txt")):
            raise serializers.ValidationError("Upload a CSV or TSV file.")
        return uploaded_file