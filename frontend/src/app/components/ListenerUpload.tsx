import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const MAX_FILES = 20;

export default function ListenerUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [form, setForm] = useState({ make: '', model: '', year: '', user_id: '' });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles.slice(0, MAX_FILES));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: MAX_FILES,
    accept: { 'image/*': [] }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    files.forEach(file => data.append('images', file));
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    // TODO: Replace with your backend endpoint if needed
    const res = await fetch('/api/v1/listener/upload', {
      method: 'POST',
      body: data,
    });
    const result = await res.json();
    alert(JSON.stringify(result, null, 2));
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow space-y-6">
      <h2 className="text-2xl font-bold mb-4">Upload Car Photos &amp; Details</h2>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded p-6 text-center cursor-pointer transition ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-gray-600">
          {isDragActive
            ? "Drop the images here ..."
            : `Drag 'n' drop up to ${MAX_FILES} images here, or click to select files`}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {files.map((file, idx) => (
          <img
            key={idx}
            src={URL.createObjectURL(file)}
            alt={`preview ${idx}`}
            className="w-24 h-24 object-cover rounded border"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          name="make"
          value={form.make}
          onChange={handleChange}
          placeholder="Make (e.g. Toyota)"
          className="border p-2 rounded"
        />
        <input
          name="model"
          value={form.model}
          onChange={handleChange}
          placeholder="Model (e.g. Camry)"
          className="border p-2 rounded"
        />
        <input
          name="year"
          value={form.year}
          onChange={handleChange}
          placeholder="Year (e.g. 2020)"
          className="border p-2 rounded"
        />
        <input
          name="user_id"
          value={form.user_id}
          onChange={handleChange}
          placeholder="User ID"
          className="border p-2 rounded"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
        disabled={files.length === 0}
      >
        Submit Listing
      </button>
    </form>
  );
} 