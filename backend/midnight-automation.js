// Google Apps Script - Runs 24/7 in Google's Cloud
// This will check for new form submissions and notify you

function checkForNewSubmissions() {
  // Get your Google Form responses
  const form = FormApp.openById('YOUR_FORM_ID'); // Replace with your actual form ID
  const responses = form.getResponses();
  
  // Get the last processed timestamp (stored in PropertiesService)
  const lastProcessed = PropertiesService.getScriptProperties().getProperty('lastProcessed') || 0;
  
  // Check for new responses since last check
  const newResponses = responses.filter(response => 
    response.getTimestamp().getTime() > lastProcessed
  );
  
  if (newResponses.length > 0) {
    // Process each new response
    newResponses.forEach(response => {
      const email = response.getResponseForItem(form.getItems()[0]).getResponse();
      const timestamp = response.getTimestamp();
      
      // Send to your Accorria system
      const accorriaData = {
        email: email,
        source: "google_forms",
        role: "dealer",
        focus: "cars",
        timestamp: timestamp.toISOString()
      };
      
      // Call your Accorria API
      UrlFetchApp.fetch('https://accorria.com/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        payload: JSON.stringify(accorriaData)
      });
      
      // Send you a notification email
      GmailApp.sendEmail(
        'preston@accorria.com', // Your email
        '🎉 New Lead from Google Form!',
        `New submission at ${timestamp}:\nEmail: ${email}\nSource: Google Form\n\nCheck your Accorria dashboard for details.`
      );
      
      console.log(`Processed new submission: ${email} at ${timestamp}`);
    });
    
    // Update last processed timestamp
    const latestTimestamp = Math.max(...newResponses.map(r => r.getTimestamp().getTime()));
    PropertiesService.getScriptProperties().setProperty('lastProcessed', latestTimestamp);
  }
}

// Set up trigger to run every hour (or at midnight)
function setupTrigger() {
  ScriptApp.newTrigger('checkForNewSubmissions')
    .timeBased()
    .everyHours(1) // Check every hour, or use .atHour(0) for midnight
    .create();
}
