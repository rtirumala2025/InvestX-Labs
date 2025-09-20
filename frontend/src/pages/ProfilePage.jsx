import React from 'react';
import UserProfile from '../components/dashboard/UserProfile';

const ProfilePage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>
      <UserProfile />
    </div>
  );
};

export default ProfilePage;
