"""
GEP Platform - Facebook Social Posting Service
Simple service for posting social media content to Facebook using Graph API
"""

import logging
import aiohttp
import json
from typing import Dict, Any, Optional
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


async def post_to_facebook(
    user_access_token: str,
    message: str,
    media_url: Optional[str] = None,
    page_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Post content to Facebook using Graph API
    
    Args:
        user_access_token: User's Facebook OAuth2 access token
        message: Text content to post
        media_url: Optional URL to image/video to attach to post
        page_id: Optional page ID to post to (if None, posts to user's timeline)
        
    Returns:
        Dictionary with posting result:
        {
            "success": bool,
            "post_id": str (if successful),
            "post_url": str (if successful),
            "error": str (if failed)
        }
    
    TODO:
        - Add support for uploading local media files (not just URLs)
        - Add support for multiple images (carousel posts)
        - Add support for video uploads
        - Add better error handling for Facebook API errors
        - Add rate limiting handling
    """
    api_version = "v18.0"
    base_url = f"https://graph.facebook.com/{api_version}"
    
    try:
        # Determine target (user timeline or page)
        if page_id:
            # Post to page
            target_id = page_id
            endpoint = f"{base_url}/{page_id}/feed"
        else:
            # Post to user's timeline
            endpoint = f"{base_url}/me/feed"
            target_id = "me"
        
        # Prepare post data
        post_data = {
            "message": message,
            "access_token": user_access_token
        }
        
        # If media_url is provided, attach it to the post
        if media_url:
            # TODO: Validate media URL is accessible
            # TODO: For now, we'll use the 'link' parameter for images
            # In production, you may want to upload the media first using /photos endpoint
            # then attach the photo_id to the post
            
            # Check if it's a direct image URL
            parsed_url = urlparse(media_url)
            if parsed_url.path.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                # Use photos endpoint to upload image, then post
                # For MVP, we'll use the link parameter
                post_data["link"] = media_url
            else:
                # For videos or other media, use link parameter
                post_data["link"] = media_url
        
        # Make POST request to Facebook Graph API
        async with aiohttp.ClientSession() as session:
            async with session.post(endpoint, data=post_data) as response:
                response_data = await response.json()
                
                if response.status == 200 and "id" in response_data:
                    # Success - extract post ID
                    post_id = response_data["id"]
                    
                    # Construct post URL
                    # Format: https://www.facebook.com/{post_id}
                    # For pages: https://www.facebook.com/{page_id}/posts/{post_id}
                    if page_id:
                        post_url = f"https://www.facebook.com/{page_id}/posts/{post_id.split('_')[-1]}"
                    else:
                        # For user timeline posts, we need to get the user ID from the token
                        # For now, use a generic format
                        post_url = f"https://www.facebook.com/{post_id}"
                    
                    return {
                        "success": True,
                        "post_id": post_id,
                        "post_url": post_url,
                        "facebook_response": response_data
                    }
                else:
                    # Error from Facebook API
                    error_message = response_data.get("error", {}).get("message", "Unknown Facebook API error")
                    error_code = response_data.get("error", {}).get("code", response.status)
                    
                    logger.error(f"Facebook API error: {error_code} - {error_message}")
                    
                    return {
                        "success": False,
                        "error": error_message,
                        "error_code": error_code,
                        "facebook_response": response_data
                    }
                    
    except aiohttp.ClientError as e:
        logger.error(f"HTTP error posting to Facebook: {str(e)}")
        return {
            "success": False,
            "error": f"Network error: {str(e)}"
        }
    except Exception as e:
        logger.error(f"Unexpected error posting to Facebook: {str(e)}")
        return {
            "success": False,
            "error": f"Unexpected error: {str(e)}"
        }
