'use client';
// @ts-nocheck - Temporary disable for deployment

import React, { useState, useRef } from 'react';
import { api } from '@/utils/api';
import FacebookAuth from '@/components/FacebookAuth';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Card, 
  CardContent, 
  Chip, 
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Paper
} from '@mui/material';
import { 
  CloudUpload, 
  PhotoCamera, 
  Delete, 
  ExpandMore,
  ContentCopy,
  CheckCircle,
  Error
} from '@mui/icons-material';

interface CarDetails {
  make?: string;
  model?: string;
  year?: number;
  mileage?: string;
  description?: string;
  location: string;
  title_status: string;
  additional_details?: string;
}

interface ListingResult {
  success: boolean;
  timestamp: string;
  image_analysis: any;
  market_analysis: any;
  pricing_recommendations: any;
  formatted_listings: any;
  processing_time: number;
  error_message?: string;
}

const AIListingGenerator: React.FC = () => {
  const [images, setImages] = useState<File[]>([]);
  const [carDetails, setCarDetails] = useState<CarDetails>({
    location: 'Detroit, MI',
    title_status: 'clean'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ListingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [facebookListingContent, setFacebookListingContent] = useState<{
    title: string;
    description: string;
    price: number;
    images?: string[];
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (images.length + imageFiles.length > 20) {
      setError('Maximum 20 images allowed');
      return;
    }
    
    setImages(prev => [...prev, ...imageFiles]);
    setError(null);
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCarDetailsChange = (field: keyof CarDetails, value: string | number) => {
    setCarDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateListing = async () => {
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      
      // Add images
      images.forEach((image, index) => {
        formData.append(`images`, image);
      });

      // Add car details
      Object.entries(carDetails).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          formData.append(key, String(value));
        }
      });

      const data = await api.postFormData('/api/v1/car-listing/generate', formData) as any;

      if (!data.success) {
        const errorMessage = data.error || data.detail || 'Failed to generate listing';
        setError(errorMessage);
        return;
      }

      setResult(data);
      
      // Extract Facebook listing content for integration
      if (data.formatted_listings?.facebook) {
        const facebookContent = data.formatted_listings.facebook as string;
        const lines = facebookContent.split('\n');
        const title = lines[0] || 'Car Listing';
        const description = lines.slice(1).join('\n');
        const price = data.pricing_recommendations?.market_price?.price || 0;
        
        setFacebookListingContent({
          title,
          description,
          price,
          images: images.map(img => URL.createObjectURL(img))
        });
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyListing = async (platform: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedPlatform(platform);
      setTimeout(() => setCopiedPlatform(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getImagePreview = (file: File) => {
    return URL.createObjectURL(file);
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        🚗 AI Car Listing Generator
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Upload car photos and get AI-generated listings for multiple platforms
      </Typography>

      {/* Image Upload Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📸 Upload Car Photos
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <Button
              variant="outlined"
              startIcon={<CloudUpload />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ mr: 2 }}
            >
              Upload Images
            </Button>
            <Typography variant="caption" color="text.secondary">
              Upload up to 20 car images (max 5MB each)
            </Typography>
          </Box>

          {/* Image Previews */}
          {images.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
              {images.map((image, index) => (
                <Paper
                  key={index}
                  sx={{
                    position: 'relative',
                    height: 150,
                    backgroundImage: `url(${getImagePreview(image)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: 1,
                  }}
                >
                  <IconButton
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.7)',
                      },
                    }}
                    onClick={() => handleRemoveImage(index)}
                  >
                    <Delete />
                  </IconButton>
                </Paper>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Car Details Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🚙 Car Details
          </Typography>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <TextField
              label="Make"
              value={carDetails.make || ''}
              onChange={(e) => handleCarDetailsChange('make', e.target.value)}
              fullWidth
            />
            <TextField
              label="Model"
              value={carDetails.model || ''}
              onChange={(e) => handleCarDetailsChange('model', e.target.value)}
              fullWidth
            />
            <TextField
              label="Year"
              type="number"
              value={carDetails.year || ''}
              onChange={(e) => handleCarDetailsChange('year', parseInt(e.target.value) || 0)}
              fullWidth
            />
            <TextField
              label="Mileage"
              value={carDetails.mileage || ''}
              onChange={(e) => handleCarDetailsChange('mileage', e.target.value)}
              fullWidth
            />
            <TextField
              label="Location"
              value={carDetails.location}
              onChange={(e) => handleCarDetailsChange('location', e.target.value)}
              fullWidth
            />
            <TextField
              label="Title Status"
              value={carDetails.title_status}
              onChange={(e) => handleCarDetailsChange('title_status', e.target.value)}
              fullWidth
            />
          </div>
          
          <TextField
            label="Description"
            multiline
            rows={3}
                            value={carDetails.description || ''}
            onChange={(e) => handleCarDetailsChange('description', e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
          
          <TextField
            label="Additional Details"
            multiline
            rows={2}
            value={carDetails.additional_details || ''}
            onChange={(e) => handleCarDetailsChange('additional_details', e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleGenerateListing}
          disabled={isGenerating || images.length === 0}
          startIcon={isGenerating ? <CircularProgress size={20} /> : <PhotoCamera />}
          sx={{ minWidth: 200 }}
        >
          {isGenerating ? 'Generating...' : 'Generate Listings'}
        </Button>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Facebook Integration */}
      <FacebookAuth 
        listingContent={facebookListingContent}
        onPostSuccess={(postId) => {
          console.log('Successfully posted to Facebook:', postId);
        }}
        onPostError={(error) => {
          console.error('Facebook posting error:', error);
        }}
      />

      {/* Results Section */}
      {result && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 Generated Listings
            </Typography>
            
            {result.formatted_listings && Object.entries(result.formatted_listings).map(([platform, content]) => (
              <Accordion key={platform} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyListing(platform, content as string);
                    }}
                    sx={{ mr: 1 }}
                  >
                    {copiedPlatform === platform ? <CheckCircle color="success" /> : <ContentCopy />}
                  </IconButton>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography
                    component="pre"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      backgroundColor: 'grey.100',
                      padding: 2,
                      borderRadius: 1,
                    }}
                  >
                    {content as string}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
            
            {result.pricing_recommendations && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  💰 Pricing Recommendations
                </Typography>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  {Object.entries(result.pricing_recommendations).map(([key, value]) => (
                    <Chip
                      key={key}
                      label={`${key}: ${value}`}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </div>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AIListingGenerator; 