import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Shield as ShieldIcon,
  Block as BlockIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { SecurityMetrics, SecuritySeverity } from '../../types/security';

interface SecurityMetricsCardsProps {
  metrics: SecurityMetrics;
}

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  trend?: {
    direction: 'up' | 'down';
    percentage: number;
  };
  subtitle?: string;
  progress?: {
    value: number;
    max: number;
  };
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  color,
  trend,
  subtitle,
  progress,
  onClick,
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        sx={{
          height: '100%',
          cursor: onClick ? 'pointer' : 'default',
          '&:hover': onClick ? {
            boxShadow: (theme) => theme.shadows[4],
          } : {},
        }}
        onClick={onClick}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 1,
                  backgroundColor: `${color}.light`,
                  color: `${color}.contrastText`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {icon}
              </Box>
              <Typography variant="h6" component="div" color={`${color}.main`}>
                {value}
              </Typography>
            </Box>
            {trend && (
              <Tooltip title={`${trend.direction === 'up' ? 'Increased' : 'Decreased'} by ${trend.percentage}%`}>
                <Chip
                  icon={trend.direction === 'up' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  label={`${trend.percentage}%`}
                  size="small"
                  color={trend.direction === 'up' ? 'error' : 'success'}
                  variant="outlined"
                />
              </Tooltip>
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          {progress && (
            <Box sx={{ mt: 1 }}>
              <LinearProgress
                variant="determinate"
                value={(progress.value / progress.max) * 100}
                color={color}
                sx={{ height: 6, borderRadius: 3 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {progress.value} / {progress.max}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const SecurityMetricsCards: React.FC<SecurityMetricsCardsProps> = ({ metrics }) => {
  const getRiskScoreColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score <= 3) return 'success';
    if (score <= 7) return 'warning';
    return 'error';
  };

  const getRiskScoreLabel = (score: number): string => {
    if (score <= 3) return 'Low Risk';
    if (score <= 7) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {/* Total Security Events */}
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Total Security Events"
          value={metrics.totalEvents.toLocaleString()}
          icon={<SecurityIcon />}
          color="primary"
          subtitle="Last 24 hours"
          trend={{
            direction: 'up',
            percentage: 12,
          }}
        />
      </Grid>

      {/* Critical Events */}
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Critical Events"
          value={metrics.criticalEvents}
          icon={<ErrorIcon />}
          color="error"
          subtitle="Requires immediate attention"
          progress={{
            value: metrics.criticalEvents,
            max: Math.max(metrics.criticalEvents, 10),
          }}
        />
      </Grid>

      {/* Active Threats */}
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Active Threats"
          value={metrics.activeThreat}
          icon={<WarningIcon />}
          color="warning"
          subtitle="Currently being monitored"
          trend={{
            direction: 'down',
            percentage: 8,
          }}
        />
      </Grid>

      {/* Average Risk Score */}
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Average Risk Score"
          value={`${metrics.averageRiskScore.toFixed(1)}/10`}
          icon={<AssessmentIcon />}
          color={getRiskScoreColor(metrics.averageRiskScore)}
          subtitle={getRiskScoreLabel(metrics.averageRiskScore)}
          progress={{
            value: metrics.averageRiskScore,
            max: 10,
          }}
        />
      </Grid>

      {/* Failed Logins */}
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Failed Login Attempts"
          value={metrics.failedLogins.toLocaleString()}
          icon={<BlockIcon />}
          color="error"
          subtitle="Last 24 hours"
          trend={{
            direction: 'up',
            percentage: 25,
          }}
        />
      </Grid>

      {/* Successful Logins */}
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Successful Logins"
          value={metrics.successfulLogins.toLocaleString()}
          icon={<ShieldIcon />}
          color="success"
          subtitle="Last 24 hours"
        />
      </Grid>

      {/* Blocked IPs */}
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Blocked IP Addresses"
          value={metrics.blockedIps}
          icon={<BlockIcon />}
          color="warning"
          subtitle="Currently blocked"
        />
      </Grid>

      {/* Resolved Threats */}
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Resolved Threats"
          value={metrics.resolvedThreats}
          icon={<ShieldIcon />}
          color="success"
          subtitle="This month"
          trend={{
            direction: 'up',
            percentage: 15,
          }}
        />
      </Grid>

      {/* Event Severity Breakdown */}
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon />
              Events by Severity
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {Object.entries(metrics.eventsBySeverity).map(([severity, count]) => {
                const total = metrics.totalEvents;
                const percentage = total > 0 ? (count / total) * 100 : 0;
                const severityColor = severity === SecuritySeverity.CRITICAL ? 'error' :
                                   severity === SecuritySeverity.HIGH ? 'warning' :
                                   severity === SecuritySeverity.MEDIUM ? 'info' : 'success';

                return (
                  <Box key={severity}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {severity}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {count} ({percentage.toFixed(1)}%)
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      color={severityColor}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Top Event Types */}
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssessmentIcon />
              Top Event Types
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {Object.entries(metrics.eventsByType)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([type, count]) => {
                  const percentage = metrics.totalEvents > 0 ? (count / metrics.totalEvents) * 100 : 0;
                  return (
                    <Box key={type} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {type.replace(/_/g, ' ')}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {count}
                        </Typography>
                        <Chip
                          label={`${percentage.toFixed(1)}%`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  );
                })}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default SecurityMetricsCards;