// Google Apps Script for 24/7 Google Forms Automation
// This runs in Google's cloud, not locally

function onFormSubmit(e) {
  // Get form data
  const email = e.values[1]; // Adjust index based on your form
  const name = e.values[2];
  const role = e.values[3];
  const source = e.values[4];
  
  // Send to Accorria API
  const accorriaData = {
    email: email,
    name: name,
    source: "google_forms",
    role: role,
    focus: "cars"
  };
  
  // Call Accorria API
  const response = UrlFetchApp.fetch('https://accorria.com/api/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(accorriaData)
  });
  
  // Send welcome email via SendGrid
  const emailData = {
    personalizations: [{
      to: [{ email: email }]
    }],
    from: { email: "preston@accorria.com" },
    subject: "Welcome to Accorria Beta! 🚀",
    content: [{
      type: "text/html",
      value: `Welcome ${name}! Thanks for signing up for Accorria beta access.`
    }]
  };
  
  UrlFetchApp.fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_SENDGRID_API_KEY',
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(emailData)
  });
  
  console.log('Automation completed for:', email);
}

// Set up trigger in Google Apps Script:
// 1. Go to script.google.com
// 2. Create new project
// 3. Paste this code
// 4. Go to Triggers → Add trigger
// 5. Select onFormSubmit function
// 6. Select "From form" → "On form submit"
// 7. Save and authorize
