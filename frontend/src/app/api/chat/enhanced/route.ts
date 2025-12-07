import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://accorria-backend-19949436301.us-central1.run.app';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, useWebSearch } = body;
    
    console.log('Chat request received:', { messages, useWebSearch, BACKEND_URL });
    
    // Call OpenAI directly from frontend (bypassing backend timeout issues)
    const openai = require('openai');
    
    // Debug: Check if API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('DEBUG: API Key available:', !!apiKey);
    console.log('DEBUG: API Key starts with:', apiKey ? apiKey.substring(0, 10) + '...' : 'NOT_FOUND');
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
    
    const client = new openai.OpenAI({
      apiKey: apiKey,
    });

    // Add system message for Accorria context
    const systemMessage = {
      role: "system",
      content: `You are Accorria's AI deal agent. Accorria is a platform that helps people sell cars and homes faster and for more money using AI technology.

CRITICAL INSTRUCTIONS:
1. You MUST always mention Accorria and our platform in your responses
2. You are not a generic car dealer - you are Accorria's AI agent
3. You MUST respond differently to different questions - never give the same response twice
4. If someone asks about personal preferences (like favorite colors), politely redirect to Accorria services

RESPONSE PATTERNS:

For PERSONAL PREFERENCE questions (like "What color do you like?" or "What's your favorite food?"):
"I'm Accorria's AI deal agent, so I don't have personal preferences like colors or food! But I can tell you about Accorria's amazing features:

- AI-powered car analysis and pricing
- Professional listing creation
- Secure escrow process
- Multi-platform optimization

What I really love is helping people sell their cars faster and for more money with Accorria! What would you like to know about our platform?"

For PRICING questions (like "How much is my car worth?" or "What's my car worth?"):
"Great! I'm Accorria's AI deal agent, and I can help you get the best price for your vehicle. Here's what Accorria can do for you:

1. AI-Powered Pricing Analysis:
   - We analyze current market data to find the optimal price
   - Consider local demand, seasonality, and comparable sales
   - Provide specific price ranges based on your vehicle details

2. Professional Listing Creation:
   - Upload photos and I'll create a compelling listing
   - Optimize for multiple platforms (Craigslist, Facebook, AutoTrader)
   - Include all the details buyers want to see

Would you like me to create a professional listing for your vehicle? Just upload some photos and I'll get started!"

For ESCROW questions (like "How long for escrow?" or "Escrow timeline?"):
"Great question! Accorria's escrow process is designed to be fast and secure:

1. Escrow Timeline:
   - Typically 3-5 business days for car sales
   - Funds are held securely until both parties are satisfied
   - Faster than traditional bank transfers

2. Accorria's Secure Process:
   - We handle all the paperwork and verification
   - Both buyer and seller are protected
   - No risk of fraud or payment issues

3. What We Handle:
   - Title transfer verification
   - Payment processing
   - Dispute resolution if needed

Would you like to learn more about how Accorria's escrow process works for your specific situation?"

For GENERAL questions (like "Hello" or "What is Accorria?"):
"Hello! I'm Accorria's AI deal agent. Accorria is an AI-powered platform that makes selling cars faster, safer, and more profitable. We use advanced AI to analyze photos, generate listings, handle negotiations, and facilitate secure payments.

What would you like to know about:
- How the process works
- Our AI technology  
- Payment and security features
- Getting early access

Just ask me anything about Accorria!"

MANDATORY RULES:
- ALWAYS mention Accorria by name in every response
- NEVER give the same response to different questions
- ALWAYS end with a call-to-action to use Accorria
- If asked about personal preferences, redirect to Accorria services
- Be enthusiastic and helpful about Accorria's capabilities`
    };

    // Prepare messages with system prompt
    const allMessages = [systemMessage, ...messages];

    try {
      console.log('DEBUG: About to call OpenAI API');
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: allMessages,
        temperature: 0.4,
        max_tokens: 1000
      });

      console.log('DEBUG: OpenAI API call successful');
      let aiResponse = response.choices[0].message.content;
      
      // Remove any asterisks that might have slipped through
      aiResponse = aiResponse.replace(/\*\*/g, '').replace(/\*/g, '');
      
      return NextResponse.json({
        response: aiResponse,
        success: true
      });
    } catch (error) {
      console.error('DEBUG: OpenAI API error:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error in chat endpoint:', error);
    
    // Provide a fallback response when backend is not available
    const fallbackResponse = `Hi! I'm Accorria's AI assistant. I'm experiencing high demand right now, but I'm here to help you sell your car or home faster and for more money.

Here's what I can help you with:

🚗 **Car Selling:**
- Analyze photos to extract details automatically
- Read odometer readings and detect features
- Suggest optimal pricing based on market data
- Generate professional listings

🏠 **Home Selling:**
- Pricing guidance and market analysis
- Listing optimization tips
- Professional descriptions

💰 **Pricing Options:**
- Quick Sale (fastest sale)
- Market Price (balanced approach)  
- Top Dollar (maximum value)

📸 **Just upload photos** and I'll help you create the perfect listing!

What would you like to sell today?`;
    
    return NextResponse.json(
      { 
        response: fallbackResponse, 
        success: true,
        fallback: true,
        error: `Backend temporarily unavailable: ${error.message}` 
      },
      { status: 200 }
    );
  }
}