import React from "react";
import { Button, Typography, Box, Paper } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        p: 3,
        backgroundColor: (theme) =>
          theme.palette.mode === "light"
            ? theme.palette.grey[100]
            : theme.palette.grey[900],
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 600,
          width: "100%",
          textAlign: "center",
        }}
      >
        <ErrorOutlineIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Something went wrong
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          We're sorry, but an unexpected error occurred. Our team has been
          notified.
        </Typography>
        <Box sx={{ mt: 3, mb: 2 }}>
          <Typography
            variant="caption"
            component="div"
            sx={{
              backgroundColor: "rgba(0, 0, 0, 0.05)",
              p: 2,
              borderRadius: 1,
              fontFamily: "monospace",
              textAlign: "left",
              maxHeight: "200px",
              overflow: "auto",
              mb: 2,
            }}
          >
            {error.message}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={resetErrorBoundary}
          sx={{ mr: 2 }}
        >
          Try again
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => (window.location.href = "/")}
        >
          Go to Home
        </Button>
      </Paper>
    </Box>
  );
};

export default ErrorFallback;
