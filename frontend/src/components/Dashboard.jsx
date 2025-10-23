import React, { useEffect } from 'react';
import { Box, Container, Grid, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import { useAppContext } from '../contexts/AppContext';
import QuickStats from './dashboard/QuickStats';
import UserProfile from './dashboard/UserProfile';
import Skeleton from '@mui/material/Skeleton';

const Dashboard = () => {
  const {
    ai: { recommendations, loading, error, fetchAIRecommendations },
    mcp: { context, fetchMCPContext },
    preferences
  } = useAppContext();

  useEffect(() => {
    // Fetch initial data when component mounts
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchAIRecommendations(),
          fetchMCPContext()
        ]);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };

    fetchData();
  }, [fetchAIRecommendations, fetchMCPContext]);

  const renderContent = () => {
    if (loading) {
      return (
        <Grid container spacing={3}>
          {[1, 2, 3].map((item) => (
            <Grid item xs={12} md={4} key={item}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      );
    }

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={8} lg={9}>
          <QuickStats recommendations={recommendations} />
          
          {/* AI Recommendations Section */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              AI-Powered Investment Recommendations
            </Typography>
            {recommendations?.length > 0 ? (
              <Grid container spacing={2}>
                {recommendations.slice(0, 3).map((rec) => (
                  <Grid item xs={12} md={6} key={rec.id}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle1">{rec.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {rec.description}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography>No recommendations available. Complete your profile to get personalized suggestions.</Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4} lg={3}>
          <UserProfile context={context} />
          
          {/* MCP Context Summary */}
          {context && (
            <Paper sx={{ p: 2, mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Your Investment Context
              </Typography>
              <Typography variant="body2" paragraph>
                Risk Tolerance: <strong>{context.riskProfile?.riskLevel || 'Moderate'}</strong>
              </Typography>
              <Typography variant="body2" paragraph>
                Investment Goal: <strong>{context.investmentGoal || 'Growth'}</strong>
              </Typography>
              <Typography variant="body2">
                Time Horizon: <strong>{context.timeHorizon || '5-10 years'}</strong>
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        {loading && <CircularProgress size={24} />}
      </Box>
      
      {renderContent()}
    </Container>
  );
};

export default Dashboard;
