# API v1 package - Full version
from .auth import router as auth_router
from .user import router as user_router
from .analytics import router as analytics_router
from .car_listing_generator import router as car_listing_generator_router
from .car_analysis import router as car_analysis_router
from .market_intelligence import router as market_intelligence_router
from .enhanced_analysis import router as enhanced_analysis_router
from .flip_car import router as flip_car_router
from . import listings
from .platform_posting import router as platform_posting_router
from .messages import router as messages_router
from .replies import router as replies_router
from .deals import router as deals_router
from .chat import router as chat_router
from .inventory import router as inventory_router
from .market_search_scraping import router as market_search_scraping_router
try:
    from .test_apis import router as test_apis_router
except ImportError:
    test_apis_router = None 