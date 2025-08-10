import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  IconButton,
  Tooltip,
  Alert,
  Divider,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Lightbulb as LightbulbIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { RiskAssessment, RiskFactor } from '../../types/security';

interface RiskAssessmentCardProps {
  riskAssessment: RiskAssessment;
}

const RiskAssessmentCard: React.FC<RiskAssessmentCardProps> = ({ riskAssessment }) => {
  const [expanded, setExpanded] = useState(false);
  const [factorsExpanded, setFactorsExpanded] = useState(false);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      case 'critical':
        return 'error';
      default:
        return 'info';
    }
  };

  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case 'low':
        return <CheckCircleIcon color="success" />;
      case 'medium':
        return <InfoIcon color="warning" />;
      case 'high':
        return <WarningIcon color="error" />;
      case 'critical':
        return <ErrorIcon color="error" />;
      default:
        return <SecurityIcon />;
    }
  };

  const getMitigationStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'success';
      case 'partial':
        return 'warning';
      case 'none':
        return 'error';
      default:
        return 'default';
    }
  };

  const getMitigationStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircleIcon fontSize="small" />;
      case 'partial':
        return <WarningIcon fontSize="small" />;
      case 'none':
        return <ErrorIcon fontSize="small" />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        avatar={getRiskLevelIcon(riskAssessment.riskLevel)}
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">Risk Assessment</Typography>
            <Chip
              label={riskAssessment.riskLevel.toUpperCase()}
              color={getRiskLevelColor(riskAssessment.riskLevel)}
              size="small"
            />
          </Box>
        }
        subheader={`Last updated: ${format(new Date(riskAssessment.lastUpdated), 'PPp')}`}
        action={
          <Tooltip title={expanded ? 'Collapse' : 'Expand'}>
            <IconButton onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        {/* Overall Risk Score */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Overall Risk Score
            </Typography>
            <Typography variant="h6" color={`${getRiskLevelColor(riskAssessment.riskLevel)}.main`}>
              {riskAssessment.overallRiskScore.toFixed(1)}/10
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={(riskAssessment.overallRiskScore / 10) * 100}
            color={getRiskLevelColor(riskAssessment.riskLevel)}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Risk Level Alert */}
        {riskAssessment.riskLevel === 'high' || riskAssessment.riskLevel === 'critical' ? (
          <Alert
            severity={riskAssessment.riskLevel === 'critical' ? 'error' : 'warning'}
            sx={{ mb: 2 }}
          >
            <Typography variant="body2">
              {riskAssessment.riskLevel === 'critical'
                ? 'Critical security risks detected. Immediate action required.'
                : 'High security risks detected. Review and address promptly.'}
            </Typography>
          </Alert>
        ) : null}

        {/* Quick Recommendations */}
        {riskAssessment.recommendations.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LightbulbIcon fontSize="small" />
              Top Recommendations
            </Typography>
            <List dense>
              {riskAssessment.recommendations.slice(0, expanded ? undefined : 3).map((recommendation, index) => (
                <ListItem key={index} sx={{ pl: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2">
                        {recommendation}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
            {!expanded && riskAssessment.recommendations.length > 3 && (
              <Typography
                variant="caption"
                color="primary"
                sx={{ cursor: 'pointer', ml: 2 }}
                onClick={() => setExpanded(true)}
              >
                +{riskAssessment.recommendations.length - 3} more recommendations
              </Typography>
            )}
          </Box>
        )}

        {/* Expanded Content */}
        <Collapse in={expanded}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Divider sx={{ my: 2 }} />

            {/* Risk Factors */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssessmentIcon fontSize="small" />
                  Risk Factors ({riskAssessment.riskFactors.length})
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setFactorsExpanded(!factorsExpanded)}
                >
                  {factorsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              {/* Risk Factors Summary */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 1, mb: 2 }}>
                {['none', 'partial', 'complete'].map((status) => {
                  const count = riskAssessment.riskFactors.filter(f => f.mitigationStatus === status).length;
                  return (
                    <Box key={status} sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color={`${getMitigationStatusColor(status)}.main`}>
                        {count}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {status === 'none' ? 'Unmitigated' : status === 'partial' ? 'Partial' : 'Mitigated'}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              {/* Detailed Risk Factors */}
              <Collapse in={factorsExpanded}>
                <List dense>
                  {riskAssessment.riskFactors
                    .sort((a, b) => b.riskScore - a.riskScore)
                    .map((factor, index) => (
                      <ListItem key={index} sx={{ pl: 0 }}>
                        <ListItemIcon>
                          {getMitigationStatusIcon(factor.mitigationStatus)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {factor.category}
                              </Typography>
                              <Chip
                                label={factor.riskScore.toFixed(1)}
                                size="small"
                                color={factor.riskScore >= 8 ? 'error' : factor.riskScore >= 6 ? 'warning' : 'success'}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                {factor.description}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                <Chip
                                  label={`Impact: ${factor.impact}/10`}
                                  size="small"
                                  variant="outlined"
                                />
                                <Chip
                                  label={`Likelihood: ${factor.likelihood}/10`}
                                  size="small"
                                  variant="outlined"
                                />
                                <Chip
                                  label={factor.mitigationStatus}
                                  size="small"
                                  color={getMitigationStatusColor(factor.mitigationStatus)}
                                />
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                </List>
              </Collapse>
            </Box>

            {/* All Recommendations */}
            {riskAssessment.recommendations.length > 3 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LightbulbIcon fontSize="small" />
                  All Recommendations
                </Typography>
                <List dense>
                  {riskAssessment.recommendations.slice(3).map((recommendation, index) => (
                    <ListItem key={index + 3} sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: 'primary.main',
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2">
                            {recommendation}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </motion.div>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default RiskAssessmentCard;