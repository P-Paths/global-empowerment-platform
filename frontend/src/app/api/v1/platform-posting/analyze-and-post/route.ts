import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 [API] Platform posting request received at:', new Date().toISOString());
  
  try {
    // Get the backend URL from environment variable
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://accorria-backend-19949436301.us-central1.run.app';
    console.log('📡 [API] Backend URL:', backendUrl);
    
    // Get form data from request
    const formData = await req.formData();
    console.log('📦 [API] FormData received with', formData.getAll('images').length, 'images');
    
    // Extract car details from form data
    const make = formData.get('make')?.toString() || '';
    const model = formData.get('model')?.toString() || '';
    const year = formData.get('year')?.toString() || '';
    const mileage = formData.get('mileage')?.toString() || '';
    const price = formData.get('price')?.toString() || '';
    const titleStatus = formData.get('titleStatus')?.toString() || 'clean';
    const aboutVehicle = formData.get('aboutVehicle')?.toString() || '';
    
    console.log('🚗 [API] Car details:', { make, model, year, mileage, price, titleStatus });
    
    // Call the REAL enhanced-analyze endpoint to actually analyze images
    console.log('⏱️  [API] Starting image analysis...');
    const analysisStartTime = Date.now();
    
    // Create new FormData for analysis endpoint
    const analysisFormData = new FormData();
    
    // Add images
    const images = formData.getAll('images');
    images.forEach((image) => {
      if (image instanceof File) {
        analysisFormData.append('images', image);
      }
    });
    
    // Add car details for analysis
    if (make) analysisFormData.append('make', make);
    if (model) analysisFormData.append('model', model);
    if (year) analysisFormData.append('year', year);
    if (mileage) analysisFormData.append('mileage', mileage);
    if (price) analysisFormData.append('price', price);
    if (titleStatus) analysisFormData.append('titleStatus', titleStatus);
    if (aboutVehicle) analysisFormData.append('aboutVehicle', aboutVehicle);
    
    // Call enhanced-analyze endpoint with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
    
    try {
      console.log('📤 [API] Calling backend /api/v1/enhanced-analyze...');
      const analysisResponse = await fetch(`${backendUrl}/api/v1/enhanced-analyze`, {
        method: 'POST',
        body: analysisFormData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const analysisTime = Date.now() - analysisStartTime;
      console.log(`⏱️  [API] Analysis completed in ${analysisTime}ms (${(analysisTime/1000).toFixed(1)}s)`);
      
      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error('❌ [API] Analysis failed:', analysisResponse.status, errorText);
        throw new Error(`Analysis failed: ${analysisResponse.status} ${errorText}`);
      }
      
      const analysisResult = await analysisResponse.json();
      console.log('✅ [API] Analysis result received:', {
        success: analysisResult.success,
        detected: analysisResult.detected,
        description_length: analysisResult.description?.length || 0,
        processing_times: analysisResult.processing_times
      });
      
      // Return the analysis result in a format the frontend expects
      const totalTime = Date.now() - startTime;
      console.log(`✅ [API] Total request time: ${totalTime}ms (${(totalTime/1000).toFixed(1)}s)`);
      
      return new Response(JSON.stringify({
        success: true,
        message: "Listing analyzed and created successfully",
        car_analysis: {
          make: analysisResult.detected?.make || make,
          model: analysisResult.detected?.model || model,
          year: analysisResult.detected?.year || year,
          mileage: analysisResult.detected?.mileage || mileage,
          price: price,
          title: `${year} ${make} ${model}`,
          description: analysisResult.description || analysisResult.post_text || '',
          features: analysisResult.detected?.features || [],
          condition: 'Good',
          location: `${formData.get('city') || ''}, ${formData.get('zipCode') || ''}`,
          ...analysisResult.detected
        },
        analysis_result: analysisResult,
        platforms: formData.getAll('platforms') || ['accorria'],
        processing_times: analysisResult.processing_times || {},
        total_time_ms: totalTime
      }), {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('❌ [API] Request timeout after 5 minutes');
        throw new Error('Image analysis timed out after 5 minutes. Please try with fewer or smaller images.');
      }
      throw fetchError;
    }
    
  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    console.error('❌ [API] Platform posting error:', error);
    console.error('⏱️  [API] Failed after', totalTime, 'ms');
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to analyze images and create listing',
      details: error.toString(),
      total_time_ms: totalTime
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
