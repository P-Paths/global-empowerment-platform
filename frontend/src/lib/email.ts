import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface BetaSignupData {
  email: string;
  role: string;
  source: string;
  focus: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export async function sendBetaSignupNotification(signupData: BetaSignupData) {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_TO_EMAIL) {
    console.log('SendGrid not configured, skipping email notification');
    return;
  }

  const msg = {
    to: process.env.SENDGRID_TO_EMAIL,
    from: process.env.SENDGRID_FROM_EMAIL || 'preston@accorria.com',
    subject: `🎉 New Beta Signup: ${signupData.email}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">New Beta Signup!</h2>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">Signup Details</h3>
          <p><strong>Email:</strong> ${signupData.email}</p>
          <p><strong>Role:</strong> ${signupData.role}</p>
          <p><strong>Source:</strong> ${signupData.source}</p>
          <p><strong>Focus:</strong> ${signupData.focus}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <div style="background: #e5e7eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #374151; margin-top: 0;">Tracking Info</h4>
          <p><strong>IP:</strong> ${signupData.ip_address || 'Unknown'}</p>
          <p><strong>Referrer:</strong> ${signupData.referrer || 'Direct'}</p>
          ${signupData.utm_source ? `<p><strong>UTM Source:</strong> ${signupData.utm_source}</p>` : ''}
          ${signupData.utm_medium ? `<p><strong>UTM Medium:</strong> ${signupData.utm_medium}</p>` : ''}
          ${signupData.utm_campaign ? `<p><strong>UTM Campaign:</strong> ${signupData.utm_campaign}</p>` : ''}
        </div>

        <div style="margin-top: 30px; text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/beta-signups" 
             style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View All Signups
          </a>
        </div>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('Beta signup notification email sent successfully');
  } catch (error) {
    console.error('Error sending beta signup notification:', error);
  }
}

export async function sendWelcomeEmail(signupData: BetaSignupData) {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('SendGrid not configured, skipping welcome email');
    return;
  }

  const msg = {
    to: signupData.email,
    from: process.env.SENDGRID_FROM_EMAIL || 'preston@accorria.com',
    subject: 'Welcome to Accorria Beta! 🚀',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Welcome to Accorria Beta!</h2>
        
        <p>Hi there!</p>
        
        <p>Thanks for signing up for early access to Accorria! I'm Preston, the founder, and I'm excited to have you on board.</p>
        
        <p>Accorria is an AI-powered platform that's revolutionizing how people buy and sell cars (and soon homes). We're building something special that will make the entire process faster, smarter, and more transparent.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">What's Next?</h3>
          <ul>
            <li>You'll be among the first to try our AI-powered listing platform</li>
            <li>We'll notify you as soon as early access is ready</li>
            <li>I'll personally send you exclusive updates and behind-the-scenes insights</li>
            <li>Your feedback will directly shape the product</li>
          </ul>
        </div>

        <p>We're still gathering feedback and fine-tuning everything, so your input will be incredibly valuable. I'm personally committed to making this the best platform possible.</p>

        <p>In the meantime, feel free to follow us on social media for updates:</p>
        <ul>
          <li><a href="https://www.facebook.com/accorria">Facebook</a></li>
          <li><a href="https://www.linkedin.com/company/accorria">LinkedIn</a></li>
        </ul>

        <p>Thanks again for believing in what we're building!</p>
        
        <p>Best regards,<br>Preston Eaton<br>Founder, Accorria</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('Welcome email sent successfully to:', signupData.email);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
}
