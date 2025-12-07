import { supabaseBrowser } from '@/lib/supabaseBrowser';

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  soldFor?: number;
  status: 'active' | 'sold' | 'draft';
  images: string[];
  created_at: string;
  updated_at: string;
  // Additional fields
  make?: string;
  model?: string;
  year?: number;
  mileage: string; // Required field to match component
  condition?: string;
  location?: string;
  // Fields expected by DashboardListing component
  titleStatus: string;
  postedAt: string;
  platforms?: string[];
  messages?: number;
  clicks?: number;
  soldAt?: string;
  soldTo?: string;
  detectedFeatures?: string[];
  aiAnalysis?: string;
  finalDescription?: string;
}

export class ListingsService {
  private supabase = supabaseBrowser();

  /**
   * Get empty listings array - ready for real car data
   */
  private getMockListings(): Listing[] {
    try {
      const stored = localStorage.getItem('demoListings');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading mock listings:', error);
      return [];
    }
  }

  private createMockListing(listingData: Omit<Listing, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Listing {
    // Preserve ALL image URLs (Supabase URLs, http/https URLs, and data URLs)
    // We'll only optimize data URLs if localStorage becomes too large
    const imageData = listingData.images || [];
    const preservedImages = imageData.map((img, idx) => {
      // Always preserve valid URLs (Supabase, http, https, and data URLs)
      if (typeof img === 'string') {
        if (img.startsWith('http://') || img.startsWith('https://')) {
          // Keep all HTTP/HTTPS URLs (including Supabase URLs)
          return img;
        }
        if (img.startsWith('data:image/')) {
          // Keep data URLs - they're needed for display
          // We'll only optimize them if localStorage quota is exceeded
          return img;
        }
        // If it's a file name (like "image.jpg"), log a warning
        // File names won't display, but at least we know there should be images
        if (img.includes('.jpg') || img.includes('.jpeg') || img.includes('.png') || img.includes('.webp')) {
          console.warn(`⚠️ Image stored as filename instead of URL: ${img}. This image won't display.`);
          return img;
        }
      }
      return img; // Return as-is for any other format
    });

    const newListing: Listing = {
      id: Date.now().toString(),
      user_id: '00000000-0000-0000-0000-000000000123',
      title: listingData.title,
      description: listingData.description,
      price: listingData.price,
      platforms: listingData.platforms || ['accorria'],
      status: listingData.status || 'active',
      images: preservedImages, // Preserve all URLs (Supabase, http/https, and data URLs)
      make: listingData.make,
      model: listingData.model,
      year: listingData.year,
      mileage: listingData.mileage,
      condition: listingData.condition,
      location: listingData.location,
      postedAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      titleStatus: 'Clean',
      messages: 0,
      clicks: 0,
      detectedFeatures: [],
      aiAnalysis: undefined,
      finalDescription: listingData.description
    };

    try {
      // Store in localStorage - use consistent key for demo data
      const existingListings = this.getMockListings();
      existingListings.unshift(newListing);
      
      // Limit to 5 listings to prevent quota issues (reduced from 50)
      const limitedListings = existingListings.slice(0, 5);
      
      // Calculate size before storing
      const listingString = JSON.stringify(limitedListings);
      const sizeKB = Math.round(listingString.length / 1024);
      
      // If size is still too large (>4MB), keep only the newest listing
      if (sizeKB > 4000) {
        console.warn('⚠️ Listing data too large, keeping only newest listing');
        localStorage.setItem('demoListings', JSON.stringify([newListing]));
        localStorage.setItem('testListings', JSON.stringify([newListing]));
      } else {
        localStorage.setItem('demoListings', listingString);
        // Also store in testListings for backward compatibility (limited to 5)
        const existingTestListings = JSON.parse(localStorage.getItem('testListings') || '[]');
        existingTestListings.unshift(newListing);
        const limitedTestListings = existingTestListings.slice(0, 5);
        localStorage.setItem('testListings', JSON.stringify(limitedTestListings));
      }
      
      console.log(`✅ Stored listing (${sizeKB}KB, ${limitedListings.length} total listings)`);
      
    } catch (error) {
      console.error('Failed to store listing in localStorage:', error);
      // If localStorage fails, clear old data and try again
      this.clearOldListings();
      try {
        // Store only the newest listing with minimal data
        // If we still have storage issues, optimize data URLs to placeholders
        const optimizedImages = imageData.map((img, idx) => {
          if (typeof img === 'string' && img.startsWith('data:image/')) {
            // Replace data URLs with placeholders only as last resort
            return `placeholder:image${idx + 1}`;
          }
          return img;
        });
        const minimalListing = {
          ...newListing,
          images: optimizedImages.length > 0 ? optimizedImages : [`placeholder:${imageData.length} images`],
          description: newListing.description.substring(0, 500) // Truncate description
        };
        localStorage.setItem('demoListings', JSON.stringify([minimalListing]));
        localStorage.setItem('testListings', JSON.stringify([minimalListing]));
        console.log('✅ Stored minimal listing after cleanup');
      } catch (retryError) {
        console.error('❌ Failed to store listing even after cleanup:', retryError);
        // Last resort: Don't store in localStorage, just return the listing
        console.warn('⚠️ Listing created but not persisted to localStorage due to quota limits');
      }
    }

    return newListing;
  }

  private clearOldListings(): void {
    try {
      // Clear old data to free up space
      localStorage.removeItem('demoListings');
      localStorage.removeItem('testListings');
      localStorage.removeItem('oldListings');
      localStorage.removeItem('carListings');
      
      // Clear any other potential listing keys
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('listing') || key.includes('car') || key.includes('demo'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear any large data that might be taking up space
      const allKeys = Object.keys(localStorage);
      let clearedCount = 0;
      for (const key of allKeys) {
        try {
          const value = localStorage.getItem(key);
          if (value && value.length > 1000000) { // Clear items > 1MB
            localStorage.removeItem(key);
            clearedCount++;
          }
        } catch (e) {
          // Skip keys that can't be read
        }
      }
      
      console.log(`✅ Cleared old listing data (${keysToRemove.length} listing keys, ${clearedCount} large items)`);
    } catch (error) {
      console.error('❌ Failed to clear old listings:', error);
    }
  }

  /**
   * Public method to clear localStorage when quota is exceeded
   */
  public clearLocalStorage(): void {
    this.clearOldListings();
  }

  /**
   * Get all listings for the current user
   */
  async getUserListings(): Promise<Listing[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      // For development, return mock data if no Supabase user or if it's the demo user
      if (!user || user.id === '00000000-0000-0000-0000-000000000123' || user.email === 'preston@accorria.com') {
        console.log('Demo user detected, returning mock data for development');
        const mockListings = this.getMockListings();
        console.log('Mock listings loaded:', mockListings.length, 'listings');
        return mockListings;
      }

      const { data, error } = await this.supabase
        .from('car_listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching listings:', error);
        throw error;
      }

      // Map database fields to component-expected fields
      const mappedListings = (data || []).map(listing => ({
        ...listing,
        // Map created_at to postedAt for component compatibility
        postedAt: listing.created_at,
        // Map car_listings fields to component-expected names
        titleStatus: 'Clean', // Default since car_listings doesn't have title_status
        mileage: '0', // Default since car_listings doesn't have mileage
        platforms: listing.platform ? [listing.platform] : [],
        messages: 0, // Default since car_listings doesn't have messages
        clicks: 0, // Default since car_listings doesn't have clicks
        // Map sold status
        soldFor: listing.status === 'sold' ? listing.price : undefined,
        soldAt: listing.status === 'sold' ? listing.updated_at : undefined,
        soldTo: undefined, // Not available in car_listings
        detectedFeatures: [], // Not available in car_listings
        aiAnalysis: undefined, // Not available in car_listings
        finalDescription: listing.description
      }));

      return mappedListings;
    } catch (error) {
      console.error('Failed to fetch user listings:', error);
      return [];
    }
  }

  /**
   * Create a new listing
   */
  async createListing(listingData: Omit<Listing, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Listing | null> {
    try {
      console.log('🚀 createListing called at:', new Date().toISOString());
      const { data: { user } } = await this.supabase.auth.getUser();
      
      console.log('Current user:', user?.id, user?.email);
      console.log('User check conditions:', {
        noUser: !user,
        isDemoId: user?.id === '00000000-0000-0000-0000-000000000123',
        isPrestonEmail: user?.email === 'preston@accorria.com'
      });
      
      // For demo user or any user without a profile, store in localStorage instead of database
      if (!user || user.id === '00000000-0000-0000-0000-000000000123' || user.email === 'preston@accorria.com') {
        console.log('✅ Demo user detected, storing listing in localStorage');
        return this.createMockListing(listingData);
      }
      
      console.log('❌ Proceeding to database insert for user:', user.email);

      const { data, error } = await this.supabase
        .from('car_listings')
        .insert({
          title: listingData.title,
          description: listingData.description,
          price: listingData.price,
          platform: listingData.platforms?.[0] || 'accorria',
          status: listingData.status,
          images: listingData.images,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating listing:', error);
        
        // If it's a foreign key constraint error, fall back to localStorage
        if (error.code === '23503') {
          console.log('🔄 Foreign key constraint error detected, falling back to localStorage');
          return this.createMockListing(listingData);
        }
        
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to create listing:', error);
      return null;
    }
  }

  /**
   * Update an existing listing
   */
  async updateListing(id: string, updates: Partial<Listing>): Promise<Listing | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('car_listings')
        .update({
          title: updates.title,
          description: updates.description,
          price: updates.price,
          platform: updates.platforms?.[0] || 'accorria',
          status: updates.status,
          images: updates.images,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id) // Ensure user can only update their own listings
        .select()
        .single();

      if (error) {
        console.error('Error updating listing:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update listing:', error);
      return null;
    }
  }

  /**
   * Delete a listing
   */
  async deleteListing(id: string): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      // For demo users, delete from localStorage
      if (!user || user.id === '00000000-0000-0000-0000-000000000123' || user.email === 'preston@accorria.com') {
        console.log('Demo user detected, deleting from localStorage');
        const testListings = JSON.parse(localStorage.getItem('testListings') || '[]');
        const demoListings = JSON.parse(localStorage.getItem('demoListings') || '[]');
        
        const updatedTestListings = testListings.filter((l: Listing) => l.id !== id);
        const updatedDemoListings = demoListings.filter((l: Listing) => l.id !== id);
        
        localStorage.setItem('testListings', JSON.stringify(updatedTestListings));
        localStorage.setItem('demoListings', JSON.stringify(updatedDemoListings));
        
        console.log('Deleted listing from localStorage');
        return true;
      }

      // For real users, delete from database
      const { error } = await this.supabase
        .from('car_listings')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Ensure user can only delete their own listings

      if (error) {
        console.error('Error deleting listing:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete listing:', error);
      return false;
    }
  }

  /**
   * Get a single listing by ID
   */
  async getListing(id: string): Promise<Listing | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('car_listings')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching listing:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch listing:', error);
      return null;
    }
  }

  /**
   * Get listing statistics for the user
   */
  async getListingStats(): Promise<{
    totalListings: number;
    activeListings: number;
    soldListings: number;
    totalRevenue: number;
  }> {
    try {
      const listings = await this.getUserListings();
      
      const stats = listings.reduce((acc, listing) => {
        acc.totalListings++;
        
        if (listing.status === 'active') {
          acc.activeListings++;
        } else if (listing.status === 'sold') {
          acc.soldListings++;
          acc.totalRevenue += listing.soldFor || 0;
        }
        
        return acc;
      }, {
        totalListings: 0,
        activeListings: 0,
        soldListings: 0,
        totalRevenue: 0
      });

      return stats;
    } catch (error) {
      console.error('Failed to get listing stats:', error);
      return {
        totalListings: 0,
        activeListings: 0,
        soldListings: 0,
        totalRevenue: 0
      };
    }
  }

  /**
   * Migrate localStorage data to Supabase (one-time migration)
   */
  async migrateLocalStorageData(): Promise<boolean> {
    try {
      const localData = localStorage.getItem('testListings');
      if (!localData) {
        return true; // No data to migrate
      }

      const localListings = JSON.parse(localData);
      const { data: { user } } = await this.supabase.auth.getUser();
      
      // For demo users, skip migration to prevent quota issues
      if (!user || user.id === '00000000-0000-0000-0000-000000000123' || user.email === 'preston@accorria.com') {
        console.log('Demo user detected, skipping migration to prevent quota issues');
        return true;
      }

      // Check if we already have listings in the database
      const existingListings = await this.getUserListings();
      if (existingListings.length > 0) {
        console.log('Listings already exist in database, skipping migration');
        return true;
      }

      // Limit migration to prevent quota issues
      const listingsToMigrate = localListings.slice(0, 10); // Only migrate first 10 listings
      
      // Migrate each listing
      for (const listing of listingsToMigrate) {
        try {
          await this.createListing({
            title: listing.title || 'Migrated Listing',
            description: listing.description || '',
            price: listing.price || 0,
            soldFor: listing.soldFor,
            status: listing.soldFor ? 'sold' : 'active',
            images: listing.images || [],
            make: listing.make,
            model: listing.model,
            year: listing.year,
            mileage: listing.mileage?.toString() || '0',
            condition: listing.condition,
            location: listing.location,
            // Required fields for component compatibility
            postedAt: listing.postedAt || new Date().toISOString(),
            titleStatus: listing.titleStatus || 'Clean',
            platforms: listing.platforms || ['accorria'],
            messages: listing.messages || 0,
            clicks: listing.clicks || 0,
            soldAt: listing.soldAt,
            soldTo: listing.soldTo,
            detectedFeatures: listing.detectedFeatures || [],
            aiAnalysis: listing.aiAnalysis,
            finalDescription: listing.finalDescription
          });
        } catch (listingError) {
          console.error('Failed to migrate individual listing:', listingError);
          // Continue with other listings
        }
      }

      // Clear localStorage after successful migration
      localStorage.removeItem('testListings');
      console.log('Successfully migrated localStorage data to Supabase');
      
      return true;
    } catch (error) {
      console.error('Failed to migrate localStorage data:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const listingsService = new ListingsService();
