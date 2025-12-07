import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { 
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  DirectionsCar as CarIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

interface Listing {
  id: number;
  year: number;
  make: string;
  model: string;
  price: number;
  status: 'Listed' | 'Sold' | 'Pending';
  imageUrl?: string;
}

interface DashboardStats {
  totalListings: number;
  totalSales: number;
  salesThisWeek: number;
  avgSale: number;
  highestSale: number;
  recentListings: Listing[];
}

interface DashboardProps {
  stats?: DashboardStats;
  loading?: boolean;
  onNewListing?: () => void;
  onViewListing?: (id: number) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Sold': return 'success';
    case 'Pending': return 'warning';
    default: return 'primary';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Sold': return '✅';
    case 'Pending': return '⏳';
    default: return '📋';
  }
};

export default function Dashboard({ 
  stats, 
  loading = false, 
  onNewListing,
  onViewListing 
}: DashboardProps) {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  if (loading) {
    return (
      <Box p={3}>
        <Skeleton variant="text" width="60%" height={60} />
        <Grid container spacing={2} mb={2} {...({} as any)}>
          {[...Array(5)].map((_, i) => (
            <Grid item xs={6} md={2} key={i} {...({} as any)}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="text" width="30%" height={40} />
        <Grid container spacing={2} {...({} as any)}>
          {[...Array(3)].map((_, i) => (
            <Grid item xs={12} md={4} key={i} {...({} as any)}>
              <Skeleton variant="rectangular" height={100} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const defaultStats: DashboardStats = {
    totalListings: 18,
    totalSales: 7,
    salesThisWeek: 19500,
    avgSale: 8200,
    highestSale: 14500,
    recentListings: [
      { id: 1, year: 2018, make: 'Ford', model: 'Edge SEL', price: 9900, status: 'Listed' },
      { id: 2, year: 2013, make: 'Lincoln', model: 'MKT', price: 3300, status: 'Sold' },
      { id: 3, year: 2010, make: 'Chevy', model: 'Impala LT', price: 3200, status: 'Sold' }
    ]
  };

  const currentStats = stats || defaultStats;

  const statCards = [
    {
      title: 'Total Listings',
      value: currentStats.totalListings,
      icon: '📋',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    },
    {
      title: 'Total Sales',
      value: currentStats.totalSales,
      icon: '🚗',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      color: 'white'
    },
    {
      title: 'Sales This Week',
      value: `$${currentStats.salesThisWeek.toLocaleString()}`,
      icon: '💰',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      color: 'white'
    },
    {
      title: 'Avg Sale',
      value: `$${currentStats.avgSale.toLocaleString()}`,
      icon: '📊',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      color: 'white'
    },
    {
      title: 'Highest Sale',
      value: `$${currentStats.highestSale.toLocaleString()}`,
      icon: '⭐',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      color: 'white'
    }
  ];

  return (
    <Box p={3} sx={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
      {/* Header with Welcome and Action Button */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ 
            fontWeight: 'bold', 
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🚀 Welcome back, Preston!
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Here's your Accorria dashboard overview
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onNewListing}
          sx={{
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            color: 'white',
            fontWeight: 'bold',
            px: 3,
            py: 1.5,
            borderRadius: 2,
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
            },
            transition: 'all 0.3s ease'
          }}
        >
          New Listing
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4} {...({} as any)}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={2.4} key={index} {...({} as any)}>
            <Card
              sx={{
                background: stat.gradient,
                color: stat.color,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
                },
                borderRadius: 3,
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h3" sx={{ mb: 1 }}>
                  {stat.icon}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {stat.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Listings */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2d3748' }}>
        📋 Recent Listings
      </Typography>
      <Grid container spacing={3} {...({} as any)}>
        {currentStats.recentListings.map((listing, index) => (
          <Grid item xs={12} md={4} key={listing.id} {...({} as any)}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: hoveredCard === listing.id ? 'translateY(-4px)' : 'none',
                boxShadow: hoveredCard === listing.id 
                  ? '0 8px 25px rgba(0,0,0,0.15)' 
                  : '0 4px 15px rgba(0,0,0,0.1)',
                borderRadius: 3,
                '&:hover': {
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                }
              }}
              onMouseEnter={() => setHoveredCard(listing.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => onViewListing?.(listing.id)}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" flex={1}>
                    <Avatar 
                      sx={{ 
                        mr: 2, 
                        bgcolor: 'primary.main',
                        width: 56,
                        height: 56,
                        fontSize: '1.5rem'
                      }}
                    >
                      {listing.make.charAt(0)}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {listing.year} {listing.make} {listing.model}
                      </Typography>
                      <Typography variant="h5" sx={{ 
                        fontWeight: 'bold', 
                        color: 'primary.main',
                        mb: 1
                      }}>
                        ${listing.price.toLocaleString()}
                      </Typography>
                      <Chip
                        label={`${getStatusIcon(listing.status)} ${listing.status}`}
                        color={getStatusColor(listing.status) as any}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                  </Box>
                  <Tooltip title="View Details">
                    <IconButton size="small" sx={{ color: 'primary.main' }}>
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
} 