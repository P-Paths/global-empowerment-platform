# API v1 package - GEP Platform MVP
from .auth import router as auth_router
from .user import router as user_router
from .analytics import router as analytics_router
from .messages import router as messages_router
from .posts import router as posts_router
from .comments import router as comments_router
from .tasks import router as tasks_router
from .score import router as score_router
from .clone import router as clone_router
from .pitchdeck import router as pitchdeck_router
try:
    from .test_apis import router as test_apis_router
except ImportError:
    test_apis_router = None 