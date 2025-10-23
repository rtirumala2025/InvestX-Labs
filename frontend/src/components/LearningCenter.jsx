import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActionArea,
  CardMedia,
  Chip,
  Divider,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  School as LearnIcon,
  Lightbulb as InsightIcon,
  TrendingUp as TrendingIcon,
  Book as ArticleIcon,
  PlayCircleOutline as VideoIcon,
  Quiz as QuizIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import { useAppContext } from '../contexts/AppContext';

const LearningCenter = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [expandedCard, setExpandedCard] = useState(null);
  const [savedItems, setSavedItems] = useState([]);
  
  const {
    mcp: {
      context: mcpContext,
      recommendations: mcpRecommendations,
      loading: mcpLoading,
      error: mcpError,
      fetchMCPContext,
      fetchMCPRecommendations,
    },
    ai: {
      recommendations: aiRecommendations,
      loading: aiLoading,
      error: aiError,
      fetchAIRecommendations,
    },
  } = useAppContext();

  const loading = mcpLoading || aiLoading;
  const error = mcpError || aiError;

  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          fetchMCPContext(),
          fetchMCPRecommendations({ type: 'educational' }),
          fetchAIRecommendations(),
        ]);
      } catch (err) {
        console.error('Error initializing learning center data:', err);
      }
    };

    initializeData();
  }, [fetchMCPContext, fetchMCPRecommendations, fetchAIRecommendations]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const toggleSaveItem = (itemId) => {
    setSavedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const refreshData = () => {
    if (activeTab === 0) {
      fetchMCPRecommendations({ type: 'educational' });
    } else if (activeTab === 1) {
      fetchAIRecommendations();
    }
  };

  const renderLearningPath = () => {
    const learningPath = [
      {
        id: 'beginner',
        title: 'Beginner Investor',
        description: 'Learn the basics of investing and build a strong foundation.',
        progress: 30,
        topics: [
          'Understanding Stocks',
          'Introduction to Bonds',
          'Diversification 101',
          'Risk vs. Reward',
        ],
      },
      {
        id: 'intermediate',
        title: 'Intermediate Strategies',
        description: 'Take your investing skills to the next level with advanced strategies.',
        progress: 15,
        topics: [
          'Technical Analysis',
          'Fundamental Analysis',
          'Sector Rotation',
          'Options Trading Basics',
        ],
      },
      {
        id: 'advanced',
        title: 'Advanced Techniques',
        description: 'Master advanced investment strategies and portfolio management.',
        progress: 0,
        topics: [
          'Derivatives Trading',
          'Quantitative Analysis',
          'Hedging Strategies',
          'Portfolio Optimization',
        ],
      },
    ];

    return (
      <Grid container spacing={3}>
        {learningPath.map((path) => (
          <Grid item xs={12} md={4} key={path.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <LearnIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="h3">
                    {path.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {path.description}
                </Typography>
                
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      Progress: {path.progress}%
                    </Typography>
                    <Typography variant="caption" color="primary">
                      {path.topics.length} topics
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      height: 6,
                      backgroundColor: 'action.hover',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        width: `${path.progress}%`,
                        height: '100%',
                        backgroundColor: 'primary.main',
                        borderRadius: 3,
                      }}
                    />
                  </Box>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Topics covered:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {path.topics.map((topic, index) => (
                      <Chip
                        key={index}
                        label={topic}
                        size="small"
                        variant="outlined"
                        sx={{ mb: 0.5 }}
                      />
                    ))}
                  </Box>
                </Box>
              </CardContent>
              <Box sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={() => setExpandedCard(expandedCard === path.id ? null : path.id)}
                >
                  {expandedCard === path.id ? 'Show Less' : 'Learn More'}
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderAILearningInsights = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      );
    }

    const insights = [
      ...(mcpRecommendations?.slice(0, 2) || []).map(rec => ({
        ...rec,
        type: 'mcp',
        icon: <InsightIcon />,
        category: 'MCP Insight',
      })),
      ...(aiRecommendations?.slice(0, 3) || []).map(rec => ({
        ...rec,
        type: 'ai',
        icon: <TrendingIcon />,
        category: 'AI Suggestion',
      })),
    ].sort(() => Math.random() - 0.5); // Shuffle the array

    if (insights.length === 0) {
      return (
        <Box textAlign="center" p={4}>
          <Typography variant="body1" color="text.secondary">
            No learning insights available. Complete your profile to get personalized recommendations.
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {insights.map((insight) => (
          <Grid item xs={12} md={6} key={`${insight.type}-${insight.id}`}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box display="flex" alignItems="center">
                    <Box
                      sx={{
                        p: 1,
                        bgcolor: insight.type === 'mcp' ? 'primary.light' : 'secondary.light',
                        color: 'primary.contrastText',
                        borderRadius: 1,
                        mr: 1.5,
                        display: 'flex',
                      }}
                    >
                      {insight.icon}
                    </Box>
                    <Box>
                      <Chip
                        label={insight.category}
                        size="small"
                        sx={{
                          backgroundColor: insight.type === 'mcp' ? 'primary.light' : 'secondary.light',
                          color: 'primary.contrastText',
                          fontWeight: 500,
                          mb: 0.5,
                        }}
                      />
                      <Typography variant="subtitle1" component="h3">
                        {insight.title || 'Investment Insight'}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => toggleSaveItem(`${insight.type}-${insight.id}`)}
                    color={savedItems.includes(`${insight.type}-${insight.id}`) ? 'primary' : 'default'}
                  >
                    {savedItems.includes(`${insight.type}-${insight.id}`) ? (
                      <StarIcon />
                    ) : (
                      <StarBorderIcon />
                    )}
                  </IconButton>
                </Box>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  {insight.description || 'No description available.'}
                </Typography>
                
                {insight.topics && insight.topics.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary">
                      Related topics:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {insight.topics.slice(0, 3).map((topic, index) => (
                        <Chip
                          key={index}
                          label={topic}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
              <Box sx={{ p: 2, pt: 0 }}>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => {
                    // Handle learn more action
                    console.log('Learn more about:', insight.title);
                  }}
                >
                  Learn More
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return renderLearningPath();
      case 1:
        return renderAILearningInsights();
      case 2:
        return (
          <Box textAlign="center" p={4}>
            <Typography variant="h6" gutterBottom>
              Your Saved Items
            </Typography>
            {savedItems.length > 0 ? (
              <Typography variant="body1" color="text.secondary">
                You have {savedItems.length} saved items.
              </Typography>
            ) : (
              <Typography variant="body1" color="text.secondary">
                You haven't saved any items yet. Click the star icon to save items for later.
              </Typography>
            )}
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            Learning Center
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refreshData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Expand your investment knowledge with personalized learning paths and AI-powered insights
          tailored to your experience level and interests.
        </Typography>
        
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{
            mb: 3,
            '& .MuiTabs-flexContainer': {
              borderBottom: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          <Tab
            label="Learning Paths"
            icon={<School as LearnIcon />}
            iconPosition="start"
          />
          <Tab
            label="AI Learning Insights"
            icon={<Lightbulb as InsightIcon />}
            iconPosition="start"
          />
          <Tab
            label="Saved Items"
            icon={<StarIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {renderContent()}
      
      {mcpContext?.riskProfile && (
        <Box mt={6}>
          <Typography variant="h6" gutterBottom>
            Your Learning Profile
          </Typography>
          <Paper sx={{ p: 3, backgroundColor: 'background.paper' }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Risk Tolerance
                </Typography>
                <Typography variant="h5">
                  {mcpContext.riskProfile.riskLevel || 'Moderate'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {mcpContext.riskProfile.description || 'Balanced approach to risk and return.'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Investment Goal
                </Typography>
                <Typography variant="h5">
                  {mcpContext.investmentGoal || 'Growth'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {mcpContext.timeHorizon || '5-10 years'} time horizon
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Learning Progress
                </Typography>
                <Box display="flex" alignItems="center">
                  <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
                    <CircularProgress
                      variant="determinate"
                      value={mcpContext.learningProgress || 25}
                      size={50}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="caption" component="div" color="text.secondary">
                        {`${mcpContext.learningProgress || 25}%`}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {mcpContext.completedLessons || 0} of {mcpContext.totalLessons || 20} lessons completed
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default LearningCenter;
