'use client';

import { useProfile, useFollow } from '@/hooks/useGEMPlatform';
import { useParams } from 'next/navigation';
import { UserPlus, UserMinus, MapPin, Briefcase } from 'lucide-react';

export default function ProfilePage() {
  const params = useParams();
  // Extract ID immediately to avoid serialization issues
  const profileId = (params?.id as string) || '';
  const { profile, loading, error } = useProfile(profileId);
  const { follow, unfollow, loading: following } = useFollow();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error || 'Profile not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name || 'User'} className="w-full h-full rounded-full" />
                ) : (
                  <span className="text-3xl text-gray-600 font-semibold">
                    {(profile.full_name || profile.business_name || 'U')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {profile.full_name || profile.business_name || 'Anonymous'}
                </h1>
                {profile.business_name && profile.full_name && (
                  <p className="text-xl text-gray-600 mb-2">{profile.business_name}</p>
                )}
                {profile.bio && (
                  <p className="text-gray-700 mb-4">{profile.bio}</p>
                )}
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  {profile.city && profile.state && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.city}, {profile.state}</span>
                    </div>
                  )}
                  {profile.business_category && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      <span>{profile.business_category}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                // TODO: Implement follow/unfollow logic
                console.log('Follow/Unfollow clicked');
              }}
              disabled={following}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <UserPlus className="w-5 h-5" />
              Follow
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-3xl font-bold text-gray-900">{profile.followers_count}</p>
            <p className="text-gray-600">Followers</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-3xl font-bold text-gray-900">{profile.following_count}</p>
            <p className="text-gray-600">Following</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-3xl font-bold text-gray-900">{profile.funding_score}</p>
            <p className="text-gray-600">Funding Score</p>
          </div>
        </div>

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Funding Score Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Funding Readiness</h2>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all"
              style={{ width: `${profile.funding_score}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">
            {profile.funding_score}/100 - {profile.funding_score >= 70 ? 'VC-Ready' : profile.funding_score >= 40 ? 'Emerging' : 'Building'}
          </p>
        </div>
      </div>
    </div>
  );
}
