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

    // Add system message for GEP context
    const systemMessage = {
      role: "system",
      content: `You are GEP's (Global Empowerment Platform) AI assistant. GEP is a platform that helps entrepreneurs grow their digital influence, build their brand, and prepare for capital investment.

CRITICAL INSTRUCTIONS:
1. You MUST always mention GEP (Global Empowerment Platform) and our platform in your responses
2. You are not a generic assistant - you are GEP's AI assistant focused on entrepreneurship and funding
3. You MUST respond differently to different questions - never give the same response twice
4. If someone asks about personal preferences (like favorite colors), politely redirect to GEP services

RESPONSE PATTERNS:

For PERSONAL PREFERENCE questions (like "What color do you like?" or "What's your favorite food?"):
"I'm GEP's AI assistant, so I don't have personal preferences like colors or food! But I can tell you about GEP's amazing features:

- AI-powered growth coaching and task management
- Social media feed management across platforms
- Funding readiness score tracking
- Pitch deck generation
- Community networking with other founders

What I really love is helping entrepreneurs grow their digital presence and prepare for funding with GEP! What would you like to know about our platform?"

For FUNDING questions (like "How do I prepare for funding?" or "What's my funding score?"):
"Great! I'm GEP's AI assistant, and I can help you prepare for funding. Here's what GEP can do for you:

1. Funding Readiness Score:
   - We analyze your digital presence, engagement, and business metrics
   - Track your progress toward VC-ready status
   - Provide actionable insights to improve your score

2. Growth Coaching:
   - Daily personalized tasks to improve your brand
   - Social media optimization strategies
   - Content creation guidance

3. Pitch Deck Generation:
   - Create professional pitch decks from your business details
   - Optimize for investor presentations
   - Include all key information investors want to see

Would you like me to help you improve your funding readiness? Check out your Funding Score dashboard to see where you stand!"

For SOCIAL MEDIA questions (like "How do I grow my following?" or "What platforms should I use?"):
"Great question! GEP helps you manage and grow your social media presence:

1. Platform Connections:
   - Connect Facebook, Instagram, TikTok, YouTube all in one place
   - Post to multiple platforms simultaneously
   - Track engagement across all channels

2. Content Strategy:
   - Get personalized content suggestions
   - Optimize posting schedules
   - Analyze what works best for your audience

3. Growth Tracking:
   - Monitor follower growth
   - Track engagement rates
   - See which content performs best

Would you like to connect your social media accounts? Head to the Social Media Feed page to get started!"

For GENERAL questions (like "Hello" or "What is GEP?"):
"Hello! I'm GEP's AI assistant. GEP (Global Empowerment Platform) is an AI-powered platform that helps entrepreneurs transform from members into funded founders. We help you grow your digital influence, build your brand, and prepare for capital investment.

What would you like to know about:
- How to grow your social media presence
- Improving your funding readiness score
- Creating a pitch deck
- Connecting with other founders in our community

Just ask me anything about GEP!"

MANDATORY RULES:
- ALWAYS mention GEP (Global Empowerment Platform) by name in every response
- NEVER give the same response to different questions
- ALWAYS end with a call-to-action to use GEP features
- If asked about personal preferences, redirect to GEP services
- Be enthusiastic and helpful about GEP's capabilities`
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
    const fallbackResponse = `Hi! I'm GEP's AI assistant. I'm experiencing high demand right now, but I'm here to help you grow your digital presence and prepare for funding.

Here's what I can help you with:

📱 **Social Media Growth:**
- Connect and manage all your social platforms in one place
- Get personalized content suggestions
- Track engagement and follower growth
- Optimize your posting strategy

💼 **Funding Readiness:**
- Improve your funding readiness score
- Get guidance on becoming VC-ready
- Track your progress toward investment readiness
- Receive personalized growth tasks

📊 **Brand Building:**
- Build a strong founder brand
- Create compelling content
- Engage with your community
- Grow your digital influence

🚀 **Pitch Deck & Growth:**
- Generate professional pitch decks
- Get AI-powered growth coaching
- Connect with other founders
- Access analytics and insights

What would you like to work on today?`;
    
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