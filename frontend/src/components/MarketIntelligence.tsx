'use client';

import React, { useState, useEffect } from 'react';
import carDataRaw from '@/data/carData.json';
const carData = carDataRaw as Record<string, string[]>;

interface MarketIntelligenceProps {
  onClose: () => void;
}

interface MarketAnalysis {
  success: boolean;
  make: string;
  model: string;
  overall_score: number;
  make_score: number;
  model_score: number;
  demand_category: string;
  profit_potential: string;
  recommendation: string;
}

interface CompetitorAnalysis {
  success: boolean;
  location: string;
  radius_miles: number;
  competitors_found: number;
  competitors: Array<{
    id: string;
    title: string;
    price: number;
    mileage: number;
    year: number;
    location: string;
    platform: string;
    days_listed: number;
    condition: string;
  }>;
  pricing_analysis: {
    average_price: number;
    price_range: { min: number; max: number };
    pricing_strategy: string;
  };
  recommendations: string[];
}

interface ProfitThresholds {
  success: boolean;
  make: string;
  model: string;
  target_profit: number;
  risk_tolerance: string;
  acquisition_thresholds: {
    max_acquisition_price: number;
    target_acquisition_price: number;
    walk_away_price: number;
  };
  selling_thresholds: {
    min_selling_price: number;
    target_selling_price: number;
    aspirational_price: number;
    quick_sale_price: number;
  };
  recommendations: string[];
}

export default function MarketIntelligence({ onClose }: MarketIntelligenceProps) {
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [location, setLocation] = useState('United States');
  const [radiusMiles, setRadiusMiles] = useState(50);
  const [targetProfit, setTargetProfit] = useState(2000);
  const [riskTolerance, setRiskTolerance] = useState('medium');
  const [analysisType, setAnalysisType] = useState('comprehensive');
  
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null);
  const [competitorAnalysis, setCompetitorAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [profitThresholds, setProfitThresholds] = useState<ProfitThresholds | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('analysis');

  const makes = Object.keys(carData);
  const models = selectedMake ? carData[selectedMake] : [];

  const runMarketAnalysis = async () => {
    if (!selectedMake || !selectedModel) {
      alert('Please select both make and model');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/market-intelligence/quick-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          make: selectedMake,
          model: selectedModel,
          location: location
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMarketAnalysis(data);
      } else {
        throw new Error('Market analysis failed');
      }
    } catch (error) {
      console.error('Error running market analysis:', error);
      alert('Failed to run market analysis. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const runCompetitorSearch = async () => {
    if (!selectedMake || !selectedModel) {
      alert('Please select both make and model');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/market-intelligence/competitor-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          make: selectedMake,
          model: selectedModel,
          location: location,
          radius_miles: radiusMiles
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCompetitorAnalysis(data);
      } else {
        throw new Error('Competitor search failed');
      }
    } catch (error) {
      console.error('Error running competitor search:', error);
      alert('Failed to run competitor search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProfitThresholds = async () => {
    if (!selectedMake || !selectedModel) {
      alert('Please select both make and model');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/market-intelligence/profit-thresholds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          make: selectedMake,
          model: selectedModel,
          target_profit: targetProfit,
          risk_tolerance: riskTolerance
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfitThresholds(data);
      } else {
        throw new Error('Profit threshold calculation failed');
      }
    } catch (error) {
      console.error('Error calculating profit thresholds:', error);
      alert('Failed to calculate profit thresholds. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const runComprehensiveAnalysis = async () => {
    if (!selectedMake || !selectedModel) {
      alert('Please select both make and model');
      return;
    }

    setIsLoading(true);
    try {
      // Run all analyses in parallel
      await Promise.all([
        runMarketAnalysis(),
        runCompetitorSearch(),
        calculateProfitThresholds()
      ]);
    } catch (error) {
      console.error('Error running comprehensive analysis:', error);
      alert('Failed to run comprehensive analysis. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Market Intelligence Analysis
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Configuration Panel */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Analysis Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Make
              </label>
              <select
                value={selectedMake}
                onChange={(e) => {
                  setSelectedMake(e.target.value);
                  setSelectedModel('');
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Make</option>
                {makes.map(make => (
                  <option key={make} value={make}>{make}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!selectedMake}
              >
                <option value="">{selectedMake ? 'Select Model' : 'Select Make First'}</option>
                {models.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Profit ($)
              </label>
              <input
                type="number"
                value={targetProfit}
                onChange={(e) => setTargetProfit(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Radius (miles)
              </label>
              <input
                type="number"
                value={radiusMiles}
                onChange={(e) => setRadiusMiles(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="10"
                max="200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Risk Tolerance
              </label>
              <select
                value={riskTolerance}
                onChange={(e) => setRiskTolerance(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Analysis Type
              </label>
              <select
                value={analysisType}
                onChange={(e) => setAnalysisType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="comprehensive">Comprehensive</option>
                <option value="make_model_analysis">Make/Model Analysis</option>
                <option value="competitor_research">Competitor Research</option>
                <option value="threshold_setting">Profit Thresholds</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={runComprehensiveAnalysis}
              disabled={isLoading || !selectedMake || !selectedModel}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Analyzing...' : 'Run Comprehensive Analysis'}
            </button>
            
            <button
              onClick={runMarketAnalysis}
              disabled={isLoading || !selectedMake || !selectedModel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Market Analysis Only
            </button>
            
            <button
              onClick={runCompetitorSearch}
              disabled={isLoading || !selectedMake || !selectedModel}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Competitor Search
            </button>
            
            <button
              onClick={calculateProfitThresholds}
              disabled={isLoading || !selectedMake || !selectedModel}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Profit Thresholds
            </button>
          </div>
        </div>

        {/* Results Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-600 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analysis'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Market Analysis
            </button>
            <button
              onClick={() => setActiveTab('competitors')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'competitors'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Competitors ({competitorAnalysis?.competitors_found || 0})
            </button>
            <button
              onClick={() => setActiveTab('thresholds')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'thresholds'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Profit Thresholds
            </button>
          </nav>
        </div>

        {/* Results Content */}
        <div className="space-y-6">
          {/* Market Analysis Tab */}
          {activeTab === 'analysis' && marketAnalysis && (
            <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Market Analysis: {marketAnalysis.make} {marketAnalysis.model}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Overall Score</div>
                  <div className={`text-2xl font-bold ${getScoreColor(marketAnalysis.overall_score)}`}>
                    {marketAnalysis.overall_score.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">{getScoreLabel(marketAnalysis.overall_score)}</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Make Score</div>
                  <div className={`text-2xl font-bold ${getScoreColor(marketAnalysis.make_score)}`}>
                    {marketAnalysis.make_score.toFixed(2)}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Model Score</div>
                  <div className={`text-2xl font-bold ${getScoreColor(marketAnalysis.model_score)}`}>
                    {marketAnalysis.model_score.toFixed(2)}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Demand</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 capitalize">
                    {marketAnalysis.demand_category}
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Recommendation</h4>
                <p className="text-blue-800 dark:text-blue-200">{marketAnalysis.recommendation}</p>
              </div>
            </div>
          )}

          {/* Competitors Tab */}
          {activeTab === 'competitors' && competitorAnalysis && (
            <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Competitor Analysis: {competitorAnalysis.location} ({competitorAnalysis.radius_miles} mile radius)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Competitors Found</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {competitorAnalysis.competitors_found}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Average Price</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${competitorAnalysis.pricing_analysis.average_price.toLocaleString()}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Pricing Strategy</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 capitalize">
                    {competitorAnalysis.pricing_analysis.pricing_strategy}
                  </div>
                </div>
              </div>
              
              {competitorAnalysis.competitors.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-600">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Listing</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Year</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mileage</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Platform</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Days Listed</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                      {competitorAnalysis.competitors.map((competitor) => (
                        <tr key={competitor.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {competitor.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                            ${competitor.price.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {competitor.year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {competitor.mileage.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {competitor.platform}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {competitor.days_listed}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {competitorAnalysis.recommendations.length > 0 && (
                <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Recommendations</h4>
                  <ul className="list-disc list-inside text-yellow-800 dark:text-yellow-200 space-y-1">
                    {competitorAnalysis.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Profit Thresholds Tab */}
          {activeTab === 'thresholds' && profitThresholds && (
            <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Profit Thresholds: {profitThresholds.make} {profitThresholds.model}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">Acquisition Thresholds</h4>
                  <div className="space-y-3">
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                      <div className="text-sm text-red-600 dark:text-red-400">Max Acquisition Price</div>
                      <div className="text-xl font-bold text-red-700 dark:text-red-300">
                        ${profitThresholds.acquisition_thresholds.max_acquisition_price.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                      <div className="text-sm text-yellow-600 dark:text-yellow-400">Target Acquisition Price</div>
                      <div className="text-xl font-bold text-yellow-700 dark:text-yellow-300">
                        ${profitThresholds.acquisition_thresholds.target_acquisition_price.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                      <div className="text-sm text-orange-600 dark:text-orange-400">Walk Away Price</div>
                      <div className="text-xl font-bold text-orange-700 dark:text-orange-300">
                        ${profitThresholds.acquisition_thresholds.walk_away_price.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-green-600 dark:text-green-400">Selling Thresholds</h4>
                  <div className="space-y-3">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                      <div className="text-sm text-green-600 dark:text-green-400">Min Selling Price</div>
                      <div className="text-xl font-bold text-green-700 dark:text-green-300">
                        ${profitThresholds.selling_thresholds.min_selling_price.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <div className="text-sm text-blue-600 dark:text-blue-400">Target Selling Price</div>
                      <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                        ${profitThresholds.selling_thresholds.target_selling_price.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                      <div className="text-sm text-purple-600 dark:text-purple-400">Aspirational Price</div>
                      <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
                        ${profitThresholds.selling_thresholds.aspirational_price.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {profitThresholds.recommendations.length > 0 && (
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Recommendations</h4>
                  <ul className="list-disc list-inside text-blue-800 dark:text-blue-200 space-y-1">
                    {profitThresholds.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* No Results Message */}
          {!marketAnalysis && !competitorAnalysis && !profitThresholds && (
            <div className="text-center py-12">
              <div className="text-gray-500 dark:text-gray-400 text-lg">
                Select a make and model, then run an analysis to see results.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 