// Google Apps Script - Midnight Automation
// Runs at 12:00 AM every day to process Google Form submissions
// Sends data to your Accorria CRM and notifies you

function midnightAutomation() {
  console.log('🕛 Starting midnight automation...');
  
  // Get your Google Form (replace with your actual form ID)
  const formId = 'YOUR_GOOGLE_FORM_ID'; // You'll need to get this from your Google Form URL
  const form = FormApp.openById(formId);
  const responses = form.getResponses();
  
  // Get the last processed timestamp
  const scriptProperties = PropertiesService.getScriptProperties();
  const lastProcessed = scriptProperties.getProperty('lastProcessed') || 0;
  
  // Find new responses since last check
  const newResponses = responses.filter(response => 
    response.getTimestamp().getTime() > lastProcessed
  );
  
  console.log(`Found ${newResponses.length} new responses to process`);
  
  if (newResponses.length > 0) {
    let processedCount = 0;
    
    newResponses.forEach(response => {
      try {
        // Extract form data (adjust these based on your form fields)
        const email = response.getResponseForItem(form.getItems()[0]).getResponse();
        const name = response.getResponseForItem(form.getItems()[1]).getResponse();
        const role = response.getResponseForItem(form.getItems()[2]).getResponse();
        const source = response.getResponseForItem(form.getItems()[3]).getResponse();
        const timestamp = response.getTimestamp();
        
        // Calculate lead score based on form data
        let score = 50; // Base score
        
        // Boost score based on role
        if (role === 'dealer') score += 20;
        if (role === 'flipper') score += 15;
        if (role === 'investor') score += 10;
        
        // Boost score based on source
        if (source === 'referral') score += 15;
        if (source === 'social') score += 10;
        
        // Determine status based on score
        const status = score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold';
        
        // Prepare data for your CRM
        const crmData = {
          name: name,
          email: email,
          phone: null,
          source: 'google_forms',
          utm_campaign: 'google_forms',
          utm_source: 'google_forms',
          utm_medium: 'form',
          score: Math.min(100, Math.max(0, score)),
          status: status,
          notes: `Google Form submission at ${timestamp.toLocaleString()}`,
          demo_engagement: null,
          survey_responses: {
            role: role,
            source: source,
            submitted_at: timestamp.toISOString()
          }
        };
        
        // Send to your Accorria CRM
        const crmResponse = UrlFetchApp.fetch('https://accorria.com/api/leads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          payload: JSON.stringify(crmData)
        });
        
        if (crmResponse.getResponseCode() === 200) {
          console.log(`✅ Successfully added ${email} to CRM (Score: ${score}, Status: ${status})`);
          processedCount++;
        } else {
          console.error(`❌ Failed to add ${email} to CRM: ${crmResponse.getContentText()}`);
        }
        
        // Send welcome email to the person
        const welcomeEmail = {
          personalizations: [{
            to: [{ email: email, name: name }]
          }],
          from: { email: "preston@accorria.com", name: "Preston from Accorria" },
          subject: "Welcome to Accorria Beta! 🚀",
          content: [{
            type: "text/html",
            value: `
              <h2>Welcome to Accorria, ${name}!</h2>
              <p>Thanks for signing up for early access to Accorria's AI-powered listing platform.</p>
              <p>We'll be in touch soon with your beta access details.</p>
              <p>Best regards,<br>Preston<br>Founder, Accorria</p>
            `
          }]
        };
        
        UrlFetchApp.fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer YOUR_SENDGRID_API_KEY', // Replace with your actual API key
            'Content-Type': 'application/json'
          },
          payload: JSON.stringify(welcomeEmail)
        });
        
      } catch (error) {
        console.error(`Error processing response: ${error.toString()}`);
      }
    });
    
    // Update last processed timestamp
    const latestTimestamp = Math.max(...newResponses.map(r => r.getTimestamp().getTime()));
    scriptProperties.setProperty('lastProcessed', latestTimestamp);
    
    // Send you a summary notification
    if (processedCount > 0) {
      const summaryEmail = {
        personalizations: [{
          to: [{ email: "preston@accorria.com" }]
        }],
        from: { email: "preston@accorria.com" },
        subject: `🎉 Midnight Automation: ${processedCount} New Leads Added to CRM`,
        content: [{
          type: "text/html",
          value: `
            <h2>Midnight Automation Complete!</h2>
            <p><strong>${processedCount} new leads</strong> have been automatically added to your CRM.</p>
            <p>All leads have been:</p>
            <ul>
              <li>✅ Added to your Accorria database</li>
              <li>✅ Scored automatically (0-100)</li>
              <li>✅ Classified as Hot/Warm/Cold</li>
              <li>✅ Welcome emails sent</li>
            </ul>
            <p>Check your <a href="https://accorria.com/admin/leads">Accorria Admin Dashboard</a> to see the new leads.</p>
            <p>Time: ${new Date().toLocaleString()}</p>
          `
        }]
      };
      
      UrlFetchApp.fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer YOUR_SENDGRID_API_KEY', // Replace with your actual API key
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify(summaryEmail)
      });
    }
  }
  
  console.log('🕛 Midnight automation completed');
}

// Set up the midnight trigger
function setupMidnightTrigger() {
  // Delete any existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'midnightAutomation') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new trigger for midnight
  ScriptApp.newTrigger('midnightAutomation')
    .timeBased()
    .everyDays(1)
    .atHour(0) // Midnight
    .create();
    
  console.log('✅ Midnight trigger set up successfully!');
}

// Test function to run automation immediately
function testAutomation() {
  midnightAutomation();
}

