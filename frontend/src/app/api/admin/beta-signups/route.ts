import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Read leads from local file (same as main leads API)
    const leadsPath = path.join(process.cwd(), '..', 'leads.json');
    let leads = [];
    
    if (fs.existsSync(leadsPath)) {
      const data = fs.readFileSync(leadsPath, 'utf8');
      leads = JSON.parse(data);
    }

    // Convert leads to beta signups format
    const signups = leads.map(lead => ({
      id: lead.id,
      email: lead.email,
      role: lead.role || 'individual',
      source: lead.source,
      focus: lead.focus || 'cars',
      status: lead.status === 'hot' ? 'active' : lead.status === 'warm' ? 'invited' : 'pending',
      created_at: lead.created_at,
      updated_at: lead.updated_at
    }));

    // Calculate stats
    const total_signups = signups.length;
    const pending_signups = signups.filter(s => s.status === 'pending').length;
    const invited_signups = signups.filter(s => s.status === 'invited').length;
    const active_signups = signups.filter(s => s.status === 'active').length;
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const signups_today = signups.filter(s => {
      const signupDate = new Date(s.created_at);
      return signupDate.toDateString() === now.toDateString();
    }).length;
    
    const signups_this_week = signups.filter(s => {
      const signupDate = new Date(s.created_at);
      return signupDate > weekAgo;
    }).length;
    
    const signups_this_month = signups.filter(s => {
      const signupDate = new Date(s.created_at);
      return signupDate > monthAgo;
    }).length;

    const stats = {
      total_signups,
      pending_signups,
      invited_signups,
      active_signups,
      signups_today,
      signups_this_week,
      signups_this_month
    };

    return NextResponse.json({
      signups,
      stats
    });

  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
