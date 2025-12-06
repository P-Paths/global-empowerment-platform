'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useDropzone, FileRejection } from 'react-dropzone';
import carDataRaw from '@/data/carData.json';
import carTrimsRaw from '@/data/carTrims.json';
import { api } from '@/utils/api';
import { getBackendUrl, API_ENDPOINTS } from '@/config/api';
import { ListingsService } from '@/services/listingsService';
import FacebookOAuth2 from '@/components/FacebookOAuth2';
import { authenticatedFetch } from '@/utils/api';
import { correctSpelling } from '@/utils/spellChecker';
const carData = carDataRaw as Record<string, string[]>;
const carTrims = carTrimsRaw as Record<string, Record<string, string[]>>;

interface CreateListingProps {
  onClose: () => void;
  onListingCreated?: () => void;
}

interface CarDetails {
  make: string;
  model: string;
  trim: string;
  year: string;
  mileage: string;
  price: string;
  lowestPrice: string;
  titleStatus: string;
  city?: string;
  zipCode?: string;
  aboutVehicle: string; // User's input about the vehicle
  finalDescription: string; // AI-generated final description

}

interface FeatureAdjustmentDetail {
  label?: string;
  keyword?: string;
  percent: number;
  amount: number;
}

interface AnalysisResult {
  success: boolean;
  post_text?: string;
  description?: string;
  ai_analysis?: string;
  image_analysis?: {
    make?: string;
    model?: string;
    year?: string;
    color?: string;
    mileage?: number;
  };
  confidence_score?: number;
  detected?: {
    features?: string[];
    make?: string;
    model?: string;
    year?: number;
    drivetrain?: string;
    debug_gemini_detection?: {
      features_detected?: Record<string, { present: boolean; confidence?: number }>;
      badges_seen?: string[];
      exterior_color?: string;
      interior_color?: string;
      drivetrain_detected?: string;
      features_list?: string[];
      features_list_count?: number;
    };
  };
  analysis_json?: Record<string, unknown>;
  listing_context?: Record<string, unknown>;
  final_listing_text?: string;
  market_intelligence?: {
    pricing_analysis?: {
      price_trends?: {
        trend?: string;
      };
      market_prices?: {
        market_average?: number;
        kbb_value?: number;
        edmunds_value?: number;
        cargurus_value?: number;
        price_range?: {
          low?: number;
          high?: number;
        };
        data_source?: string;
      };
      price_recommendations?: {
        recommended_buy_price?: number;
        recommended_sell_price?: number;
        target_profit_margin?: number;
      };
    };
    make_model_analysis?: {
      demand_analysis?: {
        demand_level?: string;
      };
    };
    competitor_research?: {
      competitors_found?: number;
      competitors?: Array<Record<string, unknown>>;
      pricing_analysis?: {
        average_price?: number;
        price_range?: {
          min?: number;
          max?: number;
        };
      };
    };
    profit_thresholds?: {
      acquisition_thresholds?: {
        max_acquisition_price?: number;
        target_acquisition_price?: number;
      };
      selling_thresholds?: {
        min_selling_price?: number;
        target_selling_price?: number;
      };
    };
  };
  price_recommendations?: {
    price_recommendations?: Record<string, { price: number; description?: string; estimated_days_to_sell?: number }>;
  };
  pricing?: {
    quick_sale?: { price: number };
    premium?: { price: number };
    market_price?: { price: number };
    breakdown?: {
      base_market_value: number;
      title_status_adjustment: number;
      title_status_percent: number;
      condition_adjustment: number;
      condition_percent: number;
      trim_adjustment: number;
      trim_percent: number;
      mileage_adjustment: number;
      mileage_percent: number;
      feature_adjustment: number;
      feature_percent: number;
      local_market_adjustment: number;
      local_market_percent: number;
      final_adjusted_price: number;
      raw_google_price?: number;
      trim_tier?: string;
      trim_tier_label?: string;
      trim_keywords?: string[];
      mileage_range_label?: string;
      reliability_tier?: string;
      feature_details?: FeatureAdjustmentDetail[];
      feature_cap_applied?: boolean;
      market_data_source?: string;
      market_search_query?: string;
      market_location?: string;
      title_status_label?: string;
    };
  };
  vin_status?: {
    state: string;
    vin?: string;
    source?: string;
    message?: string;
    equipment?: string[];
    equipment_error?: string;
  };
  price_warnings?: {
    type: 'high' | 'low' | 'good';
    message: string;
    market_average: number;
    recommendation?: string;
  };
  data?: {
    price_trends?: Record<string, unknown>;
    demand_analysis?: Record<string, unknown>;
    condition_assessment?: {
      overall_condition?: string;
    };
    features_detected?: {
      car_features?: {
        technology?: string[];
        interior?: string[];
        exterior?: string[];
      };
    };
  };
}

interface FileWithId {
  id: string;
  file: File;
  url?: string; // Store the object URL with the file
  dataUrl?: string; // Fallback: data URL if blob URL fails
  _errorLogged?: boolean; // Track if we've already logged an error for this file
  _retryCount?: number; // Track retry attempts
  _urlType?: 'blob' | 'data'; // Track which type of URL we're using
  _corrupted?: boolean; // Track if file is corrupted and can't be loaded
  _heicConverted?: boolean; // Track if HEIC file was already converted
  _recreatingDataUrl?: boolean; // Track if we're recreating data URL
  _originalHeicFile?: File; // Store original HEIC file if converted
  isVinImage?: boolean; // Mark image as VIN-only (excluded from Facebook posts)
}

export default function CreateListing({ onClose, onListingCreated }: CreateListingProps) {
  const [files, setFiles] = useState<FileWithId[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileWithId[]>([]);
  const [renderKey, setRenderKey] = useState(0);
  const [isDragging, setIsDragging] = useState(false); // Track if photo is being dragged
  const dragStartScrollYRef = useRef(0); // Store scroll position when drag starts (use ref for immediate access)

  const [carDetails, setCarDetails] = useState<CarDetails>({
    make: '',
    model: '',
    trim: '',
    year: '',
    mileage: '',
    price: '',
    lowestPrice: '',
    titleStatus: 'clean',
    aboutVehicle: '',
    finalDescription: ''
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customMake, setCustomMake] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [priceWarning, setPriceWarning] = useState<{ type: 'high' | 'low' | 'good' | null; message: string; marketAvg: number | null }>({ type: null, message: '', marketAvg: null });
  const [priceWarningDismissed, setPriceWarningDismissed] = useState(false); // Track if user dismissed the warning
  const [showPricingBreakdown, setShowPricingBreakdown] = useState(false); // Track if pricing breakdown is expanded
  const pricingBreakdown = analysisResult?.pricing?.breakdown;
  const vinStatus = analysisResult?.vin_status;
  
  // Clear any existing error on component mount
  useEffect(() => {
    setAnalysisError(null);
  }, []);

  // Auto-fill zip code when city is set (from profile or AI analysis)
  useEffect(() => {
    const autoFillZip = async () => {
      // Only auto-fill if city is set but zip is not
      if (carDetails.city && !carDetails.zipCode) {
        try {
          const { supabase } = await import('@/utils/supabase');
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('zip_code, city')
              .eq('id', user.id)
              .maybeSingle();
            
            // If profile has zip code, auto-fill it
            if (profile?.zip_code) {
              setCarDetails(prev => ({ ...prev, zipCode: profile.zip_code }));
            }
          }
        } catch (err) {
          // Ignore errors - zip auto-fill is optional
        }
      }
    };

    autoFillZip();
  }, [carDetails.city]); // Run when city changes

  // Cleanup: Unlock scroll if component unmounts while dragging
  useEffect(() => {
    return () => {
      if (isDragging) {
        const scrollY = dragStartScrollYRef.current;
        // Restore all scroll-related styles
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.documentElement.style.overflow = '';
        document.documentElement.style.position = '';
        document.documentElement.style.top = '';
        // Restore scroll position
        window.scrollTo(0, scrollY);
      }
    };
  }, [isDragging]);

  // Keep selectedFiles in sync with files - remove selections for files that no longer exist
  useEffect(() => {
    setSelectedFiles(prev => {
      const validSelected = prev.filter(selected => files.some(f => f.id === selected.id));
      if (validSelected.length !== prev.length) {
        console.log(`🧹 Cleaned up ${prev.length - validSelected.length} invalid file selections`);
      }
      return validSelected;
    });
  }, [files]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [descriptionSuggestions, setDescriptionSuggestions] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState<Record<string, boolean>>({});
  const [isPosting, setIsPosting] = useState(false);
  const [selectedPricingTier, setSelectedPricingTier] = useState<'quick' | 'market' | 'premium' | 'original' | null>(null);
  const [titleRebuildExplanation, setTitleRebuildExplanation] = useState('');
  const [savedRebuildReasons, setSavedRebuildReasons] = useState<string[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [zipSuggestions, setZipSuggestions] = useState<string[]>([]);
  const [locationMismatchWarning, setLocationMismatchWarning] = useState<string | null>(null);
  const rebuildReasonSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [postSuccess, setPostSuccess] = useState(false);
  const [postResult, setPostResult] = useState<{successCount: number, totalCount: number} | null>(null);
  const [userPresets, setUserPresets] = useState<Array<{preset_value: string, usage_count: number}>>([]);
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);
  
  // Speech-to-Text state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [transcript, setTranscript] = useState<string>('');
  const [fieldConflicts, setFieldConflicts] = useState<Array<{field: string, speechValue: string, currentValue: string}>>([]);
  const [speechFeatures, setSpeechFeatures] = useState<string[]>([]); // Features extracted from speech

  // Load connection statuses for platforms
  useEffect(() => {
    const loadConnections = async () => {
      try {
        // Check Facebook connection - use backend URL with shorter timeout (10 seconds)
        const backendUrl = getBackendUrl();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
          const response = await authenticatedFetch(`${backendUrl}/api/v1/facebook/connection-status`, {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            setConnectedPlatforms(prev => ({
              ...prev,
              facebook_marketplace: data.connected || false
            }));
          } else {
            // Facebook not connected or not configured - this is expected
            // Silently set to false
            setConnectedPlatforms(prev => ({
              ...prev,
              facebook_marketplace: false
            }));
          }
        } catch (error: any) {
          clearTimeout(timeoutId);
          // Backend not available or network error - silently handle
          // This is expected in development when backend isn't running
          // Don't log connection-status errors - they're expected when backend is down
          if (!error?.isSilent && !error?.message?.includes('connection-status')) {
            // Only log non-connection-status errors
            console.debug('Platform connection check:', error.message);
          }
          // Silently set to false - backend not available
          setConnectedPlatforms(prev => ({
            ...prev,
            facebook_marketplace: false
          }));
        }
      } catch (outerError: any) {
        // Outer catch for any other errors - also handle silently
        setConnectedPlatforms(prev => ({
          ...prev,
          facebook_marketplace: false
        }));
      }
    };

    loadConnections();
  }, []);

  // Load saved rebuild title reasons when "rebuilt" is selected
  useEffect(() => {
    const loadRebuildReasons = async () => {
      if (carDetails.titleStatus === 'rebuilt') {
        try {
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const response = await fetch(`${backendUrl}/api/v1/presets?preset_type=rebuilt_title_reason&limit=10`, {
            credentials: 'include'
          });
          
          if (response.ok) {
            const presets = await response.json();
            const reasons = presets.map((p: any) => p.preset_value).filter(Boolean);
            setSavedRebuildReasons(reasons);
          }
        } catch (error) {
          // Silently fail - presets are optional
          console.log('Could not load rebuild reasons:', error);
        }
      } else {
        setSavedRebuildReasons([]);
      }
    };
    
    loadRebuildReasons();
  }, [carDetails.titleStatus]);

  // Save rebuild reason when user enters one
  const saveRebuildReason = async (reason: string) => {
    if (!reason.trim() || carDetails.titleStatus !== 'rebuilt') return;
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await fetch(`${backendUrl}/api/v1/presets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          preset_type: 'rebuilt_title_reason',
          preset_value: reason.trim()
        })
      });
      
      // Reload reasons to update the list
      const response = await fetch(`${backendUrl}/api/v1/presets?preset_type=rebuilt_title_reason&limit=10`, {
        credentials: 'include'
      });
      if (response.ok) {
        const presets = await response.json();
        const reasons = presets.map((p: any) => p.preset_value).filter(Boolean);
        setSavedRebuildReasons(reasons);
      }
    } catch (error) {
      console.log('Could not save rebuild reason:', error);
    }
  };

  // Load user profile (city, zip code) from Supabase
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const { supabase } = await import('@/utils/supabase');
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          try {
            // Try to get profile - use select('*') to avoid column errors
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*') // Select all columns to avoid 400 if specific columns don't exist
              .eq('id', user.id)
              .maybeSingle();
            
            if (error) {
              // Check if it's a column/table error (400) - that's okay, just skip
              const errorStatus = (error as any).status;
              if (error.code === 'PGRST116' || error.code === '42P01' || errorStatus === 400) {
                console.log('Profile table/columns not available (optional feature)');
                return;
              }
              // Other errors - log but don't break
              console.warn('Profile query error:', error.message);
              return;
            }
            
            if (profile) {
              // Auto-fill city and zip code from onboarding profile (source of truth)
              // These were validated during onboarding to ensure they match
              const updates: Partial<CarDetails> = {};
              
              // Use onboarding profile data as source of truth
              if (profile.city && !carDetails.city) {
                updates.city = profile.city;
              }
              
              // Always use zip from onboarding profile if available (it was validated to match city)
              if (profile.zip_code && !carDetails.zipCode) {
                updates.zipCode = profile.zip_code;
                console.log(`✅ Using zip ${profile.zip_code} and city ${profile.city} from onboarding profile`);
              }
              
              // If both city and zip exist in profile, validate they still match
              if (profile.city && profile.zip_code) {
                try {
                  const { onboardingService } = await import('@/services/onboardingService');
                  const zipCity = await onboardingService.getCityFromZip(profile.zip_code);
                  
                  if (zipCity && zipCity.toLowerCase().trim() === profile.city.toLowerCase().trim()) {
                    // They match - use both from onboarding
                    updates.city = profile.city;
                    updates.zipCode = profile.zip_code;
                    console.log(`✅ Using validated city/zip from onboarding: ${profile.city}, ${profile.zip_code}`);
                  } else if (zipCity) {
                    // Zip city doesn't match profile city - use zip's city (more accurate)
                    updates.city = zipCity;
                    updates.zipCode = profile.zip_code;
                    console.warn(`⚠️ Profile city ${profile.city} doesn't match zip ${profile.zip_code} (${zipCity}) - using zip's city`);
                  }
                } catch (err) {
                  // If validation fails, still use profile data
                  if (profile.city) updates.city = profile.city;
                  if (profile.zip_code) updates.zipCode = profile.zip_code;
                }
              }
              
              if (Object.keys(updates).length > 0) {
                setCarDetails(prev => ({ ...prev, ...updates }));
              }
            }
          } catch (profileError: any) {
            // Handle any errors gracefully - profile is optional
            const errorStatus = profileError?.status;
            if (profileError?.code === 'PGRST116' || profileError?.code === '42P01' || errorStatus === 400) {
              console.log('Profile table structure different (optional feature)');
            } else {
              console.warn('Failed to load profile:', profileError?.message || profileError);
            }
          }
        }
      } catch (error: any) {
        console.warn('Failed to get user for profile:', error?.message || error);
        // Silently fail - profile loading is optional
      }
    };

    loadUserProfile();
  }, []);


  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    console.log('📥 onDrop called with', acceptedFiles.length, 'accepted files');
    console.log('📁 Accepted file names:', acceptedFiles.map(f => f.name));
    
    if (rejectedFiles.length > 0) {
      console.log('❌ Rejected files details:', rejectedFiles);
              alert(`Some files were rejected. Please check file size (max 5MB) and format (JPEG, PNG, WebP).`);
    }
    
    if (acceptedFiles.length > 0) {
      // Validate files before processing
      // Handle files that might have been converted (e.g., from phone to Google Drive to JPEG)
      const validFiles = acceptedFiles.filter(file => {
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          console.warn('⚠️ File too large, skipping:', file.name, 'Size:', file.size);
          return false;
        }
        // Check if file is readable
        if (file.size === 0) {
          console.warn('⚠️ File is empty, skipping:', file.name);
          return false;
        }
        
        // Check if it's an image - be more lenient for converted files
        const isImage = file.type.startsWith('image/') || 
                       file.name.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|bmp)$/i);
        
        if (!isImage) {
          console.warn('⚠️ Not an image file, skipping:', file.name, 'Type:', file.type);
          return false;
        }
        
        // For files that might have been converted, ensure they have a proper MIME type
        // If type is empty or generic, try to infer from filename
        if (!file.type || file.type === 'application/octet-stream') {
          const ext = file.name.toLowerCase().split('.').pop();
          const mimeTypes: Record<string, string> = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'webp': 'image/webp',
            'gif': 'image/gif',
            'bmp': 'image/bmp'
          };
          if (ext && mimeTypes[ext]) {
            // Create a new File object with the correct MIME type
            // This helps with files that lost their MIME type during conversion
            Object.defineProperty(file, 'type', {
              value: mimeTypes[ext],
              writable: false,
              configurable: true
            });
            console.log('🔧 Fixed MIME type for converted file:', file.name, '→', mimeTypes[ext]);
          }
        }
        
        return true;
      });

      if (validFiles.length === 0) {
        alert('No valid image files were selected. Please select JPEG, PNG, WebP, or other image files (max 10MB each).');
        return;
      }

      if (validFiles.length < acceptedFiles.length) {
        const skipped = acceptedFiles.length - validFiles.length;
        console.warn(`⚠️ Skipped ${skipped} invalid file(s)`);
      }

      // ADD FILES TO STATE IMMEDIATELY (before compression) so they show up right away
      // Use a robust approach: Create data URL FIRST (most reliable), blob URL as secondary
      // Data URLs work for ALL file types, even files that went through multiple conversions
      // IMPORTANT: Convert HEIC files immediately so they can be previewed
      const tempFilesWithIds = await Promise.all(validFiles.map(async (file, idx) => {
        // STEP 0: Convert HEIC files immediately for preview
        const isHeic = file.name.toLowerCase().match(/\.(heic|heif)$/i) || 
                      file.type === 'image/heic' || 
                      file.type === 'image/heif';
        
        let previewFile = file;
        if (isHeic) {
          console.log('🔄 Converting HEIC file immediately for preview:', file.name);
          try {
            // Dynamic import to avoid SSR issues
            const heic2any = (await import('heic2any')).default;
            const convertedBlob = await heic2any({
              blob: file,
              toType: 'image/jpeg',
              quality: 0.92
            });
            const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
            const jpegName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
            previewFile = new File([blob], jpegName, {
              type: 'image/jpeg',
              lastModified: file.lastModified
            });
            console.log('✅ Converted HEIC to JPEG for preview:', file.name, '→', jpegName);
          } catch (heicError) {
            console.error('❌ HEIC conversion failed for preview:', file.name, heicError);
            // Continue with original file - conversion will be retried later
          }
        }
        
        const fileWithId: FileWithId = {
          id: `temp-${previewFile.name}-${previewFile.size}-${Date.now()}-${idx}`,
          file: previewFile // Use converted file for preview, original will be used in background conversion
        };
        
        // Verify file is valid
        const isValidImage = previewFile && previewFile.size > 0 && (
          previewFile.type.startsWith('image/') || 
          previewFile.name.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|bmp|heic|heif)$/i)
        );
        
        if (!isValidImage) {
          console.warn('⚠️ Invalid file, skipping:', previewFile.name, 'Type:', previewFile.type);
          return fileWithId;
        }
        
        // PRIORITY: Create data URL FIRST (most reliable for converted files)
        // Data URLs work even if files lost metadata during conversion
        try {
          fileWithId.dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            const timeout = setTimeout(() => {
              reject(new Error('FileReader timeout'));
            }, 15000); // 15 second timeout for large/converted files
            
            reader.onload = () => {
              clearTimeout(timeout);
              const result = reader.result as string;
              
              // Validate that the data URL is actually an image
              if (result && result.startsWith('data:image/')) {
                resolve(result);
              } else {
                reject(new Error('File does not appear to be a valid image'));
              }
            };
            reader.onerror = (error) => {
              clearTimeout(timeout);
              reject(error);
            };
            
            try {
              // Read the entire file as data URL (use converted file for HEIC)
              reader.readAsDataURL(previewFile);
            } catch (readError) {
              clearTimeout(timeout);
              reject(readError);
            }
          });
          
          fileWithId._urlType = 'data';
          console.log('✅ Created data URL (primary) for:', previewFile.name, 'Size:', (previewFile.size / 1024 / 1024).toFixed(2) + 'MB');
        } catch (dataError: any) {
          console.error('❌ Data URL creation failed for:', previewFile.name, dataError?.message || dataError);
          // File might be corrupted - try blob URL as last resort
        }
        
        // Try blob URL as secondary option (more memory efficient if it works)
        // But data URL is primary because it's more reliable for converted files
        if (!fileWithId.dataUrl) {
          try {
            fileWithId.url = URL.createObjectURL(previewFile);
            fileWithId._urlType = 'blob';
            console.log('✅ Created blob URL (fallback) for:', previewFile.name);
          } catch (blobError) {
            console.error('❌ Blob URL also failed for:', previewFile.name, blobError);
            // Both failed - file is likely corrupted
          }
        } else {
          // Also try blob URL for better performance, but data URL is primary
          try {
            fileWithId.url = URL.createObjectURL(previewFile);
            console.log('✅ Created blob URL (secondary) for:', previewFile.name);
          } catch (blobError) {
            // That's okay - we have data URL
            console.log('⚠️ Blob URL failed, but data URL available for:', previewFile.name);
          }
        }
        
        // Store original file if it was HEIC (for background conversion)
        if (isHeic && previewFile !== file) {
          (fileWithId as any)._originalHeicFile = file;
        }
        
        return fileWithId;
      }));
      
      console.log('⚡ Adding files to state immediately (before compression):', tempFilesWithIds.length, 'files');
      setFiles(prev => {
        const newFiles = [...prev, ...tempFilesWithIds];
        console.log('📊 Total files in state (immediate):', newFiles.length);
        return newFiles;
      });
      setRenderKey(prev => prev + 1);
      
      // Now convert HEIC files to JPEG first, then compress in background
      console.log('🔄 Starting file processing (HEIC conversion + compression) for', acceptedFiles.length, 'files...');
      try {
        const convertedFiles = await Promise.all(
          acceptedFiles.map(async (file, idx): Promise<File> => {
            try {
              // STEP 1: Check if this file was already converted from HEIC in preview step
              // Find the corresponding temp file to see if it was already converted
              const tempFile = tempFilesWithIds.find(tf => 
                tf.file.name === file.name || 
                (tf.file.name.replace(/\.jpg$/i, '') === file.name.replace(/\.(heic|heif)$/i, ''))
              );
              
              // If file was already converted from HEIC, use the converted version
              let processedFile = file;
              if (tempFile && (tempFile as any)._originalHeicFile) {
                console.log('♻️ Using already-converted HEIC file:', tempFile.file.name);
                processedFile = tempFile.file; // Use the already-converted JPEG version
              } else {
                // STEP 1b: Convert HEIC/HEIF files to JPEG if not already converted
                const isHeic = file.name.toLowerCase().match(/\.(heic|heif)$/i) || 
                              file.type === 'image/heic' || 
                              file.type === 'image/heif';
                
                if (isHeic) {
                  console.log('🔄 Converting HEIC file to JPEG:', file.name);
                  try {
                    // Dynamic import to avoid SSR issues
                    const heic2any = (await import('heic2any')).default;
                    const convertedBlob = await heic2any({
                      blob: file,
                      toType: 'image/jpeg',
                      quality: 0.92
                    });
                    
                    // heic2any returns an array, get the first result
                    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                    
                    // Create a new File object with JPEG extension
                    const jpegName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
                    processedFile = new File([blob], jpegName, {
                      type: 'image/jpeg',
                      lastModified: file.lastModified
                    });
                    
                    console.log('✅ Converted HEIC to JPEG:', file.name, '→', jpegName, 'Size:', processedFile.size);
                  } catch (heicError) {
                    console.error('❌ HEIC conversion failed for:', file.name, heicError);
                    // If conversion fails, try to continue with original (might fail later)
                    alert(`Failed to convert HEIC file ${file.name}. Please convert it to JPEG manually.`);
                    return file;
                  }
                }
              }
              
              // STEP 2: Now compress the file (or converted JPEG)
              // Skip compression for small JPEG files (already optimized, compression can corrupt them)
              if (processedFile.type === 'image/jpeg' && processedFile.size < 3 * 1024 * 1024) { // Less than 3MB
                console.log('⏭️ Skipping compression for small JPEG:', processedFile.name, processedFile.size);
                return processedFile;
              }
              
              // Skip compression for small files in general
              if (processedFile.size < 1 * 1024 * 1024) { // Less than 1MB
                console.log('⏭️ Skipping compression for small file:', processedFile.name, processedFile.size);
                return processedFile;
              }
              
              // Skip compression for formats that don't compress well or might get corrupted
              const skipCompressionTypes = ['image/gif', 'image/webp', 'image/bmp'];
              if (skipCompressionTypes.includes(processedFile.type)) {
                console.log('⏭️ Skipping compression for format:', processedFile.type, processedFile.name);
                return processedFile;
              }
              
              // Compress images to reduce file size (JPEG, PNG mainly)
              if (processedFile.type.startsWith('image/')) {
                
                // Create a canvas to compress the image
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                  console.warn('Canvas context not available, using original file');
                  return processedFile;
                }
                
                const img = new Image();
                
                return new Promise<File>((resolve, reject) => {
                  // Set timeout to prevent hanging
                  const timeout = setTimeout(() => {
                    console.warn(`Compression timeout for ${processedFile.name}, using original`);
                    resolve(processedFile);
                  }, 10000); // 10 second timeout
                  
                  img.onerror = () => {
                    clearTimeout(timeout);
                    console.warn(`Failed to load image ${processedFile.name}, using original`);
                    resolve(processedFile);
                  };
                  
                  img.onload = () => {
                    clearTimeout(timeout);
                    try {
                      // Calculate new dimensions (max 1200px width/height)
                      const maxSize = 1200;
                      let { width, height } = img;
                      
                      if (width > height) {
                        if (width > maxSize) {
                          height = (height * maxSize) / width;
                          width = maxSize;
                        }
                      } else {
                        if (height > maxSize) {
                          width = (width * maxSize) / height;
                          height = maxSize;
                        }
                      }
                      
                      canvas.width = width;
                      canvas.height = height;
                      
                      // Draw and compress
                      ctx.drawImage(img, 0, 0, width, height);
                      
                      // Determine output format based on input
                      let outputType = 'image/jpeg';
                      let quality = 0.85; // Default quality
                      
                      // Preserve PNG transparency if original was PNG
                      if (processedFile.type === 'image/png') {
                        outputType = 'image/png';
                        quality = 0.9;
                      }
                      
                      canvas.toBlob((blob) => {
                        if (blob && blob.size > 0) {
                          // Only use compressed version if it's actually smaller
                          if (blob.size < processedFile.size) {
                            const compressedFile = new File([blob], processedFile.name, {
                              type: outputType,
                              lastModified: Date.now()
                            });
                            console.log(`✅ Compressed ${processedFile.name}: ${processedFile.size} → ${blob.size} bytes`);
                            resolve(compressedFile);
                          } else {
                            console.log(`⏭️ Compression didn't reduce size for ${processedFile.name}, using original`);
                            resolve(processedFile);
                          }
                        } else {
                          console.warn(`⚠️ Compression failed for ${processedFile.name}, using original`);
                          resolve(processedFile);
                        }
                      }, outputType, quality);
                    } catch (error) {
                      console.warn(`Error compressing ${processedFile.name}:`, error);
                      resolve(processedFile);
                    }
                  };
                  
                  img.src = URL.createObjectURL(processedFile);
                });
              }
              return processedFile;
            } catch (error) {
              console.warn(`Error processing file ${file.name}:`, error);
              return file; // Return original file on error
            }
          })
        );
        
        console.log('✅ File compression complete. Processed', convertedFiles.length, 'files');
        
        // Replace temp files with compressed versions
        // IMPORTANT: Preserve data URLs from temp files, create new blob URLs for final files
        const filesWithIds = await Promise.all(convertedFiles.map(async (file, idx) => {
          // Find the corresponding temp file to preserve its data URL
          // Match by name, or by base name if one was converted (e.g., IMG_5766.heic -> IMG_5766.jpg)
          const tempFile = tempFilesWithIds.find(tf => {
            if (tf.file.name === file.name) return true;
            // Check if names match when ignoring extensions (for HEIC conversions)
            const tfBase = tf.file.name.replace(/\.(jpg|jpeg|png|heic|heif)$/i, '');
            const fileBase = file.name.replace(/\.(jpg|jpeg|png|heic|heif)$/i, '');
            return tfBase === fileBase && tfBase.length > 0;
          });
          
          const fileWithId: FileWithId = {
            id: `${file.name}-${file.size}-${file.lastModified}-${Date.now()}-${idx}`,
            file
          };
          
          // Preserve data URL from temp file (works with any File object)
          if (tempFile && tempFile.dataUrl) {
            fileWithId.dataUrl = tempFile.dataUrl;
            fileWithId._urlType = 'data';
            console.log('♻️ Preserved data URL from temp file:', file.name);
          }
          
          // Create new blob URL for the final file (tied to this File object)
          try {
            if (file && file.size > 0 && file.type.startsWith('image/')) {
              fileWithId.url = URL.createObjectURL(file);
              fileWithId._urlType = fileWithId._urlType || 'blob';
              console.log('🆕 Created blob URL for final file:', file.name, 'Size:', file.size);
            } else {
              console.warn('⚠️ Invalid file, skipping blob URL:', file.name);
            }
          } catch (error) {
            console.error('❌ Failed to create blob URL for final file:', file.name, error);
            // Data URL is still available as fallback
          }
          
          // If no data URL exists yet, create one as backup
          if (!fileWithId.dataUrl) {
            try {
              fileWithId.dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);
                reader.onload = () => {
                  clearTimeout(timeout);
                  resolve(reader.result as string);
                };
                reader.onerror = () => {
                  clearTimeout(timeout);
                  reject(new Error('FileReader failed'));
                };
                reader.readAsDataURL(file);
              });
              console.log('✅ Created data URL backup for final file:', file.name);
            } catch (dataError) {
              console.error('❌ Failed to create data URL backup:', file.name, dataError);
            }
          }
          
          return fileWithId;
        }));
        
        console.log('✅ Files processed, replacing with compressed versions:', filesWithIds.length, 'files');
        console.log('📋 File names:', filesWithIds.map(f => f.file.name));
        
        setFiles(prev => {
          // Remove temp files but DON'T revoke URLs - they're being reused!
          const tempFiles = prev.filter(f => f.id.startsWith('temp-'));
          const withoutTemp = prev.filter(f => !f.id.startsWith('temp-'));
          const newFiles = [...withoutTemp, ...filesWithIds];
          console.log('📊 Total files in state after compression:', newFiles.length);
          
          // DON'T revoke temp file URLs - they're being preserved in the new files
          // Only revoke URLs that aren't being reused
          const reusedUrls = new Set(filesWithIds.map(f => f.url).filter(Boolean));
          setTimeout(() => {
            tempFiles.forEach(f => {
              // Only revoke if URL wasn't reused
              if (f.url && !reusedUrls.has(f.url)) {
                try {
                  URL.revokeObjectURL(f.url);
                  console.log('🧹 Revoked unused temp file URL:', f.file.name);
                } catch (error) {
                  // Ignore
                }
              } else if (f.url) {
                console.log('♻️ URL reused, not revoking:', f.file.name);
              }
            });
          }, 2000); // Longer delay to ensure everything is stable
          
          return newFiles;
        });
        
        // Force re-render to ensure UI updates
        setRenderKey(prev => prev + 1);
      } catch (error) {
        console.error('❌ Error during file compression:', error);
        // Files are already in state, so UI should still show them
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.tif', '.heic', '.heif']
    },
    maxFiles: 20,
    maxSize: 10 * 1024 * 1024, // 10MB per file (reasonable limit)
    multiple: true,
    noClick: false,
    noKeyboard: false,
    // Don't reject files - we'll handle validation ourselves for better error messages
    validator: null
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleFileSelection = (fileWithId: FileWithId) => {
    console.log('Toggle file selection called for:', fileWithId.file.name);
    setSelectedFiles(prev => {
      // First, clean up any selected files that no longer exist in the files array
      const validSelected = prev.filter(selected => files.some(f => f.id === selected.id));
      
      if (validSelected.some(f => f.id === fileWithId.id)) {
        console.log('Removing file from selection:', fileWithId.file.name);
        return validSelected.filter(f => f.id !== fileWithId.id);
      } else if (validSelected.length < 5) {
        // Verify the file exists in the files array before selecting
        const fileExists = files.some(f => f.id === fileWithId.id);
        if (fileExists) {
          console.log('Adding file to selection:', fileWithId.file.name);
          return [...validSelected, fileWithId];
        } else {
          console.warn('⚠️ Cannot select file - not found in files array:', fileWithId.file.name);
          return validSelected;
        }
      }
      console.log('Max selection reached (5 files)');
      return validSelected;
    });
  };

  const handleTestPost = async () => {
    // Use market rate as default if no pricing tier is selected
    const pricingTier = selectedPricingTier || 'market';
    
    setIsPosting(true);
    
    try {
      // Upload photos to Supabase (filter out VIN images)
      const filesToPost = files.filter(f => !f.isVinImage);
      const imageUrls = await uploadPhotosToSupabase(filesToPost);
      
      // Calculate price based on selected tier
      const basePrice = parseInt(carDetails.price || '0');
      const finalPrice = pricingTier === 'quick' ? Math.floor(basePrice * 0.85) :
                        pricingTier === 'premium' ? Math.floor(basePrice * 1.15) :
                        basePrice;
      
      // Create listing data for database
      const listingData = {
        title: `${carDetails.year} ${carDetails.make} ${carDetails.model}`,
        description: carDetails.finalDescription,
        price: finalPrice,
        platforms: selectedPlatforms.length > 0 ? selectedPlatforms : ['accorria'],
        status: 'active' as const,
        images: imageUrls,
        make: carDetails.make,
        model: carDetails.model,
        year: parseInt(carDetails.year) || new Date().getFullYear(),
        mileage: carDetails.mileage,
        condition: 'good',
        location: 'Detroit, MI',
        titleStatus: carDetails.titleStatus || 'Clean',
        postedAt: new Date().toISOString()
      };
      
      // Use the listingsService to create the listing
      const listingsService = new ListingsService();
      const createdListing = await listingsService.createListing(listingData);
      
      if (createdListing) {
        console.log('Listing created successfully:', createdListing);
        
        // Show success state
        setPostResult({ successCount: 1, totalCount: 1 });
        setPostSuccess(true);
        
        // Notify parent component that listing was created
        if (onListingCreated) {
          onListingCreated();
        }
      } else {
        throw new Error('Failed to create listing');
      }
      
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('Failed to create listing. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  // Save listing as draft without posting
  const handleSaveDraft = async () => {
    if (files.length === 0) {
      alert('Please upload at least one image');
      return;
    }

    setIsPosting(true);
    
    try {
      // Upload photos to Supabase (filter out VIN images)
      const filesToPost = files.filter(f => !f.isVinImage);
      const imageUrls = await uploadPhotosToSupabase(filesToPost);
      
      // Save listing without posting to any platforms
      const saved = await saveListingToDatabase(imageUrls, analysisResult);
      
      if (saved) {
        alert('✅ Listing saved as draft! You can post it to platforms later from your listings page.');
        setPostResult({ successCount: 0, totalCount: 0 });
        setPostSuccess(true);
        
        // Notify parent component that listing was created
        if (onListingCreated) {
          onListingCreated();
        }
      } else {
        throw new Error('Failed to save listing');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save listing. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };


  const generateAIDescription = (analysisResult: AnalysisResult, carDetails: CarDetails, titleRebuildExplanation?: string): string => {
    let description = '';
    
    // CRITICAL: Use DETECTED values from Gemini Vision if available, otherwise fall back to user input
    // This ensures we use what the AI actually saw in the photos, not what the user typed
    const detectedMake = analysisResult?.detected?.make;
    const detectedModel = analysisResult?.detected?.model;
    const detectedYear = analysisResult?.detected?.year;
    
    const make = (detectedMake && detectedMake !== "Unknown") ? detectedMake : (carDetails.make || "Unknown");
    const model = (detectedModel && detectedModel !== "Unknown") ? detectedModel : (carDetails.model || "Unknown");
    const year = detectedYear ? detectedYear.toString() : (carDetails.year || "Unknown");
    const mileage = carDetails.mileage || "Unknown";
    const price = carDetails.price || '';
    const titleStatus = carDetails.titleStatus || 'clean';
    
    // Log what we're using for debugging
    if (detectedMake || detectedModel) {
      console.log('📸 Using DETECTED vehicle info:', { detectedMake, detectedModel, detectedYear });
      console.log('📝 User provided:', { make: carDetails.make, model: carDetails.model, year: carDetails.year });
      console.log('✅ Final values:', { make, model, year });
    }
    
    // Calculate price based on selected tier and market data if available
    let displayPrice = parseInt(price || '0');
    
    // First, try to use pricing tiers from analysis result
    if (analysisResult.pricing) {
      if (selectedPricingTier === 'quick' && analysisResult.pricing.quick_sale?.price) {
        displayPrice = analysisResult.pricing.quick_sale.price;
      } else if (selectedPricingTier === 'premium' && analysisResult.pricing.premium?.price) {
        displayPrice = analysisResult.pricing.premium.price;
      } else if ((selectedPricingTier === 'market' || !selectedPricingTier) && analysisResult.pricing.market_price?.price) {
        displayPrice = analysisResult.pricing.market_price.price;
      }
    }
    
    // Fallback: Calculate price based on market data if pricing tiers not available
    if (displayPrice === parseInt(price || '0') || displayPrice === 0) {
      const marketData = analysisResult.market_intelligence?.pricing_analysis;
      let basePriceForTier = displayPrice;
      
      // Use market average if available, otherwise use user's price
      if (marketData?.market_prices?.market_average) {
        const marketAvg = (marketData.market_prices as { market_average?: number }).market_average || displayPrice;
        basePriceForTier = Math.floor(marketAvg);
      }
      
      if (selectedPricingTier === 'quick') {
        displayPrice = Math.floor(basePriceForTier * 0.85);
      } else if (selectedPricingTier === 'premium') {
        displayPrice = Math.floor(basePriceForTier * 1.15);
      } else {
        // For market rate, use the base price (market average or user's price)
        displayPrice = basePriceForTier;
      }
    }
    
    // Build description in your exact format with emojis
    description += `🚗 ${year} ${make} ${model}\n`;
    description += `💰 Asking Price: $${displayPrice.toLocaleString()}\n`;
    description += `🏁 Mileage: ${parseInt(mileage).toLocaleString()} miles\n`;
    
    // Title status is metadata for AI conversations - NOT included in listing description
    // The AI will use this information when answering buyer questions about the title
    // Show location: Just city (or city, state) - don't show zip code as it can be confusing
    // Zip code 48239 is Bradford, not Detroit, so showing "Detroit, 48239" is misleading
    const location = carDetails.city 
      ? carDetails.city.includes(',') ? carDetails.city : `${carDetails.city}, MI`
      : 'Detroit, MI';
    description += `📍 Location: ${location}\n\n`;
    
    // Details section
    description += `💡 Details:\n`;
    
    // Add AI-detected details if available
    if (analysisResult.data?.condition_assessment) {
      const condition = analysisResult.data.condition_assessment;
      if (condition.overall_condition) {
        description += `• ${condition.overall_condition} condition\n`;
      }
    }
    
    // Title rebuild explanation is metadata for AI conversations - NOT included in listing description
    // The AI will use this when buyers ask "Why was the title rebuilt?"
    
    // Add default details if no AI analysis
    if (!analysisResult.data?.features_detected) {
      description += `• Runs and drives\n`;
      description += `• Transmission works great\n`;
      description += `• Good condition\n`;
    }
    
    description += `\n`;
    
    // Features section
    description += `🔧 Features & Equipment:\n`;
    
    // Add features from speech-to-text first (user explicitly mentioned these)
    if (speechFeatures.length > 0) {
      const featureMap: { [key: string]: string } = {
        'backup_camera': 'Backup camera',
        'bluetooth': 'Bluetooth & USB',
        'apple_carplay': 'Apple CarPlay & Android Auto',
        'android_auto': 'Android Auto',
        'navigation': 'Navigation system',
        'heated_seats': 'Heated seats',
        'leather_seats': 'Leather seats',
        'alloy_wheels': 'Alloy wheels',
        'cruise_control': 'Cruise control',
        'dual_zone_climate': 'Dual-zone climate control',
        'sunroof': 'Sunroof',
        'tinted_windows': 'Tinted windows',
        'touchscreen': 'Touchscreen display',
        'premium_audio': 'Premium audio system',
        'keyless_entry': 'Keyless entry',
        'push_button_start': 'Push-button start',
        'lane_departure': 'Lane departure warning',
        'blind_spot': 'Blind spot monitoring',
        'adaptive_cruise': 'Adaptive cruise control',
        'parking_sensors': 'Parking sensors',
        'led_headlights': 'LED headlights',
        'fog_lights': 'Fog lights',
        'spoiler': 'Rear spoiler',
        'chrome_trim': 'Chrome trim',
        'premium_wheels': 'Premium wheels',
        'awd': 'All-wheel drive (AWD)',
        '4wd': 'Four-wheel drive (4WD)',
        '4x4': 'Four-wheel drive (4x4)',
        'roof_rack': 'Roof rails/rack'
      };
      
      speechFeatures.forEach(feature => {
        const readableFeature = featureMap[feature] || feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        description += `• ${readableFeature}\n`;
      });
    }
    
    // Add user-provided features from aboutVehicle (if not already added from speech)
    if (carDetails.aboutVehicle && carDetails.aboutVehicle.trim() && speechFeatures.length === 0) {
      // Handle both comma-separated and line-break separated items
      const userFeatures = carDetails.aboutVehicle
        .split(/[,\n]/) // Split by comma OR newline
        .map(feature => feature.trim())
        .filter(feature => feature.length > 0 && !feature.toLowerCase().startsWith('voice:')); // Remove empty items and voice prefixes
      
      userFeatures.forEach(feature => {
        description += `• ${feature}\n`;
      });
    }
    
    // Add detected features from analysis (image analysis)
    if (analysisResult.data?.features_detected) {
      const features = analysisResult.data.features_detected;
      const featureList = [];
      
      if (features.car_features?.technology?.length > 0) {
        featureList.push(...features.car_features.technology);
      }
      if (features.car_features?.interior?.length > 0) {
        featureList.push(...features.car_features.interior);
      }
      if (features.car_features?.exterior?.length > 0) {
        featureList.push(...features.car_features.exterior);
      }
      
      // Map feature names to readable format
      const featureMap: { [key: string]: string } = {
        'backup_camera': 'Backup camera',
        'bluetooth': 'Bluetooth & USB',
        'apple_carplay': 'Apple CarPlay & Android Auto',
        'navigation': 'Navigation system',
        'heated_seats': 'Heated seats',
        'leather_seats': 'Leather seats',
        'alloy_wheels': 'Alloy wheels',
        'cruise_control': 'Cruise control',
        'dual_zone_climate': 'Dual-zone climate control',
        'sunroof': 'Sunroof',
        'tinted_windows': 'Tinted windows',
        'touchscreen': 'Touchscreen display',
        'premium_audio': 'Premium audio system',
        'keyless_entry': 'Keyless entry',
        'push_button_start': 'Push-button start',
        'lane_departure': 'Lane departure warning',
        'blind_spot': 'Blind spot monitoring',
        'adaptive_cruise': 'Adaptive cruise control',
        'parking_sensors': 'Parking sensors',
        'led_headlights': 'LED headlights',
        'fog_lights': 'Fog lights',
        'spoiler': 'Rear spoiler',
        'chrome_trim': 'Chrome trim',
        'premium_wheels': 'Premium wheels',
        'awd': 'All-wheel drive (AWD)',
        '4wd': 'Four-wheel drive (4WD)',
        '4x4': 'Four-wheel drive (4x4)'
      };
      
      // Add drivetrain if detected
      if (analysisResult.detected?.drivetrain) {
        const drivetrain = analysisResult.detected.drivetrain.toLowerCase();
        if (drivetrain.includes('awd') || drivetrain.includes('all-wheel')) {
          featureList.push('awd');
        } else if (drivetrain.includes('4wd') || drivetrain.includes('4x4') || drivetrain.includes('four-wheel')) {
          featureList.push('4wd');
        }
      }
      
      const uniqueFeatures = [...new Set(featureList.slice(0, 6))];
      uniqueFeatures.forEach(feature => {
        const readableFeature = featureMap[feature] || feature.replace(/_/g, ' ');
        description += `• ${readableFeature}\n`;
      });
    }
    
    // Add VIN-detected features to description
    const vinFeatures = analysisResult.detected?.debug_gemini_detection?.features_list || 
                        analysisResult.vin_status?.equipment || 
                        analysisResult.listing_context?.features_list;
    
    if (vinFeatures && Array.isArray(vinFeatures) && vinFeatures.length > 0) {
      // Filter out features that might already be in the description
      const existingFeatures = description.toLowerCase();
      vinFeatures.forEach(feature => {
        if (feature && typeof feature === 'string') {
          // Check if this feature is already mentioned
          const featureLower = feature.toLowerCase();
          const alreadyMentioned = existingFeatures.includes(featureLower) || 
                                   existingFeatures.includes(featureLower.replace(/\s+/g, ' '));
          
          if (!alreadyMentioned) {
            // Format the feature nicely
            const formattedFeature = feature
              .replace(/_/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase())
              .trim();
            description += `• ${formattedFeature}\n`;
          }
        }
      });
    }
    
    // Add standard features ONLY if no detected features AND no VIN lookup was performed
    // (VIN lookup would have added real features, so we don't want to add defaults in that case)
    const hasDetectedFeatures = analysisResult.data?.features_detected?.car_features && 
      (analysisResult.data.features_detected.car_features.technology?.length > 0 ||
       analysisResult.data.features_detected.car_features.interior?.length > 0 ||
       analysisResult.data.features_detected.car_features.exterior?.length > 0);
    
    const hasFeaturesFromAnalysis = analysisResult.detected?.features && 
      analysisResult.detected.features.length > 0;
    
    const hasVINFeatures = vinFeatures && Array.isArray(vinFeatures) && vinFeatures.length > 0;
    
    // DO NOT add default features - only include what's actually detected or mentioned by the user
    // This prevents adding features that don't exist on the vehicle
    
    // Add title-specific context to the description - use actual car details
    let titleContext = '';
    const vehicleType = analysisResult?.image_analysis?.color || analysisResult?.detected?.make 
      ? `${make} ${model}` 
      : 'vehicle';
    
    if (titleStatus === 'clean') {
      titleContext = `${make} ${model} with a clean title, priced competitively.`;
    } else if (titleStatus === 'rebuilt') {
      titleContext = `Rebuilt title ${make} ${model}, professionally restored and ready to drive.`;
    } else if (titleStatus === 'salvage') {
      titleContext = `Salvage title ${make} ${model}, great for parts or restoration project.`;
    } else if (titleStatus === 'flood') {
      titleContext = `Flood title ${make} ${model}, sold as-is for parts or restoration.`;
    } else if (titleStatus === 'lemon') {
      titleContext = `Lemon title ${make} ${model}, sold as-is, great for parts.`;
    } else if (titleStatus === 'junk') {
      titleContext = `Junk title ${make} ${model}, sold for parts only.`;
    } else {
      titleContext = `${make} ${model}, priced right for the market.`;
    }
    
    description += `\n🔑 ${titleContext}\n\n`;
    description += `📱 Message me to schedule a test drive or make an offer!`;
    
    // Remove all hyphens (-) and em dashes (—), preserve line breaks
    description = description.replace(/-/g, ' ').replace(/—/g, ' ');
    // Clean up multiple spaces but preserve newlines
    description = description.replace(/[ \t]+/g, ' ').replace(/[ \t]*\n[ \t]*/g, '\n');
    
    return description;
  };

  // Function to fetch market intelligence
  const fetchMarketIntelligence = useCallback(async (location?: string) => {
    if (!carDetails.make || !carDetails.model) return;
    
    try {
      const marketLocation = location || 
        (carDetails.zipCode ? `${carDetails.city || ''}, ${carDetails.zipCode}`.trim() : 
         carDetails.city || 'United States');
      
      const marketResult = await api.post(API_ENDPOINTS.MARKET_INTELLIGENCE_ANALYZE, {
        make: carDetails.make,
        model: carDetails.model,
        year: carDetails.year ? parseInt(carDetails.year) : undefined,
        mileage: carDetails.mileage ? parseInt(carDetails.mileage) : undefined,
        location: marketLocation,
        analysis_type: 'pricing_analysis',  // Changed from 'comprehensive' to 'pricing_analysis' for faster results
        radius_miles: 50,
      }) as { data?: Record<string, unknown>; success?: boolean };
      
      if (marketResult && marketResult.data) {
        const marketData = marketResult.data as Record<string, unknown>;
        setAnalysisResult((prev) => prev ? ({ ...prev, market_intelligence: marketData }) : null);
        
        // Update pricing tiers based on market data
        const pricingAnalysis = marketData.pricing_analysis as { market_prices?: { market_average?: number } } | undefined;
        if (pricingAnalysis?.market_prices?.market_average) {
          const marketAvg = pricingAnalysis.market_prices.market_average;
          if (marketAvg && carDetails.price) {
            const currentPrice = parseInt(carDetails.price);
            // Validate price against market
            const priceDiff = currentPrice - marketAvg;
            const priceDiffPct = (priceDiff / marketAvg * 100);
            
            if (currentPrice < marketAvg * 0.8) {
              // Price is too low (good for quick sale)
              setPriceWarning({
                type: 'low',
                message: `Your price is ${Math.abs(priceDiffPct).toFixed(1)}% below market average ($${marketAvg.toLocaleString()}). Good for quick sale!`,
                marketAvg
              });
            } else if (currentPrice > marketAvg * 1.2) {
              // Price is too high
              const recommendedPrice = Math.round(marketAvg * 1.1);
              setPriceWarning({
                type: 'high',
                message: `Your price is ${priceDiffPct.toFixed(1)}% above market average ($${marketAvg.toLocaleString()}). Consider lowering to $${recommendedPrice.toLocaleString()} for better market fit.`,
                marketAvg
              });
            } else {
              // Price is within range
              setPriceWarning({
                type: 'good',
                message: `Your price is within market range (market average: $${marketAvg.toLocaleString()}).`,
                marketAvg
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Market intelligence error:', error);
    }
  }, [carDetails.make, carDetails.model, carDetails.year, carDetails.mileage, carDetails.city, carDetails.zipCode]);

  // DISABLED: Don't fetch market intelligence automatically before "Coordinate" is clicked
  // This prevents showing incorrect pricing before the AI analysis is complete
  // Market intelligence will be fetched when "Coordinate" button is clicked (in analyzeImages)
  // useEffect(() => {
  //   if (carDetails.zipCode && carDetails.zipCode.length >= 5 && carDetails.make && carDetails.model) {
  //     const timer = setTimeout(() => {
  //       fetchMarketIntelligence();
  //     }, 1000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [carDetails.zipCode, carDetails.make, carDetails.model, fetchMarketIntelligence]);

  // DISABLED: Don't fetch market intelligence when price is set
  // Wait until "Coordinate" is clicked to get accurate pricing
  // useEffect(() => {
  //   if (carDetails.price && parseInt(carDetails.price) > 0 && carDetails.make && carDetails.model && analysisResult) {
  //     const timer = setTimeout(() => {
  //       fetchMarketIntelligence();
  //     }, 1500);
  //     return () => clearTimeout(timer);
  //   }
  // }, [carDetails.price, carDetails.make, carDetails.model, analysisResult, fetchMarketIntelligence]);

  // Regenerate description when any relevant field changes
  useEffect(() => {
    if (analysisResult && carDetails.finalDescription) {
      const newDescription = generateAIDescription(analysisResult, carDetails, titleRebuildExplanation);
      setCarDetails(prev => ({ ...prev, finalDescription: newDescription }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedPricingTier, 
    analysisResult, 
    carDetails.make, 
    carDetails.model, 
    carDetails.year, 
    carDetails.mileage, 
    carDetails.price, 
    carDetails.titleStatus,
    carDetails.city,
    carDetails.zipCode,
    carDetails.aboutVehicle,
    titleRebuildExplanation
  ]);

  // Speech-to-Text: Check microphone permissions
  const checkMicrophonePermission = async (): Promise<boolean> => {
    try {
      // Check if MediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Microphone access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
        return false;
      }

      // Check current permission status
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          
          if (permissionStatus.state === 'denied') {
            alert(
              'Microphone access is required for voice input.\n\n' +
              'Why we need permission: Unlike simple websites, Accorria uses advanced speech-to-text technology to convert your voice into text for faster listing creation. This requires microphone access to record your voice.\n\n' +
              'To enable:\n' +
              '• Chrome/Edge: Click the lock icon in the address bar → Site settings → Microphone → Allow\n' +
              '• Firefox: Click the lock icon → Permissions → Microphone → Allow\n' +
              '• Safari: Safari → Settings → Websites → Microphone → Allow for accorria.com\n\n' +
              'Your privacy: We only record when you click the microphone button, and audio is processed securely.'
            );
            return false;
          }
        } catch (permError) {
          // Permissions API might not be fully supported, continue anyway
          console.log('Permission query not fully supported, attempting direct access');
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      return false;
    }
  };

  // Speech-to-Text: Handle microphone click
  const handleMicrophoneClick = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      setIsRecording(false);
      return;
    }

    // Check permissions first
    const hasPermission = await checkMicrophonePermission();
    if (!hasPermission) {
      return;
    }

    // Start recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Try to find a supported MIME type
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        // Fallback to other supported types
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else {
          mimeType = ''; // Use browser default
        }
      }
      
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Combine chunks
        const audioBlob = new Blob(chunks, { type: mimeType || 'audio/webm' });
        setAudioChunks(chunks);
        
        // Transcribe
        await transcribeAudio(audioBlob);
      };
      
      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        alert('Recording error occurred. Please try again.');
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioChunks([]);
    } catch (error: any) {
      console.error('Error accessing microphone:', error);
      
      let errorMessage = 'Microphone access denied. ';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Please allow microphone access:\n\n';
        
        // Check if using Cursor browser
        if (navigator.userAgent.includes('Cursor')) {
          errorMessage += '⚠️ Cursor Browser Detected:\n';
          errorMessage += 'Cursor\'s built-in browser may have limited microphone support.\n\n';
          errorMessage += 'RECOMMENDED: Open this page in an external browser:\n';
          errorMessage += '1. Copy the URL from Cursor\'s address bar\n';
          errorMessage += '2. Open Chrome, Firefox, or Safari\n';
          errorMessage += '3. Paste the URL and allow microphone access\n';
          errorMessage += '4. Voice recording will work in the external browser\n\n';
          errorMessage += 'OR try in Cursor:\n';
          errorMessage += '1. Check Cursor Settings → Privacy → Microphone\n';
          errorMessage += '2. Ensure microphone is enabled for localhost\n';
          errorMessage += '3. Check macOS System Settings → Privacy → Microphone → Cursor\n\n';
        } else if (navigator.userAgent.includes('Chrome') || navigator.userAgent.includes('Edge')) {
          errorMessage += 'Chrome/Edge:\n';
          errorMessage += '1. Click the lock icon (🔒) in the address bar\n';
          errorMessage += '2. Click "Site settings"\n';
          errorMessage += '3. Find "Microphone" and set it to "Allow"\n';
          errorMessage += '4. Refresh the page\n\n';
        } else if (navigator.userAgent.includes('Firefox')) {
          errorMessage += 'Firefox:\n';
          errorMessage += '1. Click the lock icon (🔒) in the address bar\n';
          errorMessage += '2. Click "More Information"\n';
          errorMessage += '3. Go to "Permissions" tab\n';
          errorMessage += '4. Find "Use the Microphone" and set to "Allow"\n';
          errorMessage += '5. Refresh the page\n\n';
        } else if (navigator.userAgent.includes('Safari')) {
          errorMessage += 'Safari:\n';
          errorMessage += '1. Safari → Settings (Preferences)\n';
          errorMessage += '2. Click "Websites" tab\n';
          errorMessage += '3. Select "Microphone" in left sidebar\n';
          errorMessage += '4. Find "localhost" and set to "Allow"\n';
          errorMessage += '5. Refresh the page\n\n';
        }
        
        errorMessage += 'Also check your system microphone permissions in System Settings.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Microphone is being used by another application. Please close other apps using the microphone and try again.';
      } else {
        errorMessage += `\n\nError: ${error.message || error.name}`;
      }
      
      alert(errorMessage);
      setIsRecording(false);
    }
  };

  // Speech-to-Text: Transcribe audio
  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setTranscript('');
    
    try {
      const backendUrl = getBackendUrl();
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const response = await authenticatedFetch(`${backendUrl}/api/v1/speech-to-text/transcribe`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Transcription failed: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.text) {
        setTranscript(data.text);
        // Parse the transcript and extract vehicle data
        await parseAndSyncTranscript(data.text);
      } else {
        throw new Error('No transcript received');
      }
    } catch (error: any) {
      console.error('Transcription error:', error);
      alert(`Failed to transcribe audio: ${error.message}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Speech-to-Text: Parse transcript and extract structured data
  const parseAndSyncTranscript = async (text: string) => {
    try {
      // Use OpenAI to extract structured data from transcript
      const backendUrl = getBackendUrl();
      const response = await authenticatedFetch(`${backendUrl}/api/v1/speech-to-text/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          currentFields: carDetails,
        }),
      });
      
      if (!response.ok) {
        // If parsing endpoint doesn't exist, do basic parsing in frontend
        console.warn('Parsing endpoint not available, using basic extraction');
        extractFieldsFromText(text);
        return;
      }
      
      const parsedData = await response.json();
      
      // Store features from speech if extracted
      if (parsedData.features && Array.isArray(parsedData.features)) {
        setSpeechFeatures(parsedData.features);
        console.log('🎤 Features extracted from speech:', parsedData.features);
      }
      
      // Sync fields with priority: VIN > Whisper > Manual
      syncFieldsFromSpeech(parsedData);
    } catch (error: any) {
      console.error('Parsing error:', error);
      // Fallback to basic text extraction
      extractFieldsFromText(text);
    }
  };

  // Speech-to-Text: Basic field extraction (fallback)
  const extractFieldsFromText = (text: string) => {
    const lowerText = text.toLowerCase();
    const extracted: Partial<CarDetails> = {};
    
    // Extract year (4-digit number)
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      extracted.year = yearMatch[0];
    }
    
    // Extract mileage (numbers with "mile" or "miles")
    const mileageMatch = text.match(/(\d{1,3}(?:,\d{3})*)\s*(?:mile|miles|mi)/i);
    if (mileageMatch) {
      extracted.mileage = mileageMatch[1].replace(/,/g, '');
    }
    
    // Extract title status
    if (lowerText.includes('rebuilt') || lowerText.includes('rebuild')) {
      extracted.titleStatus = 'rebuilt';
    } else if (lowerText.includes('salvage')) {
      extracted.titleStatus = 'salvage';
    } else if (lowerText.includes('clean')) {
      extracted.titleStatus = 'clean';
    }
    
    // Add transcript to aboutVehicle
    const currentAbout = carDetails.aboutVehicle || '';
    const newAbout = currentAbout ? `${currentAbout}\n\n${text}` : text;
    extracted.aboutVehicle = newAbout;
    
    // Sync with existing fields
    syncFieldsFromSpeech(extracted);
  };

  // Speech-to-Text: Sync fields with priority logic
  const syncFieldsFromSpeech = (speechData: Partial<CarDetails>) => {
    const conflicts: Array<{field: string, speechValue: string, currentValue: string}> = [];
    const updates: Partial<CarDetails> = {};
    
    // Priority: VIN > Whisper > Manual
    // Note: VIN data comes from enhanced-analyze endpoint when Coordinate is clicked
    // For now, we compare Whisper vs Manual input and show conflicts
    
    const fieldsToCheck: (keyof CarDetails)[] = ['year', 'make', 'model', 'trim', 'titleStatus'];
    
    fieldsToCheck.forEach(field => {
      const speechValue = speechData[field];
      const currentValue = carDetails[field];
      
      if (speechValue && speechValue.trim()) {
        // If current value exists and differs, mark as conflict
        if (currentValue && currentValue.trim() && speechValue !== currentValue) {
          conflicts.push({
            field,
            speechValue: speechValue,
            currentValue: currentValue,
          });
          // For now, prefer speech value (user can manually change if wrong)
          // TODO: Show MismatchResolutionModal for user choice
          updates[field] = speechValue;
        } else if (!currentValue || !currentValue.trim()) {
          // No current value, use speech value
          updates[field] = speechValue;
        }
      }
    });
    
    // Handle mileage separately (optional field, only if not already set)
    if (speechData.mileage && (!carDetails.mileage || !carDetails.mileage.trim())) {
      updates.mileage = speechData.mileage;
    }
    
    // Handle aboutVehicle: Use speechData.aboutVehicle if provided, otherwise append transcript
    if (speechData.aboutVehicle) {
      // If GPT provided structured aboutVehicle, use it
      const currentAbout = carDetails.aboutVehicle || '';
      updates.aboutVehicle = currentAbout 
        ? `${currentAbout}\n\nVoice: ${speechData.aboutVehicle}`
        : `Voice: ${speechData.aboutVehicle}`;
    } else if (transcript) {
      // Fallback: append raw transcript
      const currentAbout = carDetails.aboutVehicle || '';
      updates.aboutVehicle = currentAbout 
        ? `${currentAbout}\n\nVoice: ${transcript}`
        : `Voice: ${transcript}`;
    }
    
    // If conflicts exist, log them (modal can be added later)
    if (conflicts.length > 0) {
      setFieldConflicts(conflicts);
      console.warn('Field conflicts detected (speech vs manual):', conflicts);
      // Show a simple alert for now - can be replaced with modal
      const conflictMsg = conflicts.map(c => `${c.field}: "${c.currentValue}" vs "${c.speechValue}"`).join(', ');
      console.log(`⚠️ Conflicts: ${conflictMsg}. Using speech values. User can manually correct if needed.`);
    }
    
    // Apply updates
    if (Object.keys(updates).length > 0) {
      setCarDetails(prev => ({ ...prev, ...updates }));
    }
  };

  const analyzeImages = async () => {
    const startTime = Date.now();
    console.log('🚀 [ANALYZE] analyzeImages called at:', new Date().toISOString());
    setPriceWarningDismissed(false); // Reset dismissed flag for new analysis
    
    if (selectedFiles.length === 0) {
      console.log('❌ [ANALYZE] No files selected');
      alert('Please select at least one image for analysis');
      return;
    }

    console.log(`📁 [ANALYZE] Selected ${selectedFiles.length} files for analysis`);
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      // Test API connectivity first
      try {
        const backendUrl = getBackendUrl();
        console.log('🏥 [ANALYZE] Starting health check using backend URL:', backendUrl);
        const healthCheckStart = Date.now();
        const healthCheckUrl = API_ENDPOINTS.HEALTH;
        
        console.log(`🔍 [ANALYZE] Starting health check to: ${healthCheckUrl}`);
        console.log(`🔍 [ANALYZE] Backend URL: ${backendUrl}`);
        
        // Add timeout for health check (5 seconds - reduced for faster failure)
        const healthCheckController = new AbortController();
        const healthCheckTimeout = setTimeout(() => {
          console.error('⏱️  [ANALYZE] Health check timeout - aborting request');
          healthCheckController.abort();
        }, 3000); // Reduced to 3 seconds for faster failure
        
        try {
          // Use fetch directly with short timeout instead of authenticatedFetch
          const healthCheck = await fetch(healthCheckUrl, {
            signal: healthCheckController.signal,
            method: 'GET',
            cache: 'no-cache',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          clearTimeout(healthCheckTimeout);
          const healthCheckTime = Date.now() - healthCheckStart;
          console.log(`⏱️  [ANALYZE] Health check completed in ${healthCheckTime}ms`);
          
          if (!healthCheck.ok) {
            console.error('❌ [ANALYZE] Health check failed with status:', healthCheck.status);
            const errorText = await healthCheck.text().catch(() => 'Unable to read error response');
            console.error('❌ [ANALYZE] Health check error response:', errorText);
            throw new Error(`Backend health check failed: ${healthCheck.status} - ${errorText}`);
          }
          
          const healthData = await healthCheck.json().catch(() => ({}));
          console.log('✅ [ANALYZE] Backend health check passed', healthData);
        } catch (fetchError: any) {
          clearTimeout(healthCheckTimeout);
          throw fetchError; // Re-throw to be caught by outer catch
        }
      } catch (healthError: any) {
        const healthCheckTime = Date.now() - startTime;
        const backendUrl = getBackendUrl();
        const healthCheckUrl = API_ENDPOINTS.HEALTH;
        
        console.error('❌ [ANALYZE] Health check error:', {
          name: healthError.name,
          message: healthError.message,
          time: healthCheckTime,
          url: healthCheckUrl,
          backendUrl: backendUrl
        });
        
        if (healthError.name === 'AbortError' || healthError.name === 'TimeoutError') {
          console.error('❌ [ANALYZE] Health check timed out after 5 seconds');
          const isLocal = backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1');
          
          if (isLocal) {
            setAnalysisError(
              `Local backend is not responding (${healthCheckUrl}). ` +
              `Make sure your local backend is running at http://localhost:8000. ` +
              `If you want to use the production backend, set NEXT_PUBLIC_API_URL=https://accorria-backend-tv2qihivdq-uc.a.run.app in your .env.local file.`
            );
          } else {
            setAnalysisError(
              `Backend service (${backendUrl}) is not responding. ` +
              `This could be due to network issues or the service being down. ` +
              `Please check your connection or try again later.`
            );
          }
        } else if (healthError.message?.includes('Failed to fetch') || healthError.message?.includes('NetworkError')) {
          // Only log in development mode, and only if backend URL is localhost
          const isLocal = backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1');
          if (isLocal && process.env.NODE_ENV === 'development') {
            console.debug('⚠️ [ANALYZE] Backend not available - image analysis disabled');
          }
          
          if (isLocal) {
            setAnalysisError(
              `Cannot connect to local backend (${backendUrl}). ` +
              `Make sure your backend is running: cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
            );
          } else {
            setAnalysisError(
              `Cannot connect to backend service (${backendUrl}). ` +
              `Check your internet connection or try again later.`
            );
          }
        } else {
          console.error('❌ [ANALYZE] Backend health check failed:', healthError);
          setAnalysisError(
            `Backend health check failed: ${healthError.message || 'Unknown error'}. ` +
            `URL: ${healthCheckUrl}`
          );
        }
        setIsAnalyzing(false);
        return;
      }
      
      // Use enhanced analysis endpoint for comprehensive image analysis
      const formData = new FormData();
      
      // Apply comprehensive spelling correction to aboutVehicle before sending
      const correctedAboutVehicle = correctSpelling(carDetails.aboutVehicle || '');
      
      // Add ALL selected images for analysis (including VIN images - they're used for analysis but excluded from posting)
      // VIN images should be analyzed to extract VIN and get vehicle features
      // Prioritize VIN images by sending them first
      const vinImages = selectedFiles.filter(f => f.isVinImage);
      const nonVinImages = selectedFiles.filter(f => !f.isVinImage);
      
      // Send VIN images first so backend can prioritize them
      vinImages.forEach((fileWithId) => {
        formData.append('images', fileWithId.file);
        formData.append('vin_images', 'true'); // Flag to indicate this is a VIN image
        console.log(`📤 [ANALYZE] Adding VIN image for analysis (PRIORITIZED): ${fileWithId.file.name}`);
      });
      
      // Then send non-VIN images
      nonVinImages.forEach((fileWithId) => {
        formData.append('images', fileWithId.file);
        formData.append('vin_images', 'false');
        console.log(`📤 [ANALYZE] Adding image for analysis: ${fileWithId.file.name}`);
      });
      
      // Also include VIN images that might not be in selectedFiles but are marked as VIN
      // This ensures VIN images are always analyzed
      files.forEach((fileWithId) => {
        if (fileWithId.isVinImage && !selectedFiles.some(f => f.id === fileWithId.id)) {
          formData.append('images', fileWithId.file);
          formData.append('vin_images', 'true');
          console.log(`📤 [ANALYZE] Adding VIN image for analysis (PRIORITIZED): ${fileWithId.file.name}`);
        }
      });
      
      // Extract VIN from aboutVehicle if present
      const extractVIN = (text: string): string | null => {
        if (!text) return null;
        // VIN pattern: 17 alphanumeric characters (excluding I, O, Q)
        const vinPattern = /\b([A-HJ-NPR-Z0-9]{17})\b/;
        const match = text.toUpperCase().match(vinPattern);
        return match ? match[1] : null;
      };
      
      const extractedVIN = extractVIN(correctedAboutVehicle);
      
      // Add car details (with corrected spelling)
      formData.append('make', carDetails.make || '');
      formData.append('model', carDetails.model || '');
      formData.append('trim', carDetails.trim || '');
      formData.append('year', carDetails.year || '');
      formData.append('mileage', carDetails.mileage || '');
      formData.append('price', carDetails.price || '');
      formData.append('lowestPrice', carDetails.lowestPrice || '');
      formData.append('titleStatus', carDetails.titleStatus || '');
      formData.append('aboutVehicle', correctedAboutVehicle);
      // Add title rebuild explanation if rebuilt title
      if (carDetails.titleStatus === 'rebuilt' && titleRebuildExplanation) {
        formData.append('titleRebuildReason', titleRebuildExplanation);
        console.log('📝 [ANALYZE] Adding title rebuild reason:', titleRebuildExplanation);
      }
      if (extractedVIN) {
        formData.append('vin', extractedVIN);
        console.log('🔍 [ANALYZE] Extracted VIN from aboutVehicle:', extractedVIN);
      }
      
      console.log('📤 [ANALYZE] Sending analysis request with:', {
        files: selectedFiles.length,
        make: carDetails.make,
        model: carDetails.model,
        year: carDetails.year,
        mileage: carDetails.mileage,
        price: carDetails.price,
        titleStatus: carDetails.titleStatus,
        endpoint: API_ENDPOINTS.ENHANCED_ANALYZE
      });
      
      // Call backend directly instead of going through frontend API route
      const backendUrl = getBackendUrl();
      console.log('📡 [ANALYZE] Using backend URL:', backendUrl);
      console.log('⏱️  [ANALYZE] Calling api.postFormData to:', API_ENDPOINTS.ENHANCED_ANALYZE);
      const analysisStart = Date.now();
      
      const result = await api.postFormData(API_ENDPOINTS.ENHANCED_ANALYZE, formData) as AnalysisResult;
      
      const analysisTime = Date.now() - analysisStart;
      console.log(`⏱️  [ANALYZE] Analysis completed in ${analysisTime}ms (${(analysisTime/1000).toFixed(1)}s)`);
      console.log('✅ [ANALYZE] Analysis result received:', {
        success: result?.success,
        hasDescription: !!result?.description,
        hasPostText: !!result?.post_text,
        descriptionLength: result?.description?.length || 0,
        postTextLength: result?.post_text?.length || 0
      });
      
      // DEBUG: Print the actual result to console
      console.log('📋 [ANALYZE] Full result object:', JSON.stringify(result, null, 2).substring(0, 500));
      
      setAnalysisResult(result);
      setShowAnalysis(true);
      
      // Extract price warnings from backend response (only if not dismissed)
      if (result.price_warnings && !priceWarningDismissed) {
        const warnings = result.price_warnings as {
          type: 'high' | 'low' | 'good';
          message: string;
          market_average: number;
          recommendation?: string;
        };
        setPriceWarning({
          type: warnings.type,
          message: warnings.message,
          marketAvg: warnings.market_average
        });
        console.log('⚠️ [ANALYZE] Price warning received:', warnings);
      } else {
        // Clear price warning if not provided
        setPriceWarning({ type: null, message: '', marketAvg: null });
      }
      
      // Generate AI description based on enhanced analysis
      const analysisResult = result;
      if (analysisResult.success) {
        // Use AI-generated content from backend if available, otherwise fallback to local generation
        let generatedDescription = '';
        
        if (analysisResult.post_text) {
          // Use the AI-generated post text from backend
          generatedDescription = analysisResult.post_text;
          console.log('✅ [ANALYZE] Using AI-generated post text from backend');
          console.log('📝 [ANALYZE] Post text preview:', generatedDescription.substring(0, 200));
          console.log('🔍 [ANALYZE] Full post_text length:', generatedDescription.length);
          console.log('🔍 [ANALYZE] Features in post_text?', generatedDescription.includes('Features & Equipment'));
          console.log('🔍 [ANALYZE] Detected features from backend:', analysisResult.detected?.features);
          
          // DEBUG: Log Gemini Vision detection results
          if (analysisResult.detected?.debug_gemini_detection) {
            const debug = analysisResult.detected.debug_gemini_detection;
            console.log('🔍 ===== GEMINI VISION DETECTION RESULTS (from backend) =====');
            console.log('📋 Features detected by Gemini:', Object.keys(debug.features_detected || {}));
            console.log('📋 Features present (✅) vs absent (❌):');
            Object.entries(debug.features_detected || {}).forEach(([name, data]: [string, any]) => {
              const icon = data.present ? '✅' : '❌';
              console.log(`  ${icon} ${name}: present=${data.present}, confidence=${data.confidence?.toFixed(2) || 0}`);
            });
            console.log('📋 Badges seen:', debug.badges_seen);
            console.log('📋 Exterior color:', debug.exterior_color);
            console.log('📋 Interior color:', debug.interior_color);
            console.log('📋 Drivetrain detected:', debug.drivetrain_detected);
            console.log('📋 Features list (extracted):', debug.features_list);
            console.log('📋 Features list count:', debug.features_list_count);
            console.log('🔍 ===== END GEMINI VISION DETECTION RESULTS =====');
          }
        } else if (analysisResult.description) {
          // Use the AI-generated description from backend
          generatedDescription = analysisResult.description;
          console.log('✅ [ANALYZE] Using AI description from backend');
          console.log('📝 [ANALYZE] Description preview:', generatedDescription.substring(0, 200));
        } else if (analysisResult.ai_analysis) {
          // Use the raw AI analysis from backend
          generatedDescription = analysisResult.ai_analysis;
          console.log('⚠️ [ANALYZE] Using raw AI analysis from backend (no formatted description)');
        } else {
          // Fallback to local generation
          generatedDescription = generateAIDescription(analysisResult, carDetails, titleRebuildExplanation);
          console.log('⚠️ [ANALYZE] Using fallback local generation (backend did not return description)');
        }
        
        if (!generatedDescription || generatedDescription.trim().length === 0) {
          console.error('❌ [ANALYZE] ERROR: No description generated!');
          alert('Analysis completed but no description was generated. Please check console for details.');
          setIsAnalyzing(false);
          return;
        }
        
        // Clean up the description text
        const cleanedDescription = generatedDescription
          .replace(/no visible damage/gi, 'good condition')
          .replace(/runs and drives excellent/gi, 'Runs and drives')
          .replace(/runs and drives great/gi, 'Runs and drives')
          .replace(/transmission shifts smooth/gi, 'Transmission works great')
          .replace(/transmission shifts great/gi, 'Transmission works great')
          .replace(/good paint condition/gi, 'excellent paint condition')
          .replace(/clean interior/gi, 'well-maintained interior')
          // Remove emojis from features section
          .replace(/🔧 Features & Equipment:/g, 'Features & Equipment:')
          .replace(/❤️/g, '•')
          .replace(/🛠️/g, '•')
          .replace(/⚙️/g, '•')
          .replace(/🔧/g, '•')
          .replace(/📱/g, '•')
          .replace(/🎵/g, '•')
          .replace(/🧭/g, '•')
          .replace(/🪑/g, '•')
          .replace(/🛞/g, '•')
          .replace(/🌡️/g, '•')
          .replace(/🚗/g, '•');
        
        // Apply spelling correction for common misspellings
        // Additional common automotive misspellings
        let correctedDescription = cleanedDescription
          .replace(/\breplased\b/gi, 'replaced') // Fix "replaced" misspellings
          .replace(/\breplaed\b/gi, 'replaced')
          .replace(/\breplced\b/gi, 'replaced')
          .replace(/\breplcaed\b/gi, 'replaced')
          .replace(/\btransmision\b/gi, 'transmission')
          .replace(/\btransmision\b/gi, 'transmission')
          .replace(/\bcondtion\b/gi, 'condition')
          .replace(/\bconditon\b/gi, 'condition')
          .replace(/\bmaintainance\b/gi, 'maintenance')
          .replace(/\bmaintanance\b/gi, 'maintenance')
          .replace(/\bexcellant\b/gi, 'excellent')
          .replace(/\bexcelent\b/gi, 'excellent')
          .replace(/\binterior\b/gi, 'interior')
          .replace(/\binteriour\b/gi, 'interior')
          .replace(/\bexterior\b/gi, 'exterior')
          .replace(/\bexteriour\b/gi, 'exterior')
          // Fix "keys" misspellings
          .replace(/\bkyes\b/gi, 'keys')
          .replace(/\bkeis\b/gi, 'keys')
          .replace(/\bkees\b/gi, 'keys')
          .replace(/\bkeyes\b/gi, 'keys')
          .replace(/\bteo\b/gi, 'two')
          .replace(/\btow\b/gi, 'two') // Only if context suggests it's a number
          .replace(/\bsets of kyes\b/gi, 'sets of keys')
          .replace(/\bsets of keis\b/gi, 'sets of keys')
          .replace(/\bsets of kees\b/gi, 'sets of keys')
          .replace(/\bteo sets\b/gi, 'two sets')
          // Apply the same comprehensive spelling correction function
          .replace(/\breplased\b/gi, 'replaced')
          .replace(/\breplaed\b/gi, 'replaced')
          .replace(/\breplced\b/gi, 'replaced')
          .replace(/\btransmision\b/gi, 'transmission')
          .replace(/\bcondtion\b/gi, 'condition')
          .replace(/\bconditon\b/gi, 'condition')
          .replace(/\bmaintainance\b/gi, 'maintenance')
          .replace(/\bmaintanance\b/gi, 'maintenance')
          .replace(/\bexcellant\b/gi, 'excellent')
          .replace(/\bexcelent\b/gi, 'excellent');

        setCarDetails(prev => ({ ...prev, finalDescription: correctedDescription }));
        setShowAnalysis(false); // Hide the analysis results section
        
        console.log('✅ [ANALYZE] Description set in carDetails.finalDescription');
        console.log('📝 [ANALYZE] Final description length:', correctedDescription.length, 'chars');
        console.log('📝 [ANALYZE] Final description preview:', correctedDescription.substring(0, 200));
      } else {
        console.error('❌ [ANALYZE] Analysis result.success is false');
        console.error('❌ [ANALYZE] Result:', result);
        alert('Analysis failed. Please check console for details.');
      }
      // Run market analysis in background
      if (carDetails.make && carDetails.model) {
        const backendUrl = getBackendUrl();
        api.post(API_ENDPOINTS.MARKET_INTELLIGENCE_ANALYZE, {
          make: carDetails.make,
          model: carDetails.model,
          year: carDetails.year ? parseInt(carDetails.year) : undefined,
          mileage: carDetails.mileage ? parseInt(carDetails.mileage) : undefined,
          location: 'United States',
          analysis_type: 'comprehensive',
        })
          .then(marketResult => {
            if (marketResult && result) {
              const marketData = marketResult as { data?: Record<string, unknown> };
              setAnalysisResult((prev) => prev ? ({ ...prev, market_intelligence: marketData.data }) : null);
            }
          })
          .catch(error => {
            console.error('Market intelligence error:', error);
          });
      }
      // 6. Generate 2-3 AI description suggestions (mock for now)
      setTimeout(() => {
        setDescriptionSuggestions([
          `${carDetails.year} ${carDetails.make} ${carDetails.model} - Clean, well-maintained, ${carDetails.mileage} miles. Ready to drive!`,
          `Excellent ${carDetails.year} ${carDetails.make} ${carDetails.model}, clean title, only ${carDetails.mileage} miles.`,
          `For sale: ${carDetails.year} ${carDetails.make} ${carDetails.model}, ${carDetails.mileage} miles, great condition!`,
        ]);
      }, 500);
    } catch (error) {
      console.error('Error analyzing images:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response,
        files: files.length
      });
      alert(`Failed to analyze images. Error: ${error.message || 'Unknown error'}. Please try again.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper function to upload photos to Supabase Storage
  const uploadPhotosToSupabase = async (filesToUpload: FileWithId[]): Promise<string[]> => {
    const imageUrls: string[] = [];
    
    if (filesToUpload.length === 0) {
      console.warn('⚠️ No files to upload');
      return imageUrls;
    }
    
    try {
      const { supabase } = await import('@/utils/supabase');
      const timestamp = Date.now();

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i].file;
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${timestamp}-${i}.${fileExt}`;
        const filePath = `listings/${fileName}`;

        console.log(`📤 Uploading image ${i + 1}/${filesToUpload.length}: ${file.name} -> ${filePath}`);

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('car-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error(`❌ Failed to upload image ${i + 1}:`, uploadError);
          // Fallback to data URL if upload fails
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          imageUrls.push(dataUrl);
          console.log(`⚠️ Using data URL fallback for image ${i + 1}`);
        } else {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('car-images')
            .getPublicUrl(filePath);
          imageUrls.push(urlData.publicUrl);
          console.log(`✅ Successfully uploaded image ${i + 1}: ${urlData.publicUrl}`);
        }
      }
      
      console.log(`✅ Image upload complete: ${imageUrls.length} URLs generated`);
    } catch (error) {
      console.error('❌ Failed to upload images to Supabase:', error);
      // Fallback: create data URLs from files
      console.log('🔄 Falling back to data URLs...');
      for (const fileWithId of filesToUpload) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(fileWithId.file);
        });
        imageUrls.push(dataUrl);
      }
      console.log(`⚠️ Generated ${imageUrls.length} data URLs as fallback`);
    }
    
    return imageUrls;
  };

  // Helper function to save listing to database
  const saveListingToDatabase = async (imageUrls: string[], analysisResult?: any) => {
    try {
      const { listingsService } = await import('@/services/listingsService');
      const service = listingsService;
      
      // Ensure we have image URLs - if imageUrls is empty, create data URLs from files
      let finalImageUrls = imageUrls;
      if (finalImageUrls.length === 0 && files.length > 0) {
        console.log('⚠️ No image URLs found, creating data URLs from files as fallback...');
        finalImageUrls = [];
        for (const fileWithId of files) {
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(fileWithId.file);
          });
          finalImageUrls.push(dataUrl);
        }
        console.log(`✅ Generated ${finalImageUrls.length} data URLs as fallback`);
      }
      
      // Create listing data
      const listingData = {
        title: analysisResult?.car_analysis?.title || `${analysisResult?.car_analysis?.year || carDetails.year || ''} ${analysisResult?.car_analysis?.make || carDetails.make || ''} ${analysisResult?.car_analysis?.model || carDetails.model || ''}`.trim() || 'Untitled Listing',
        description: analysisResult?.car_analysis?.description || carDetails.finalDescription || carDetails.aboutVehicle || '',
        price: analysisResult?.car_analysis?.price || parseFloat(carDetails.price) || 0,
        platforms: selectedPlatforms,
        status: 'active' as const,
        images: finalImageUrls, // Use uploaded URLs (Supabase or data URLs)
        make: analysisResult?.car_analysis?.make || carDetails.make,
        model: analysisResult?.car_analysis?.model || carDetails.model,
        year: analysisResult?.car_analysis?.year || carDetails.year,
        mileage: analysisResult?.car_analysis?.mileage || carDetails.mileage,
        condition: analysisResult?.car_analysis?.condition || 'Good',
        location: analysisResult?.car_analysis?.location || `${carDetails.city || ''}, ${carDetails.zipCode || ''}`.trim() || 'Unknown',
        postedAt: new Date().toISOString(),
        titleStatus: carDetails.titleStatus || 'Clean',
        messages: 0,
        clicks: 0,
        detectedFeatures: analysisResult?.car_analysis?.features || [],
        aiAnalysis: analysisResult?.car_analysis || null,
        finalDescription: analysisResult?.car_analysis?.description || carDetails.finalDescription || ''
      };
      
      await service.createListing(listingData);
      console.log('✅ Listing saved to database');
      return true;
    } catch (error) {
      console.error('❌ Failed to save listing to database:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      alert('Please upload at least one image');
      return;
    }

    setIsPosting(true);
    
    const requestStartTime = Date.now();
    
    try {
      const formData = new FormData();
      files.forEach((fileWithId) => {
        formData.append(`images`, fileWithId.file);
      });
      
      // Add car details, using custom values if 'Other' is selected
      
      // Add platform selection
      selectedPlatforms.forEach(platform => {
        formData.append(`platforms`, platform);
      });
      
      // Add user ID (you'll need to get this from auth context)
      formData.append('user_id', '1'); // TODO: Get from auth context
      
      // Add custom price if available
      if (carDetails.price) {
        formData.append('custom_price', carDetails.price);
      }
      
      // Add custom description if available
      if (carDetails.finalDescription) {
        formData.append('custom_description', carDetails.finalDescription);
      }

      // Save user presets (extract and save common phrases)
      if (carDetails.aboutVehicle || carDetails.titleStatus) {
        try {
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          await fetch(`${backendUrl}/api/v1/presets/extract-and-save`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              about_vehicle: carDetails.aboutVehicle || '',
              title_status: carDetails.titleStatus || 'clean'
            })
          });
          // Silently save - don't block on this
        } catch (error) {
          console.warn('Failed to save presets:', error);
          // Don't block submission if preset saving fails
        }
      }
      console.log('⏱️  [FRONTEND] Starting request at:', new Date().toISOString());
      console.log('📡 [FRONTEND] Calling fetch to /api/v1/platform-posting/analyze-and-post...');
      console.log('📦 [FRONTEND] FormData contains:', {
        images: files.length,
        make: carDetails.make,
        model: carDetails.model,
        year: carDetails.year,
        mileage: carDetails.mileage,
        price: carDetails.price
      });
      
      let response;
      try {
        response = await fetch('/api/v1/platform-posting/analyze-and-post', {
          method: 'POST',
          body: formData,
        });
        
        const requestTime = Date.now() - requestStartTime;
        console.log(`⏱️  [FRONTEND] Response received in ${requestTime}ms (${(requestTime/1000).toFixed(1)}s)`);
        console.log('📊 [FRONTEND] Response status:', response.status, response.statusText);
      } catch (fetchError: any) {
        const requestTime = Date.now() - requestStartTime;
        console.error('❌ [FRONTEND] Fetch error after', requestTime, 'ms:', fetchError);
        console.error('❌ [FRONTEND] Error details:', {
          name: fetchError.name,
          message: fetchError.message,
          stack: fetchError.stack
        });
        throw fetchError;
      }

      let result: any = null;
      let imageUrls: string[] = [];
      
      if (response.ok) {
        console.log('✅ [FRONTEND] Response OK, parsing JSON...');
        result = await response.json();
        console.log('✅ [FRONTEND] Listing posted successfully:', result);
        console.log('📝 [FRONTEND] Generated description length:', result.car_analysis?.description?.length || 0);
      } else {
        const errorText = await response.text().catch(() => 'Could not read error');
        console.error('❌ [FRONTEND] Response not OK:', response.status, errorText);
        // Continue to save listing even if posting failed
      }
      
      // ALWAYS upload and save photos, even if posting failed
      // Filter out VIN images - they're used for analysis but not posted/saved
      const filesToPost = files.filter(f => !f.isVinImage);
      const vinImages = files.filter(f => f.isVinImage);
      console.log(`📤 Starting image upload: ${filesToPost.length} files to save, ${vinImages.length} VIN images (excluded)`);
      
      // Upload photos to Supabase
      imageUrls = await uploadPhotosToSupabase(filesToPost);
      
      // Save listing to database (always save, even if posting failed)
      const saved = await saveListingToDatabase(imageUrls, result);
      
      if (saved) {
        console.log('✅ Listing saved successfully');
      }
      
      if (response.ok && result) {
        // Show success state if posting was successful
        const successCount = result.successful_postings || 0;
        const totalCount = result.total_platforms || 0;
        setPostResult({ successCount, totalCount });
        setPostSuccess(true);
      } else {
        // Show message that listing was saved even if posting failed
        alert('Listing saved to your dashboard. Some platforms may not have posted successfully. Check console for details.');
        setPostResult({ successCount: 0, totalCount: selectedPlatforms.length });
        setPostSuccess(true);
      }
    } catch (error: any) {
      const totalTime = Date.now() - (requestStartTime || Date.now());
      console.error('❌ [FRONTEND] Error posting listing after', totalTime, 'ms:', error);
      console.error('❌ [FRONTEND] Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      alert(`Failed to post listing: ${error?.message || 'Unknown error'}. Check console for details.`);
    } finally {
      setIsPosting(false);
      console.log('🏁 [FRONTEND] Request finished, isPosting set to false');
    }
  };


  const makes = Object.keys(carData).sort();
  const models = carDetails.make && carDetails.make !== 'Other' ? (carData[carDetails.make] || []).sort() : [];
  const trims = useMemo(() => {
    if (carDetails.make && carDetails.make !== 'Other' && 
        carDetails.model && carDetails.model !== 'Other' && 
        carTrims[carDetails.make] && 
        carTrims[carDetails.make][carDetails.model]) {
      return [...carTrims[carDetails.make][carDetails.model]].sort();
    }
    return [];
  }, [carDetails.make, carDetails.model]);
  const currentYear = new Date().getFullYear() + 1;
  const years = Array.from({ length: currentYear - 1959 }, (_, i) => (currentYear - i).toString());

  // Create and manage image URLs for all files
  // Use a ref to track previous files to only cleanup removed files
  const prevFilesRef = useRef<FileWithId[]>([]);
  
  useEffect(() => {
    console.log('🔄 [URLs] useEffect triggered, files count:', files.length);
    
    // Find files that were removed (cleanup their URLs)
    // BUT: Don't cleanup if files array is being replaced (compression in progress)
    // Only cleanup if files are actually being removed (count decreased)
    const prevCount = prevFilesRef.current.length;
    const currentCount = files.length;
    
    // Only cleanup if files were actually removed (not replaced)
    if (prevCount > currentCount) {
      const prevFileIds = new Set(prevFilesRef.current.map(f => f.id));
      const currentFileIds = new Set(files.map(f => f.id));
      const removedFileIds = [...prevFileIds].filter(id => !currentFileIds.has(id));
      
      if (removedFileIds.length > 0) {
        console.log('🧹 [URLs] Cleaning up', removedFileIds.length, 'removed files');
        prevFilesRef.current.forEach(fileWithId => {
          if (removedFileIds.includes(fileWithId.id) && fileWithId.url) {
            try {
              URL.revokeObjectURL(fileWithId.url);
              console.log('✅ [URLs] Revoked URL for removed file:', fileWithId.file?.name || fileWithId.id);
            } catch (error) {
              // Ignore errors
            }
          }
        });
      }
    } else if (prevCount === currentCount && prevCount > 0) {
      // Same count - might be replacement (compression), don't cleanup yet
      console.log('🔄 [URLs] Files replaced (compression?), preserving URLs');
    }
    
    // Create URLs for all files that don't have one
    files.forEach((fileWithId, idx) => {
      if (!fileWithId.url && fileWithId.file) {
        // Validate file before creating URL
        if (fileWithId.file.size === 0) {
          console.warn('⚠️ [URLs] File has zero size:', fileWithId.file.name);
          return;
        }
        if (!fileWithId.file.type.startsWith('image/')) {
          console.warn('⚠️ [URLs] File is not an image:', fileWithId.file.name, fileWithId.file.type);
          return;
        }
        
        // Check if file is too large (might cause memory issues)
        if (fileWithId.file.size > 50 * 1024 * 1024) { // 50MB
          console.warn('⚠️ [URLs] File is very large, may cause issues:', fileWithId.file.name, fileWithId.file.size);
          // Still try to create URL, but warn user
        }
        
        try {
          fileWithId.url = URL.createObjectURL(fileWithId.file);
          console.log(`✅ [URLs] Created URL ${idx + 1}/${files.length} for:`, fileWithId.file.name, {
            size: (fileWithId.file.size / 1024 / 1024).toFixed(2) + 'MB',
            type: fileWithId.file.type
          });
        } catch (error) {
          console.error('❌ [URLs] Failed to create URL for:', fileWithId.file.name, error);
          // Try to provide helpful error message
          if (error instanceof DOMException) {
            console.error('   DOMException details:', error.message, error.name);
          }
        }
      } else if (fileWithId.url) {
        // URL already exists - don't test it, just use it
        // Testing URLs causes them to be revoked prematurely
        console.log(`✅ [URLs] URL already exists for:`, fileWithId.file.name);
      }
    });

    // Update ref for next comparison
    prevFilesRef.current = files;
    
    // Only cleanup on unmount
    return () => {
      // Only cleanup on component unmount, not on every files change
      console.log('🧹 [URLs] Component unmounting, cleaning up all URLs');
    };
  }, [files]); // Re-run when files array changes

  // Helper to get image URL (prioritize data URL for reliability)
  const getImageUrl = useCallback((fileWithId: FileWithId): string => {
    if (!fileWithId.file) {
      if (!fileWithId._errorLogged) {
        console.error('❌ [getImageUrl] File object is missing for:', fileWithId.id);
        fileWithId._errorLogged = true;
      }
      return '';
    }
    
    // Validate file
    if (fileWithId.file.size === 0) {
      if (!fileWithId._errorLogged) {
        console.error('❌ [getImageUrl] File has zero size:', fileWithId.file.name);
        fileWithId._errorLogged = true;
      }
      return '';
    }
    
    // PRIORITIZE data URL - most reliable for converted files
    if (fileWithId.dataUrl) {
      return fileWithId.dataUrl;
    }
    
    // Fallback to blob URL if data URL doesn't exist
    if (fileWithId.url && fileWithId._urlType === 'blob') {
      return fileWithId.url;
    }
    
    // Try to create data URL if neither exists (most reliable)
    if (!fileWithId.dataUrl) {
      // Note: This is async, so we'll trigger it but return empty for now
      // The error handler will create it
      console.warn('⚠️ [getImageUrl] No data URL available, will create on error:', fileWithId.file.name);
    }
    
    // Return whatever we have (empty string will trigger error handler)
    return fileWithId.dataUrl || fileWithId.url || '';
  }, []);

  // Show success screen after posting
  if (postSuccess && postResult) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
              <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              🎉 Listing Posted Successfully!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your listing has been posted to <strong>{postResult.successCount}</strong> out of <strong>{postResult.totalCount}</strong> platforms.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setPostSuccess(false);
                  setPostResult(null);
                  // Call the callback to refresh dashboard listings
                  if (onListingCreated) {
                    onListingCreated();
                  }
                  onClose();
                }}
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                Return to Dashboard
              </button>
              <button
                onClick={() => {
                  setPostSuccess(false);
                  setPostResult(null);
                  // Reset form for new listing
                  setFiles([]);
                  setSelectedFiles([]);
                  setCarDetails({
                    make: '',
                    model: '',
                    trim: '',
                    year: '',
                    mileage: '',
                    price: '',
                    lowestPrice: '',
                    titleStatus: '',
                    city: '',
                    zipCode: '',
                    aboutVehicle: '',
                    finalDescription: ''
                  });
                  setAnalysisResult(null);
                  setShowAnalysis(false);
                  setSelectedPricingTier(null);
                  setSelectedPlatforms([]);
                }}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Create Another Listing
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              Create New Listing
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 -m-2"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Car Photos ({files.length}/20)
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-4 sm:p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <input {...getInputProps()} />
                <div className="text-4xl mb-2">📸</div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {isDragActive
                    ? 'Drop the files here...'
                    : 'Tap to select photos from your camera or gallery'}
                </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Up to 20 images (JPEG, PNG, WebP) • Auto-compressed for optimal size
                  </p>
                                  <p className="text-xs text-blue-500 mt-2">
                    💡 Tip: Take photos from different angles for better analysis (v2)
                  </p>
              </div>

              {/* Preview Images */}
              {files.length > 0 && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        🎯 Select 5 Key Photos for Accorria Analysis
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Hover to see selection checkbox • Drag to reorder
                      </p>
                    </div>
                    <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                      {selectedFiles.length}/5 selected
                    </span>
                    {files.length > 0 && (
                      <button
                        onClick={() => {
                          console.log('🗑️ Clearing all files');
                          setFiles([]);
                          setSelectedFiles([]);
                          setRenderKey(prev => prev + 1);
                        }}
                        className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-2 py-1 rounded border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        Clear All ({files.length})
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {files.map((fileWithId, index) => {
                      const isSelected = selectedFiles.some(f => f.id === fileWithId.id);
                      console.log(`🎯 Rendering photo ${index}: ${fileWithId.file.name}`);
                      return (
                        <div 
                          key={`${fileWithId.id}-${index}`}
                          className="relative group cursor-move select-none"
                          draggable
                          style={{ userSelect: 'none', touchAction: 'none' }}
                          onMouseDown={(e) => {
                            // Start tracking for drag vs click
                            e.currentTarget.dataset.mouseDownTime = Date.now().toString();
                          }}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', index.toString());
                            e.currentTarget.classList.add('opacity-50', 'scale-105');
                            console.log('🎯 DRAG STARTED for image', index, 'File:', fileWithId.file.name);
                          }}
                          onDragEnd={(e) => {
                            e.currentTarget.classList.remove('opacity-50', 'scale-105');
                            console.log('Drag ended for image', index);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add('ring-2', 'ring-blue-300');
                            console.log('Drag over image', index);
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('ring-2', 'ring-blue-300');
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('ring-2', 'ring-blue-300');
                            
                            const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
                            const dropIndex = index;
                            
                            console.log('🎯 DROP EVENT:', { draggedIndex, dropIndex, draggedIndexType: typeof draggedIndex, dropIndexType: typeof dropIndex });
                            
                            if (draggedIndex !== dropIndex && !isNaN(draggedIndex) && !isNaN(dropIndex)) {
                              console.log('🎯 REORDERING: Moving from', draggedIndex, 'to', dropIndex);
                              const newFiles = [...files];
                              const [draggedFile] = newFiles.splice(draggedIndex, 1);
                              newFiles.splice(dropIndex, 0, draggedFile);
                              setFiles(newFiles);
                              // Update selectedFiles to maintain selection state after reorder
                              setSelectedFiles(prev => {
                                // Map old selected files to new file positions by ID
                                return prev.map(selectedFile => {
                                  const newFile = newFiles.find(f => f.id === selectedFile.id);
                                  return newFile || selectedFile;
                                }).filter(Boolean);
                              });
                              setRenderKey(prev => prev + 1); // Force re-render
                              console.log('🎯 FILES REORDERED:', newFiles.map(f => f.file.name));
                            } else {
                              console.log('🎯 NO REORDER: Same position or invalid indices');
                            }
                          }}
                          // Mobile touch events for drag and drop
                          onTouchStart={(e) => {
                            const touch = e.touches[0];
                            e.currentTarget.dataset.touchStartTime = Date.now().toString();
                            e.currentTarget.dataset.touchStartY = touch.clientY.toString();
                            e.currentTarget.dataset.touchStartX = touch.clientX.toString();
                            e.currentTarget.dataset.draggedIndex = index.toString();
                            
                            // Store initial scroll position to lock it during drag (use ref for immediate access)
                            dragStartScrollYRef.current = window.scrollY || document.documentElement.scrollTop;
                            
                            // Prevent any potential scrolling immediately when touch starts on draggable element
                            // This helps prevent the page from scrolling when user starts dragging
                            e.stopPropagation();
                          }}
                          onTouchMove={(e) => {
                            const touch = e.touches[0];
                            const startY = parseFloat(e.currentTarget.dataset.touchStartY || '0');
                            const startX = parseFloat(e.currentTarget.dataset.touchStartX || '0');
                            const deltaY = Math.abs(touch.clientY - startY);
                            const deltaX = Math.abs(touch.clientX - startX);
                            const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                            
                            // Detect drag intent: if movement is significant (>10px), treat as drag
                            // Lowered threshold to detect drag earlier and prevent scrolling sooner
                            const isDragIntent = totalMovement > 10;
                            
                            if (isDragIntent) {
                              // ALWAYS prevent default and stop propagation when drag is detected
                              // This prevents ALL scrolling, including momentum scrolling
                              e.preventDefault();
                              e.stopPropagation();
                              
                              // Lock scroll position immediately when drag is detected
                              if (!isDragging) {
                                setIsDragging(true);
                                // Lock body scroll immediately
                                const scrollY = dragStartScrollYRef.current;
                                document.body.style.overflow = 'hidden';
                                document.body.style.position = 'fixed';
                                document.body.style.top = `-${scrollY}px`;
                                document.body.style.width = '100%';
                                // Also prevent scrolling on the document element
                                document.documentElement.style.overflow = 'hidden';
                                document.documentElement.style.position = 'fixed';
                                document.documentElement.style.top = `-${scrollY}px`;
                              }
                              
                              // Visual feedback for dragging
                              e.currentTarget.classList.add('opacity-50', 'scale-105', 'z-10');
                              e.currentTarget.style.transform = `translate(${touch.clientX - startX}px, ${touch.clientY - startY}px)`;
                            } else {
                              // For small movements, still prevent default to avoid accidental scrolling
                              // Only allow scrolling if user explicitly scrolls (not dragging)
                              // But we need to be careful - if user is just tapping, don't prevent
                              const timeSinceStart = Date.now() - parseFloat(e.currentTarget.dataset.touchStartTime || '0');
                              if (timeSinceStart > 100) {
                                // If touch has been held for >100ms, it's likely a drag attempt
                                e.preventDefault();
                                e.stopPropagation();
                              }
                            }
                          }}
                          onTouchEnd={(e) => {
                            const element = e.currentTarget;
                            
                            // Unlock scroll if we were dragging
                            if (isDragging) {
                              const scrollY = dragStartScrollYRef.current;
                              // Restore all scroll-related styles
                              document.body.style.overflow = '';
                              document.body.style.position = '';
                              document.body.style.top = '';
                              document.body.style.width = '';
                              document.documentElement.style.overflow = '';
                              document.documentElement.style.position = '';
                              document.documentElement.style.top = '';
                              // Restore scroll position
                              window.scrollTo(0, scrollY);
                              // Use requestAnimationFrame to ensure scroll is restored after styles are reset
                              requestAnimationFrame(() => {
                                window.scrollTo(0, scrollY);
                              });
                              setIsDragging(false);
                            }
                            
                            e.stopPropagation();
                            
                            // Reset visual state
                            element.classList.remove('opacity-50', 'scale-105', 'z-10');
                            element.style.transform = '';
                            
                            // Find the element under the touch point
                            const touch = e.changedTouches[0];
                            const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                            
                            if (elementBelow) {
                              const dropTarget = elementBelow.closest('[data-file-index]');
                              if (dropTarget) {
                                const draggedIndex = parseInt(element.dataset.draggedIndex || '0');
                                const dropIndex = parseInt(dropTarget.getAttribute('data-file-index') || '0');
                                
                                if (draggedIndex !== dropIndex) {
                                  const newFiles = [...files];
                                  const [draggedFile] = newFiles.splice(draggedIndex, 1);
                                  newFiles.splice(dropIndex, 0, draggedFile);
                                  setFiles(newFiles);
                                  // Update selectedFiles to maintain selection state after reorder
                                  setSelectedFiles(prev => {
                                    // Map old selected files to new file positions by ID
                                    return prev.map(selectedFile => {
                                      const newFile = newFiles.find(f => f.id === selectedFile.id);
                                      return newFile || selectedFile;
                                    }).filter(Boolean);
                                  });
                                  setRenderKey(prev => prev + 1); // Force re-render
                                  console.log('Mobile drag: Files reordered:', newFiles.map(f => f.file.name));
                                }
                              }
                            }
                            
                            // Clear touch start data
                            delete e.currentTarget.dataset.touchStartTime;
                            delete e.currentTarget.dataset.touchStartY;
                            delete e.currentTarget.dataset.touchStartX;
                            delete e.currentTarget.dataset.draggedIndex;
                          }}
                          onTouchCancel={(e) => {
                            // Handle touch cancel (e.g., if user scrolls page instead)
                            const element = e.currentTarget;
                            
                            // Unlock scroll if we were dragging
                            if (isDragging) {
                              const scrollY = dragStartScrollYRef.current;
                              // Restore all scroll-related styles
                              document.body.style.overflow = '';
                              document.body.style.position = '';
                              document.body.style.top = '';
                              document.body.style.width = '';
                              document.documentElement.style.overflow = '';
                              document.documentElement.style.position = '';
                              document.documentElement.style.top = '';
                              // Restore scroll position
                              window.scrollTo(0, scrollY);
                              requestAnimationFrame(() => {
                                window.scrollTo(0, scrollY);
                              });
                              setIsDragging(false);
                            }
                            
                            e.stopPropagation();
                            
                            // Reset visual state
                            element.classList.remove('opacity-50', 'scale-105', 'z-10');
                            element.style.transform = '';
                            
                            // Clear touch start data
                            delete e.currentTarget.dataset.touchStartTime;
                            delete e.currentTarget.dataset.touchStartY;
                            delete e.currentTarget.dataset.touchStartX;
                            delete e.currentTarget.dataset.draggedIndex;
                          }}
                          data-file-index={index}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {fileWithId.file && fileWithId.file.size > 0 && !fileWithId._corrupted ? (
                            <img
                              key={`img-${fileWithId.id}-${renderKey}`}
                              src={getImageUrl(fileWithId) || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg=='}
                              alt={`Preview ${index + 1}`}
                              draggable={false}
                              className={`w-full h-20 object-cover rounded-lg transition-all ${
                                isSelected ? 'ring-2 ring-blue-500 opacity-100' : 'opacity-70 hover:opacity-100'
                              }`}
                              onError={async (e) => {
                                const imgElement = e.currentTarget;
                                if (!imgElement || !fileWithId || !fileWithId.file) {
                                  console.error('❌ Image error handler: Missing element or file data');
                                  return;
                                }
                                
                                const fileName = fileWithId.file?.name || 'unknown';
                                
                                // Only log once per file to avoid spam
                                if (!fileWithId._errorLogged) {
                                  console.error('❌ Image failed to load:', fileName, {
                                    size: fileWithId.file?.size,
                                    type: fileWithId.file?.type,
                                    url: fileWithId.url?.substring(0, 50) + '...',
                                    urlType: fileWithId._urlType,
                                    hasDataUrl: !!fileWithId.dataUrl,
                                    currentSrc: imgElement.src?.substring(0, 50) + '...'
                                  });
                                  fileWithId._errorLogged = true;
                                }
                                
                                // Don't retry if we've already tried - prevents infinite loop
                                if (fileWithId._retryCount && fileWithId._retryCount > 2) {
                                  console.warn('⚠️ Max retries reached for:', fileName);
                                  // Mark as corrupted and hide
                                  fileWithId._corrupted = true;
                                  imgElement.style.display = 'none';
                                  setRenderKey(prev => prev + 1);
                                  return;
                                }
                                
                                // Check if this is a HEIC file that needs conversion
                                const isHeic = fileName.toLowerCase().match(/\.(heic|heif)$/i) || 
                                              fileWithId.file.type === 'image/heic' || 
                                              fileWithId.file.type === 'image/heif';
                                
                                // If it's HEIC, try to convert it first
                                if (isHeic && !fileWithId._heicConverted) {
                                  console.log('🔄 Converting HEIC file in error handler for:', fileName);
                                  try {
                                    // Dynamic import to avoid SSR issues
                                    const heic2any = (await import('heic2any')).default;
                                    const convertedBlob = await heic2any({
                                      blob: fileWithId.file,
                                      toType: 'image/jpeg',
                                      quality: 0.92
                                    });
                                    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                                    const jpegName = fileName.replace(/\.(heic|heif)$/i, '.jpg');
                                    
                                    // Create data URL from converted blob
                                    const reader = new FileReader();
                                    fileWithId.dataUrl = await new Promise<string>((resolve, reject) => {
                                      const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);
                                      reader.onload = () => {
                                        clearTimeout(timeout);
                                        resolve(reader.result as string);
                                      };
                                      reader.onerror = () => {
                                        clearTimeout(timeout);
                                        reject(new Error('Read failed'));
                                      };
                                      reader.readAsDataURL(blob);
                                    });
                                    
                                    // Update the file object
                                    fileWithId.file = new File([blob], jpegName, {
                                      type: 'image/jpeg',
                                      lastModified: fileWithId.file.lastModified
                                    });
                                    fileWithId._urlType = 'data';
                                    fileWithId._heicConverted = true;
                                    fileWithId._retryCount = (fileWithId._retryCount || 0) + 1;
                                    
                                    // Update image src
                                    if (imgElement && fileWithId.dataUrl) {
                                      imgElement.src = fileWithId.dataUrl;
                                      console.log('✅ Converted HEIC and switched to data URL for:', fileName);
                                      setRenderKey(prev => prev + 1);
                                      return;
                                    }
                                  } catch (heicError) {
                                    console.error('❌ HEIC conversion failed in error handler:', fileName, heicError);
                                  }
                                }
                                
                                // ALWAYS try data URL as fallback - it works for ALL file types
                                if (!fileWithId.dataUrl) {
                                  console.log('🔄 Creating data URL fallback for:', fileName);
                                  try {
                                    fileWithId.dataUrl = await new Promise<string>((resolve, reject) => {
                                      const reader = new FileReader();
                                      const timeout = setTimeout(() => {
                                        reject(new Error('FileReader timeout'));
                                      }, 10000); // Increased timeout for large files
                                      
                                      reader.onload = () => {
                                        clearTimeout(timeout);
                                        const result = reader.result as string;
                                        // Validate it's actually an image data URL
                                        if (result && result.startsWith('data:image/')) {
                                          resolve(result);
                                        } else {
                                          reject(new Error('Invalid image data'));
                                        }
                                      };
                                      reader.onerror = (error) => {
                                        clearTimeout(timeout);
                                        reject(error);
                                      };
                                      
                                      try {
                                        reader.readAsDataURL(fileWithId.file);
                                      } catch (readError) {
                                        clearTimeout(timeout);
                                        reject(readError);
                                      }
                                    });
                                    
                                    fileWithId._urlType = 'data';
                                    fileWithId._retryCount = (fileWithId._retryCount || 0) + 1;
                                    
                                    // Update image src with data URL immediately
                                    if (imgElement && imgElement.parentNode && fileWithId.dataUrl) {
                                      imgElement.src = fileWithId.dataUrl;
                                      console.log('✅ Switched to data URL for:', fileName);
                                      // Force re-render
                                      setRenderKey(prev => prev + 1);
                                    }
                                    return;
                                  } catch (dataError: any) {
                                    console.error('❌ Data URL creation failed for:', fileName, dataError?.message || dataError);
                                    // If data URL fails, the file might be corrupted
                                  }
                                } else {
                                  // Data URL already exists but image still failed - try to recreate it
                                  console.warn('⚠️ Data URL exists but image failed - attempting to recreate:', fileName);
                                  
                                  // Validate the existing data URL
                                  if (fileWithId.dataUrl && !fileWithId.dataUrl.startsWith('data:image/')) {
                                    console.warn('⚠️ Invalid data URL format, recreating:', fileName);
                                    fileWithId.dataUrl = undefined; // Clear invalid data URL
                                  }
                                  
                                  // Try to recreate the data URL from the file
                                  if (!fileWithId._recreatingDataUrl) {
                                    fileWithId._recreatingDataUrl = true;
                                    try {
                                      const newDataUrl = await new Promise<string>((resolve, reject) => {
                                        const reader = new FileReader();
                                        const timeout = setTimeout(() => reject(new Error('Timeout')), 15000);
                                        
                                        reader.onload = () => {
                                          clearTimeout(timeout);
                                          const result = reader.result as string;
                                          if (result && result.startsWith('data:image/')) {
                                            resolve(result);
                                          } else {
                                            reject(new Error('Invalid image data'));
                                          }
                                        };
                                        reader.onerror = () => {
                                          clearTimeout(timeout);
                                          reject(new Error('FileReader failed'));
                                        };
                                        reader.readAsDataURL(fileWithId.file);
                                      });
                                      
                                      // Update with new data URL
                                      fileWithId.dataUrl = newDataUrl;
                                      fileWithId._urlType = 'data';
                                      fileWithId._retryCount = (fileWithId._retryCount || 0) + 1;
                                      
                                      // Update image src
                                      if (imgElement && fileWithId.dataUrl) {
                                        imgElement.src = fileWithId.dataUrl;
                                        console.log('✅ Recreated data URL for:', fileName);
                                        setRenderKey(prev => prev + 1);
                                        fileWithId._recreatingDataUrl = false;
                                        return;
                                      }
                                    } catch (recreateError) {
                                      console.error('❌ Failed to recreate data URL for:', fileName, recreateError);
                                      fileWithId._recreatingDataUrl = false;
                                      
                                      // If recreation fails, the file is likely corrupted
                                      // Mark as corrupted and hide
                                      fileWithId._corrupted = true;
                                      imgElement.style.display = 'none';
                                      console.error('❌ File appears to be corrupted after multiple attempts:', fileName);
                                      
                                      // Force re-render to show placeholder
                                      setRenderKey(prev => prev + 1);
                                    }
                                  }
                                }
                                
                                // Cleanup blob URL if it exists and failed
                                if (fileWithId.url && fileWithId._urlType === 'blob') {
                                  try {
                                    URL.revokeObjectURL(fileWithId.url);
                                    delete fileWithId.url;
                                  } catch (error) {
                                    // Ignore
                                  }
                                }
                              }}
                              onLoad={() => {
                                // Successfully loaded - clear error flag
                                fileWithId._errorLogged = false;
                                fileWithId._retryCount = 0;
                              }}
                            />
                          ) : fileWithId._corrupted ? (
                            <div className="w-full h-20 bg-red-100 dark:bg-red-900/20 rounded-lg flex flex-col items-center justify-center text-xs text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700">
                              <span className="text-lg mb-1">⚠️</span>
                              <span>Corrupted</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFiles(prev => prev.filter(f => f.id !== fileWithId.id));
                                  setSelectedFiles(prev => prev.filter(f => f.id !== fileWithId.id));
                                }}
                                className="mt-1 text-xs underline hover:no-underline"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="w-full h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-xs text-gray-500">
                              Invalid file
                            </div>
                          )}
                          
                          {/* Selection Checkbox - appears on hover */}
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Selection button clicked for:', fileWithId.file.name);
                              toggleFileSelection(fileWithId);
                            }}
                            className={`absolute top-1 left-1 w-6 h-6 rounded-full border-2 transition-all z-10 ${
                              isSelected 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'bg-white border-gray-300 hover:border-green-400 hover:bg-green-50'
                            } opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer`}
                          >
                            {isSelected ? (
                              <span className="text-xs font-bold">✓</span>
                            ) : (
                              <span className="text-xs text-gray-400">+</span>
                            )}
                          </button>
                          
                          {/* VIN Toggle Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFiles(prev => prev.map(f => 
                                f.id === fileWithId.id ? { ...f, isVinImage: !f.isVinImage } : f
                              ));
                            }}
                            className={`absolute -top-2 left-1 w-7 h-7 rounded-full text-sm flex items-center justify-center transition-all ${
                              fileWithId.isVinImage 
                                ? 'bg-blue-500 text-white hover:bg-blue-600 opacity-100 shadow-lg' 
                                : 'bg-gray-500 text-white hover:bg-gray-600 opacity-80 group-hover:opacity-100'
                            }`}
                            title={fileWithId.isVinImage ? "VIN image - Accorria will prioritize this for VIN detection" : "Mark as VIN image - Click to help Accorria detect VIN"}
                          >
                            {fileWithId.isVinImage ? '🔢' : '🔍'}
                          </button>
                          
                          {/* VIN Badge */}
                          {fileWithId.isVinImage && (
                            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-bl-lg font-semibold">
                              VIN
                            </div>
                          )}
                          
                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(index);
                            }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                          >
                            ✕
                          </button>
                          <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                            {index + 1}
                          </div>
                          
                          {/* Selected indicator overlay */}
                          {isSelected && (
                            <div className="absolute inset-0 bg-green-500 bg-opacity-20 border-2 border-green-500 rounded-lg flex items-center justify-center">
                              <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                                <span className="text-sm font-bold">✓</span>
                              </div>
                            </div>
                          )}
                          
                          <div className="absolute inset-0 bg-blue-500 bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                              Drag to reorder
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* AI Analysis Button */}
                  <button
                    type="button"
                    onClick={analyzeImages}
                    disabled={isAnalyzing}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Accorrarating...</span>
                      </>
                    ) : (
                      <>
                        <span>⚡</span>
                        <span>Accorrarate</span>
                      </>
                    )}
                  </button>
                  
                  {/* Error Display */}
                  {analysisError && (
                    <div className="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-red-500 mr-2">⚠️</span>
                        <span className="text-sm">{analysisError}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Car Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Year
                </label>
                <select
                  value={carDetails.year}
                  onChange={e => setCarDetails(prev => ({ ...prev, year: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10 overflow-y-auto"
                  required
                >
                  <option value="" disabled>Select Year</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Make
                </label>
                <select
                  value={carDetails.make}
                  onChange={e => {
                    setCarDetails(prev => ({ ...prev, make: e.target.value, model: '', trim: '' }));
                    setCustomMake('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10 overflow-y-auto"
                  required
                >
                  <option value="" disabled>Select Make</option>
                  {makes.map(make => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                {carDetails.make === 'Other' && (
                  <input
                    type="text"
                    value={customMake}
                    onChange={e => setCustomMake(e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter Make"
                    required
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Model
                </label>
                <select
                  value={carDetails.model}
                  onChange={e => {
                    setCarDetails(prev => ({ ...prev, model: e.target.value, trim: '' }));
                    setCustomModel('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10 overflow-y-auto"
                  required
                  disabled={!carDetails.make}
                >
                  <option value="" disabled>{carDetails.make ? 'Select Model' : 'Select Make First'}</option>
                  {models.map((model: string) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                {carDetails.model === 'Other' && (
                  <input
                    type="text"
                    value={customModel}
                    onChange={e => setCustomModel(e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter Model"
                    required
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Trim
                </label>
                <select
                  value={carDetails.trim}
                  onChange={e => setCarDetails(prev => ({ ...prev, trim: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10 overflow-y-auto"
                  disabled={!carDetails.make || !carDetails.model || carDetails.model === 'Other' || trims.length === 0}
                >
                  <option value="">{trims.length > 0 ? 'Select Trim (Optional)' : carDetails.make && carDetails.model ? 'No trims available' : 'Select Make & Model First'}</option>
                  {trims.map((trim: string) => (
                    <option key={trim} value={trim}>{trim}</option>
                  ))}
                </select>
                {trims.length === 0 && carDetails.make && carDetails.model && carDetails.model !== 'Other' && (
                  <input
                    type="text"
                    value={carDetails.trim}
                    onChange={e => setCarDetails(prev => ({ ...prev, trim: e.target.value }))}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter Trim (Optional)"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mileage
                </label>
                <input
                  type="text"
                  value={carDetails.mileage && carDetails.mileage !== '' ? parseInt(carDetails.mileage).toLocaleString() : ''}
                  onChange={(e) => {
                    // Remove all non-numeric characters and convert to number
                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                    setCarDetails(prev => ({ ...prev, mileage: numericValue }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="50,000"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Price
              </label>
              <input
                type="text"
                value={carDetails.price ? parseInt(carDetails.price).toLocaleString() : ''}
                onChange={(e) => {
                  // Remove all non-numeric characters and convert to number
                  const numericValue = e.target.value.replace(/[^0-9]/g, '');
                  setCarDetails(prev => ({ ...prev, price: numericValue }));
                  // Clear price warning when price changes (but only if not dismissed)
                  if (!priceWarningDismissed) {
                    setPriceWarning({ type: null, message: '', marketAvg: null });
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  priceWarning.type === 'high' ? 'border-red-500 dark:border-red-500' :
                  priceWarning.type === 'low' ? 'border-green-500 dark:border-green-500' :
                  priceWarning.type === 'good' ? 'border-blue-500 dark:border-blue-500' :
                  'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter asking price"
                required
              />
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mt-2">
                Lowest I&apos;ll Take
              </label>
              <input
                type="text"
                value={carDetails.lowestPrice ? parseInt(carDetails.lowestPrice).toLocaleString() : ''}
                onChange={(e) => {
                  // Remove all non-numeric characters and convert to number
                  const numericValue = e.target.value.replace(/[^0-9]/g, '');
                  setCarDetails(prev => ({ ...prev, lowestPrice: numericValue }));
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-1"
                placeholder="Enter minimum price"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title Status
              </label>
              <select
                value={carDetails.titleStatus}
                onChange={(e) => setCarDetails(prev => ({ ...prev, titleStatus: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="clean">Clean Title</option>
                <option value="rebuilt">Rebuilt Title</option>
                <option value="salvage">Salvage Title</option>
                <option value="flood">Flood Title</option>
                <option value="lemon">Lemon Title</option>
                <option value="junk">Junk Title</option>
              </select>
            </div>

            {/* Title Rebuild Explanation - only show when Rebuilt Title is selected */}
            {carDetails.titleStatus === 'rebuilt' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Why was the title rebuilt?
                </label>
                {/* Saved rebuild reasons - quick select buttons */}
                {savedRebuildReasons.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {savedRebuildReasons.map((reason, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setTitleRebuildExplanation(reason);
                          saveRebuildReason(reason); // Increment usage count
                        }}
                        className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                )}
                <textarea
                  value={titleRebuildExplanation}
                  onChange={(e) => {
                    setTitleRebuildExplanation(e.target.value);
                    // Clear existing timeout
                    if (rebuildReasonSaveTimeoutRef.current) {
                      clearTimeout(rebuildReasonSaveTimeoutRef.current);
                    }
                    // Auto-save when user finishes typing (debounced)
                    if (e.target.value.trim()) {
                      rebuildReasonSaveTimeoutRef.current = setTimeout(() => {
                        saveRebuildReason(e.target.value);
                      }, 2000); // Save 2 seconds after user stops typing
                    }
                  }}
                  onBlur={() => {
                    // Clear timeout and save immediately when user leaves the field
                    if (rebuildReasonSaveTimeoutRef.current) {
                      clearTimeout(rebuildReasonSaveTimeoutRef.current);
                    }
                    if (titleRebuildExplanation.trim()) {
                      saveRebuildReason(titleRebuildExplanation);
                    }
                  }}
                  placeholder="e.g., Replace front bumper cover, Minor accident damage that has been professionally repaired"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={2}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  💡 Your saved reasons will appear above for quick selection
                </p>
              </div>
            )}

            {/* Location Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={carDetails.city || ''}
                  onChange={async (e) => {
                    const value = e.target.value;
                    setCarDetails(prev => ({ ...prev, city: value }));
                    
                    // VALIDATION: If zip is already set, validate city matches zip
                    if (value && carDetails.zipCode && carDetails.zipCode.length === 5) {
                      try {
                        const { onboardingService } = await import('@/services/onboardingService');
                        const zipCity = await onboardingService.getCityFromZip(carDetails.zipCode);
                        
                        if (zipCity) {
                          const enteredCityLower = value.toLowerCase().trim();
                          const zipCityLower = zipCity.toLowerCase().trim();
                          
                          if (enteredCityLower !== zipCityLower) {
                            // Show warning but don't auto-correct (user might be typing)
                            console.warn(`⚠️ City "${value}" doesn't match zip ${carDetails.zipCode} (belongs to ${zipCity})`);
                            setLocationMismatchWarning(`City "${value}" doesn't match zip ${carDetails.zipCode} (belongs to ${zipCity})`);
                          } else {
                            // They match - clear warnings
                            setLocationMismatchWarning(null);
                          }
                        }
                      } catch (err) {
                        // Ignore errors
                      }
                    }
                    
                    // If city is set and zip is empty, try to get zip from profile (onboarding data)
                    if (value && !carDetails.zipCode) {
                      try {
                        const { supabase } = await import('@/utils/supabase');
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user) {
                          const { data: profile } = await supabase
                            .from('profiles')
                            .select('zip_code, city')
                            .eq('id', user.id)
                            .maybeSingle();
                          
                          // Use onboarding profile data - if city matches, use the zip from onboarding
                          if (profile?.zip_code && profile.city && profile.city.toLowerCase().trim() === value.toLowerCase().trim()) {
                            setCarDetails(prev => ({ ...prev, zipCode: profile.zip_code }));
                            console.log(`✅ Using zip ${profile.zip_code} from onboarding profile (matches city ${value})`);
                          }
                        }
                      } catch (err) {
                        // Ignore errors - zip auto-fill is optional
                      }
                    }
                    
                    // Simple autocomplete - show nearby cities based on user's profile
                    if (value.length > 2) {
                      setCitySuggestions([]);
                    } else {
                      setCitySuggestions([]);
                    }
                  }}
                  onBlur={async () => {
                    // Final validation when user leaves city field
                    if (carDetails.city && carDetails.zipCode && carDetails.zipCode.length === 5) {
                      try {
                        const { onboardingService } = await import('@/services/onboardingService');
                        const zipCity = await onboardingService.getCityFromZip(carDetails.zipCode);
                        
                        if (zipCity) {
                          const enteredCityLower = carDetails.city.toLowerCase().trim();
                          const zipCityLower = zipCity.toLowerCase().trim();
                          
                          if (enteredCityLower !== zipCityLower) {
                            // Auto-correct city to match zip (zip is more specific)
                            setCarDetails(prev => ({ ...prev, city: zipCity }));
                            console.log(`✅ Auto-corrected city to ${zipCity} to match zip ${carDetails.zipCode}`);
                          }
                        }
                      } catch (err) {
                        // Ignore errors
                      }
                    }
                  }}
                  onFocus={() => {
                    // Load nearby cities when user focuses (if we have their zip code)
                    if (carDetails.zipCode) {
                      // Could fetch nearby cities based on zip code
                      // For now, just show profile city if available
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter city (auto-filled from profile)"
                  required
                  list="city-suggestions"
                />
                {citySuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {citySuggestions.map((city, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCarDetails(prev => ({ ...prev, city }));
                          setCitySuggestions([]);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  💡 Set your default city in your profile settings
                </p>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Zip Code
                </label>
                <input
                  type="text"
                  value={carDetails.zipCode || ''}
                  onChange={async (e) => {
                    // Only allow numbers, max 5 digits
                    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 5);
                    setCarDetails(prev => ({ ...prev, zipCode: value }));
                    
                    // VALIDATION: When zip is entered, lookup city and validate it matches
                    if (value.length === 5 && carDetails.city) {
                      try {
                        const { onboardingService } = await import('@/services/onboardingService');
                        const zipCity = await onboardingService.getCityFromZip(value);
                        
                        if (zipCity) {
                          // Check if zip's city matches entered city
                          const enteredCityLower = carDetails.city.toLowerCase().trim();
                          const zipCityLower = zipCity.toLowerCase().trim();
                          
                          if (enteredCityLower !== zipCityLower) {
                            // Show warning - zip doesn't match city
                            console.warn(`⚠️ Zip ${value} belongs to ${zipCity}, but city is set to ${carDetails.city}`);
                            setLocationMismatchWarning(`Zip ${value} belongs to ${zipCity}, not ${carDetails.city}`);
                            // Auto-update city to match zip (since zip is more specific)
                            setCarDetails(prev => ({ ...prev, city: zipCity }));
                            // Clear warning after auto-correction
                            setTimeout(() => setLocationMismatchWarning(null), 3000);
                          }
                        }
                      } catch (err) {
                        // Ignore errors - validation is optional
                        console.debug('Zip validation error:', err);
                      }
                    }
                    
                    // Show nearby zip codes as user types (if we have their city)
                    if (value.length >= 3 && carDetails.city) {
                      setZipSuggestions([]);
                    } else {
                      setZipSuggestions([]);
                    }
                  }}
                  onBlur={async () => {
                    // Final validation when user leaves zip field
                    if (carDetails.zipCode && carDetails.zipCode.length === 5 && carDetails.city) {
                      try {
                        const { onboardingService } = await import('@/services/onboardingService');
                        const zipCity = await onboardingService.getCityFromZip(carDetails.zipCode);
                        
                        if (zipCity) {
                          const enteredCityLower = carDetails.city.toLowerCase().trim();
                          const zipCityLower = zipCity.toLowerCase().trim();
                          
                          if (enteredCityLower !== zipCityLower) {
                            // Auto-correct city to match zip
                            setCarDetails(prev => ({ ...prev, city: zipCity }));
                          }
                        }
                      } catch (err) {
                        // Ignore errors
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter zip code (auto-filled from profile)"
                  maxLength={5}
                  required
                />
                {zipSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {zipSuggestions.map((zip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCarDetails(prev => ({ ...prev, zipCode: zip }));
                          setZipSuggestions([]);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {zip}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  💡 Set your default zip code in your profile settings
                </p>
              </div>
            </div>
            
            {/* Location Mismatch Warning */}
            {locationMismatchWarning && (
              <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start">
                  <span className="text-yellow-600 dark:text-yellow-400 mr-2">⚠️</span>
                  <div className="flex-1">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                      Location Mismatch
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      {locationMismatchWarning}
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      Using onboarding profile data ensures city and zip code match.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  About the Vehicle
                </label>
                <div className="flex items-center gap-2">
                  {/* Microphone Button */}
                  <button
                    type="button"
                    onClick={handleMicrophoneClick}
                    disabled={isTranscribing}
                    className={`p-2 rounded-full transition-all ${
                      isRecording
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                        : isTranscribing
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                    title={isRecording ? 'Stop recording' : isTranscribing ? 'Transcribing...' : 'Start voice recording'}
                  >
                  {isTranscribing ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : isRecording ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v4a1 1 0 11-2 0V7zM12 9a1 1 0 10-2 0v3a1 1 0 102 0V9z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                  )}
                  </button>
                  {/* Browser compatibility note */}
                  {typeof window !== 'undefined' && (window.navigator.userAgent.includes('Cursor') || !navigator.mediaDevices?.getUserMedia) && (
                    <span className="text-xs text-gray-500 dark:text-gray-400" title="Voice recording works best in Chrome, Firefox, or Safari. Open this page in an external browser if microphone access is denied.">
                      ⚠️
                    </span>
                  )}
                </div>
              </div>
              
              {/* User Presets - Quick Select Buttons */}
              {userPresets.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">💡 Your saved phrases (click to add):</p>
                  <div className="flex flex-wrap gap-2">
                    {userPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const currentText = carDetails.aboutVehicle || '';
                          const newText = currentText 
                            ? `${currentText}, ${preset.preset_value}`
                            : preset.preset_value;
                          setCarDetails(prev => ({ ...prev, aboutVehicle: newText }));
                        }}
                        className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        title={`Used ${preset.usage_count} time${preset.usage_count > 1 ? 's' : ''}`}
                      >
                        {preset.preset_value} ({preset.usage_count})
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <textarea
                value={carDetails.aboutVehicle}
                onChange={(e) => setCarDetails(prev => ({ ...prev, aboutVehicle: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder={`Tell us about the vehicle's condition, features, history, or any important details...${carDetails.titleStatus === 'rebuilt' && titleRebuildExplanation ? `\n\nTitle Rebuild: ${titleRebuildExplanation}` : ''}\n\n💡 Accorria learns from your input - common phrases will appear as quick-select buttons next time`}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                💡 Accorria learns from your input - common phrases will appear as quick-select buttons next time
              </p>
            </div>

            {/* VIN status banner */}
            {vinStatus && vinStatus.state !== 'decoded' && (
              <div className="mb-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start">
                  <span className="text-2xl mr-3">🔎</span>
                  <div>
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                      {vinStatus.message || 'VIN data missing. Upload a VIN photo to unlock full equipment decoding.'}
                    </p>
                    {vinStatus.source && (
                      <p className="text-xs text-amber-600 dark:text-amber-200 mt-1">
                        Source: {vinStatus.source}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* BLOCK B - VIN Decode */}
            {vinStatus && vinStatus.state === 'decoded' && (
              <div className="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">✅</span>
                  <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                    VIN: {vinStatus.vin || 'Decoded'}
                  </p>
                </div>
              </div>
            )}

            {/* BLOCK A - Pricing Summary (Unified) */}
            {analysisResult && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-green-200 dark:border-green-700 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-3">
                  <span className="mr-2">💰</span>
                  Great pricing!
                  {analysisResult.market_intelligence?.pricing_analysis && (
                    <span className="ml-2 text-xs text-green-600 dark:text-green-400">✓ Market Data</span>
                  )}
                </h3>
                
                {/* Price Warning Message - Integrated */}
                {priceWarning.type && priceWarning.marketAvg && !priceWarningDismissed && (
                  <div className={`mb-4 p-3 rounded-lg text-sm ${
                    priceWarning.type === 'high' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
                    priceWarning.type === 'low' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' :
                    'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  }`}>
                    <div className="flex items-start">
                      <span className={`text-xl mr-2 ${
                        priceWarning.type === 'high' ? 'text-red-600 dark:text-red-400' :
                        priceWarning.type === 'low' ? 'text-green-600 dark:text-green-400' :
                        'text-blue-600 dark:text-blue-400'
                      }`}>
                        {priceWarning.type === 'high' ? '⚠️' : priceWarning.type === 'low' ? '✅' : 'ℹ️'}
                      </span>
                      <div className="flex-1">
                        <div className={`font-medium ${
                          priceWarning.type === 'high' ? 'text-red-700 dark:text-red-300' :
                          priceWarning.type === 'low' ? 'text-green-700 dark:text-green-300' :
                          'text-blue-700 dark:text-blue-300'
                        }`}>
                          {priceWarning.message}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {(() => {
                  // Use pricing tiers from backend if available, otherwise calculate from market data or user's price
                  let quickPrice = 0;
                  let marketPrice = 0;
                  let premiumPrice = 0;
                  
                  // First, try to use pricing tiers from backend response
                  if (analysisResult.pricing) {
                    quickPrice = analysisResult.pricing.quick_sale?.price || 0;
                    marketPrice = analysisResult.pricing.market_price?.price || 0;
                    premiumPrice = analysisResult.pricing.premium?.price || 0;
                  }
                  
                  // If backend pricing not available, calculate from market data
                  if (!quickPrice || !marketPrice || !premiumPrice) {
                    const basePrice = parseInt(carDetails.price || '10000');
                    const marketData = analysisResult.market_intelligence?.pricing_analysis;
                    
                    // Use market average if available, otherwise use user's price
                    if (marketData?.market_prices?.market_average) {
                      const marketAvg = (marketData.market_prices as { market_average?: number }).market_average || basePrice;
                      quickPrice = Math.floor(marketAvg * 0.85);
                      marketPrice = Math.floor(marketAvg);
                      premiumPrice = Math.floor(marketAvg * 1.15);
                    } else {
                      quickPrice = Math.floor(basePrice * 0.85);
                      marketPrice = basePrice;
                      premiumPrice = Math.floor(basePrice * 1.15);
                    }
                  }
                  
                  return (
                    <div className="grid grid-cols-1 gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedPricingTier('quick')}
                        className={`p-4 rounded-lg border-2 transition-all min-h-[80px] active:scale-95 touch-manipulation ${
                          selectedPricingTier === 'quick' 
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg' 
                            : 'border-gray-200 dark:border-gray-600 hover:border-green-300 active:border-green-400 bg-white dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-bold text-green-600 dark:text-green-400">🚀 Quick Sale</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Lower price, faster sale</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg text-gray-900 dark:text-white">${quickPrice.toLocaleString()}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Less • Quick</div>
                          </div>
                        </div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setSelectedPricingTier('market')}
                        className={`p-4 rounded-lg border-2 transition-all min-h-[80px] active:scale-95 touch-manipulation ${
                          selectedPricingTier === 'market' 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg' 
                            : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 active:border-blue-400 bg-white dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-bold text-blue-600 dark:text-blue-400">⚖️ Market Rate</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Balanced price & speed</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg text-gray-900 dark:text-white">${marketPrice.toLocaleString()}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Moderate</div>
                          </div>
                        </div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setSelectedPricingTier('premium')}
                        className={`p-4 rounded-lg border-2 transition-all min-h-[80px] active:scale-95 touch-manipulation ${
                          selectedPricingTier === 'premium' 
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg' 
                            : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 active:border-purple-400 bg-white dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-bold text-purple-600 dark:text-purple-400">💎 Premium</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Higher price, detailed listing</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900 dark:text-white">${premiumPrice.toLocaleString()}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">More • Slower</div>
                          </div>
                        </div>
                      </button>
                      
                      {/* Use My Original Price Button */}
                      {carDetails.price && parseInt(carDetails.price) > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedPricingTier('original')}
                          className={`p-4 rounded-lg border-2 transition-all min-h-[80px] active:scale-95 touch-manipulation ${
                            selectedPricingTier === 'original' 
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-lg' 
                              : 'border-gray-200 dark:border-gray-600 hover:border-orange-300 active:border-orange-400 bg-white dark:bg-gray-800'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-bold text-orange-600 dark:text-orange-400">💰 Use My Price</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Keep your original price</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg text-gray-900 dark:text-white">${parseInt(carDetails.price || '0').toLocaleString()}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Your price</div>
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  );
                })()}
                
                {/* Pricing Breakdown - Collapsible */}
                {pricingBreakdown && (
                  <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
                    <button
                      type="button"
                      onClick={() => setShowPricingBreakdown(!showPricingBreakdown)}
                      className="w-full text-left flex items-center justify-between mb-3 hover:opacity-80 transition-opacity"
                    >
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                        <span className="mr-2">📊</span>
                        Pricing Breakdown
                      </h4>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        {showPricingBreakdown ? '▼ Hide' : '▶ Show'}
                      </span>
                    </button>
                    {showPricingBreakdown && (
                      <div className="space-y-2 text-xs bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                      {/* Show raw Google price if different from base */}
                      {pricingBreakdown.raw_google_price && pricingBreakdown.raw_google_price !== pricingBreakdown.base_market_value && (
                        <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 px-2 -mx-2 rounded">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">Raw Google Search Price:</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            ${(pricingBreakdown.raw_google_price || 0).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Base Market Value (after adjustments):</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${(pricingBreakdown.base_market_value || 0).toLocaleString()}
                        </span>
                      </div>
                      
                      {pricingBreakdown.title_status_adjustment != null && pricingBreakdown.title_status_adjustment !== 0 && (
                        <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400">
                            {pricingBreakdown.title_status_label || 'Title'}:
                          </span>
                          <span className={`font-semibold ${(pricingBreakdown.title_status_adjustment || 0) < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {(pricingBreakdown.title_status_adjustment || 0) > 0 ? '+' : ''}
                            ${(pricingBreakdown.title_status_adjustment || 0).toLocaleString()} 
                            ({(pricingBreakdown.title_status_percent || 0) > 0 ? '+' : ''}
                            {pricingBreakdown.title_status_percent || 0}%)
                          </span>
                        </div>
                      )}
                      
                      {pricingBreakdown.trim_adjustment != null && pricingBreakdown.trim_adjustment !== 0 && (
                        <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400">
                            Trim:
                            {pricingBreakdown.trim_tier_label && (
                              <span className="block text-xs text-gray-500 dark:text-gray-400">{pricingBreakdown.trim_tier_label}</span>
                            )}
                          </span>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            +${(pricingBreakdown.trim_adjustment || 0).toLocaleString()} 
                            (+{pricingBreakdown.trim_percent || 0}%)
                          </span>
                        </div>
                      )}
                      
                      {pricingBreakdown.mileage_adjustment != null && pricingBreakdown.mileage_adjustment !== 0 && (
                        <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400">
                            Mileage:
                            {pricingBreakdown.mileage_range_label && (
                              <span className="block text-xs text-gray-500 dark:text-gray-400">{pricingBreakdown.mileage_range_label}</span>
                            )}
                          </span>
                          <span className={`font-semibold ${(pricingBreakdown.mileage_adjustment || 0) < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {(pricingBreakdown.mileage_adjustment || 0) > 0 ? '+' : ''}
                            ${(pricingBreakdown.mileage_adjustment || 0).toLocaleString()} 
                            ({(pricingBreakdown.mileage_percent || 0) > 0 ? '+' : ''}
                            {pricingBreakdown.mileage_percent || 0}%)
                          </span>
                        </div>
                      )}
                      
                      {pricingBreakdown.feature_adjustment != null && pricingBreakdown.feature_adjustment !== 0 && (
                        <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400">
                            Features:
                            {pricingBreakdown.feature_details && pricingBreakdown.feature_details.length > 0 && (
                              <ul className="mt-1 text-xs text-gray-500 dark:text-gray-400 list-disc list-inside space-y-0.5">
                                {pricingBreakdown.feature_details.slice(0, 3).map((detail, idx) => (
                                  <li key={`${detail.label ?? detail.keyword ?? 'feature'}-${idx}`}>
                                    {detail.label || detail.keyword}: +{detail.percent || 0}%
                                  </li>
                                ))}
                              </ul>
                            )}
                          </span>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            +${(pricingBreakdown.feature_adjustment || 0).toLocaleString()} 
                            (+{pricingBreakdown.feature_percent || 0}%)
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center py-2 pt-3 border-t-2 border-gray-300 dark:border-gray-600">
                        <span className="font-semibold text-gray-900 dark:text-white">Suggested Price:</span>
                        <span className="font-bold text-sm text-green-600 dark:text-green-400">
                          ${(pricingBreakdown.final_adjusted_price || pricingBreakdown.base_market_value || 0).toLocaleString()}
                        </span>
                      </div>
                      
                      {pricingBreakdown.market_data_source && (
                        <div className="pt-1 text-xs text-gray-500 dark:text-gray-400">
                          {pricingBreakdown.market_data_source === 'google_search_grounding' ? '✓ Live Market Data' : 'Estimated'}
                          {pricingBreakdown.market_location && ` · ${pricingBreakdown.market_location}`}
                        </div>
                      )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Edit Button */}
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAnalysis(false);
                      setAnalysisResult(null);
                      setSelectedPricingTier('market');
                    }}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <span>✏️</span>
                    <span>Edit Details & Pricing</span>
                  </button>
                </div>
              </div>
            )}

            {/* Final Description Field - Generated by AI */}
            {carDetails.finalDescription && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    📄 Final Description
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(carDetails.finalDescription);
                      alert('✅ Listing copied to clipboard! Ready to paste into Facebook Marketplace.');
                    }}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    📋 Copy to Clipboard
                  </button>
                </div>
                <textarea
                  value={carDetails.finalDescription}
                  readOnly
                  className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-lg bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={Math.max(8, carDetails.finalDescription.split('\n').length + 2)}
                  placeholder="AI will generate the final polished listing here..."
                />
                
                {/* Unified Post Button */}
                <div className="mt-4 space-y-2">
                  <button
                    type="button"
                    onClick={handleTestPost}
                    disabled={isPosting}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>🚀</span>
                    <span>{isPosting ? 'Posting...' : 'Post Listing'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={isPosting}
                    className="w-full px-6 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>💾</span>
                    <span>{isPosting ? 'Saving...' : 'Save as Draft'}</span>
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                    {selectedPlatforms.length > 0 
                      ? `Will post to ${selectedPlatforms.length} platform${selectedPlatforms.length > 1 ? 's' : ''} and save to dashboard`
                      : 'Save as draft to post later, or select platforms above to post now'
                    }
                  </p>
                </div>
              </div>
            )}



            {/* Platform Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Platforms (Optional)
                </label>
                <Link 
                  href="/dashboard/connections" 
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Manage Connections →
                </Link>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Choose which platforms to post to. Connect your accounts in Settings → Connections first.
              </p>
              <div className="space-y-2">
                {[
                  { id: 'facebook_marketplace', name: 'Facebook Marketplace', icon: '📘' },
                  { id: 'craigslist', name: 'Craigslist', icon: '📋' },
                  { id: 'offerup', name: 'OfferUp', icon: '📱' },
                  { id: 'ebay', name: 'eBay Motors', icon: '🛒' },
                  { id: 'autotrader', name: 'AutoTrader', icon: '🚗' },
                  { id: 'cars_com', name: 'Cars.com', icon: '🚙' },
                  { id: 'cargurus', name: 'CarGurus', icon: '🔍' },
                  { id: 'vroom', name: 'Vroom', icon: '💨' }
                ].map((platform) => {
                  const isConnected = connectedPlatforms[platform.id] || false;
                  return (
                    <label key={platform.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes(platform.id)}
                        onChange={(e) => {
                          if (e.target.checked && !isConnected) {
                            // Show message to connect account first
                            alert(`${platform.name} is not connected. Please connect your account in Settings → Connections first.`);
                            return;
                          }
                          if (e.target.checked) {
                            setSelectedPlatforms([...selectedPlatforms, platform.id]);
                          } else {
                            setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform.id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`text-sm ${isConnected ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                        {platform.icon} {platform.name}
                        {isConnected ? (
                          <span className="ml-2 text-xs text-green-600 dark:text-green-400">✓ Connected</span>
                        ) : (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-500">(Not connected)</span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
              
              {/* Warning if selecting unconnected platforms */}
              {selectedPlatforms.some(platformId => !connectedPlatforms[platformId]) && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-xs text-yellow-800 dark:text-yellow-300">
                    ⚠️ Some selected platforms are not connected. Please connect them in{' '}
                    <Link href="/dashboard/connections" className="underline font-medium">
                      Settings → Connections
                    </Link>{' '}
                    before posting.
                  </p>
                </div>
              )}
            </div>

            {/* AI Analysis Results - Hidden for cleaner UX */}
            {false && showAnalysis && analysisResult && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <span className="mr-2">🤖</span>
                    AI Analysis Results
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAnalysis(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Detected Information */}
                {analysisResult.image_analysis && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Detected Information</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Make:</span>
                        <span className="font-medium">{analysisResult.image_analysis.make || 'Not detected'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Model:</span>
                        <span className="font-medium">{analysisResult.image_analysis.model || 'Not detected'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Year:</span>
                        <span className="font-medium">{analysisResult.image_analysis.year || 'Not detected'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Color:</span>
                        <span className="font-medium">{analysisResult.image_analysis.color || 'Not detected'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Mileage:</span>
                        <span className="font-medium">{analysisResult.image_analysis.mileage ? `${analysisResult.image_analysis.mileage.toLocaleString()} mi` : 'Not detected'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                        <span className="font-medium">{Math.round((analysisResult.confidence_score || 0) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Price Recommendations */}
                {analysisResult.price_recommendations && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price Recommendations</h4>
                    <div className="space-y-2">
                      {Object.entries(analysisResult.price_recommendations.price_recommendations || {}).map(([strategy, data]: [string, { price: number; description?: string; estimated_days_to_sell?: number }]) => (
                        <div key={strategy} className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg border">
                          <div>
                            <div className="font-medium capitalize">{strategy.replace('_', ' ')}</div>
                            <div className="text-xs text-gray-500">{data.description}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">${data.price?.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">{data.estimated_days_to_sell} days</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Market Intelligence */}
                {analysisResult.market_intelligence && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Market Intelligence</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>Market trend: <span className="font-medium capitalize">{analysisResult.market_intelligence.pricing_analysis?.price_trends?.trend || 'stable'}</span></p>
                      <p>Demand level: <span className="font-medium capitalize">{analysisResult.market_intelligence.make_model_analysis?.demand_analysis?.demand_level || 'medium'}</span></p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {false && descriptionSuggestions.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">AI Description Suggestions</label>
                <div className="space-y-2">
                  {descriptionSuggestions.map((desc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="w-full text-left px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                      onClick={() => setCarDetails(prev => ({ ...prev, description: desc }))}
                    >
                      {desc}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="space-y-2">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                {selectedPlatforms.length > 0 ? (
                  <button
                    type="submit"
                    disabled={isPosting || files.length === 0}
                    className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                  >
                    {isPosting ? `Posting to ${selectedPlatforms.length} Platform${selectedPlatforms.length > 1 ? 's' : ''}...` : `Post to ${selectedPlatforms.length} Platform${selectedPlatforms.length > 1 ? 's' : ''}`}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={isPosting || files.length === 0}
                    className="flex-1 px-4 py-3 bg-gray-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                  >
                    {isPosting ? 'Saving...' : 'Save as Draft'}
                  </button>
                )}
              </div>
              {selectedPlatforms.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  💡 Select platforms above to post, or save as draft to post later
                </p>
              )}
            </div>
          </form>
          
          {/* Mobile-friendly back button */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 sm:hidden">
            <button
              onClick={onClose}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {/* 1. Add a style block to hide number input spinners */}
      <style jsx global>{`
        /* Hide number input spinners for Chrome, Safari, Edge, Opera */
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        /* Hide number input spinners for Firefox */
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
} 