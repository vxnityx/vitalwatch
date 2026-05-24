from rest_framework import serializers
from .models import StudentRecord, FacultyRecord

class StudentRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentRecord
        fields = '__all__'

class FacultyRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacultyRecord
        fields = '__all__'


class RecordUploadSerializer(serializers.Serializer):
    record_type = serializers.ChoiceField(choices=(("student", "Student"), ("faculty", "Faculty")))
    file = serializers.FileField()

    def validate_file(self, uploaded_file):
        file_name = uploaded_file.name.lower()
        if not file_name.endswith((".csv", ".tsv", ".txt")):
            raise serializers.ValidationError("Upload a CSV or TSV file.")
        return uploaded_file