"""
Scraping Service - Orchestrates Scrapy spiders for car data
"""

import asyncio
import logging
import subprocess
import json
import tempfile
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)


class ScrapingService:
    """
    Service to orchestrate Scrapy spiders for car data scraping
    """
    
    def __init__(self):
        self.scrapy_project_path = Path(__file__).parent.parent.parent / "accorria_scraper"
        self.temp_dir = tempfile.gettempdir()
    
    async def search_cars(
        self, 
        search_term: str, 
        max_results: int = 20,
        sources: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for cars across multiple sources using Scrapy spiders
        
        Args:
            search_term: Search term (e.g., "2015 Audi A8")
            max_results: Maximum number of results to return
            sources: List of sources to search (e.g., ['ebay', 'cargurus'])
        
        Returns:
            List of car listing dictionaries
        """
        if sources is None:
            sources = ['ebay', 'cargurus']
        
        logger.info(f"Starting car search for: {search_term}")
        
        # Run spiders in parallel
        tasks = []
        for source in sources:
            if source == 'ebay':
                tasks.append(self._run_ebay_spider(search_term, max_results // len(sources)))
            elif source == 'cargurus':
                tasks.append(self._run_cargurus_spider(search_term, max_results // len(sources)))
        
        # Wait for all spiders to complete
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Combine and clean results
        all_results = []
        for result in results:
            if isinstance(result, list):
                all_results.extend(result)
            elif isinstance(result, Exception):
                logger.error(f"Spider error: {result}")
        
        # Sort by deal score and limit results
        all_results.sort(key=lambda x: x.get('deal_score', 0.5), reverse=True)
        return all_results[:max_results]
    
    async def _run_ebay_spider(self, search_term: str, max_results: int) -> List[Dict[str, Any]]:
        """Run eBay spider and return results"""
        try:
            logger.info(f"Running eBay spider for: {search_term}")
            
            # Create temporary output file
            output_file = os.path.join(self.temp_dir, f"ebay_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
            
            # Build scrapy command
            cmd = [
                'scrapy', 'crawl', 'ebay_cars',
                '-a', f'search_term={search_term}',
                '-a', f'max_results={max_results}',
                '-o', output_file,
                '-s', 'LOG_LEVEL=INFO'
            ]
            
            # Run spider
            process = await asyncio.create_subprocess_exec(
                *cmd,
                cwd=self.scrapy_project_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                logger.error(f"eBay spider failed: {stderr.decode()}")
                return []
            
            # Read results from output file
            if os.path.exists(output_file):
                with open(output_file, 'r', encoding='utf-8') as f:
                    results = json.load(f)
                
                # Clean up temp file
                os.remove(output_file)
                
                logger.info(f"eBay spider found {len(results)} results")
                return results
            else:
                logger.warning("eBay spider output file not found")
                return []
                
        except Exception as e:
            logger.error(f"Error running eBay spider: {e}")
            return []
    
    async def _run_cargurus_spider(self, search_term: str, max_results: int) -> List[Dict[str, Any]]:
        """Run CarGurus spider and return results"""
        try:
            logger.info(f"Running CarGurus spider for: {search_term}")
            
            # Create temporary output file
            output_file = os.path.join(self.temp_dir, f"cargurus_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
            
            # Build scrapy command
            cmd = [
                'scrapy', 'crawl', 'cargurus_cars',
                '-a', f'search_term={search_term}',
                '-a', f'max_results={max_results}',
                '-o', output_file,
                '-s', 'LOG_LEVEL=INFO'
            ]
            
            # Run spider
            process = await asyncio.create_subprocess_exec(
                *cmd,
                cwd=self.scrapy_project_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                logger.error(f"CarGurus spider failed: {stderr.decode()}")
                return []
            
            # Read results from output file
            if os.path.exists(output_file):
                with open(output_file, 'r', encoding='utf-8') as f:
                    results = json.load(f)
                
                # Clean up temp file
                os.remove(output_file)
                
                logger.info(f"CarGurus spider found {len(results)} results")
                return results
            else:
                logger.warning("CarGurus spider output file not found")
                return []
                
        except Exception as e:
            logger.error(f"Error running CarGurus spider: {e}")
            return []
    
    async def get_spider_status(self) -> Dict[str, Any]:
        """Get status of all spiders"""
        return {
            'ebay_spider': {
                'status': 'ready',
                'description': 'eBay Motors car listings spider'
            },
            'cargurus_spider': {
                'status': 'ready',
                'description': 'CarGurus car listings spider with 404 fallback'
            }
        }
    
    async def test_spider(self, spider_name: str, search_term: str = "2015 Honda Civic") -> Dict[str, Any]:
        """Test a specific spider with a sample search"""
        try:
            if spider_name == 'ebay':
                results = await self._run_ebay_spider(search_term, 5)
            elif spider_name == 'cargurus':
                results = await self._run_cargurus_spider(search_term, 5)
            else:
                return {'error': f'Unknown spider: {spider_name}'}
            
            return {
                'spider': spider_name,
                'search_term': search_term,
                'results_count': len(results),
                'sample_results': results[:2] if results else [],
                'status': 'success'
            }
            
        except Exception as e:
            return {
                'spider': spider_name,
                'error': str(e),
                'status': 'error'
            }


# Global instance
scraping_service = ScrapingService()
