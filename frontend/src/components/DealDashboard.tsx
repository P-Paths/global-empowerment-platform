import React, { useState, useEffect } from 'react';
import { api } from '@/utils/api';

interface Deal {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  condition: string;
  location: string;
  deal_score: number;
  potential_profit: number;
  seller_motivation: string;
  urgency_indicators: string[];
  source: string;
  url: string;
  analysis?: DealAnalysis;
}

interface DealAnalysis {
  valuation: {
    estimated_market_value: number;
    potential_profit: number;
    profit_margin: number;
  };
  analysis: {
    deal_score: number;
    risk_score: number;
    recommendation: string;
    confidence: number;
  };
  recommendation?: string;
  deal_score?: number;
}

const DealDashboard: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [dealAnalysis, setDealAnalysis] = useState<DealAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("Honda Civic");
  const [filters, setFilters] = useState({
    make: '',
    model: '',
    maxPrice: '',
    minYear: '',
    location: ''
  });

  const loadDeals = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/v1/deals/discover?search_term=${encodeURIComponent(searchTerm)}&max_results=20`) as { success: boolean; deals: Deal[] };
      if (data.success) {
        setDeals(data.deals);
      }
    } catch (error) {
      console.error('Error loading deals:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDeals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchDeals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.make) params.append('make', filters.make);
      if (filters.model) params.append('model', filters.model);
      if (filters.maxPrice) params.append('max_price', filters.maxPrice);
      if (filters.minYear) params.append('min_year', filters.minYear);
      if (filters.location) params.append('location', filters.location);
      params.append('limit', '20');

      const data = await api.get(`/api/v1/deals/search?${params.toString()}`) as { success: boolean; deals: Deal[] };
      if (data.success) {
        setDeals(data.deals);
      }
    } catch (error) {
      console.error('Error searching deals:', error);
    }
    setLoading(false);
  };

  const loadDealAnalysis = async (dealId: string) => {
    try {
      const data = await api.get(`/api/v1/deals/${dealId}`) as { success: boolean; analysis: DealAnalysis };
      if (data.success) {
        setDealAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Error loading deal analysis:', error);
    }
  };

  const handleDealSelect = (deal: Deal) => {
    setSelectedDeal(deal);
    loadDealAnalysis(deal.id);
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'STRONG_BUY': return 'text-green-600 bg-green-100';
      case 'BUY': return 'text-blue-600 bg-blue-100';
      case 'CONSIDER': return 'text-yellow-600 bg-yellow-100';
      case 'PASS': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDealScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-blue-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'ebay': return '🛒';
      case 'cargurus': return '🚗';
      default: return '📋';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🚗 Live Deal Dashboard</h1>
          <p className="text-gray-600">Real-time car deals with AI-powered profit analysis</p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Term</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Honda Civic, Toyota Camry"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
              <input
                type="text"
                value={filters.make}
                onChange={(e) => setFilters({...filters, make: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Honda"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 15000"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadDeals}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Search Deals'}
            </button>
            <button
              onClick={searchDeals}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
            >
              Advanced Search
            </button>
          </div>
        </div>

        {/* Deals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((deal) => (
            <div
              key={deal.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleDealSelect(deal)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{getSourceIcon(deal.source)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRecommendationColor(deal.analysis?.recommendation || 'CONSIDER')}`}>
                    {deal.analysis?.recommendation || 'ANALYZING'}
                  </span>
                </div>
                
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{deal.title}</h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-semibold text-green-600">{formatPrice(deal.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mileage:</span>
                    <span className="text-gray-900">{deal.mileage.toLocaleString()} mi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="text-gray-900">{deal.location}</span>
                  </div>
                </div>

                {deal.analysis && (
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Deal Score:</span>
                                           <span className={`font-semibold ${getDealScoreColor(deal.analysis.deal_score || 0)}`}>
                       {(deal.analysis.deal_score || 0)}/10
                     </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Potential Profit:</span>
                      <span className="font-semibold text-green-600">
                        {formatPrice(deal.analysis.valuation.potential_profit)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <a
                    href={deal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Original Listing →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Deal Analysis Modal */}
        {selectedDeal && dealAnalysis && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedDeal.title}</h2>
                  <button
                    onClick={() => setSelectedDeal(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Valuation Analysis</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Market Value:</span>
                        <span className="font-semibold">{formatPrice(dealAnalysis.valuation.estimated_market_value)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Potential Profit:</span>
                        <span className="font-semibold text-green-600">{formatPrice(dealAnalysis.valuation.potential_profit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profit Margin:</span>
                        <span className="font-semibold">{dealAnalysis.valuation.profit_margin.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Risk Analysis</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Deal Score:</span>
                        <span className={`font-semibold ${getDealScoreColor(dealAnalysis.analysis.deal_score)}`}>
                          {dealAnalysis.analysis.deal_score}/10
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Risk Score:</span>
                        <span className="font-semibold text-red-600">{dealAnalysis.analysis.risk_score}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Confidence:</span>
                        <span className="font-semibold">{dealAnalysis.analysis.confidence}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Recommendation</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRecommendationColor(dealAnalysis.analysis.recommendation)}`}>
                    {dealAnalysis.analysis.recommendation}
                  </span>
                </div>

                <div className="mt-6 flex gap-3">
                  <a
                    href={selectedDeal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2 bg-blue-500 text-white text-center rounded-md hover:bg-blue-600"
                  >
                    Contact Seller
                  </a>
                  <button
                    onClick={() => setSelectedDeal(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {deals.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No deals found. Try adjusting your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealDashboard; 