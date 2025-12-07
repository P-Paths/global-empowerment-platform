import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const events = await request.json();
    
    console.log('📧 Email events received:', events);
    
    // Process each email event
    for (const event of events) {
      const { event: eventType, email, timestamp, sg_message_id, custom_args } = event;
      
      // Extract lead information from custom_args
      const leadId = custom_args?.lead_id;
      const dealership = custom_args?.dealership;
      const score = custom_args?.score;
      
      console.log(`📊 Email Event: ${eventType} for ${email} (Lead: ${leadId})`);
      
      // Update lead record with email engagement data
      if (leadId && leadId !== 'unknown') {
        await updateLeadEmailEngagement({
          leadId,
          email,
          eventType,
          timestamp,
          sgMessageId: sg_message_id,
          dealership,
          score
        });
      }
    }
    
    return NextResponse.json({ success: true, processed: events.length });
    
  } catch (error) {
    console.error('Error processing email events:', error);
    return NextResponse.json(
      { error: 'Failed to process email events' },
      { status: 500 }
    );
  }
}

async function updateLeadEmailEngagement(data: {
  leadId: string;
  email: string;
  eventType: string;
  timestamp: string;
  sgMessageId: string;
  dealership: string;
  score: number;
}) {
  try {
    // For now, just log the engagement data
    // In a full implementation, you'd update your database
    console.log('📈 Lead Email Engagement:', {
      leadId: data.leadId,
      dealership: data.dealership,
      email: data.email,
      event: data.eventType,
      timestamp: data.timestamp,
      score: data.score
    });
    
    // TODO: Update your Supabase database with email engagement data
    // This would involve updating the lead record with:
    // - email_opened: true/false
    // - email_clicked: true/false
    // - last_email_activity: timestamp
    // - email_engagement_score: calculated score
    
  } catch (error) {
    console.error('Error updating lead email engagement:', error);
  }
}

// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Email events webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}
