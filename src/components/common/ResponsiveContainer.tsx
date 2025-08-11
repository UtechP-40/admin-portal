import React from 'react';
import {
  Box,
  Container,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import type { Breakpoint } from '@mui/material/styles';
import { motion } from 'framer-motion';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: Breakpoint | false;
  disableGutters?: boolean;
  animate?: boolean;
  mobileFullWidth?: boolean;
  padding?: number | string;
  className?: string;
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'lg',
  disableGutters = false,
  animate = true,
  mobileFullWidth = true,
  padding,
  className,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const content = (
    <Container
      maxWidth={maxWidth}
      disableGutters={disableGutters || (mobileFullWidth && isMobile)}
      className={className}
      sx={{
        px: padding || (mobileFullWidth && isMobile ? 1 : undefined),
        width: mobileFullWidth && isMobile ? '100%' : undefined,
      }}
    >
      {children}
    </Container>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
};

// Hook for responsive values
export const useResponsiveValue = <T,>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
}) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));
  const isXl = useMediaQuery(theme.breakpoints.up('xl'));

  if (isXl && values.xl !== undefined) return values.xl;
  if (isLg && values.lg !== undefined) return values.lg;
  if (isMd && values.md !== undefined) return values.md;
  if (isSm && values.sm !== undefined) return values.sm;
  if (isXs && values.xs !== undefined) return values.xs;

  // Fallback to the largest available value
  return values.xl || values.lg || values.md || values.sm || values.xs;
};

// Hook for responsive breakpoint detection
export const useBreakpoint = () => {
  const theme = useTheme();
  
  return {
    isXs: useMediaQuery(theme.breakpoints.only('xs')),
    isSm: useMediaQuery(theme.breakpoints.only('sm')),
    isMd: useMediaQuery(theme.breakpoints.only('md')),
    isLg: useMediaQuery(theme.breakpoints.only('lg')),
    isXl: useMediaQuery(theme.breakpoints.up('xl')),
    isMobile: useMediaQuery(theme.breakpoints.down('sm')),
    isTablet: useMediaQuery(theme.breakpoints.down('md')),
    isDesktop: useMediaQuery(theme.breakpoints.up('md')),
    isLargeScreen: useMediaQuery(theme.breakpoints.up('lg')),
  };
};

// Responsive Grid component
interface ResponsiveGridProps {
  children: React.ReactNode;
  spacing?: number;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  spacing = 3,
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
}) => {
  const { isXs, isSm, isMd, isLg } = useBreakpoint();
  
  let cols = columns.xl || 4;
  if (isLg) cols = columns.lg || 4;
  if (isMd) cols = columns.md || 3;
  if (isSm) cols = columns.sm || 2;
  if (isXs) cols = columns.xs || 1;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: spacing,
        width: '100%',
      }}
    >
      {children}
    </Box>
  );
};

// Responsive Stack component
interface ResponsiveStackProps {
  children: React.ReactNode;
  direction?: {
    xs?: 'row' | 'column';
    sm?: 'row' | 'column';
    md?: 'row' | 'column';
    lg?: 'row' | 'column';
  };
  spacing?: number;
  alignItems?: string;
  justifyContent?: string;
}

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  direction = { xs: 'column', md: 'row' },
  spacing = 2,
  alignItems = 'stretch',
  justifyContent = 'flex-start',
}) => {
  const currentDirection = useResponsiveValue(direction);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: currentDirection,
        gap: spacing,
        alignItems,
        justifyContent,
        width: '100%',
      }}
    >
      {children}
    </Box>
  );
};

export default ResponsiveContainer;