import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../common/LoadingSpinner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, userProfile, loading } = useAuth();

  // const handleSignOut = async () => {
  //   try {
  //     await logout();
  //     navigate('/');
  //   } catch (error) {
  //     console.error('Error signing out:', error);
  //   }
  // };

  const handleEditProfile = () => {
    navigate('/onboarding');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to access your dashboard</h2>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const isProfileComplete = userProfile?.profileCompleted;
  const profile = userProfile?.profile || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">InvestX Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back, {user.displayName || user.email}! 👋</p>
          </div>
          <button
            onClick={handleEditProfile}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors border border-blue-200 rounded-lg hover:bg-blue-50"
          >
            Edit Profile
          </button>
        </div>
        {/* Profile Completion Status */}
        {!isProfileComplete && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="text-2xl mr-3">⚠️</div>
              <div>
                <h3 className="text-lg font-medium text-yellow-800">Complete Your Profile</h3>
                <p className="text-yellow-700 mt-1">
                  Finish setting up your profile to get personalized investment recommendations.
                </p>
                <button
                  onClick={handleEditProfile}
                  className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                >
                  Complete Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile & Quick Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-2">👤</span>
                Your Profile
              </h2>
              
              {isProfileComplete ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Age</span>
                    <span className="text-sm text-gray-900">{profile.age || 'Not set'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Monthly Allowance</span>
                    <span className="text-sm text-gray-900">
                      {profile.monthlyAllowance ? `$${profile.monthlyAllowance}` : 'Not set'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Risk Tolerance</span>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      profile.riskTolerance === 'conservative' ? 'bg-green-100 text-green-800' :
                      profile.riskTolerance === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      profile.riskTolerance === 'aggressive' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {profile.riskTolerance ? profile.riskTolerance.charAt(0).toUpperCase() + profile.riskTolerance.slice(1) : 'Not set'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Experience</span>
                    <span className="text-sm text-gray-900 capitalize">{profile.experienceLevel || 'Beginner'}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">Complete your profile to see your information here</p>
                </div>
              )}
            </div>

            {/* Interests Card */}
            {isProfileComplete && profile.interests && profile.interests.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-2xl mr-2">🎯</span>
                  Your Interests
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {interest.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Goals Card */}
            {isProfileComplete && profile.investmentGoals && profile.investmentGoals.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-2xl mr-2">🎯</span>
                  Investment Goals
                </h2>
                <div className="space-y-2">
                  {profile.investmentGoals.map((goal, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-700">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      {goal.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Main Content Areas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio Summary */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-2">📊</span>
                Portfolio Summary
              </h2>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Coming Soon!</h3>
                <p className="text-gray-600 mb-4">
                  Track your investments and see your portfolio performance here.
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">Portfolio tracking in development</p>
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-2">🤖</span>
                AI Recommendations
              </h2>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🧠</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Smart Suggestions</h3>
                <p className="text-gray-600 mb-4">
                  Get personalized investment recommendations based on your profile and goals.
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">AI engine in development</p>
              </div>
            </div>

            {/* Educational Content */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-2">📚</span>
                Learning Center
              </h2>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎓</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Educational Content</h3>
                <p className="text-gray-600 mb-4">
                  Learn about investing with interactive lessons and quizzes.
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '40%' }}></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">Learning modules in development</p>
              </div>
            </div>

            {/* Learning Progress */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-2">📈</span>
                Learning Progress
              </h2>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Track Your Progress</h3>
                <p className="text-gray-600 mb-4">
                  See how much you've learned and earn badges for your achievements.
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">Progress tracking in development</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">⚡</span>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={handleEditProfile}
              className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-3xl mb-2">✏️</div>
              <div className="text-sm font-medium text-gray-900">Edit Profile</div>
            </button>
            
            <button
              onClick={() => navigate('/portfolio')}
              className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-3xl mb-2">💼</div>
              <div className="text-sm font-medium text-gray-900">View Portfolio</div>
            </button>
            
            <button
              onClick={() => navigate('/education')}
              className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-3xl mb-2">📖</div>
              <div className="text-sm font-medium text-gray-900">Learn</div>
            </button>
            
            <button
              onClick={() => navigate('/suggestions')}
              className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-3xl mb-2">💡</div>
              <div className="text-sm font-medium text-gray-900">Get Suggestions</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
