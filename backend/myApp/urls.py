from django.urls import path
from . import views
from . import surveillance_views

urlpatterns = [
    path('predict', views.api_predict, name='api_predict'),
    path('predict/', views.api_predict, name='api_predict_slash'),
    path('chatbot', views.chatbot, name='chatbot'),
    path('chatbot/', views.chatbot, name='chatbot_slash'),
    
    path('overview', surveillance_views.api_overview, name='api_overview'),
    path('overview/', surveillance_views.api_overview, name='api_overview_slash'),
    path('historical', surveillance_views.api_historical, name='api_historical'),
    path('historical/', surveillance_views.api_historical, name='api_historical_slash'),
    path('capacity', surveillance_views.api_capacity, name='api_capacity'),
    path('capacity/', surveillance_views.api_capacity, name='api_capacity_slash'),
    path('demographics', surveillance_views.api_demographics, name='api_demographics'),
    path('demographics/', surveillance_views.api_demographics, name='api_demographics_slash'),
]
