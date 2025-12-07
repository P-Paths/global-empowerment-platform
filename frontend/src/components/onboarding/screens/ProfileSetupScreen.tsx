'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { onboardingService, OnboardingData } from '@/services/onboardingService';
import { PhotoIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface ProfileSetupScreenProps {
  initialData?: Partial<OnboardingData>;
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
}

export default function ProfileSetupScreen({ initialData, onNext, onBack }: ProfileSetupScreenProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    email: initialData?.email || user?.email || '',
    phone: initialData?.phone || '',
    zip: initialData?.zip || '',
    city: initialData?.city || '',
  });
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loadingCity, setLoadingCity] = useState(false);

  // Auto-fill city from zip
  useEffect(() => {
    if (formData.zip && formData.zip.length === 5) {
      const fetchCity = async () => {
        setLoadingCity(true);
        const city = await onboardingService.getCityFromZip(formData.zip);
        if (city) {
          setFormData(prev => ({ ...prev, city }));
        }
        setLoadingCity(false);
      };
      fetchCity();
    }
  }, [formData.zip]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      e.target.value = ''; // Reset input
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      alert('Image size must be less than 5MB. Please choose a smaller image.');
      e.target.value = ''; // Reset input
      return;
    }

    try {
      setProfilePhoto(file);
      const reader = new FileReader();
      
      reader.onerror = () => {
        console.error('Error reading file');
        alert('Error reading image. Please try a different image.');
        setProfilePhoto(null);
        setPhotoPreview(null);
        e.target.value = ''; // Reset input
      };
      
      reader.onloadend = () => {
        try {
          if (reader.result) {
            setPhotoPreview(reader.result as string);
          }
        } catch (error) {
          console.error('Error setting photo preview:', error);
          alert('Error processing image. Please try a different image.');
          setProfilePhoto(null);
          setPhotoPreview(null);
          e.target.value = ''; // Reset input
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error handling photo upload:', error);
      alert('Error uploading image. Please try again.');
      setProfilePhoto(null);
      setPhotoPreview(null);
      e.target.value = ''; // Reset input
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Upload profile photo if selected
    let avatarUrl = null;
    if (profilePhoto && user) {
      try {
        const { supabase } = await import('@/utils/supabase');
        const fileExt = profilePhoto.name.split('.').pop() || 'jpg';
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('car-images') // Using existing bucket, or create 'avatars' bucket
          .upload(filePath, profilePhoto, {
            cacheControl: '3600',
            upsert: true
          });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from('car-images')
            .getPublicUrl(filePath);
          avatarUrl = urlData.publicUrl;
          
          // Update profile with avatar URL
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: avatarUrl })
            .eq('id', user.id);
          
          if (updateError) {
            console.error('Error updating profile with avatar:', updateError);
          }
        } else {
          console.error('Error uploading avatar:', uploadError);
        }
      } catch (error) {
        console.error('Error handling avatar upload:', error);
        // Continue with onboarding even if avatar upload fails
      }
    }
    
    onNext(formData);
  };

  return (
    <div className="min-h-full w-full flex flex-col bg-white">
      {/* Top Center Header Banner */}
      <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <div className="flex-1 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Profile Setup</h2>
              <p className="text-sm md:text-base text-gray-600">Tell us a bit about yourself</p>
            </div>
            <div className="w-6"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 pb-6 pt-6">
        <div className="max-w-md mx-auto space-y-6">
          {/* Profile Photo */}
          <div className="flex flex-col items-center">
            <label className="cursor-pointer">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors">
                {photoPreview ? (
                  <img 
                    src={photoPreview} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Error loading image preview');
                      setPhotoPreview(null);
                      setProfilePhoto(null);
                      e.currentTarget.src = '';
                    }}
                  />
                ) : (
                  <PhotoIcon className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
            <p className="text-sm text-gray-500 mt-2">Profile Photo (Optional)</p>
            <p className="text-xs text-gray-400 mt-1">Max size: 5MB</p>
          </div>

          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              required
              value={formData.first_name}
              onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={formData.last_name}
              onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone (Optional)
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                // Format phone number as user types: (555) 123-4567
                const input = e.target.value.replace(/\D/g, ''); // Remove all non-digits
                let formatted = '';
                if (input.length > 0) {
                  if (input.length <= 3) {
                    formatted = `(${input}`;
                  } else if (input.length <= 6) {
                    formatted = `(${input.slice(0, 3)}) ${input.slice(3)}`;
                  } else {
                    formatted = `(${input.slice(0, 3)}) ${input.slice(3, 6)}-${input.slice(6, 10)}`;
                  }
                }
                setFormData(prev => ({ ...prev, phone: formatted }));
              }}
              placeholder="(555) 123-4567"
              maxLength={14}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            />
          </div>

          {/* Zip Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zip Code *
            </label>
            <input
              type="text"
              required
              maxLength={5}
              value={formData.zip}
              onChange={(e) => setFormData(prev => ({ ...prev, zip: e.target.value.replace(/\D/g, '') }))}
              placeholder="48239"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            />
          </div>

          {/* City (Auto-filled) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              disabled={loadingCity}
              placeholder={loadingCity ? 'Loading...' : 'Detroit'}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 text-gray-900 bg-white"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-sm active:scale-95 mt-8"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}

