"""
Search History API - Track and retrieve market search history
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime
import json

from app.core.security import get_current_user
from app.core.database import get_db
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

router = APIRouter()


class SearchHistoryRequest(BaseModel):
    searchTerm: str
    location: Optional[str] = "United States"
    radius: Optional[int] = 50
    results: Optional[List[Dict[str, Any]]] = []
    summary: Optional[Dict[str, Any]] = {}


class SearchHistoryResponse(BaseModel):
    success: bool
    message: str
    search_id: Optional[str] = None


class SearchHistoryItem(BaseModel):
    id: str
    searchTerm: str
    location: str
    radius: int
    results: List[Dict[str, Any]]
    summary: Dict[str, Any]
    timestamp: datetime
    user_id: Optional[str] = None


# In-memory storage for demo purposes (replace with database in production)
search_history_storage = []


@router.post("/", response_model=SearchHistoryResponse)
async def save_search_history(
    request: SearchHistoryRequest
):
    """
    Save a market search to history
    """
    try:
        logger.info(f"Saving search history: {request.searchTerm}")
        
        # Generate a simple ID
        search_id = f"search_{len(search_history_storage) + 1}_{int(datetime.now().timestamp())}"
        
        # Create search history item
        history_item = {
            "id": search_id,
            "searchTerm": request.searchTerm,
            "location": request.location,
            "radius": request.radius,
            "results": request.results,
            "summary": request.summary,
            "timestamp": datetime.now(),
            "user_id": None  # No auth for demo
        }
        
        # Store in memory (replace with database in production)
        search_history_storage.append(history_item)
        
        # Keep only last 100 searches to prevent memory issues
        if len(search_history_storage) > 100:
            search_history_storage.pop(0)
        
        return SearchHistoryResponse(
            success=True,
            message="Search saved to history successfully",
            search_id=search_id
        )
        
    except Exception as e:
        logger.error(f"Failed to save search history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save search history: {str(e)}"
        )


@router.get("/", response_model=List[SearchHistoryItem])
async def get_search_history(
    limit: int = Query(20, description="Number of searches to return")
):
    """
    Get search history for the current user
    """
    try:
        logger.info("Retrieving search history")
        
        # For demo purposes, return all searches
        user_searches = search_history_storage
        
        # Sort by timestamp (newest first)
        user_searches.sort(key=lambda x: x["timestamp"], reverse=True)
        
        # Limit results
        user_searches = user_searches[:limit]
        
        # Convert to response format
        history_items = []
        for search in user_searches:
            history_items.append(SearchHistoryItem(
                id=search["id"],
                searchTerm=search["searchTerm"],
                location=search["location"],
                radius=search["radius"],
                results=search["results"],
                summary=search["summary"],
                timestamp=search["timestamp"],
                user_id=search.get("user_id")
            ))
        
        return history_items
        
    except Exception as e:
        logger.error(f"Failed to get search history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get search history: {str(e)}"
        )


@router.get("/{search_id}", response_model=SearchHistoryItem)
async def get_search_by_id(
    search_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific search by ID
    """
    try:
        logger.info(f"Retrieving search by ID: {search_id}")
        
        # Find the search
        search = next((s for s in search_history_storage if s["id"] == search_id), None)
        
        if not search:
            raise HTTPException(
                status_code=404,
                detail="Search not found"
            )
        
        # Check if user has access to this search
        user_id = current_user.get("user_id") if current_user else None
        if user_id and search.get("user_id") != user_id:
            raise HTTPException(
                status_code=403,
                detail="Access denied to this search"
            )
        
        return SearchHistoryItem(
            id=search["id"],
            searchTerm=search["searchTerm"],
            location=search["location"],
            radius=search["radius"],
            results=search["results"],
            summary=search["summary"],
            timestamp=search["timestamp"],
            user_id=search.get("user_id")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get search by ID: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get search: {str(e)}"
        )


@router.delete("/{search_id}", response_model=SearchHistoryResponse)
async def delete_search(
    search_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a search from history
    """
    try:
        logger.info(f"Deleting search: {search_id}")
        
        # Find the search
        search_index = next((i for i, s in enumerate(search_history_storage) if s["id"] == search_id), None)
        
        if search_index is None:
            raise HTTPException(
                status_code=404,
                detail="Search not found"
            )
        
        # Check if user has access to this search
        user_id = current_user.get("user_id") if current_user else None
        search = search_history_storage[search_index]
        if user_id and search.get("user_id") != user_id:
            raise HTTPException(
                status_code=403,
                detail="Access denied to this search"
            )
        
        # Remove the search
        search_history_storage.pop(search_index)
        
        return SearchHistoryResponse(
            success=True,
            message="Search deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete search: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete search: {str(e)}"
        )
