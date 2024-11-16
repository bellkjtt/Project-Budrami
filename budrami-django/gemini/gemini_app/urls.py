# myapp/urls.py
from django.urls import path
from .views import index, process_speech,save_dialogues

urlpatterns = [
    path('reset_count/', index, name='reset_count'),
    path('process_speech/', process_speech, name='process_speech'),
    path('save_conversation/', save_dialogues, name='save_conversation'),
]
