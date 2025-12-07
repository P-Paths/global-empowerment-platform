"""
ScrapingBee Service - Professional web scraping for car listings
"""

import aiohttp
import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class ScrapingBeeService:
    """
    Professional web scraping service for car listings
    """
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or "YOUR_SCRAPINGBEE_API_KEY"  # Replace with actual key
        self.base_url = "https://app.scrapingbee.com/api/v1/"
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def scrape_ebay_motors(self, search_term: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """
        Scrape eBay Motors using ScrapingBee
        """
        try:
            if not self.session:
                raise RuntimeError("Session not initialized")
            
            # eBay Motors search URL
            ebay_url = f"https://www.ebay.com/sch/Cars-Trucks/6001/i.html?_nkw={search_term.replace(' ', '+')}"
            
            # ScrapingBee parameters
            params = {
                'api_key': self.api_key,
                'url': ebay_url,
                'render_js': 'true',  # Handle JavaScript
                'premium_proxy': 'true',  # Use premium proxies
                'country_code': 'us',
                'wait': 3000,  # Wait 3 seconds for page to load
                'wait_for': '.s-item'  # Wait for car listings to load
            }
            
            async with self.session.get(self.base_url, params=params) as response:
                if response.status != 200:
                    logger.error(f"ScrapingBee request failed: {response.status}")
                    return []
                
                html = await response.text()
                
                # Parse the HTML to extract car listings
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(html, 'html.parser')
                
                results = []
                items = soup.select('.s-item')
                
                for item in items[:max_results]:
                    try:
                        # Extract data from eBay listing
                        title_elem = item.select_one('.s-item__title')
                        price_elem = item.select_one('.s-item__price')
                        url_elem = item.select_one('.s-item__link')
                        location_elem = item.select_one('.s-item__location')
                        image_elem = item.select_one('.s-item__image img')
                        
                        if not all([title_elem, price_elem, url_elem]):
                            continue
                        
                        title = title_elem.get_text(strip=True)
                        price_text = price_elem.get_text(strip=True)
                        url = url_elem.get('href', '')
                        location = location_elem.get_text(strip=True) if location_elem else "Unknown"
                        image_url = image_elem.get('src', '') if image_elem else ''
                        
                        # Extract price
                        price = self._extract_price(price_text)
                        
                        # Extract car details
                        car_info = self._parse_car_title(title)
                        mileage = self._extract_mileage(title)
                        
                        result = {
                            "id": f"ebay_sb_{len(results)}",
                            "title": title,
                            "make": car_info.get("make", ""),
                            "model": car_info.get("model", ""),
                            "year": car_info.get("year", 0),
                            "price": price,
                            "mileage": mileage,
                            "condition": car_info.get("condition", "unknown"),
                            "location": location,
                            "url": url,
                            "image_url": image_url,
                            "source": "eBay Motors",
                            "deal_score": self._calculate_deal_score(price, car_info, mileage),
                            "potential_profit": 0,
                            "seller_motivation": "unknown",
                            "urgency_indicators": [],
                            "scraped_at": datetime.now().isoformat(),
                            "is_direct_listing": True
                        }
                        
                        results.append(result)
                        
                    except Exception as e:
                        logger.error(f"Error parsing eBay item: {e}")
                        continue
                
                logger.info(f"ScrapingBee scraped {len(results)} cars from eBay Motors")
                return results
                
        except Exception as e:
            logger.error(f"ScrapingBee eBay scraping error: {e}")
            return []
    
    async def scrape_cargurus(self, search_term: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """
        Scrape CarGurus using ScrapingBee
        """
        try:
            if not self.session:
                raise RuntimeError("Session not initialized")
            
            # CarGurus search URL
            cargurus_url = f"https://www.cargurus.com/Cars/searchresults.action?search={search_term.replace(' ', '+')}"
            
            # ScrapingBee parameters
            params = {
                'api_key': self.api_key,
                'url': cargurus_url,
                'render_js': 'true',
                'premium_proxy': 'true',
                'country_code': 'us',
                'wait': 5000,  # Wait 5 seconds for CarGurus to load
                'wait_for': '[data-cg-ft="car-blade"]'  # Wait for car listings
            }
            
            async with self.session.get(self.base_url, params=params) as response:
                if response.status != 200:
                    logger.error(f"ScrapingBee CarGurus request failed: {response.status}")
                    return []
                
                html = await response.text()
                
                # Parse CarGurus HTML
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(html, 'html.parser')
                
                results = []
                items = soup.select('[data-cg-ft="car-blade"]')
                
                for item in items[:max_results]:
                    try:
                        # Extract CarGurus data
                        title_elem = item.select_one('[data-cg-ft="car-blade-title"]')
                        price_elem = item.select_one('[data-cg-ft="car-blade-price"]')
                        mileage_elem = item.select_one('[data-cg-ft="car-blade-mileage"]')
                        url_elem = item.select_one('a[data-cg-ft="car-blade-link"]')
                        
                        if not all([title_elem, price_elem, url_elem]):
                            continue
                        
                        title = title_elem.get_text(strip=True)
                        price_text = price_elem.get_text(strip=True)
                        mileage_text = mileage_elem.get_text(strip=True) if mileage_elem else ""
                        url = url_elem.get('href', '')
                        
                        # Make URL absolute
                        if url and not url.startswith('http'):
                            url = f"https://www.cargurus.com{url}"
                        
                        price = self._extract_price(price_text)
                        mileage = self._extract_mileage(mileage_text)
                        car_info = self._parse_car_title(title)
                        
                        result = {
                            "id": f"cargurus_sb_{len(results)}",
                            "title": title,
                            "make": car_info.get("make", ""),
                            "model": car_info.get("model", ""),
                            "year": car_info.get("year", 0),
                            "price": price,
                            "mileage": mileage,
                            "condition": car_info.get("condition", "unknown"),
                            "location": "Unknown",
                            "url": url,
                            "image_url": "",
                            "source": "CarGurus",
                            "deal_score": self._calculate_deal_score(price, car_info, mileage),
                            "potential_profit": 0,
                            "seller_motivation": "unknown",
                            "urgency_indicators": [],
                            "scraped_at": datetime.now().isoformat(),
                            "is_direct_listing": True
                        }
                        
                        results.append(result)
                        
                    except Exception as e:
                        logger.error(f"Error parsing CarGurus item: {e}")
                        continue
                
                logger.info(f"ScrapingBee scraped {len(results)} cars from CarGurus")
                return results
                
        except Exception as e:
            logger.error(f"ScrapingBee CarGurus scraping error: {e}")
            return []
    
    async def scrape_all_sources(self, search_term: str, max_results_per_source: int = 5) -> List[Dict[str, Any]]:
        """
        Scrape all sources using ScrapingBee
        """
        try:
            all_results = []
            
            # Scrape from multiple sources in parallel
            tasks = [
                self.scrape_ebay_motors(search_term, max_results_per_source),
                self.scrape_cargurus(search_term, max_results_per_source)
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result_set in results:
                if isinstance(result_set, list):
                    all_results.extend(result_set)
                elif isinstance(result_set, Exception):
                    logger.error(f"ScrapingBee task failed: {result_set}")
            
            # Sort by deal score (best deals first)
            all_results.sort(key=lambda x: x.get('deal_score', 0), reverse=True)
            
            # Limit total results
            final_results = all_results[:max_results_per_source * 2]
            
            logger.info(f"ScrapingBee scraped {len(final_results)} total listings from all sources")
            return final_results
            
        except Exception as e:
            logger.error(f"Error scraping all sources with ScrapingBee: {e}")
            return []
    
    def _extract_price(self, price_text: str) -> int:
        """Extract price from text"""
        try:
            import re
            # Remove currency symbols and commas
            price_str = re.sub(r'[^\d]', '', price_text)
            return int(price_str) if price_str else 0
        except:
            return 0
    
    def _extract_mileage(self, text: str) -> int:
        """Extract mileage from text"""
        try:
            import re
            # Look for mileage patterns
            mileage_match = re.search(r'(\d{1,3}(?:,\d{3})*)\s*(?:miles?|mi)', text, re.IGNORECASE)
            if mileage_match:
                mileage_str = mileage_match.group(1).replace(',', '')
                return int(mileage_str)
            return 0
        except:
            return 0
    
    def _parse_car_title(self, title: str) -> Dict[str, Any]:
        """Parse car details from title"""
        try:
            import re
            # Common patterns
            year_pattern = r'\b(19|20)\d{2}\b'
            make_pattern = r'\b(Honda|Toyota|Ford|Chevrolet|BMW|Mercedes|Audi|Lexus|Nissan|Hyundai|Kia|Mazda|Subaru|Volkswagen|Chrysler)\b'
            
            year_match = re.search(year_pattern, title)
            make_match = re.search(make_pattern, title, re.IGNORECASE)
            
            year = int(year_match.group()) if year_match else 0
            make = make_match.group() if make_match else ""
            
            # Extract model (simplified)
            model = ""
            if make:
                # Remove make and year from title to get model
                model_text = title.replace(str(year), "").replace(make, "").strip()
                model = model_text.split()[0] if model_text else ""
            
            # Determine condition from keywords
            condition = "unknown"
            if any(word in title.lower() for word in ["excellent", "mint", "perfect"]):
                condition = "excellent"
            elif any(word in title.lower() for word in ["good", "clean", "well maintained"]):
                condition = "good"
            elif any(word in title.lower() for word in ["fair", "decent", "ok"]):
                condition = "fair"
            elif any(word in title.lower() for word in ["poor", "rough", "needs work"]):
                condition = "poor"
            
            return {
                "year": year,
                "make": make,
                "model": model,
                "condition": condition
            }
            
        except Exception as e:
            logger.error(f"Error parsing car title: {e}")
            return {"year": 0, "make": "", "model": "", "condition": "unknown"}
    
    def _calculate_deal_score(self, price: int, car_info: Dict[str, Any], mileage: int) -> float:
        """Calculate initial deal score"""
        try:
            score = 0.5  # Base score
            
            # Price factor (lower price = higher score)
            if price > 0:
                # Simple heuristic: lower price relative to year = better deal
                year = car_info.get("year", 0)
                if year > 0:
                    avg_price_per_year = price / (2024 - year)
                    if avg_price_per_year < 1000:
                        score += 0.2
                    elif avg_price_per_year < 2000:
                        score += 0.1
            
            # Mileage factor (lower mileage = higher score)
            if mileage > 0:
                if mileage < 50000:
                    score += 0.2
                elif mileage < 100000:
                    score += 0.1
                elif mileage > 200000:
                    score -= 0.1
            
            # Condition factor
            condition = car_info.get("condition", "unknown")
            condition_scores = {"excellent": 0.2, "good": 0.1, "fair": 0.0, "poor": -0.1}
            score += condition_scores.get(condition, 0.0)
            
            return max(0.0, min(1.0, score))
            
        except:
            return 0.5

# Global instance
scrapingbee_service = ScrapingBeeService()
