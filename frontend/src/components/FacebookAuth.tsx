'use client';

import React, { useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { 
  Box, 
  Button, 
  Typography, 
  Card, 
  CardContent, 
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import { 
  Facebook as FacebookIcon,
  CheckCircle,
  Share,
  ContentCopy
} from '@mui/icons-material';

interface FacebookAuthProps {
  listingContent?: {
    title: string;
    description: string;
    price: number;
    images?: string[];
  };
  onPostSuccess?: (postId: string) => void;
  onPostError?: (error: string) => void;
}

const FacebookAuth: React.FC<FacebookAuthProps> = ({
  listingContent,
  onPostSuccess,
  onPostError
}) => {
  const { data: session, status } = useSession();
  const [isPosting, setIsPosting] = useState(false);
  const [postStatus, setPostStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleFacebookLogin = () => {
    signIn('facebook', { callbackUrl: window.location.href });
  };

  const handleFacebookLogout = () => {
    signOut();
    setPostStatus('idle');
    setErrorMessage('');
  };

  const copyToClipboard = async () => {
    if (!listingContent) return;
    
    const listingText = `${listingContent.title}\n\n${listingContent.description}\n\nPrice: $${listingContent.price.toLocaleString()}`;
    
    try {
      await navigator.clipboard.writeText(listingText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const openFacebookMarketplace = () => {
    window.open('https://www.facebook.com/marketplace/create/vehicle', '_blank');
  };

  const postToFacebook = async () => {
    if (!listingContent || !session) {
      setErrorMessage('Please connect Facebook and generate a listing first');
      setPostStatus('error');
      return;
    }

    setIsPosting(true);
    setPostStatus('idle');
    setErrorMessage('');

    try {
      // For demo purposes, simulate posting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPostStatus('success');
      onPostSuccess?.('demo-post-id');
      
    } catch (error) {
      console.error('Error posting to Facebook:', error);
      setErrorMessage('Failed to post to Facebook. Please try again.');
      setPostStatus('error');
      onPostError?.(errorMessage);
    } finally {
      setIsPosting(false);
    }
  };

  if (status === 'loading') {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography>Loading...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <FacebookIcon sx={{ mr: 1, color: '#1877F2' }} />
          Facebook Integration
        </Typography>

        {!session ? (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Connect your Facebook account to post listings directly to Facebook Marketplace
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<FacebookIcon />}
              onClick={handleFacebookLogin}
              sx={{ 
                bgcolor: '#1877F2',
                '&:hover': { bgcolor: '#166FE5' },
                mb: 2
              }}
            >
              Connect Facebook Account
            </Button>
            
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              We'll only post to your Facebook Marketplace with your permission
            </Typography>
          </Box>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CheckCircle color="success" sx={{ mr: 1 }} />
              <Typography variant="body2" color="success.main">
                Connected as {session.user?.name || 'Facebook User'}
              </Typography>
              <Button 
                size="small" 
                onClick={handleFacebookLogout}
                sx={{ ml: 'auto' }}
              >
                Disconnect
              </Button>
            </Box>

            {listingContent ? (
              <Box>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Ready to post your listing to Facebook Marketplace
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
                  <Button
                    variant="contained"
                    startIcon={isPosting ? <CircularProgress size={16} /> : <Share />}
                    onClick={postToFacebook}
                    disabled={isPosting}
                    sx={{ 
                      bgcolor: '#1877F2',
                      '&:hover': { bgcolor: '#166FE5' }
                    }}
                  >
                    {isPosting ? 'Posting...' : 'Post to Facebook'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={copied ? <CheckCircle /> : <ContentCopy />}
                    onClick={copyToClipboard}
                  >
                    {copied ? 'Copied!' : 'Copy Listing'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={openFacebookMarketplace}
                  >
                    Open Facebook Marketplace
                  </Button>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  💡 Tip: Copy the listing, then paste it into Facebook Marketplace for the best results
                </Typography>

                {postStatus === 'success' && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    Successfully posted to Facebook Marketplace!
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
      </CardContent>
    </Card>
  );
};

export default FacebookAuth;
