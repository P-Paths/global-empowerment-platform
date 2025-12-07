"""
Real Car Scraper - Gets actual live data from marketplaces
"""

import aiohttp
import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import re
from bs4 import BeautifulSoup
import json

logger = logging.getLogger(__name__)

class RealCarScraper:
    """
    Real scraper that gets live car data from multiple sources
    """
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        # SSL context to handle certificate issues
        import ssl
        self.ssl_context = ssl.create_default_context()
        self.ssl_context.check_hostname = False
        self.ssl_context.verify_mode = ssl.CERT_NONE
    
    async def __aenter__(self):
        import aiohttp
        connector = aiohttp.TCPConnector(ssl=self.ssl_context)
        self.session = aiohttp.ClientSession(headers=self.headers, connector=connector)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def scrape_ebay_motors(self, search_term: str, max_results: int = 20) -> List[Dict[str, Any]]:
        """
        Scrape real eBay Motors listings with actual vehicle posting URLs
        """
        try:
            if not self.session:
                raise RuntimeError("Session not initialized")
            
            # eBay Motors search URL
            base_url = "https://www.ebay.com/sch/Cars-Trucks/6001/i.html"
            params = {
                '_nkw': search_term,
                '_sop': '12',  # Sort by newly listed
                '_ipg': '50'   # Items per page
            }
            
            async with self.session.get(base_url, params=params) as response:
                if response.status != 200:
                    logger.error(f"eBay request failed: {response.status}")
                    return []
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                results = []
                items = soup.select('.s-item')
                
                for item in items[:max_results]:
                    try:
                        # Extract data
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
                        
                        # Clean up the URL to ensure it's a direct eBay listing URL
                        if url and 'ebay.com' in url:
                            # Remove any tracking parameters
                            if '?' in url:
                                url = url.split('?')[0]
                        
                        # Extract price
                        price = self._extract_price(price_text)
                        
                        # Extract car details from title
                        car_info = self._parse_car_title(title)
                        
                        # Extract mileage from description
                        mileage = self._extract_mileage(title)
                        
                        # Calculate deal score
                        deal_score = self._calculate_deal_score(price, car_info, mileage)
                        
                        result = {
                            "id": f"ebay_{len(results)}",
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
                            "deal_score": deal_score,
                            "potential_profit": 0,  # Will be calculated by valuation agent
                            "seller_motivation": "unknown",
                            "urgency_indicators": [],
                            "scraped_at": datetime.now().isoformat(),
                            "is_direct_listing": True  # This is a direct listing URL
                        }
                        
                        results.append(result)
                        
                    except Exception as e:
                        logger.error(f"Error parsing eBay item: {e}")
                        continue
                
                logger.info(f"Scraped {len(results)} cars from eBay Motors")
                return results
                
        except Exception as e:
            logger.error(f"eBay scraping error: {e}")
            return []
    
    async def scrape_cargurus(self, search_term: str, max_results: int = 20) -> List[Dict[str, Any]]:
        """
        Scrape CarGurus listings
        """
        try:
            if not self.session:
                raise RuntimeError("Session not initialized")
            
            # CarGurus search URL
            base_url = "https://www.cargurus.com/Cars/searchresults.action"
            params = {
                'search': search_term,
                'sortType': 'NEWEST_FIRST'
            }
            
            async with self.session.get(base_url, params=params) as response:
                if response.status != 200:
                    logger.error(f"CarGurus request failed: {response.status}")
                    return []
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                results = []
                items = soup.select('[data-cg-ft="car-blade"]')
                
                for item in items[:max_results]:
                    try:
                        # Extract data from CarGurus
                        title_elem = item.select_one('[data-cg-ft="car-blade-title"]')
                        price_elem = item.select_one('[data-cg-ft="car-blade-price"]')
                        mileage_elem = item.select_one('[data-cg-ft="car-blade-mileage"]')
                        
                        if not all([title_elem, price_elem]):
                            continue
                        
                        title = title_elem.get_text(strip=True)
                        price_text = price_elem.get_text(strip=True)
                        mileage_text = mileage_elem.get_text(strip=True) if mileage_elem else ""
                        
                        price = self._extract_price(price_text)
                        mileage = self._extract_mileage(mileage_text)
                        car_info = self._parse_car_title(title)
                        
                        deal_score = self._calculate_deal_score(price, car_info, mileage)
                        
                        result = {
                            "id": f"cargurus_{len(results)}",
                            "title": title,
                            "make": car_info.get("make", ""),
                            "model": car_info.get("model", ""),
                            "year": car_info.get("year", 0),
                            "price": price,
                            "mileage": mileage,
                            "condition": car_info.get("condition", "unknown"),
                            "location": "Unknown",
                            "url": "",
                            "source": "cargurus",
                            "deal_score": deal_score,
                            "potential_profit": 0,
                            "seller_motivation": "unknown",
                            "urgency_indicators": [],
                            "scraped_at": datetime.now().isoformat()
                        }
                        
                        results.append(result)
                        
                    except Exception as e:
                        logger.error(f"Error parsing CarGurus item: {e}")
                        continue
                
                logger.info(f"Scraped {len(results)} cars from CarGurus")
                return results
                
        except Exception as e:
            logger.error(f"CarGurus scraping error: {e}")
            return []
    
    async def scrape_cars_com(self, search_term: str, max_results: int = 20) -> List[Dict[str, Any]]:
        """
        Scrape Cars.com listings with actual vehicle posting URLs
        """
        try:
            if not self.session:
                raise RuntimeError("Session not initialized")
            
            # Cars.com search URL
            base_url = "https://www.cars.com/shopping/results/"
            params = {
                'keyword': search_term,
                'sort': 'newest',
                'page_size': '50'
            }
            
            async with self.session.get(base_url, params=params) as response:
                if response.status != 200:
                    logger.error(f"Cars.com request failed: {response.status}")
                    return []
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                results = []
                items = soup.select('[data-qa="vehicle-card"]')
                
                for item in items[:max_results]:
                    try:
                        # Extract data from Cars.com
                        title_elem = item.select_one('[data-qa="vehicle-card-title"]')
                        price_elem = item.select_one('[data-qa="vehicle-card-price"]')
                        url_elem = item.select_one('a[data-qa="vehicle-card-link"]')
                        mileage_elem = item.select_one('[data-qa="vehicle-card-mileage"]')
                        location_elem = item.select_one('[data-qa="vehicle-card-location"]')
                        image_elem = item.select_one('[data-qa="vehicle-card-image"] img')
                        
                        if not all([title_elem, price_elem, url_elem]):
                            continue
                        
                        title = title_elem.get_text(strip=True)
                        price_text = price_elem.get_text(strip=True)
                        url = url_elem.get('href', '')
                        mileage_text = mileage_elem.get_text(strip=True) if mileage_elem else ""
                        location = location_elem.get_text(strip=True) if location_elem else "Unknown"
                        image_url = image_elem.get('src', '') if image_elem else ''
                        
                        # Make URL absolute if it's relative
                        if url and not url.startswith('http'):
                            url = f"https://www.cars.com{url}"
                        
                        price = self._extract_price(price_text)
                        mileage = self._extract_mileage(mileage_text)
                        car_info = self._parse_car_title(title)
                        
                        deal_score = self._calculate_deal_score(price, car_info, mileage)
                        
                        result = {
                            "id": f"cars_com_{len(results)}",
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
                            "source": "Cars.com",
                            "deal_score": deal_score,
                            "potential_profit": 0,
                            "seller_motivation": "unknown",
                            "urgency_indicators": [],
                            "scraped_at": datetime.now().isoformat(),
                            "is_direct_listing": True
                        }
                        
                        results.append(result)
                        
                    except Exception as e:
                        logger.error(f"Error parsing Cars.com item: {e}")
                        continue
                
                logger.info(f"Scraped {len(results)} cars from Cars.com")
                return results
                
        except Exception as e:
            logger.error(f"Cars.com scraping error: {e}")
            return []
    
    async def scrape_google_car_listings(self, search_term: str, max_results: int = 20) -> List[Dict[str, Any]]:
        """
        Scrape Google search results for car listings from various marketplaces
        """
        try:
            if not self.session:
                raise RuntimeError("Session not initialized")
            
            # Google search URL for car listings
            base_url = "https://www.google.com/search"
            params = {
                'q': f'{search_term} car for sale site:ebay.com OR site:cargurus.com OR site:autotrader.com OR site:cars.com OR site:facebook.com/marketplace',
                'num': '20',
                'tbm': 'shop'  # Shopping results
            }
            
            async with self.session.get(base_url, params=params) as response:
                if response.status != 200:
                    logger.error(f"Google search request failed: {response.status}")
                    return []
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                results = []
                items = soup.select('.sh-dgr__content')
                
                for item in items[:max_results]:
                    try:
                        # Extract data from Google shopping results
                        title_elem = item.select_one('.sh-dgr__title')
                        price_elem = item.select_one('.a8Pemb')
                        link_elem = item.select_one('a')
                        
                        if not all([title_elem, price_elem, link_elem]):
                            continue
                        
                        title = title_elem.get_text(strip=True)
                        price_text = price_elem.get_text(strip=True)
                        url = link_elem.get('href', '')
                        
                        # Clean up Google redirect URL
                        if url.startswith('/url?q='):
                            url = url.split('/url?q=')[1].split('&')[0]
                        
                        price = self._extract_price(price_text)
                        car_info = self._parse_car_title(title)
                        mileage = self._extract_mileage(title)
                        
                        # Determine source from URL
                        source = "google_search"
                        if "ebay.com" in url:
                            source = "ebay_motors"
                        elif "cargurus.com" in url:
                            source = "cargurus"
                        elif "autotrader.com" in url:
                            source = "autotrader"
                        elif "cars.com" in url:
                            source = "cars_com"
                        elif "facebook.com" in url:
                            source = "facebook_marketplace"
                        
                        deal_score = self._calculate_deal_score(price, car_info, mileage)
                        
                        result = {
                            "id": f"google_{len(results)}",
                            "title": title,
                            "make": car_info.get("make", ""),
                            "model": car_info.get("model", ""),
                            "year": car_info.get("year", 0),
                            "price": price,
                            "mileage": mileage,
                            "condition": car_info.get("condition", "unknown"),
                            "location": "Unknown",
                            "url": url,
                            "source": source,
                            "deal_score": deal_score,
                            "potential_profit": 0,
                            "seller_motivation": "unknown",
                            "urgency_indicators": [],
                            "scraped_at": datetime.now().isoformat()
                        }
                        
                        results.append(result)
                        
                    except Exception as e:
                        logger.error(f"Error parsing Google search item: {e}")
                        continue
                
                logger.info(f"Scraped {len(results)} cars from Google search")
                return results
                
        except Exception as e:
            logger.error(f"Google search scraping error: {e}")
            return []
    
    async def scrape_all_sources(self, search_term: str, max_results_per_source: int = 5) -> List[Dict[str, Any]]:
        """
        Scrape all available sources and return combined results with direct listing URLs
        """
        try:
            all_results = []
            
            # Scrape from multiple sources in parallel
            tasks = [
                self.scrape_ebay_motors(search_term, max_results_per_source),
                self.scrape_cars_com(search_term, max_results_per_source),
                self.scrape_cargurus(search_term, max_results_per_source)
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result_set in results:
                if isinstance(result_set, list):
                    all_results.extend(result_set)
                elif isinstance(result_set, Exception):
                    logger.error(f"Scraping task failed: {result_set}")
            
            # Sort by deal score (best deals first)
            all_results.sort(key=lambda x: x.get('deal_score', 0), reverse=True)
            
            # Limit total results
            final_results = all_results[:max_results_per_source * 3]
            
            logger.info(f"Scraped {len(final_results)} total listings from all sources")
            return final_results
            
        except Exception as e:
            logger.error(f"Error scraping all sources: {e}")
            return []
    
    def _extract_price(self, price_text: str) -> int:
        """Extract price from text"""
        try:
            # Remove currency symbols and commas
            price_str = re.sub(r'[^\d]', '', price_text)
            return int(price_str) if price_str else 0
        except:
            return 0
    
    def _extract_mileage(self, text: str) -> int:
        """Extract mileage from text"""
        try:
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
            # Common patterns
            year_pattern = r'\b(19|20)\d{2}\b'
            make_pattern = r'\b(Honda|Toyota|Ford|Chevrolet|BMW|Mercedes|Audi|Lexus|Nissan|Hyundai|Kia|Mazda|Subaru|Volkswagen)\b'
            
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
real_scraper = RealCarScraper() 