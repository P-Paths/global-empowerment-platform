'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, MessageSquare, Clock, Users, Car, Shield, Zap } from 'lucide-react';

interface HotCar {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  demand: number;
  profit: number;
  location: string;
  trend: 'up' | 'down' | 'stable';
}

interface ContractTransaction {
  id: string;
  buyer: string;
  seller: string;
  car: string;
  amount: number;
  status: 'pending' | 'active' | 'completed' | 'disputed';
  startDate: string;
  endDate: string;
  daysRemaining: number;
  contractNumber: string;
}

interface ConversationAnalytics {
  totalMessages: number;
  activeConversations: number;
  responseTime: string;
  conversionRate: number;
  topTopics: string[];
}

interface ProfitThresholds {
  minimumProfit: number;
  targetROI: number;
  maxDaysToSell: number;
}

export default function AnalyticsDashboard() {
  const [contractTransactions, setContractTransactions] = useState<ContractTransaction[]>([]);
  const [conversationAnalytics, setConversationAnalytics] = useState<ConversationAnalytics | null>(null);
  const [profitThresholds, setProfitThresholds] = useState<ProfitThresholds>({
    minimumProfit: 2000,
    targetROI: 25,
    maxDaysToSell: 30
  });
  const [activeTab, setActiveTab] = useState<'contracts' | 'conversations' | 'profit-thresholds'>('contracts');

  useEffect(() => {
    // Mock data for demonstration
    setContractTransactions([
      {
        id: 'tx-001',
        buyer: 'Sarah Johnson',
        seller: 'Mike Chen',
        car: '2019 Honda Civic',
        amount: 500,
        status: 'active',
        startDate: '2024-10-10',
        endDate: '2024-10-24',
        daysRemaining: 8,
        contractNumber: 'CT-2024-001'
      },
      {
        id: 'tx-002',
        buyer: 'David Rodriguez',
        seller: 'Lisa Park',
        car: '2020 Toyota Camry',
        amount: 900,
        status: 'active',
        startDate: '2024-10-12',
        endDate: '2024-10-19',
        daysRemaining: 3,
        contractNumber: 'CT-2024-002'
      },
      {
        id: 'tx-003',
        buyer: 'Jennifer Lee',
        seller: 'Robert Smith',
        car: '2018 Ford F-150',
        amount: 1200,
        status: 'pending',
        startDate: '2024-10-15',
        endDate: '2024-10-29',
        daysRemaining: 14,
        contractNumber: 'CT-2024-003'
      },
      {
        id: 'tx-004',
        buyer: 'Alex Thompson',
        seller: 'Maria Garcia',
        car: '2019 BMW 3 Series',
        amount: 750,
        status: 'completed',
        startDate: '2024-10-01',
        endDate: '2024-10-15',
        daysRemaining: 0,
        contractNumber: 'CT-2024-004'
      }
    ]);

    setConversationAnalytics({
      totalMessages: 1247,
      activeConversations: 23,
      responseTime: '2.3 min',
      conversionRate: 34.2,
      topTopics: ['Price Negotiation', 'Vehicle History', 'Inspection', 'Payment Terms', 'Delivery']
    });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'disputed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  const totalEscrowAmount = contractTransactions
    .filter(tx => tx.status === 'active' || tx.status === 'pending')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('contracts')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'contracts'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Contracts
          </button>
          <button
            onClick={() => setActiveTab('conversations')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'conversations'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Conversations
          </button>
          <button
            onClick={() => setActiveTab('profit-thresholds')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'profit-thresholds'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <DollarSign className="w-4 h-4 inline mr-2" />
            Profit Thresholds
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Escrow</p>
              <p className="text-2xl font-bold">${totalEscrowAmount.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Active Contracts</p>
              <p className="text-2xl font-bold">
                {contractTransactions.filter(tx => tx.status === 'active' || tx.status === 'pending').length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Profit Target</p>
              <p className="text-2xl font-bold">${profitThresholds.minimumProfit.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Active Chats</p>
              <p className="text-2xl font-bold">{conversationAnalytics?.activeConversations || 0}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'contracts' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">📋 Active Contracts</h3>
          <div className="space-y-4">
            {contractTransactions.map((tx) => (
              <div key={tx.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                      {tx.status.toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-600">Contract: {tx.contractNumber}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">${tx.amount}</p>
                    <p className="text-sm text-gray-600">Escrow Amount</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Vehicle</p>
                    <p className="font-semibold">{tx.car}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Parties</p>
                    <p className="font-semibold">{tx.buyer} → {tx.seller}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Time Remaining</p>
                    <p className="font-semibold flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {tx.daysRemaining} days
                    </p>
                  </div>
                </div>
                
                {tx.status === 'active' && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span>Contract Progress</span>
                      <span>{Math.round(((14 - tx.daysRemaining) / 14) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.round(((14 - tx.daysRemaining) / 14) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'profit-thresholds' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">💰 Profit Thresholds</h3>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Current Settings</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Minimum Profit</span>
                  <span className="font-semibold text-gray-900">${profitThresholds.minimumProfit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Target ROI</span>
                  <span className="font-semibold text-gray-900">{profitThresholds.targetROI}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Max Days to Sell</span>
                  <span className="font-semibold text-gray-900">{profitThresholds.maxDaysToSell} days</span>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-blue-800">How It Works</h4>
              <p className="text-sm text-blue-700">
                These thresholds help you make smart buying decisions. Only cars that meet your profit targets will be recommended for purchase.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'conversations' && conversationAnalytics && (
        <div>
          <h3 className="text-lg font-semibold mb-4">💬 Conversation Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Overview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Messages</span>
                    <span className="font-semibold">{conversationAnalytics.totalMessages.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Conversations</span>
                    <span className="font-semibold">{conversationAnalytics.activeConversations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Response Time</span>
                    <span className="font-semibold">{conversationAnalytics.responseTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conversion Rate</span>
                    <span className="font-semibold text-green-600">{conversationAnalytics.conversionRate}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Top Conversation Topics</h4>
              <div className="space-y-2">
                {conversationAnalytics.topTopics.map((topic, index) => (
                  <div key={topic} className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-2">
                        {index + 1}
                      </span>
                      {topic}
                    </span>
                    <span className="text-gray-600">
                      {Math.round(Math.random() * 50 + 20)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
