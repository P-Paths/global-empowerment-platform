import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { searchTerm, location, radius } = body;
    
    // Call the actual backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://accorria-backend-19949436301.us-central1.run.app';
    
    try {
      const backendResponse = await fetch(`${backendUrl}/api/v1/market-search/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchTerm: searchTerm,
          location: location,
          radius: radius,
          max_results: 20,
          sources: ['ebay', 'cargurus']
        }),
      });

      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        
        // Transform backend results to frontend format
        const transformedResults = backendData.results.map((result: any, index: number) => ({
          source: result.source,
          price: result.price ? `$${result.price.toLocaleString()}` : 'Price on request',
          location: result.location || 'Various locations',
          mileage: result.mileage ? `${result.mileage.toLocaleString()} miles` : 'Mileage not specified',
          year: result.year || 'Various',
          make: result.make || 'Various',
          model: result.model || 'Various',
          url: result.url || '#',
          image_url: result.primary_image || result.image_urls?.[0] || '',
          distance: `${Math.round(5 + Math.random() * 45)} miles`,
          listingId: result.listing_id || `listing-${index + 1}`,
          description: result.title || `${result.year} ${result.make} ${result.model}`,
          isDirectListing: result.is_direct_listing || false,
          dealScore: result.deal_score || 0.5,
          dealerName: result.seller_name || '',
          vin: result.vin || '',
          exteriorColor: result.exterior_color || '',
          interiorColor: result.interior_color || '',
          fuelType: result.fuel_type || '',
          transmission: result.transmission || '',
          drivetrain: result.drivetrain || '',
          bodyStyle: result.body_style || '',
          engine: result.engine || '',
          mpgCity: result.mpg_city || 0,
          mpgHighway: result.mpg_highway || 0,
          condition: result.condition || 'unknown',
          potentialProfit: result.potential_profit || 0,
          sellerMotivation: result.seller_motivation || 'unknown',
          urgencyIndicators: result.urgency_indicators || [],
          scrapedAt: result.scraped_at || new Date().toISOString()
        }));

        return Response.json({
          success: true,
          results: transformedResults,
          summary: backendData.summary,
          message: backendData.message || "Live data from real marketplace scraping"
        });
      } else {
        console.error('Backend market search failed:', backendResponse.status, await backendResponse.text());
        throw new Error(`Backend returned ${backendResponse.status}`);
      }
    } catch (backendError) {
      console.error('Backend market search error:', backendError);
      
      // Fallback to mock data if backend fails
      const mockResults = generateMockResults(searchTerm);
      
      const mockResponse = {
        success: true,
        results: mockResults,
        summary: {
          totalListings: mockResults.length,
          averagePrice: mockResults.reduce((sum, r) => sum + (r.price || 0), 0) / mockResults.length,
          priceRange: {
            min: Math.min(...mockResults.map(r => r.price || 0)),
            max: Math.max(...mockResults.map(r => r.price || 0))
          },
          sources: [...new Set(mockResults.map(r => r.source))],
          searchTerm: searchTerm,
          isRealData: false,
          isDirectListings: false,
          message: `Fallback mock data: Found ${mockResults.length} sample listings for ${searchTerm}`
        },
        message: `Found ${mockResults.length} sample vehicle listings (fallback data)`
      };
      
      return new Response(JSON.stringify(mockResponse), {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Original backend call code (commented out for demo)
    /*
    // Call the backend API to get real scraped data
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://accorria-backend-19949436301.us-central1.run.app';
    
    // Try the main market search API first
    try {
      const scrapingResponse = await fetch(`${backendUrl}/api/v1/market-search/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchTerm: searchTerm,
          location: location,
          radius: radius,
          max_results: 20,
          sources: ['ebay', 'cargurus']
        }),
      });

      if (scrapingResponse.ok) {
        const scrapingData = await scrapingResponse.json();
        
        if (scrapingData.success && scrapingData.results && scrapingData.results.length > 0) {
          // Transform scraping results to frontend format
          const transformedResults = scrapingData.results.map((result: any, index: number) => ({
            source: result.source,
            price: result.price ? `$${result.price.toLocaleString()}` : 'Price on request',
            location: result.location || 'Various locations',
            mileage: result.mileage ? `${result.mileage.toLocaleString()} miles` : 'Mileage not specified',
            year: result.year || 'Various',
            make: result.make || 'Various',
            model: result.model || 'Various',
            url: result.url,
            image_url: result.primary_image || result.image_urls?.[0] || '',
            distance: `${Math.round(5 + Math.random() * 45)} miles`,
            listingId: result.listing_id || `listing-${index + 1}`,
            description: result.title || `${result.year} ${result.make} ${result.model}`,
            isDirectListing: result.is_direct_listing || false,
            dealScore: result.deal_score || 0.5,
            dealerName: result.seller_name || '',
            vin: result.vin || '',
            exteriorColor: result.exterior_color || '',
            interiorColor: result.interior_color || '',
            fuelType: result.fuel_type || '',
            transmission: result.transmission || '',
            drivetrain: result.drivetrain || '',
            bodyStyle: result.body_style || '',
            engine: result.engine || '',
            mpgCity: result.mpg_city || 0,
            mpgHighway: result.mpg_highway || 0,
            condition: result.condition || 'unknown',
            potentialProfit: result.potential_profit || 0,
            sellerMotivation: result.seller_motivation || 'unknown',
            urgencyIndicators: result.urgency_indicators || [],
            scrapedAt: result.scraped_at || new Date().toISOString()
          }));

          return Response.json({
            success: true,
            results: transformedResults,
            summary: scrapingData.summary,
            message: "Live data from real marketplace scraping - click any link to view the actual vehicle posting"
          });
        }
      }
    } catch (scrapingError) {
      console.log("Scraping API not available, falling back to direct marketplace links:", scrapingError);
    }

    // Fallback: Generate direct marketplace URLs instead of Google search URLs
    const generateDirectMarketplaceResults = (searchTerm: string) => {
      // Create direct URLs to marketplace search pages
      const marketplaceResults = [
        {
          source: 'eBay Motors',
          price: 'View prices on eBay',
          location: 'Various locations',
          mileage: 'See listing details',
          year: searchTerm.includes('20') ? searchTerm.match(/\b(19|20)\d{2}\b/)?.[0] || 'Various' : 'Various',
          make: searchTerm.split(' ')[0] || 'Various',
          model: searchTerm.split(' ').slice(1).join(' ') || 'Various',
          url: `https://www.ebay.com/sch/Cars-Trucks/6001/i.html?_nkw=${encodeURIComponent(searchTerm)}`,
          distance: `${Math.round(5 + Math.random() * 45)} miles`,
          listingId: `ebay-direct-1`,
          description: `${searchTerm} listings on eBay Motors`,
          isDirectListing: true
        },
        {
          source: 'CarGurus',
          price: 'View prices on CarGurus',
          location: 'Various locations',
          mileage: 'See listing details',
          year: searchTerm.includes('20') ? searchTerm.match(/\b(19|20)\d{2}\b/)?.[0] || 'Various' : 'Various',
          make: searchTerm.split(' ')[0] || 'Various',
          model: searchTerm.split(' ').slice(1).join(' ') || 'Various',
          url: `https://www.cargurus.com/Cars/searchresults.action?search=${encodeURIComponent(searchTerm)}`,
          distance: `${Math.round(5 + Math.random() * 45)} miles`,
          listingId: `cargurus-direct-1`,
          description: `${searchTerm} listings on CarGurus`,
          isDirectListing: true
        },
        {
          source: 'Cars.com',
          price: 'View prices on Cars.com',
          location: 'Various locations',
          mileage: 'See listing details',
          year: searchTerm.includes('20') ? searchTerm.match(/\b(19|20)\d{2}\b/)?.[0] || 'Various' : 'Various',
          make: searchTerm.split(' ')[0] || 'Various',
          model: searchTerm.split(' ').slice(1).join(' ') || 'Various',
          url: `https://www.cars.com/shopping/results/?keyword=${encodeURIComponent(searchTerm)}`,
          distance: `${Math.round(5 + Math.random() * 45)} miles`,
          listingId: `cars-com-direct-1`,
          description: `${searchTerm} listings on Cars.com`,
          isDirectListing: true
        },
        {
          source: 'AutoTrader',
          price: 'View prices on AutoTrader',
          location: 'Various locations',
          mileage: 'See listing details',
          year: searchTerm.includes('20') ? searchTerm.match(/\b(19|20)\d{2}\b/)?.[0] || 'Various' : 'Various',
          make: searchTerm.split(' ')[0] || 'Various',
          model: searchTerm.split(' ').slice(1).join(' ') || 'Various',
          url: `https://www.autotrader.com/cars-for-sale/all-cars?searchRadius=0&makeCodeList=&modelCodeList=&zip=${location || '10001'}&marketExtension=include&startYear=1981&endYear=2024&isNewSearch=false&showAccelerateBanner=false&sortBy=relevance&numRecords=25&firstRecord=0`,
          distance: `${Math.round(5 + Math.random() * 45)} miles`,
          listingId: `autotrader-direct-1`,
          description: `${searchTerm} listings on AutoTrader`,
          isDirectListing: true
        }
      ];

      return marketplaceResults;
    };

    // Use direct marketplace URLs
    const directResults = generateDirectMarketplaceResults(searchTerm);
    
    const summary = {
      totalListings: directResults.length,
      averagePrice: 0, // Will be determined by visiting the actual listings
      priceRange: {
        min: 0,
        max: 0
      },
      sources: [...new Set(directResults.map(r => r.source))],
      searchTerm: searchTerm,
      isRealData: true,
      isDirectListings: true,
      message: "Direct links to marketplace search results - click to view actual vehicle listings"
    };

    return Response.json({
      success: true,
      results: directResults,
      summary: summary,
      message: "Direct marketplace links - click any link to view actual vehicle listings"
    });
    
    // Fallback to Google search URLs if primary search fails
    const generateGoogleFallbackResults = (searchTerm: string) => {
      const searchVariations = [
        {
          query: `${searchTerm} car for sale`,
          url: `https://www.google.com/search?q=${encodeURIComponent(`${searchTerm} car for sale`)}`,
          source: 'Google Search',
          description: `Search for ${searchTerm} cars for sale`
        },
        {
          query: `${searchTerm} ebay motors`,
          url: `https://www.google.com/search?q=${encodeURIComponent(`${searchTerm} site:ebay.com`)}`,
          source: 'eBay Motors',
          description: `${searchTerm} listings on eBay Motors`
        },
        {
          query: `${searchTerm} cargurus`,
          url: `https://www.google.com/search?q=${encodeURIComponent(`${searchTerm} site:cargurus.com`)}`,
          source: 'CarGurus',
          description: `${searchTerm} listings on CarGurus`
        },
        {
          query: `${searchTerm} autotrader`,
          url: `https://www.google.com/search?q=${encodeURIComponent(`${searchTerm} site:autotrader.com`)}`,
          source: 'AutoTrader',
          description: `${searchTerm} listings on AutoTrader`
        },
        {
          query: `${searchTerm} cars.com`,
          url: `https://www.google.com/search?q=${encodeURIComponent(`${searchTerm} site:cars.com`)}`,
          source: 'Cars.com',
          description: `${searchTerm} listings on Cars.com`
        }
      ];
      
      return searchVariations.map((search, index) => ({
        source: search.source,
        price: 'Click to view prices',
        location: 'Various locations',
        mileage: 'Click to view details',
        year: searchTerm.includes('20') ? searchTerm.match(/\b(19|20)\d{2}\b/)?.[0] || 'Various' : 'Various',
        make: searchTerm.split(' ')[0] || 'Various',
        model: searchTerm.split(' ').slice(1).join(' ') || 'Various',
        url: search.url,
        distance: `${Math.round(5 + Math.random() * 45)} miles`,
        listingId: `google-fallback-${index + 1}`,
        description: search.description,
        isGoogleSearch: true
      }));
    };
    
    const mockResults = generateGoogleFallbackResults(searchTerm);

    // Filter results based on radius
    const filteredResults = mockResults.filter(result => {
      const distance = parseInt(result.distance.replace(' miles', ''));
      return distance <= radius;
    });

    // Calculate market summary
    const prices = filteredResults.map(r => parseInt(r.price.replace(/[$,]/g, '')));
    const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const response = {
      success: true,
      results: filteredResults,
      summary: {
        totalListings: filteredResults.length,
        averagePrice: 0, // Will be determined by clicking through to actual listings
        priceRange: {
          min: 0,
          max: 0
        },
        sources: [...new Set(filteredResults.map(r => r.source))],
        searchTerm: searchTerm,
        isRealData: true,
        isGoogleSearch: true,
        message: "Click on any result to view real Google search results with actual car listings and prices"
      },
      searchTerm,
      location,
      radius
    };

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    */
  } catch (error) {
    console.error('Market search error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to search market data'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// Mock data generation function for demo
function generateMockResults(searchTerm: string) {
  const searchLower = searchTerm.toLowerCase();
  
  // Mock data based on common car makes
  const mockData = {
    "bmw": [
      { title: "2018 BMW 3 Series", price: 28000, mileage: 45000, location: "Los Angeles, CA", source: "eBay Motors", year: 2018, make: "BMW", model: "3 Series" },
      { title: "2019 BMW 5 Series", price: 35000, mileage: 32000, location: "Miami, FL", source: "CarGurus", year: 2019, make: "BMW", model: "5 Series" },
      { title: "2020 BMW X3", price: 42000, mileage: 28000, location: "Austin, TX", source: "AutoTrader", year: 2020, make: "BMW", model: "X3" },
    ],
    "toyota": [
      { title: "2019 Toyota Camry", price: 22000, mileage: 38000, location: "Phoenix, AZ", source: "eBay Motors", year: 2019, make: "Toyota", model: "Camry" },
      { title: "2020 Toyota RAV4", price: 28000, mileage: 25000, location: "Denver, CO", source: "CarGurus", year: 2020, make: "Toyota", model: "RAV4" },
      { title: "2018 Toyota Prius", price: 18000, mileage: 55000, location: "Portland, OR", source: "AutoTrader", year: 2018, make: "Toyota", model: "Prius" },
    ],
    "honda": [
      { title: "2019 Honda Civic", price: 20000, mileage: 40000, location: "Seattle, WA", source: "eBay Motors", year: 2019, make: "Honda", model: "Civic" },
      { title: "2020 Honda CR-V", price: 26000, mileage: 30000, location: "Boston, MA", source: "CarGurus", year: 2020, make: "Honda", model: "CR-V" },
      { title: "2018 Honda Accord", price: 23000, mileage: 45000, location: "Atlanta, GA", source: "AutoTrader", year: 2018, make: "Honda", model: "Accord" },
    ],
    "ford": [
      { title: "2019 Ford F-150", price: 35000, mileage: 35000, location: "Dallas, TX", source: "eBay Motors", year: 2019, make: "Ford", model: "F-150" },
      { title: "2020 Ford Explorer", price: 32000, mileage: 28000, location: "Chicago, IL", source: "CarGurus", year: 2020, make: "Ford", model: "Explorer" },
      { title: "2018 Ford Mustang", price: 25000, mileage: 40000, location: "Detroit, MI", source: "AutoTrader", year: 2018, make: "Ford", model: "Mustang" },
    ],
    "dodge": [
      { title: "2012 Dodge Charger", price: 18000, mileage: 75000, location: "Las Vegas, NV", source: "eBay Motors", year: 2012, make: "Dodge", model: "Charger" },
      { title: "2013 Dodge Challenger", price: 22000, mileage: 65000, location: "Phoenix, AZ", source: "CarGurus", year: 2013, make: "Dodge", model: "Challenger" },
      { title: "2011 Dodge Ram", price: 16000, mileage: 85000, location: "Houston, TX", source: "AutoTrader", year: 2011, make: "Dodge", model: "Ram" },
    ],
    "mercedes": [
      { title: "2019 Mercedes C-Class", price: 38000, mileage: 30000, location: "New York, NY", source: "eBay Motors", year: 2019, make: "Mercedes", model: "C-Class" },
      { title: "2020 Mercedes GLC", price: 45000, mileage: 25000, location: "San Francisco, CA", source: "CarGurus", year: 2020, make: "Mercedes", model: "GLC" },
      { title: "2018 Mercedes E-Class", price: 42000, mileage: 35000, location: "Las Vegas, NV", source: "AutoTrader", year: 2018, make: "Mercedes", model: "E-Class" },
    ]
  };
  
  // Find matching make
  let results = [];
  for (const [make, cars] of Object.entries(mockData)) {
    if (searchLower.includes(make)) {
      results = cars;
      break;
    }
  }
  
  // If no specific make found, return a mix
  if (results.length === 0) {
    for (const [make, cars] of Object.entries(mockData)) {
      results.push(...cars.slice(0, 2)); // Take 2 from each make
    }
  }
  
  // Limit results
  return results.slice(0, 20);
}
