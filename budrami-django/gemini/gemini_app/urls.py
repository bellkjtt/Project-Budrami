# myapp/urls.py
from django.urls import path
from .views import index, process_speech

urlpatterns = [
    path('reset_count/', index, name='reset_count'),
    path('process_speech/', process_speech, name='process_speech'),
    # path('save_conversation/', save_dialogues, name='save_conversation'),
    # path('generate_image/', generate_image, name='generate_image'),
]

from django.conf import settings
from django.conf.urls.static import static

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
