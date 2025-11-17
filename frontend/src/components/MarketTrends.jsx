import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  TextField,
  InputAdornment,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
  useTheme,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShowChart as ChartIcon,
  Timeline as TimelineIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
} from "@mui/icons-material";
import { useAppContext } from "../contexts/AppContext";

const MarketTrends = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [selectedStock, setSelectedStock] = useState(null);
  const [timeRange, setTimeRange] = useState("1m");

  const {
    market: {
      quotes,
      marketIndices,
      sectorPerformance,
      loading,
      error,
      fetchQuotes,
      fetchMarketData,
      fetchHistoricalData,
    },
  } = useAppContext();

  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          fetchMarketData(),
          fetchQuotes(["AAPL", "MSFT", "GOOGL", "AMZN", "META"]), // Default watchlist
        ]);
      } catch (err) {
        console.error("Error initializing market data:", err);
      }
    };

    initializeData();
  }, [fetchMarketData, fetchQuotes]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchQuotes([searchQuery.trim()]);
    }
  };

  const handleRefresh = () => {
    fetchMarketData();
    if (selectedStock) {
      fetchHistoricalData(selectedStock, timeRange);
    }
  };

  const handleStockSelect = (symbol) => {
    setSelectedStock(symbol);
    fetchHistoricalData(symbol, timeRange);
  };

  const renderMarketIndices = () => (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      {marketIndices &&
        Object.entries(marketIndices).map(([key, index]) => (
          <Grid item xs={12} sm={6} md={4} key={key}>
            <Card variant="outlined">
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <div>
                    <Typography variant="subtitle2" color="textSecondary">
                      {index.name}
                    </Typography>
                    <Typography variant="h6">
                      {index.price?.toFixed(2)}
                    </Typography>
                  </div>
                  <Box
                    sx={{
                      color: index.change >= 0 ? "success.main" : "error.main",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {index.change >= 0 ? (
                      <TrendingUpIcon />
                    ) : (
                      <TrendingDownIcon />
                    )}
                    <Typography variant="body2" sx={{ ml: 0.5 }}>
                      {index.change} ({index.changePercent}%)
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
    </Grid>
  );

  const renderStockList = () => (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">Watchlist</Typography>
        <Box>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box component="form" onSubmit={handleSearch} sx={{ mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search stocks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ maxHeight: 400, overflow: "auto" }}>
        {loading && !quotes.length ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress size={24} />
          </Box>
        ) : quotes.length > 0 ? (
          <Grid container spacing={1}>
            {quotes.map((stock) => (
              <Grid item xs={12} key={stock.symbol}>
                <Card
                  variant="outlined"
                  sx={{
                    cursor: "pointer",
                    borderLeft: 4,
                    borderLeftColor:
                      selectedStock === stock.symbol
                        ? theme.palette.primary.main
                        : "transparent",
                    "&:hover": {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                  onClick={() => handleStockSelect(stock.symbol)}
                >
                  <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box>
                        <Typography variant="subtitle2">
                          {stock.symbol}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {stock.name}
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="body2">
                          ${stock.price?.toFixed(2)}
                        </Typography>
                        <Box
                          sx={{
                            color:
                              stock.change >= 0 ? "success.main" : "error.main",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                          }}
                        >
                          {stock.change >= 0 ? (
                            <TrendingUpIcon fontSize="small" />
                          ) : (
                            <TrendingDownIcon fontSize="small" />
                          )}
                          <Typography variant="caption" sx={{ ml: 0.5 }}>
                            {stock.change} ({stock.changePercent}%)
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box p={3} textAlign="center">
            <Typography variant="body2" color="textSecondary">
              No stocks found. Try searching for a stock symbol.
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );

  const renderSectorPerformance = () => (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Sector Performance
      </Typography>
      <Grid container spacing={2}>
        {sectorPerformance?.map((sector) => (
          <Grid item xs={12} sm={6} md={4} key={sector.name}>
            <Card variant="outlined">
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="subtitle2">{sector.name}</Typography>
                  <Box
                    sx={{
                      color:
                        sector.changePercent >= 0
                          ? "success.main"
                          : "error.main",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {sector.changePercent >= 0 ? (
                      <TrendingUpIcon fontSize="small" />
                    ) : (
                      <TrendingDownIcon fontSize="small" />
                    )}
                    <Typography variant="body2" sx={{ ml: 0.5 }}>
                      {sector.changePercent}%
                    </Typography>
                  </Box>
                </Box>
                <Box mt={1}>
                  <Box
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor:
                        sector.changePercent >= 0
                          ? "success.light"
                          : "error.light",
                      width: `${Math.min(Math.abs(sector.changePercent) * 5, 100)}%`,
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          aria-label="market trends tabs"
        >
          <Tab
            label="Market Overview"
            icon={<BarChartIcon />}
            iconPosition="start"
          />
          <Tab label="Stocks" icon={<ShowChartIcon />} iconPosition="start" />
          <Tab label="Sectors" icon={<PieChartIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {activeTab === 0 && (
        <>
          {renderMarketIndices()}
          {renderStockList()}
          {renderSectorPerformance()}
        </>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            {renderStockList()}
          </Grid>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, height: "100%", minHeight: 500 }}>
              <Typography variant="h6" gutterBottom>
                {selectedStock || "Select a stock to view details"}
              </Typography>
              {selectedStock && (
                <Box>
                  {/* Placeholder for stock chart */}
                  <Box
                    sx={{
                      height: 300,
                      bgcolor: "action.hover",
                      borderRadius: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 2,
                    }}
                  >
                    <Typography color="textSecondary">
                      Interactive chart for {selectedStock} will be displayed
                      here
                    </Typography>
                  </Box>

                  {/* Time range selector */}
                  <Box display="flex" justifyContent="flex-end" mb={2}>
                    {["1d", "1w", "1m", "3m", "1y", "5y"].map((range) => (
                      <Button
                        key={range}
                        size="small"
                        variant={timeRange === range ? "contained" : "outlined"}
                        onClick={() => setTimeRange(range)}
                        sx={{ ml: 1, minWidth: 60 }}
                      >
                        {range}
                      </Button>
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && renderSectorPerformance()}
    </Container>
  );
};

export default MarketTrends;
