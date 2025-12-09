"""
Global Empowerment Platform (GEP) Database Models
"""
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey, DECIMAL, ARRAY, JSON, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid


class GEPMember(Base):
    """Member profile with business information"""
    __tablename__ = "gep_members"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, unique=True)
    business_name = Column(String(255))
    business_type = Column(String(100))
    industry = Column(String(100))
    city = Column(String(100))
    state = Column(String(50))
    skills = Column(ARRAY(String))
    services = Column(ARRAY(String))
    products_count = Column(Integer, default=0)
    followers_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    bio = Column(Text)
    website_url = Column(String(500))
    linkedin_url = Column(String(500))
    instagram_handle = Column(String(100))
    tiktok_handle = Column(String(100))
    youtube_channel = Column(String(200))
    funding_readiness_score = Column(Integer, default=0)
    funding_status = Column(String(20), default='Building')
    profile_image_url = Column(String(500))
    cover_image_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    posts = relationship("GEPPost", back_populates="member", cascade="all, delete-orphan")
    products = relationship("GEPProduct", back_populates="member", cascade="all, delete-orphan")
    growth_metrics = relationship("GEPGrowthMetric", back_populates="member", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint('funding_readiness_score >= 0 AND funding_readiness_score <= 100', name='check_funding_score_range'),
        CheckConstraint("funding_status IN ('Building', 'Emerging', 'VC-Ready')", name='check_funding_status'),
    )


class GEPPost(Base):
    """Community feed posts"""
    __tablename__ = "gep_posts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_id = Column(UUID(as_uuid=True), ForeignKey("gep_members.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text)
    image_urls = Column(ARRAY(String))
    video_url = Column(String(500))
    video_thumbnail_url = Column(String(500))
    post_type = Column(String(20), default='text')
    hashtags = Column(ARRAY(String))
    mentions = Column(ARRAY(String))
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    shares_count = Column(Integer, default=0)
    views_count = Column(Integer, default=0)
    posted_to_facebook = Column(Boolean, default=False)
    posted_to_instagram = Column(Boolean, default=False)
    posted_to_tiktok = Column(Boolean, default=False)
    posted_to_youtube = Column(Boolean, default=False)
    facebook_post_id = Column(String(200))
    instagram_post_id = Column(String(200))
    tiktok_post_id = Column(String(200))
    youtube_video_id = Column(String(200))
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    member = relationship("GEPMember", back_populates="posts")
    likes = relationship("GEPPostLike", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("GEPPostComment", back_populates="post", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint("post_type IN ('text', 'image', 'video', 'carousel')", name='check_post_type'),
    )


class GEPPostLike(Base):
    """Post likes"""
    __tablename__ = "gep_post_likes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id = Column(UUID(as_uuid=True), ForeignKey("gep_posts.id", ondelete="CASCADE"), nullable=False)
    member_id = Column(UUID(as_uuid=True), ForeignKey("gep_members.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    post = relationship("GEPPost", back_populates="likes")
    
    __table_args__ = (
        UniqueConstraint('post_id', 'member_id', name='unique_post_like'),
    )


class GEPPostComment(Base):
    """Post comments"""
    __tablename__ = "gep_post_comments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id = Column(UUID(as_uuid=True), ForeignKey("gep_posts.id", ondelete="CASCADE"), nullable=False)
    member_id = Column(UUID(as_uuid=True), ForeignKey("gep_members.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    likes_count = Column(Integer, default=0)
    parent_comment_id = Column(UUID(as_uuid=True), ForeignKey("gep_post_comments.id", ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    post = relationship("GEPPost", back_populates="comments")


class GEPProduct(Base):
    """Member products"""
    __tablename__ = "gep_products"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_id = Column(UUID(as_uuid=True), ForeignKey("gep_members.id", ondelete="CASCADE"), nullable=False)
    sku = Column(String(100))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    price = Column(DECIMAL(10, 2))
    price_range_min = Column(DECIMAL(10, 2))
    price_range_max = Column(DECIMAL(10, 2))
    category = Column(String(100))
    image_urls = Column(ARRAY(String))
    video_url = Column(String(500))
    target_audience = Column(Text)
    status = Column(String(20), default='draft')
    views_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    member = relationship("GEPMember", back_populates="products")
    
    __table_args__ = (
        CheckConstraint("status IN ('draft', 'published', 'sold', 'archived')", name='check_product_status'),
    )


class GEPGrowthMetric(Base):
    """Daily/weekly growth metrics"""
    __tablename__ = "gep_growth_metrics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_id = Column(UUID(as_uuid=True), ForeignKey("gep_members.id", ondelete="CASCADE"), nullable=False)
    metric_date = Column(DateTime(timezone=True), nullable=False)
    posts_count = Column(Integer, default=0)
    likes_received = Column(Integer, default=0)
    comments_received = Column(Integer, default=0)
    shares_received = Column(Integer, default=0)
    new_followers = Column(Integer, default=0)
    engagement_rate = Column(DECIMAL(5, 2))
    reach = Column(Integer, default=0)
    impressions = Column(Integer, default=0)
    products_uploaded = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    member = relationship("GEPMember", back_populates="growth_metrics")
    
    __table_args__ = (
        UniqueConstraint('member_id', 'metric_date', name='unique_member_metric_date'),
    )


class GEPGrowthTask(Base):
    """AI Growth Coach tasks"""
    __tablename__ = "gep_growth_tasks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_id = Column(UUID(as_uuid=True), ForeignKey("gep_members.id", ondelete="CASCADE"), nullable=False)
    task_type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    priority = Column(String(20), default='medium')
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True))
    due_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        CheckConstraint("priority IN ('low', 'medium', 'high')", name='check_task_priority'),
    )


class GEPUserStreaks(Base):
    """User streaks for gamification"""
    __tablename__ = "gep_user_streaks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_id = Column(UUID(as_uuid=True), ForeignKey("gep_members.id", ondelete="CASCADE"), nullable=False)
    streak_type = Column(String(50), nullable=False)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_activity_date = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        UniqueConstraint('member_id', 'streak_type', name='unique_member_streak_type'),
    )


class GEPMemberFollows(Base):
    """Member follow relationships"""
    __tablename__ = "gep_member_follows"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    follower_id = Column(UUID(as_uuid=True), ForeignKey("gep_members.id", ondelete="CASCADE"), nullable=False)
    following_id = Column(UUID(as_uuid=True), ForeignKey("gep_members.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint('follower_id', 'following_id', name='unique_follow_relationship'),
        CheckConstraint('follower_id != following_id', name='check_no_self_follow'),
    )


class GEPMessage(Base):
    """Direct messages (legacy GEP model)"""
    __tablename__ = "gep_messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("gep_members.id", ondelete="CASCADE"), nullable=False)
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("gep_members.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        CheckConstraint('sender_id != recipient_id', name='check_no_self_message'),
    )


# ============================================
# GEM PLATFORM MVP MODELS
# ============================================

class Profile(Base):
    """User profiles - GEM Platform MVP"""
    __tablename__ = "profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, unique=True)
    full_name = Column(Text)
    avatar_url = Column(Text)
    bio = Column(Text)
    city = Column(Text)
    state = Column(Text)
    business_name = Column(Text)
    business_category = Column(Text)
    skills = Column(ARRAY(String), default=[])
    followers_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    funding_score = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    funding_score_logs = relationship("FundingScoreLog", back_populates="user", cascade="all, delete-orphan")
    persona_clones = relationship("PersonaClone", back_populates="user", cascade="all, delete-orphan")
    pitchdecks = relationship("PitchDeck", back_populates="user", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint('funding_score >= 0 AND funding_score <= 100', name='check_funding_score_range'),
    )


class Post(Base):
    """Social feed posts - GEM Platform MVP"""
    __tablename__ = "posts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text)
    media_url = Column(Text)
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("Profile", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")


class Comment(Base):
    """Post comments - GEM Platform MVP"""
    __tablename__ = "comments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id = Column(UUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    post = relationship("Post", back_populates="comments")
    user = relationship("Profile", back_populates="comments")


class Follower(Base):
    """Follower relationships - GEM Platform MVP"""
    __tablename__ = "followers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    follower_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    following_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint('follower_id', 'following_id', name='unique_follower_relationship'),
        CheckConstraint('follower_id != following_id', name='check_no_self_follow'),
    )


class Message(Base):
    """Direct messages - GEM Platform MVP"""
    __tablename__ = "messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        CheckConstraint('sender_id != receiver_id', name='check_no_self_message'),
    )


class Task(Base):
    """AI Growth Coach tasks - GEM Platform MVP"""
    __tablename__ = "tasks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    title = Column(Text, nullable=False)
    description = Column(Text)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("Profile", back_populates="tasks")


class FundingScoreLog(Base):
    """Funding readiness score logs - GEM Platform MVP"""
    __tablename__ = "funding_score_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    score = Column(Integer, nullable=False)
    details = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("Profile", back_populates="funding_score_logs")
    
    __table_args__ = (
        CheckConstraint('score >= 0 AND score <= 100', name='check_score_range'),
    )


class PersonaClone(Base):
    """Persona Clone Studio - GEM Platform MVP"""
    __tablename__ = "persona_clones"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    title = Column(Text, nullable=False)
    prompt = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("Profile", back_populates="persona_clones")


class PitchDeck(Base):
    """Pitch Deck Generator - GEM Platform MVP"""
    __tablename__ = "pitchdecks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    deck_json = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("Profile", back_populates="pitchdecks")