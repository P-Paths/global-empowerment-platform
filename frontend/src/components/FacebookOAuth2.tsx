'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Card, 
  CardContent, 
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import { 
  Facebook as FacebookIcon,
  CheckCircle,
  Share,
  ContentCopy,
  OpenInNew,
  Warning,
  Pages,
  Person
} from '@mui/icons-material';

interface FacebookPage {
  page_id: string;
  name: string;
  category: string;
}

interface FacebookUserInfo {
  name: string;
  email?: string;
  picture_url?: string;
}

interface FacebookConnectionStatus {
  connected: boolean;
  user_info?: FacebookUserInfo;
  pages?: FacebookPage[];
  last_used?: string;
  token_expires?: string;
}

interface FacebookOAuth2Props {
  listingContent?: {
    title: string;
    description: string;
    price: number;
    make?: string;
    model?: string;
    year?: number;
    mileage?: number;
    condition?: string;
    images?: string[];
  };
  onPostSuccess?: (result: any) => void;
  onPostError?: (error: string) => void;
}

const FacebookOAuth2: React.FC<FacebookOAuth2Props> = ({
  listingContent,
  onPostSuccess,
  onPostError
}) => {
  const [connectionStatus, setConnectionStatus] = useState<FacebookConnectionStatus>({ connected: false });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [postStatus, setPostStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [marketplaceGuidance, setMarketplaceGuidance] = useState<any>(null);

  // Check connection status on component mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/v1/facebook/connection-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConnectionStatus(data);
        if (data.pages && data.pages.length > 0) {
          setSelectedPageId(data.pages[0].page_id);
        }
      }
    } catch (error) {
      console.error('Error checking Facebook connection status:', error);
    }
  };

  const initiateFacebookConnection = async () => {
    setIsConnecting(true);
    setErrorMessage('');
    
    try {
      const response = await fetch('/api/v1/auth/facebook/connect', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Redirect user to Facebook OAuth2 URL
        window.location.href = data.authorization_url;
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.detail || 'Failed to initiate Facebook connection');
      }
    } catch (error) {
      console.error('Error initiating Facebook connection:', error);
      setErrorMessage('Failed to connect to Facebook. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFacebook = async () => {
    try {
      const response = await fetch('/api/v1/auth/facebook/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ platform: 'facebook' })
      });
      
      if (response.ok) {
        setConnectionStatus({ connected: false });
        setSelectedPageId('');
        setErrorMessage('');
      }
    } catch (error) {
      console.error('Error disconnecting Facebook:', error);
    }
  };

  const postToFacebookPage = async () => {
    if (!listingContent || !connectionStatus.connected) {
      setErrorMessage('Please connect Facebook and generate a listing first');
      setPostStatus('error');
      return;
    }

    setIsPosting(true);
    setPostStatus('idle');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('title', listingContent.title);
      formData.append('description', listingContent.description);
      formData.append('price', listingContent.price.toString());
      formData.append('make', listingContent.make || '');
      formData.append('model', listingContent.model || '');
      formData.append('year', (listingContent.year || 0).toString());
      formData.append('mileage', (listingContent.mileage || 0).toString());
      formData.append('condition', listingContent.condition || 'GOOD');
      formData.append('page_id', selectedPageId);
      formData.append('post_to_marketplace', 'false');

      const response = await fetch('/api/v1/facebook/post-to-page', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setPostStatus('success');
        onPostSuccess?.(result);
      } else {
        setErrorMessage(result.error_message || 'Failed to post to Facebook');
        setPostStatus('error');
        onPostError?.(result.error_message);
      }
    } catch (error) {
      console.error('Error posting to Facebook:', error);
      setErrorMessage('Failed to post to Facebook. Please try again.');
      setPostStatus('error');
      onPostError?.(errorMessage);
    } finally {
      setIsPosting(false);
    }
  };

  const prepareForMarketplace = async () => {
    if (!listingContent || !connectionStatus.connected) {
      setErrorMessage('Please connect Facebook and generate a listing first');
      setPostStatus('error');
      return;
    }

    setIsPosting(true);
    setPostStatus('idle');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('title', listingContent.title);
      formData.append('description', listingContent.description);
      formData.append('price', listingContent.price.toString());
      formData.append('make', listingContent.make || '');
      formData.append('model', listingContent.model || '');
      formData.append('year', (listingContent.year || 0).toString());
      formData.append('mileage', (listingContent.mileage || 0).toString());
      formData.append('condition', listingContent.condition || 'GOOD');
      formData.append('post_to_marketplace', 'true');

      const response = await fetch('/api/v1/facebook/post-to-page', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setMarketplaceGuidance(result.marketplace_guidance);
        setPostStatus('success');
        onPostSuccess?.(result);
      } else {
        setErrorMessage(result.error_message || 'Failed to prepare for Marketplace');
        setPostStatus('error');
        onPostError?.(result.error_message);
      }
    } catch (error) {
      console.error('Error preparing for Marketplace:', error);
      setErrorMessage('Failed to prepare for Marketplace. Please try again.');
      setPostStatus('error');
      onPostError?.(errorMessage);
    } finally {
      setIsPosting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const openMarketplace = () => {
    if (marketplaceGuidance?.marketplace_url) {
      window.open(marketplaceGuidance.marketplace_url, '_blank');
    } else {
      window.open('https://www.facebook.com/marketplace/create/vehicle', '_blank');
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <FacebookIcon sx={{ mr: 1, color: '#1877F2' }} />
          Facebook Integration
        </Typography>

        {!connectionStatus.connected ? (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Connect your Facebook account to post listings to your Facebook pages and Marketplace
            </Typography>
            
            <Button
              variant="contained"
              startIcon={isConnecting ? <CircularProgress size={16} /> : <FacebookIcon />}
              onClick={initiateFacebookConnection}
              disabled={isConnecting}
              sx={{ 
                bgcolor: '#1877F2',
                '&:hover': { bgcolor: '#166FE5' },
                mb: 2
              }}
            >
              {isConnecting ? 'Connecting...' : 'Connect Facebook Account'}
            </Button>
            
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              We'll only post to your Facebook pages with your permission
            </Typography>
          </Box>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CheckCircle color="success" sx={{ mr: 1 }} />
              <Typography variant="body2" color="success.main">
                Connected as {connectionStatus.user_info?.name || 'Facebook User'}
              </Typography>
              <Button 
                size="small" 
                onClick={disconnectFacebook}
                sx={{ ml: 'auto' }}
              >
                Disconnect
              </Button>
            </Box>

            {connectionStatus.pages && connectionStatus.pages.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Your Facebook Pages:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {connectionStatus.pages.map((page) => (
                    <Chip
                      key={page.page_id}
                      icon={<Pages />}
                      label={page.name}
                      color={selectedPageId === page.page_id ? 'primary' : 'default'}
                      onClick={() => setSelectedPageId(page.page_id)}
                      variant={selectedPageId === page.page_id ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {listingContent ? (
              <Box>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Ready to post your listing to Facebook
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Listing Preview:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {listingContent.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ${listingContent.price.toLocaleString()}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                  {connectionStatus.pages && connectionStatus.pages.length > 0 && (
                    <Button
                      variant="contained"
                      startIcon={isPosting ? <CircularProgress size={16} /> : <Share />}
                      onClick={postToFacebookPage}
                      disabled={isPosting || !selectedPageId}
                      sx={{ 
                        bgcolor: '#1877F2',
                        '&:hover': { bgcolor: '#166FE5' }
                      }}
                    >
                      {isPosting ? 'Posting...' : 'Post to Facebook Page'}
                    </Button>
                  )}
                  
                  <Button
                    variant="outlined"
                    startIcon={isPosting ? <CircularProgress size={16} /> : <OpenInNew />}
                    onClick={prepareForMarketplace}
                    disabled={isPosting}
                  >
                    {isPosting ? 'Preparing...' : 'Prepare for Marketplace'}
                  </Button>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  💡 Tip: Use "Prepare for Marketplace" for guided posting to Facebook Marketplace
                </Typography>

                {postStatus === 'success' && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    {marketplaceGuidance ? 'Ready for Facebook Marketplace posting!' : 'Successfully posted to Facebook!'}
                  </Alert>
                )}

                {postStatus === 'error' && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {errorMessage || 'Failed to post to Facebook'}
                  </Alert>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Generate a listing first to post to Facebook
              </Typography>
            )}
          </Box>
        )}

        {/* Marketplace Guidance Dialog */}
        <Dialog 
          open={!!marketplaceGuidance} 
          onClose={() => setMarketplaceGuidance(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FacebookIcon sx={{ mr: 1, color: '#1877F2' }} />
              Facebook Marketplace Posting Guide
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              Facebook Marketplace requires manual posting. Follow these steps to post your listing.
            </Alert>
            
            <Typography variant="h6" gutterBottom>
              Your Listing Data:
            </Typography>
            
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              {marketplaceGuidance?.prepared_data && Object.entries(marketplaceGuidance.prepared_data).map(([key, value]) => (
                <Box key={key} sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                    {key.replace('_', ' ')}:
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    {String(value)}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Typography variant="h6" gutterBottom>
              Instructions:
            </Typography>
            
            <List>
              {marketplaceGuidance?.instructions?.map((instruction: string, index: number) => (
                <ListItem key={index}>
                  <ListItemText primary={instruction} />
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMarketplaceGuidance(null)}>
              Close
            </Button>
            <Button 
              variant="contained" 
              startIcon={<OpenInNew />}
              onClick={openMarketplace}
              sx={{ bgcolor: '#1877F2', '&:hover': { bgcolor: '#166FE5' } }}
            >
              Open Facebook Marketplace
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default FacebookOAuth2;
