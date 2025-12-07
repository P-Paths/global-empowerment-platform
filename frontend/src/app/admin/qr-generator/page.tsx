'use client';

import React, { useState } from 'react';
import QRCodeGenerator from '@/components/QRCodeGenerator';

export default function QRGeneratorPage() {
  const [customUrl, setCustomUrl] = useState('');
  const [qrSize, setQrSize] = useState(200);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const predefinedUrls = [
    {
      name: 'Beta Signup',
      url: `${baseUrl}/beta-signup`,
      description: 'Main beta signup page'
    },
    {
      name: 'Beta Signup (QR Source)',
      url: `${baseUrl}/beta-signup?utm_source=qr&utm_medium=admin&utm_campaign=beta`,
      description: 'Beta signup with QR tracking'
    },
    {
      name: 'Beta Signup (Social Media)',
      url: `${baseUrl}/beta-signup?utm_source=social&utm_medium=qr&utm_campaign=beta`,
      description: 'Beta signup for social media sharing'
    },
    {
      name: 'Home Page',
      url: `${baseUrl}/`,
      description: 'Main homepage'
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">QR Code Generator</h1>
        <p className="mt-2 text-gray-600">Generate QR codes for sharing Accorria links</p>
      </div>

        {/* Custom URL Generator */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Custom URL Generator</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="customUrl" className="block text-sm font-medium text-gray-700">
                Enter URL
              </label>
              <input
                type="url"
                id="customUrl"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="qrSize" className="block text-sm font-medium text-gray-700">
                QR Code Size: {qrSize}px
              </label>
              <input
                type="range"
                id="qrSize"
                min="100"
                max="500"
                value={qrSize}
                onChange={(e) => setQrSize(Number(e.target.value))}
                className="mt-1 block w-full"
              />
            </div>
            {customUrl && (
              <div className="pt-4">
                <QRCodeGenerator 
                  url={customUrl}
                  size={qrSize}
                  showDownload={true}
                  showUrl={true}
                />
              </div>
            )}
          </div>
        </div>

        {/* Predefined URLs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Predefined URLs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {predefinedUrls.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{item.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                <QRCodeGenerator 
                  url={item.url}
                  size={150}
                  showDownload={true}
                  showUrl={true}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Use</h3>
          <ul className="text-blue-800 space-y-1">
            <li>• Generate QR codes for easy sharing of Accorria links</li>
            <li>• Use UTM parameters to track where signups come from</li>
            <li>• Download QR codes for offline use (print, social media, etc.)</li>
            <li>• Copy URLs to clipboard for easy sharing</li>
          </ul>
        </div>
    </div>
  );
}
