import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Link,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { motion } from 'framer-motion';
import { CheckCircle, HourglassEmpty, Email } from '@mui/icons-material';
import { registerSchema } from '../utils/validators';
import type { RegisterFormData } from '../utils/validators';
import { useRegister } from '../hooks/useAuth';

const steps = ['Registration', 'Email Verification', 'Admin Approval', 'Complete'];

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isRegistering, registerError } = useRegister();
  const [registrationStep, setRegistrationStep] = useState(0);
  const [registrationData, setRegistrationData] = useState<any>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const result = await register(data);
      setRegistrationData(result);
      setRegistrationStep(1);
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const renderRegistrationForm = () => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: 500,
        }}
      >
        <Typography component="h1" variant="h4" gutterBottom>
          Admin Registration
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Request access to the admin portal
        </Typography>

        {registerError && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {registerError.message || 'Registration failed. Please try again.'}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ mt: 1, width: '100%' }}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                margin="normal"
                required
                fullWidth
                id="name"
                label="Full Name"
                name="name"
                autoComplete="name"
                autoFocus
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            )}
          />
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          />
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
                error={!!errors.password}
                helperText={errors.password?.message}
              />
            )}
          />
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
              />
            )}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isRegistering}
          >
            {isRegistering ? <CircularProgress size={24} /> : 'Register'}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link component={RouterLink} to="/login" variant="body2">
              Already have an account? Sign in
            </Link>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );

  const renderApprovalStatus = () => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: 600,
        }}
      >
        <Typography component="h1" variant="h4" gutterBottom>
          Registration Status
        </Typography>

        <Stepper activeStep={registrationStep} sx={{ width: '100%', mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Card sx={{ width: '100%', mb: 3 }}>
          <CardContent>
            {registrationStep === 1 && (
              <Box sx={{ textAlign: 'center' }}>
                <Email sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Email Verification Required
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  We've sent a verification email to {registrationData?.email}.
                  Please check your inbox and click the verification link.
                </Typography>
              </Box>
            )}

            {registrationStep === 2 && (
              <Box sx={{ textAlign: 'center' }}>
                <HourglassEmpty sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Pending Admin Approval
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your registration is being reviewed by an administrator.
                  You'll receive an email notification once approved.
                </Typography>
              </Box>
            )}

            {registrationStep === 3 && (
              <Box sx={{ textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Registration Complete
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Your account has been approved! You can now sign in.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/login')}
                >
                  Go to Login
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        <Box sx={{ textAlign: 'center' }}>
          <Link component={RouterLink} to="/login" variant="body2">
            Back to Login
          </Link>
        </Box>
      </Paper>
    </motion.div>
  );

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        {registrationStep === 0 ? renderRegistrationForm() : renderApprovalStatus()}
      </Box>
    </Container>
  );
};

export default RegisterPage;