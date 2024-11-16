# models.py
from django.db import models

class Dialog(models.Model):
    session_id = models.CharField(max_length=100)
    content = models.TextField()
    message_type = models.CharField(max_length=10, choices=[('human', 'Human'), ('ai', 'AI')])  # 추가 필드
    timestamp = models.DateTimeField(auto_now_add=True)
