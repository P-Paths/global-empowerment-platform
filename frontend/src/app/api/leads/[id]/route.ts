import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    
    console.log('🗑️ Deleting lead:', leadId);
    
    const supabase = getSupabaseClient();
    
    if (supabase) {
      // Delete from Supabase
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);
      
      if (error) {
        console.error('Supabase delete error:', error);
        return NextResponse.json(
          { error: 'Failed to delete lead from database' },
          { status: 500 }
        );
      }
      
      console.log('✅ Lead deleted from Supabase:', leadId);
    } else {
      // Fallback to local file storage
      const fs = require('fs');
      const path = require('path');
      
      const leadsFilePath = path.join(process.cwd(), 'leads.json');
      
      if (fs.existsSync(leadsFilePath)) {
        const leadsData = JSON.parse(fs.readFileSync(leadsFilePath, 'utf8'));
        const updatedLeads = leadsData.leads.filter((lead: any) => lead.id !== leadId);
        
        fs.writeFileSync(leadsFilePath, JSON.stringify({
          ...leadsData,
          leads: updatedLeads,
          count: updatedLeads.length
        }, null, 2));
        
        console.log('✅ Lead deleted from local file:', leadId);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Lead deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const updates = await request.json();
    
    console.log('📝 Updating lead:', leadId, updates);
    
    const supabase = getSupabaseClient();
    
    if (supabase) {
      // Update in Supabase
      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', leadId);
      
      if (error) {
        console.error('Supabase update error:', error);
        return NextResponse.json(
          { error: 'Failed to update lead in database' },
          { status: 500 }
        );
      }
      
      console.log('✅ Lead updated in Supabase:', leadId);
    } else {
      // Fallback to local file storage
      const fs = require('fs');
      const path = require('path');
      
      const leadsFilePath = path.join(process.cwd(), 'leads.json');
      
      if (fs.existsSync(leadsFilePath)) {
        const leadsData = JSON.parse(fs.readFileSync(leadsFilePath, 'utf8'));
        const updatedLeads = leadsData.leads.map((lead: any) => 
          lead.id === leadId ? { ...lead, ...updates, updated_at: new Date().toISOString() } : lead
        );
        
        fs.writeFileSync(leadsFilePath, JSON.stringify({
          ...leadsData,
          leads: updatedLeads
        }, null, 2));
        
        console.log('✅ Lead updated in local file:', leadId);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Lead updated successfully' 
    });
    
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}
