import React, { Component } from 'react';
import { Box, Typography, Button } from '@mui/material';

const AlertTriangle = ({ size = 24, color = "currentColor", style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
);

const RefreshCw = ({ size = 24, color = "currentColor", style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
);
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // You can also log the error to an error reporting service here (like Sentry)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Reload the page or trigger a specific reset action
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          minHeight="400px" 
          p={4}
          textAlign="center"
          bgcolor="background.paper"
          borderRadius={2}
          boxShadow={1}
        >
          <AlertTriangle size={64} color="#ef4444" style={{ marginBottom: '16px' }} />
          <Typography variant="h5" component="h2" gutterBottom fontWeight="bold" color="text.primary">
            Oops! Something went wrong.
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: '400px' }}>
            We're having trouble loading this section. This might be a temporary issue or an unexpected error.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<RefreshCw size={18} />}
            onClick={this.handleReset}
            sx={{ mt: 2, textTransform: 'none', px: 4, py: 1 }}
          >
            Try Again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
