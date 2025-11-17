import React from "react";
import { useAuth } from "../../hooks/useAuth";

const UserProfile = () => {
  const { user: authUser, userProfile } = useAuth();
  const profile = userProfile || {};

  const getRiskProfileColor = (riskProfile) => {
    switch (riskProfile) {
      case "conservative":
        return "bg-green-100 text-green-800";
      case "moderate":
        return "bg-yellow-100 text-yellow-800";
      case "balanced":
        return "bg-blue-100 text-blue-800";
      case "aggressive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-lg font-semibold text-blue-600">
            {authUser?.user_metadata?.full_name?.charAt(0) ||
              authUser?.email?.charAt(0) ||
              "U"}
          </span>
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-semibold text-gray-900">
            {authUser?.user_metadata?.full_name ||
              profile?.full_name ||
              "Investor"}
          </h3>
          <p className="text-sm text-gray-500">{authUser?.email}</p>
        </div>
      </div>

      {profile && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Investment Profile
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Risk Tolerance:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskProfileColor(profile.risk_tolerance || profile.riskProfile)}`}
                >
                  {profile.risk_tolerance || profile.riskProfile || "Not set"}
                </span>
              </div>

              {(profile.investment_experience ||
                profile.investmentExperience) && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Experience:</span>
                  <span className="text-sm text-gray-900">
                    {profile.investment_experience ||
                      profile.investmentExperience}
                  </span>
                </div>
              )}

              {(profile.annual_income || profile.annualIncome) && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Income Range:</span>
                  <span className="text-sm text-gray-900">
                    {profile.annual_income || profile.annualIncome}
                  </span>
                </div>
              )}
            </div>
          </div>

          {Array.isArray(profile.investment_goals || profile.investmentGoals) &&
            (profile.investment_goals || profile.investmentGoals).length >
              0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Investment Goals
                </h4>
                <div className="flex flex-wrap gap-1">
                  {(profile.investment_goals || profile.investmentGoals)
                    .slice(0, 3)
                    .map((goal, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {goal}
                      </span>
                    ))}
                  {(profile.investment_goals || profile.investmentGoals)
                    .length > 3 && (
                    <span className="text-xs text-gray-500">
                      +
                      {(profile.investment_goals || profile.investmentGoals)
                        .length - 3}{" "}
                      more
                    </span>
                  )}
                </div>
              </div>
            )}

          {Array.isArray(profile.interests) && profile.interests.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Interests
              </h4>
              <div className="flex flex-wrap gap-1">
                {profile.interests.slice(0, 2).map((interest, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    {interest}
                  </span>
                ))}
                {profile.interests.length > 2 && (
                  <span className="text-xs text-gray-500">
                    +{profile.interests.length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium">
          Edit Profile
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
