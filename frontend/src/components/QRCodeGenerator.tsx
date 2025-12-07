'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  url: string;
  size?: number;
  className?: string;
  showDownload?: boolean;
  showUrl?: boolean;
}

export default function QRCodeGenerator({ 
  url, 
  size = 200, 
  className = '',
  showDownload = true,
  showUrl = true 
}: QRCodeGeneratorProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    generateQRCode();
  }, [url, size]);

  const generateQRCode = async () => {
    if (!url) return;
    
    setIsGenerating(true);
    setError('');
    
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      setQrCodeDataUrl(dataUrl);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `qrcode-${Date.now()}.png`;
    link.href = qrCodeDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      // You could add a toast notification here
      alert('URL copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert('Failed to copy URL');
    }
  };

  if (isGenerating) {
    return (
      <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-sm text-gray-600">Generating QR code...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
        <div className="text-red-600 text-sm">{error}</div>
        <button 
          onClick={generateQRCode}
          className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {qrCodeDataUrl && (
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <img 
            src={qrCodeDataUrl} 
            alt="QR Code" 
            className="block"
            style={{ width: size, height: size }}
          />
        </div>
      )}
      
      {showUrl && (
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">URL:</p>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={url}
              readOnly
              className="px-3 py-1 text-xs border border-gray-300 rounded bg-gray-50 text-gray-700 min-w-0 flex-1"
            />
            <button
              onClick={copyToClipboard}
              className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Copy
            </button>
          </div>
        </div>
      )}
      
      {showDownload && qrCodeDataUrl && (
        <button
          onClick={downloadQRCode}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          Download QR Code
        </button>
      )}
    </div>
  );
}
