'use client';

import React, { useState, useEffect } from 'react';

interface AnalyticsData {
  totalLeads: number;
  leadsThisWeek: number;
  leadsThisMonth: number;
  conversionRate: number;
  topSources: Array<{ source: string; count: number; percentage: number }>;
  leadStatusBreakdown: Array<{ status: string; count: number; percentage: number }>;
  monthlyTrend: Array<{ month: string; leads: number }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/leads');
      const result = await response.json();
      
      if (result.success && result.leads) {
        const leads = result.leads;
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        // Calculate analytics
        const totalLeads = leads.length;
        const leadsThisWeek = leads.filter((lead: any) => 
          new Date(lead.created_at) > weekAgo
        ).length;
        const leadsThisMonth = leads.filter((lead: any) => 
          new Date(lead.created_at) > monthAgo
        ).length;
        
        // Source breakdown
        const sourceCounts = leads.reduce((acc: any, lead: any) => {
          acc[lead.source] = (acc[lead.source] || 0) + 1;
          return acc;
        }, {});
        
        const topSources = Object.entries(sourceCounts)
          .map(([source, count]) => ({
            source,
            count: count as number,
            percentage: Math.round(((count as number) / totalLeads) * 100)
          }))
          .sort((a, b) => b.count - a.count);
        
        // Status breakdown
        const statusCounts = leads.reduce((acc: any, lead: any) => {
          acc[lead.status] = (acc[lead.status] || 0) + 1;
          return acc;
        }, {});
        
        const leadStatusBreakdown = Object.entries(statusCounts)
          .map(([status, count]) => ({
            status,
            count: count as number,
            percentage: Math.round(((count as number) / totalLeads) * 100)
          }))
          .sort((a, b) => b.count - a.count);
        
        // Monthly trend (last 6 months)
        const monthlyTrend = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          const monthLeads = leads.filter((lead: any) => {
            const leadDate = new Date(lead.created_at);
            return leadDate.getFullYear() === date.getFullYear() && 
                   leadDate.getMonth() === date.getMonth();
          }).length;
          
          monthlyTrend.push({ month: monthName, leads: monthLeads });
        }
        
        setAnalytics({
          totalLeads,
          leadsThisWeek,
          leadsThisMonth,
          conversionRate: Math.round((leadsThisWeek / Math.max(totalLeads, 1)) * 100),
          topSources,
          leadStatusBreakdown,
          monthlyTrend
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h2>
        <p className="text-gray-600">Track your lead generation performance and trends.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📊</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Leads</dt>
                  <dd className="text-lg font-medium text-gray-900">{analytics?.totalLeads || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📅</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">This Week</dt>
                  <dd className="text-lg font-medium text-gray-900">{analytics?.leadsThisWeek || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📈</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">This Month</dt>
                  <dd className="text-lg font-medium text-gray-900">{analytics?.leadsThisMonth || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🎯</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
                  <dd className="text-lg font-medium text-gray-900">{analytics?.conversionRate || 0}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Lead Sources */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Sources</h3>
          <div className="space-y-3">
            {analytics?.topSources.map((source, index) => (
              <div key={source.source} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-3" style={{
                    backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index % 4]
                  }}></div>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {source.source.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{source.count} leads</span>
                  <span className="text-sm font-medium text-gray-900">{source.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Status Breakdown</h3>
          <div className="space-y-3">
            {analytics?.leadStatusBreakdown.map((status, index) => (
              <div key={status.status} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-3" style={{
                    backgroundColor: status.status === 'hot' ? '#EF4444' : 
                                   status.status === 'warm' ? '#F59E0B' : '#6B7280'
                  }}></div>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {status.status} Leads
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{status.count} leads</span>
                  <span className="text-sm font-medium text-gray-900">{status.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Lead Trend</h3>
        <div className="flex items-end space-x-4 h-32">
          {analytics?.monthlyTrend.map((month, index) => {
            const maxLeads = Math.max(...analytics.monthlyTrend.map(m => m.leads));
            const height = maxLeads > 0 ? (month.leads / maxLeads) * 100 : 0;
            
            return (
              <div key={month.month} className="flex flex-col items-center flex-1">
                <div className="w-full bg-gray-200 rounded-t" style={{ height: '80px' }}>
                  <div 
                    className="w-full bg-blue-500 rounded-t transition-all duration-500"
                    style={{ height: `${height}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 mt-2">{month.month}</span>
                <span className="text-xs font-medium text-gray-900">{month.leads}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Lead Quality Score */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Quality Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">High Quality (80-100)</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
                <span className="text-sm text-gray-900">3 leads</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Medium Quality (50-79)</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                </div>
                <span className="text-sm text-gray-900">2 leads</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Low Quality (0-49)</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                </div>
                <span className="text-sm text-gray-900">2 leads</span>
              </div>
            </div>
          </div>
        </div>

        {/* Response Time */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Average Response Time</h3>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">2.4 hrs</div>
            <p className="text-sm text-gray-500">Time to first contact</p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Same Day</span>
                <span className="font-medium">85%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Within 24hrs</span>
                <span className="font-medium">95%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Within 48hrs</span>
                <span className="font-medium">100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Lead Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">New lead from Google Forms</p>
              <p className="text-xs text-gray-500">House of Hardtops - 2 minutes ago</p>
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Hot Lead</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Email opened</p>
              <p className="text-xs text-gray-500">Preston Eaton - 15 minutes ago</p>
            </div>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Engaged</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Follow-up scheduled</p>
              <p className="text-xs text-gray-500">AutoMax Dealership - 1 hour ago</p>
            </div>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Scheduled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
