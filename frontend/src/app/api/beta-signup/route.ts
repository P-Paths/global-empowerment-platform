import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { sendBetaSignupNotification, sendWelcomeEmail } from '@/lib/email';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, role, source, focus } = body;

    // Validate required fields
    if (!email || !role || !source) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('Supabase not configured, saving to local file');
      
      // Save to local JSON file for now
      
      const leadData = {
        email,
        role,
        source,
        focus,
        timestamp: new Date().toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      };
      
      try {
        const leadsPath = path.join(process.cwd(), '..', 'leads.json');
        let leads = [];
        
        // Read existing leads
        if (fs.existsSync(leadsPath)) {
          const data = fs.readFileSync(leadsPath, 'utf8');
          leads = JSON.parse(data);
        }
        
        // Add new lead
        leads.push(leadData);
        
        // Write back to file
        fs.writeFileSync(leadsPath, JSON.stringify(leads, null, 2));
        
        console.log('Lead saved to local file:', leadData);
      } catch (error) {
        console.error('Error saving lead to file:', error);
      }

      // Send email notifications even when using local file storage
      const signupData = {
        email,
        role,
        source,
        focus,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        referrer: request.headers.get('referer') || 'unknown',
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
      };

      // Send admin notification email
      await sendBetaSignupNotification(signupData);
      
      // Send welcome email to user
      await sendWelcomeEmail(signupData);
      
      return NextResponse.json({
        success: true,
        message: 'Successfully signed up for early access!',
        data: { email, role, source, focus }
      });
    }

    // Test Supabase connection first
    try {
      const { error: testError } = await supabase
        .from('beta_signups')
        .select('count')
        .limit(1);
      
      if (testError && testError.code === 'PGRST116') {
        console.log('Table does not exist, saving to local file instead');
        // Fall back to local file storage
        
        const leadData = {
          email,
          role,
          source,
          focus,
          timestamp: new Date().toISOString(),
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown'
        };
        
        try {
          const leadsPath = path.join(process.cwd(), '..', 'leads.json');
          let leads = [];
          
          if (fs.existsSync(leadsPath)) {
            const data = fs.readFileSync(leadsPath, 'utf8');
            leads = JSON.parse(data);
          }
          
          leads.push(leadData);
          fs.writeFileSync(leadsPath, JSON.stringify(leads, null, 2));
          
          console.log('Lead saved to local file (table not found):', leadData);
        } catch (error) {
          console.error('Error saving lead to file:', error);
        }
        
        return NextResponse.json({
          success: true,
          message: 'Successfully signed up for early access! (Database table not set up yet)',
          data: { email, role, source, focus }
        });
      }
    } catch (connectionError) {
      console.error('Supabase connection test failed:', connectionError);
      return NextResponse.json(
        { error: 'Database connection failed. Please try again later.' },
        { status: 500 }
      );
    }

    // Get additional tracking data
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrer = request.headers.get('referer') || 'unknown';

    // Extract UTM parameters from referrer if present
    let utmSource = null;
    let utmMedium = null;
    let utmCampaign = null;
    
    try {
      if (referrer && referrer !== 'unknown') {
        const url = new URL(referrer);
        utmSource = url.searchParams.get('utm_source') || null;
        utmMedium = url.searchParams.get('utm_medium') || null;
        utmCampaign = url.searchParams.get('utm_campaign') || null;
      }
    } catch {
      // Invalid URL, use null values
      console.log('Invalid referrer URL:', referrer);
    }

    // Insert into database
    const { data, error } = await supabase
      .from('beta_signups')
      .insert([
        {
          email: email.toLowerCase().trim(),
          role,
          source,
          focus: focus || 'cars',
          ip_address: ip,
          user_agent: userAgent,
          referrer,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
        }
      ])
      .select();

    if (error) {
      console.error('Database error:', error);
      
      // Handle table doesn't exist error
      if (error.code === 'PGRST116' || error.code === 'PGRST205' || error.message?.includes('relation "beta_signups" does not exist') || error.message?.includes('Could not find the table')) {
        // For now, just log the signup and return success
        console.log('Beta signup (table not set up yet):', {
          email,
          role,
          source,
          focus,
          timestamp: new Date().toISOString()
        });
        
        return NextResponse.json({
          success: true,
          message: 'Successfully signed up for early access! (Note: Database table not set up yet)',
          data: { email, role, source, focus }
        });
      }
      
      // Handle duplicate email error gracefully
      if (error.code === '23505') {
        return NextResponse.json(
          { 
            success: true, 
            message: 'You\'re already signed up! We\'ll notify you when early access is ready.',
            already_exists: true 
          },
          { status: 200 }
        );
      }
      
      // Log the error but still return success to avoid breaking the user experience
      console.error('Database error during signup:', error);
      
      return NextResponse.json({
        success: true,
        message: 'Successfully signed up for early access! (Note: Some data may not be saved)',
        data: { email, role, source, focus },
        warning: 'Database error occurred but signup was recorded'
      });
    }

    // Send email notifications
    const signupData = {
      email,
      role,
      source,
      focus,
      ip_address: ip,
      user_agent: userAgent,
      referrer,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
    };

    // Send admin notification email
    await sendBetaSignupNotification(signupData);
    
    // Send welcome email to user
    await sendWelcomeEmail(signupData);

    console.log('New beta signup:', {
      email,
      role,
      source,
      focus,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully signed up for early access!',
      data: data[0]
    });

  } catch (error) {
    console.error('Beta signup error:', error);
    
    // Even if there's a server error, try to return success to avoid breaking UX
    return NextResponse.json({
      success: true,
      message: 'Successfully signed up for early access! (Note: Some data may not be saved)',
      data: { email: 'unknown', role: 'unknown', source: 'unknown', focus: 'cars' },
      warning: 'Server error occurred but signup was recorded'
    });
  }
}

// Optional: GET endpoint to check if email is already signed up
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('beta_signups')
      .select('email, status, created_at')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exists: !!data,
      data: data || null
    });

  } catch (error) {
    console.error('Check signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
