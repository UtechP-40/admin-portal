import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Rule as RuleIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemConfigurationApi } from '../../services/systemConfigurationApi';
import type { TargetingRule } from '../../types/systemConfiguration';

interface TargetingRulesManagerProps {
  featureFlagKey: string;
  environment: string;
  onClose?: () => void;
}

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'in', label: 'In List' },
  { value: 'not_in', label: 'Not In List' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'regex', label: 'Regex Match' }
];

const ATTRIBUTES = [
  { value: 'userId', label: 'User ID' },
  { value: 'userType', label: 'User Type' },
  { value: 'country', label: 'Country' },
  { value: 'platform', label: 'Platform' },
  { value: 'appVersion', label: 'App Version' },
  { value: 'deviceType', label: 'Device Type' },
  { value: 'subscriptionTier', label: 'Subscription Tier' },
  { value: 'registrationDate', label: 'Registration Date' },
  { value: 'lastActiveDate', label: 'Last Active Date' },
  { value: 'customAttribute', label: 'Custom Attribute' }
];

const TargetingRulesManager: React.FC<TargetingRulesManagerProps> = ({
  featureFlagKey,
  environment,
  onClose
}) => {
  const [createRuleOpen, setCreateRuleOpen] = useState(false);
  const [editRuleOpen, setEditRuleOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<TargetingRule | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Fetch targeting rules
  const { data: targetingRules, isLoading } = useQuery({
    queryKey: ['targetingRules', featureFlagKey, environment],
    queryFn: () => systemConfigurationApi.getTargetingRules(featureFlagKey, environment)
  });

  // Create targeting rule mutation
  const createRuleMutation = useMutation({
    mutationFn: (rule: Omit<TargetingRule, 'id'>) =>
      systemConfigurationApi.createTargetingRule(featureFlagKey, environment, rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targetingRules', featureFlagKey, environment] });
      setCreateRuleOpen(false);
    }
  });

  // Update targeting rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: ({ ruleId, updates }: { ruleId: string; updates: Partial<TargetingRule> }) =>
      systemConfigurationApi.updateTargetingRule(featureFlagKey, ruleId, environment, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targetingRules', featureFlagKey, environment] });
      setEditRuleOpen(false);
    }
  });

  // Delete targeting rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId: string) =>
      systemConfigurationApi.deleteTargetingRule(featureFlagKey, ruleId, environment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targetingRules', featureFlagKey, environment] });
      setDeleteConfirmOpen(false);
      setRuleToDelete(null);
    }
  });

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    updateRuleMutation.mutate({ ruleId, updates: { enabled } });
  };

  const handleUpdateRollout = (ruleId: string, rolloutPercentage: number) => {
    updateRuleMutation.mutate({ ruleId, updates: { rolloutPercentage } });
  };

  const handleDeleteRule = (ruleId: string) => {
    setRuleToDelete(ruleId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (ruleToDelete) {
      deleteRuleMutation.mutate(ruleToDelete);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RuleIcon />
          Targeting Rules for {featureFlagKey}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateRuleOpen(true)}
        >
          Add Rule
        </Button>
      </Box>

      {targetingRules?.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No targeting rules configured. Create rules to control feature flag rollout based on user attributes.
        </Alert>
      )}

      {targetingRules?.map((rule, index) => (
        <Accordion key={rule.id} sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Typography variant="subtitle1">{rule.name}</Typography>
              <Chip
                label={rule.enabled ? 'Active' : 'Inactive'}
                color={rule.enabled ? 'success' : 'default'}
                size="small"
              />
              <Chip
                label={`${rule.rolloutPercentage}% rollout`}
                color="primary"
                size="small"
              />
              <Box sx={{ flexGrow: 1 }} />
              <Switch
                checked={rule.enabled}
                onChange={(e) => {
                  e.stopPropagation();
                  handleToggleRule(rule.id, e.target.checked);
                }}
                size="small"
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Typography variant="subtitle2" gutterBottom>
                  Conditions
                </Typography>
                <List dense>
                  {rule.conditions.map((condition, condIndex) => (
                    <ListItem key={condIndex}>
                      <ListItemText
                        primary={`${condition.attribute} ${condition.operator} ${condition.value}`}
                        secondary={`Condition ${condIndex + 1}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Rollout Percentage
                </Typography>
                <Slider
                  value={rule.rolloutPercentage}
                  onChange={(_, value) => handleUpdateRollout(rule.id, value as number)}
                  disabled={!rule.enabled}
                  marks
                  step={5}
                  min={0}
                  max={100}
                  valueLabelDisplay="on"
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => {
                      setSelectedRule(rule);
                      setEditRuleOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteRule(rule.id)}
                  >
                    Delete
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Create Rule Dialog */}
      <CreateTargetingRuleDialog
        open={createRuleOpen}
        onClose={() => setCreateRuleOpen(false)}
        onSubmit={(rule) => createRuleMutation.mutate(rule)}
        loading={createRuleMutation.isPending}
      />

      {/* Edit Rule Dialog */}
      <EditTargetingRuleDialog
        open={editRuleOpen}
        onClose={() => setEditRuleOpen(false)}
        rule={selectedRule}
        onSubmit={(updates) => {
          if (selectedRule) {
            updateRuleMutation.mutate({ ruleId: selectedRule.id, updates });
          }
        }}
        loading={updateRuleMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Targeting Rule</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this targeting rule? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={deleteRuleMutation.isPending}
          >
            {deleteRuleMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Create Targeting Rule Dialog Component
const CreateTargetingRuleDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onSubmit: (rule: Omit<TargetingRule, 'id'>) => void;
  loading: boolean;
}> = ({ open, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    conditions: [{ attribute: 'userId', operator: 'equals' as const, value: '' }],
    rolloutPercentage: 100,
    enabled: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [...formData.conditions, { attribute: 'userId', operator: 'equals' as const, value: '' }]
    });
  };

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index)
    });
  };

  const updateCondition = (index: number, field: string, value: any) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setFormData({ ...formData, conditions: newConditions });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create Targeting Rule</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Rule Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Conditions
              </Typography>
              {formData.conditions.map((condition, index) => (
                <Card key={index} sx={{ mb: 2, p: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Attribute</InputLabel>
                        <Select
                          value={condition.attribute}
                          onChange={(e) => updateCondition(index, 'attribute', e.target.value)}
                          label="Attribute"
                        >
                          {ATTRIBUTES.map((attr) => (
                            <MenuItem key={attr.value} value={attr.value}>
                              {attr.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Operator</InputLabel>
                        <Select
                          value={condition.operator}
                          onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                          label="Operator"
                        >
                          {OPERATORS.map((op) => (
                            <MenuItem key={op.value} value={op.value}>
                              {op.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Value"
                        value={condition.value}
                        onChange={(e) => updateCondition(index, 'value', e.target.value)}
                        placeholder={condition.operator === 'in' || condition.operator === 'not_in' ? 'value1,value2,value3' : 'value'}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Button
                        color="error"
                        onClick={() => removeCondition(index)}
                        disabled={formData.conditions.length === 1}
                      >
                        Remove
                      </Button>
                    </Grid>
                  </Grid>
                </Card>
              ))}
              <Button onClick={addCondition} startIcon={<AddIcon />}>
                Add Condition
              </Button>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" gutterBottom>
                Rollout Percentage: {formData.rolloutPercentage}%
              </Typography>
              <Slider
                value={formData.rolloutPercentage}
                onChange={(_, value) => setFormData({ ...formData, rolloutPercentage: value as number })}
                marks
                step={5}
                min={0}
                max={100}
                valueLabelDisplay="on"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  />
                }
                label="Enable Rule"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Create Rule'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Edit Targeting Rule Dialog Component
const EditTargetingRuleDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  rule: TargetingRule | null;
  onSubmit: (updates: Partial<TargetingRule>) => void;
  loading: boolean;
}> = ({ open, onClose, rule, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    conditions: [{ attribute: 'userId', operator: 'equals' as const, value: '' }],
    rolloutPercentage: 100,
    enabled: true
  });

  React.useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        conditions: rule.conditions,
        rolloutPercentage: rule.rolloutPercentage,
        enabled: rule.enabled
      });
    }
  }, [rule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [...formData.conditions, { attribute: 'userId', operator: 'equals' as const, value: '' }]
    });
  };

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index)
    });
  };

  const updateCondition = (index: number, field: string, value: any) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setFormData({ ...formData, conditions: newConditions });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Targeting Rule</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Rule Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Conditions
              </Typography>
              {formData.conditions.map((condition, index) => (
                <Card key={index} sx={{ mb: 2, p: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Attribute</InputLabel>
                        <Select
                          value={condition.attribute}
                          onChange={(e) => updateCondition(index, 'attribute', e.target.value)}
                          label="Attribute"
                        >
                          {ATTRIBUTES.map((attr) => (
                            <MenuItem key={attr.value} value={attr.value}>
                              {attr.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Operator</InputLabel>
                        <Select
                          value={condition.operator}
                          onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                          label="Operator"
                        >
                          {OPERATORS.map((op) => (
                            <MenuItem key={op.value} value={op.value}>
                              {op.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Value"
                        value={condition.value}
                        onChange={(e) => updateCondition(index, 'value', e.target.value)}
                        placeholder={condition.operator === 'in' || condition.operator === 'not_in' ? 'value1,value2,value3' : 'value'}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Button
                        color="error"
                        onClick={() => removeCondition(index)}
                        disabled={formData.conditions.length === 1}
                      >
                        Remove
                      </Button>
                    </Grid>
                  </Grid>
                </Card>
              ))}
              <Button onClick={addCondition} startIcon={<AddIcon />}>
                Add Condition
              </Button>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" gutterBottom>
                Rollout Percentage: {formData.rolloutPercentage}%
              </Typography>
              <Slider
                value={formData.rolloutPercentage}
                onChange={(_, value) => setFormData({ ...formData, rolloutPercentage: value as number })}
                marks
                step={5}
                min={0}
                max={100}
                valueLabelDisplay="on"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  />
                }
                label="Enable Rule"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Updating...' : 'Update Rule'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TargetingRulesManager;