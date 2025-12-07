'use client';

import React, { useState, useEffect } from 'react';
import { onboardingService } from '@/services/onboardingService';

interface Lead {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  source: string;
  role?: string;
  focus?: string;
  score: number;
  status: string;
  created_at: string;
  updated_at: string;
  ip_address?: string;
  user_agent?: string;
  demo_engagement?: any;
  survey_responses?: any;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  notes?: string;
  // Qualification & Preferences
  qualifications?: {
    wants_notifications?: boolean;
    wants_demo?: boolean;
    wants_beta_access?: boolean;
    wants_early_access?: boolean;
    signup_type?: string;
    interest_level?: string;
    budget_range?: string;
    timeline?: string;
    volume?: string;
    pain_points?: string[];
  };
}

export default function LeadsAdmin() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [onboardingUsers, setOnboardingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOnboarding, setLoadingOnboarding] = useState(true);
  const [activeTab, setActiveTab] = useState<'leads' | 'onboarding'>('onboarding');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    thisWeek: 0,
    bySource: {} as Record<string, number>,
    byRole: {} as Record<string, number>,
    byQualification: {
      wants_notifications: 0,
      wants_demo: 0,
      wants_beta_access: 0,
      wants_early_access: 0
    }
  });

  useEffect(() => {
    fetchLeads();
    fetchOnboardingUsers();
  }, []);

  const fetchOnboardingUsers = async () => {
    try {
      setLoadingOnboarding(true);
      const { data, error } = await onboardingService.getAllOnboardingProfiles();
      if (error) {
        console.error('Error fetching onboarding users:', error);
        setOnboardingUsers([]);
      } else {
        setOnboardingUsers(data || []);
      }
    } catch (error) {
      console.error('Error fetching onboarding users:', error);
      setOnboardingUsers([]);
    } finally {
      setLoadingOnboarding(false);
    }
  };

  // Lead management functions
  const deleteLead = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setLeads(leads.filter(lead => lead.id !== leadId));
        setShowDeleteModal(false);
        setSelectedLead(null);
        fetchLeads(); // Refresh stats
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        setLeads(leads.map(lead => 
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        ));
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  const exportLeadsToCSV = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Source', 'Status', 'Score', 'Created At', 'Dealership', 'Volume', 'Budget'].join(','),
      ...filteredLeads.map(lead => [
        lead.name || '',
        lead.email,
        lead.phone || '',
        lead.source,
        lead.status,
        lead.score,
        new Date(lead.created_at).toLocaleDateString(),
        lead.survey_responses?.dealership_name || '',
        lead.survey_responses?.monthly_volume || '',
        lead.survey_responses?.willingness_to_pay || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const selectAllLeads = () => {
    setSelectedLeads(filteredLeads.map(lead => lead.id));
  };

  const clearSelection = () => {
    setSelectedLeads([]);
  };

  const bulkDeleteLeads = async () => {
    try {
      const promises = selectedLeads.map(leadId => 
        fetch(`/api/leads/${leadId}`, { method: 'DELETE' })
      );
      
      await Promise.all(promises);
      setLeads(leads.filter(lead => !selectedLeads.includes(lead.id)));
      setSelectedLeads([]);
      fetchLeads(); // Refresh stats
    } catch (error) {
      console.error('Error bulk deleting leads:', error);
    }
  };

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads');
      const result = await response.json();
      
      if (result.success && result.leads) {
        setLeads(result.leads);
        
        // Calculate stats
        const total = result.leads.length;
        const thisWeek = result.leads.filter((lead: any) => {
          const leadDate = new Date(lead.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return leadDate > weekAgo;
        }).length;
        
        const bySource = result.leads.reduce((acc: any, lead: any) => {
          acc[lead.source] = (acc[lead.source] || 0) + 1;
          return acc;
        }, {});
        
        const byRole = result.leads.reduce((acc: any, lead: any) => {
          acc[lead.role || 'unknown'] = (acc[lead.role || 'unknown'] || 0) + 1;
          return acc;
        }, {});
        
        // Calculate qualification stats
        const byQualification = result.leads.reduce((acc: any, lead: any) => {
          if (lead.qualifications) {
            if (lead.qualifications.wants_notifications) acc.wants_notifications++;
            if (lead.qualifications.wants_demo) acc.wants_demo++;
            if (lead.qualifications.wants_beta_access) acc.wants_beta_access++;
            if (lead.qualifications.wants_early_access) acc.wants_early_access++;
          }
          return acc;
        }, {
          wants_notifications: 0,
          wants_demo: 0,
          wants_beta_access: 0,
          wants_early_access: 0
        });
        
        setStats({
          total,
          thisWeek,
          bySource,
          byRole,
          byQualification
        });
      } else {
        setLeads([]);
        setStats({
          total: 0,
          thisWeek: 0,
          bySource: {},
          byRole: {},
          byQualification: {
            wants_notifications: 0,
            wants_demo: 0,
            wants_beta_access: 0,
            wants_early_access: 0
          }
        });
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeads([]);
      setStats({
        total: 0,
        thisWeek: 0,
        bySource: {},
        byRole: {},
        byQualification: {
          wants_notifications: 0,
          wants_demo: 0,
          wants_beta_access: 0,
          wants_early_access: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter leads based on search and filters
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchTerm === '' || 
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.survey_responses?.dealership_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesSource;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leads...</p>
        </div>
      </div>
    );
  }

  // Filter onboarding users
  const filteredOnboardingUsers = onboardingUsers.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'completed' && user.onboarding_complete) ||
      (statusFilter === 'incomplete' && !user.onboarding_complete);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Lead Capture System</h2>
        <p className="text-gray-600">Track and manage your leads from onboarding and signup forms.</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('onboarding')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'onboarding'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Onboarding Users ({onboardingUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'leads'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Form Leads ({leads.length})
          </button>
        </nav>
      </div>

      {/* Onboarding Users Tab */}
      {activeTab === 'onboarding' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">👥</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="text-lg font-medium text-gray-900">{onboardingUsers.length}</dd>
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
                      <span className="text-white text-sm font-bold">✅</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {onboardingUsers.filter(u => u.onboarding_complete).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">🚗</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Automotive</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {onboardingUsers.filter(u => u.selected_category === 'automotive').length}
                      </dd>
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
                      <span className="text-white text-sm font-bold">📅</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">This Week</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {onboardingUsers.filter(u => {
                          const userDate = new Date(u.created_at);
                          const weekAgo = new Date();
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          return userDate > weekAgo;
                        }).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-40 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="incomplete">Incomplete</option>
                </select>
              </div>
            </div>
          </div>

          {/* Onboarding Users Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Onboarding Users</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                All users who have started or completed onboarding.
              </p>
            </div>
            
            {loadingOnboarding ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading onboarding users...</p>
              </div>
            ) : filteredOnboardingUsers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No onboarding users yet</h3>
                <p className="text-gray-500">Users will appear here as they complete onboarding.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOnboardingUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.first_name || user.last_name 
                            ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.phone || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.selected_category ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {user.selected_category.replace('_', ' ')}
                            </span>
                          ) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.experience_level || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.onboarding_complete 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.onboarding_complete ? 'Completed' : 'In Progress'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Form Leads Tab */}
      {activeTab === 'leads' && (
        <>

          {/* Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-green-900 mb-3">✅ CRM System Active</h3>
        <div className="text-green-800 space-y-3">
          <p><strong>Current Status:</strong> Lead capture is working perfectly! All leads are being saved with automatic scoring and classification.</p>
          
          <div className="bg-white p-4 rounded border">
            <h4 className="font-semibold mb-2">What's Working:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Lead Capture:</strong> All forms and automation flows are capturing leads</li>
              <li><strong>Lead Scoring:</strong> Automatic 0-100 point scoring system</li>
              <li><strong>Status Classification:</strong> Hot/Warm/Cold based on engagement</li>
              <li><strong>Data Storage:</strong> Leads saved to local file (leads.json)</li>
              <li><strong>API Access:</strong> Real-time lead data via REST API</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📧</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Leads</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
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
                  <dd className="text-lg font-medium text-gray-900">{stats.thisWeek}</dd>
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
                  <span className="text-white text-sm font-bold">🤖</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">From Chatbot</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.bySource.chatbot || 0}</dd>
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
                  <span className="text-white text-sm font-bold">👥</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Dealers</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.byRole.dealer || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Qualification Stats */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">🎯 Lead Qualifications & Preferences</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{stats.byQualification.wants_notifications}</div>
            <div className="text-sm text-gray-600">Want Notifications</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">{stats.byQualification.wants_demo}</div>
            <div className="text-sm text-gray-600">Want Demo</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">{stats.byQualification.wants_beta_access}</div>
            <div className="text-sm text-gray-600">Want Beta Access</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-orange-600">{stats.byQualification.wants_early_access}</div>
            <div className="text-sm text-gray-600">Want Early Access</div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-32 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Status</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
            </select>
            
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="block w-40 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Sources</option>
              <option value="google_forms">Google Forms</option>
              <option value="chatbot">Chatbot</option>
              <option value="website">Website</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {selectedLeads.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedLeads.length} selected
                </span>
                <button
                  onClick={bulkDeleteLeads}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete Selected
                </button>
                <button
                  onClick={clearSelection}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Clear
                </button>
              </div>
            )}
            
            <button
              onClick={exportLeadsToCSV}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Leads</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            All leads captured from your website and chatbot.
          </p>
        </div>
        
        {filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leads yet</h3>
            <p className="text-gray-500 mb-4">
              Leads will appear here as they come through your forms and automation.
            </p>
            <div className="text-sm text-gray-400">
              <p>Test your forms to see leads appear here!</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                      onChange={selectedLeads.length === filteredLeads.length ? clearSelection : selectAllLeads}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🎯 Qualifications</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={() => toggleLeadSelection(lead.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {lead.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.source}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="space-y-2">
                        {/* Google Forms Detailed Responses */}
                        {lead.survey_responses && (
                          <div className="space-y-1">
                            {lead.survey_responses.dealership_name && (
                              <div className="text-xs">
                                <span className="font-medium text-gray-700">Dealership:</span> {lead.survey_responses.dealership_name}
                              </div>
                            )}
                            {lead.survey_responses.city && (
                              <div className="text-xs">
                                <span className="font-medium text-gray-700">City:</span> {lead.survey_responses.city}
                              </div>
                            )}
                            {lead.survey_responses.monthly_volume && (
                              <div className="text-xs">
                                <span className="font-medium text-gray-700">Volume:</span> {lead.survey_responses.monthly_volume}
                              </div>
                            )}
                            {lead.survey_responses.willingness_to_pay && (
                              <div className="text-xs">
                                <span className="font-medium text-gray-700">Budget:</span> {lead.survey_responses.willingness_to_pay}
                              </div>
                            )}
                            {lead.survey_responses.biggest_pain_point && (
                              <div className="text-xs">
                                <span className="font-medium text-gray-700">Pain Point:</span> {lead.survey_responses.biggest_pain_point}
                              </div>
                            )}
                            {lead.survey_responses.platforms_used && (
                              <div className="text-xs">
                                <span className="font-medium text-gray-700">Platforms:</span> {Array.isArray(lead.survey_responses.platforms_used) ? lead.survey_responses.platforms_used.join(', ') : lead.survey_responses.platforms_used}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Fallback to qualifications if no survey responses */}
                        {!lead.survey_responses && (
                          <div className="flex flex-wrap gap-1">
                            {lead.qualifications?.wants_notifications && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                📧 Notifications
                              </span>
                            )}
                            {lead.qualifications?.wants_demo && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                🎥 Demo
                              </span>
                            )}
                            {lead.qualifications?.wants_beta_access && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                🚀 Beta
                              </span>
                            )}
                            {lead.qualifications?.wants_early_access && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                ⚡ Early Access
                              </span>
                            )}
                            {lead.survey_responses?.timeline && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                ⏰ {lead.survey_responses.timeline}
                              </span>
                            )}
                            {lead.survey_responses?.volume && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                📊 {lead.survey_responses.volume}
                              </span>
                            )}
                            {!lead.qualifications && !lead.survey_responses && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                No Preferences
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        lead.score >= 70 ? 'bg-red-100 text-red-800' :
                        lead.score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {lead.score}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        lead.status === 'hot' ? 'bg-red-100 text-red-800' :
                        lead.status === 'warm' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          View
                        </button>
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="cold">Cold</option>
                          <option value="warm">Warm</option>
                          <option value="hot">Hot</option>
                        </select>
                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lead Detail Modal */}
      {showDetailModal && selectedLead && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Lead Details</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Name:</span> <span className="text-gray-900 font-medium">{selectedLead.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Email:</span> <span className="text-gray-900 font-medium">{selectedLead.email}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Phone:</span> <span className="text-gray-900 font-medium">{selectedLead.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Source:</span> <span className="text-gray-900 font-medium">{selectedLead.source}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Score:</span> <span className="text-gray-900 font-medium">{selectedLead.score}/100</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedLead.status === 'hot' ? 'bg-red-100 text-red-800' :
                        selectedLead.status === 'warm' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedLead.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Google Forms Survey Responses */}
                {selectedLead.survey_responses && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">📋 Google Forms Responses</h4>
                    <div className="space-y-3 text-sm">
                      {selectedLead.survey_responses.dealership_name && (
                        <div>
                          <span className="font-medium text-gray-700">Dealership Name:</span> <span className="text-gray-900 font-medium">{selectedLead.survey_responses.dealership_name}</span>
                        </div>
                      )}
                      {selectedLead.survey_responses.role && (
                        <div>
                          <span className="font-medium text-gray-700">Role:</span> <span className="text-gray-900 font-medium">{selectedLead.survey_responses.role}</span>
                        </div>
                      )}
                      {selectedLead.survey_responses.city && (
                        <div>
                          <span className="font-medium text-gray-700">City:</span> <span className="text-gray-900 font-medium">{selectedLead.survey_responses.city}</span>
                        </div>
                      )}
                      {selectedLead.survey_responses.monthly_volume && (
                        <div>
                          <span className="font-medium text-gray-700">Monthly Volume:</span> <span className="text-gray-900 font-medium">{selectedLead.survey_responses.monthly_volume}</span>
                        </div>
                      )}
                      {selectedLead.survey_responses.platforms_used && (
                        <div>
                          <span className="font-medium text-gray-700">Platforms Used:</span> <span className="text-gray-900 font-medium">{Array.isArray(selectedLead.survey_responses.platforms_used) ? selectedLead.survey_responses.platforms_used.join(', ') : selectedLead.survey_responses.platforms_used}</span>
                        </div>
                      )}
                      {selectedLead.survey_responses.biggest_pain_point && (
                        <div>
                          <span className="font-medium text-gray-700">Biggest Pain Point:</span> <span className="text-gray-900 font-medium">{selectedLead.survey_responses.biggest_pain_point}</span>
                        </div>
                      )}
                      {selectedLead.survey_responses.willingness_to_pay && (
                        <div>
                          <span className="font-medium text-gray-700">Willingness to Pay:</span> <span className="text-gray-900 font-medium">{selectedLead.survey_responses.willingness_to_pay}</span>
                        </div>
                      )}
                      {selectedLead.survey_responses.interest_confirmed && (
                        <div>
                          <span className="font-medium text-gray-700">Interest Confirmed:</span> <span className="text-gray-900 font-medium">{selectedLead.survey_responses.interest_confirmed}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Qualifications */}
                {selectedLead.qualifications && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">🎯 Lead Qualifications</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700 mr-2">Wants Notifications:</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${selectedLead.qualifications.wants_notifications ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {selectedLead.qualifications.wants_notifications ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700 mr-2">Wants Demo:</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${selectedLead.qualifications.wants_demo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {selectedLead.qualifications.wants_demo ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700 mr-2">Wants Beta Access:</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${selectedLead.qualifications.wants_beta_access ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {selectedLead.qualifications.wants_beta_access ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700 mr-2">Wants Early Access:</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${selectedLead.qualifications.wants_early_access ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {selectedLead.qualifications.wants_early_access ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {selectedLead.qualifications.budget_range && (
                        <div>
                          <span className="font-medium text-gray-700">Budget Range:</span> {selectedLead.qualifications.budget_range}
                        </div>
                      )}
                      {selectedLead.qualifications.timeline && (
                        <div>
                          <span className="font-medium text-gray-700">Timeline:</span> {selectedLead.qualifications.timeline}
                        </div>
                      )}
                      {selectedLead.qualifications.volume && (
                        <div>
                          <span className="font-medium text-gray-700">Volume:</span> {selectedLead.qualifications.volume}
                        </div>
                      )}
                      {selectedLead.qualifications.pain_points && selectedLead.qualifications.pain_points.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">Pain Points:</span> {selectedLead.qualifications.pain_points.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedLead.notes && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">📝 Notes</h4>
                    <p className="text-sm text-gray-900 font-medium">{selectedLead.notes}</p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">⏰ Timestamps</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Created:</span> <span className="text-gray-900 font-medium">{new Date(selectedLead.created_at).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Updated:</span> <span className="text-gray-900 font-medium">{new Date(selectedLead.updated_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedLead && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Lead</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete <strong>{selectedLead.name || selectedLead.email}</strong>? 
                  This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => deleteLead(selectedLead.id)}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedLead(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md w-24 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}