from django.urls import path, include

urlpatterns = [
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),

    path('api-auth/', include('rest_framework.urls')),
]

from .views import (
    NotificationContactListCreateAPIView,
    NotificationContactRetrieveUpdateAPIView,
    brevo_health_check,
    send_notification_contact,
)

urlpatterns += [
    path('notification-contacts/', NotificationContactListCreateAPIView.as_view(), name='notification-contacts'),
    path('notification-contacts/<int:pk>/', NotificationContactRetrieveUpdateAPIView.as_view(), name='notification-contact-detail'),
    path('notification-contacts/<int:pk>/send/', send_notification_contact, name='notification-contact-send'),
    path('brevo-health/', brevo_health_check, name='brevo-health'),
]