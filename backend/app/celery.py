from celery import Celery
import os

# Set default settings module for 'celery' (optional, if you have a config module)
os.environ.setdefault('CELERY_CONFIG_MODULE', 'app.core.config')

celery_app = Celery(
    'accorria',
    broker=os.getenv('CELERY_BROKER_URL', 'redis://redis:6379/0'),
    backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://redis:6379/0')
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

# Autodiscover tasks in app/services and app/agents
celery_app.autodiscover_tasks(['app.services', 'app.agents'])