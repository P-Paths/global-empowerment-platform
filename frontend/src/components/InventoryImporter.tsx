import React, { useState } from 'react';

interface InventoryImporterProps {
  onImportComplete?: (result: any) => void;
}

interface ImportResult {
  success: boolean;
  imported_count: number;
  error_count: number;
  errors: string[];
  message: string;
}

const InventoryImporter: React.FC<InventoryImporterProps> = ({ onImportComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [dealerId, setDealerId] = useState('toyota_demo');
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dealer_id', dealerId);

      const response = await fetch('/api/v1/inventory/import-csv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        if (onImportComplete) {
          onImportComplete(data);
        }
      } else {
        setError(data.detail || 'Import failed');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleCSV = `VIN,Year,Make,Model,Mileage,Price,Title_Status,Description,Photo_URLs
1HGBH41JXMN109186,2021,Toyota,Camry,25000,24500,Clean,Excellent condition one owner,https://example.com/camry1.jpg
2T1BU4EE8CC123456,2020,Toyota,Corolla,32000,18900,Clean,Well maintained regular service,https://example.com/corolla1.jpg
3T1BF1FK8CC234567,2022,Toyota,RAV4,18000,28900,Clean,Like new all-wheel drive,https://example.com/rav4_1.jpg`;

    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_toyota_inventory.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Import Dealer Inventory</h2>
      
      {/* Dealer ID Input */}
      <div className="mb-4">
        <label htmlFor="dealerId" className="block text-sm font-medium text-gray-700 mb-2">
          Dealer ID
        </label>
        <input
          type="text"
          id="dealerId"
          value={dealerId}
          onChange={(e) => setDealerId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter dealer ID"
        />
      </div>

      {/* File Upload */}
      <div className="mb-4">
        <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700 mb-2">
          CSV File
        </label>
        <input
          type="file"
          id="csvFile"
          accept=".csv"
          onChange={handleFileChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-sm text-gray-500 mt-1">
          Upload a CSV file with columns: VIN, Year, Make, Model, Mileage, Price, Title_Status, Description, Photo_URLs
        </p>
      </div>

      {/* Sample CSV Download */}
      <div className="mb-4">
        <button
          onClick={downloadSampleCSV}
          className="text-blue-600 hover:text-blue-800 text-sm underline"
        >
          Download Sample CSV Format
        </button>
      </div>

      {/* Import Button */}
      <button
        onClick={handleImport}
        disabled={!file || isUploading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isUploading ? 'Importing...' : 'Import Inventory'}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <h3 className="font-semibold">Import Complete!</h3>
          <p>{result.message}</p>
          <p>Imported: {result.imported_count} vehicles</p>
          {result.error_count > 0 && (
            <p>Errors: {result.error_count} vehicles</p>
          )}
          
          {result.errors.length > 0 && (
            <div className="mt-2">
              <h4 className="font-semibold">Errors:</h4>
              <ul className="list-disc list-inside text-sm">
                {result.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryImporter;
