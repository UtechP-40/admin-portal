import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Slider,
  Switch,
  FormControlLabel,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  TextField,
  Divider,

  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  PhoneAndroid,
  PhoneIphone,
  Tablet,
  ScreenRotation,
  TouchApp,
  NetworkWifi,
  CameraAlt,
  LocationOn,
  Sensors,
  Screenshot,
  VideoCall,
  Refresh,
  Settings,
  BugReport,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
// import { MobileComponentLibrary } from './MobileComponentLibrary';
// import { MobileDebugTools } from './MobileDebugTools';
// import { CrossBrowserTesting } from './CrossBrowserTesting';

// Device presets
const DEVICE_PRESETS = {
  'iphone-14': {
    name: 'iPhone 14',
    width: 390,
    height: 844,
    pixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
    icon: PhoneIphone,
    platform: 'iOS',
  },
  'iphone-14-pro': {
    name: 'iPhone 14 Pro',
    width: 393,
    height: 852,
    pixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
    icon: PhoneIphone,
    platform: 'iOS',
  },
  'samsung-s23': {
    name: 'Samsung Galaxy S23',
    width: 360,
    height: 780,
    pixelRatio: 3,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36',
    icon: PhoneAndroid,
    platform: 'Android',
  },
  'pixel-7': {
    name: 'Google Pixel 7',
    width: 412,
    height: 915,
    pixelRatio: 2.625,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36',
    icon: PhoneAndroid,
    platform: 'Android',
  },
  'ipad-air': {
    name: 'iPad Air',
    width: 820,
    height: 1180,
    pixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
    icon: Tablet,
    platform: 'iOS',
  },
};

// Network throttling presets
const NETWORK_PRESETS = {
  'fast-3g': { name: 'Fast 3G', downloadThroughput: 1.5 * 1024, uploadThroughput: 750, latency: 562.5 },
  'slow-3g': { name: 'Slow 3G', downloadThroughput: 0.5 * 1024, uploadThroughput: 250, latency: 2000 },
  '4g': { name: '4G', downloadThroughput: 4 * 1024, uploadThroughput: 3 * 1024, latency: 170 },
  'wifi': { name: 'WiFi', downloadThroughput: 30 * 1024, uploadThroughput: 15 * 1024, latency: 2 },
  'offline': { name: 'Offline', downloadThroughput: 0, uploadThroughput: 0, latency: 0 },
};

interface TouchEvent {
  id: string;
  x: number;
  y: number;
  type: 'start' | 'move' | 'end';
  timestamp: number;
  pressure?: number;
  radius?: number;
}

interface GestureEvent {
  id: string;
  type: 'tap' | 'double-tap' | 'long-press' | 'swipe' | 'pinch' | 'rotate';
  startX: number;
  startY: number;
  endX?: number;
  endY?: number;
  duration: number;
  velocity?: number;
  scale?: number;
  rotation?: number;
  timestamp: number;
}

interface DeviceFeatures {
  camera: boolean;
  gps: boolean;
  accelerometer: boolean;
  gyroscope: boolean;
  magnetometer: boolean;
  proximity: boolean;
  fingerprint: boolean;
  faceId: boolean;
  nfc: boolean;
  bluetooth: boolean;
}

interface RecordingOptions {
  format: 'webm' | 'mp4';
  quality: 'low' | 'medium' | 'high';
  fps: number;
  includeAudio: boolean;
}

export function MobileSimulator() {
  const [selectedDevice, setSelectedDevice] = useState<keyof typeof DEVICE_PRESETS>('iphone-14');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [networkThrottling, setNetworkThrottling] = useState<keyof typeof NETWORK_PRESETS>('wifi');
  const [scale, setScale] = useState(0.5);
  const [isRecording, setIsRecording] = useState(false);
  const [touchEvents, setTouchEvents] = useState<TouchEvent[]>([]);
  const [gestureEvents, setGestureEvents] = useState<GestureEvent[]>([]);
  const [deviceFeatures, setDeviceFeatures] = useState<DeviceFeatures>({
    camera: true,
    gps: true,
    accelerometer: true,
    gyroscope: true,
    magnetometer: true,
    proximity: true,
    fingerprint: true,
    faceId: true,
    nfc: false,
    bluetooth: true,
  });
  const [recordingOptions, setRecordingOptions] = useState<RecordingOptions>({
    format: 'webm',
    quality: 'medium',
    fps: 30,
    includeAudio: false,
  });
  const [showRecordingDialog, setShowRecordingDialog] = useState(false);
  const [showGesturePanel, setShowGesturePanel] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [customUrl, setCustomUrl] = useState('http://localhost:3000');
  const [isConnected, setIsConnected] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const simulatorRef = useRef<HTMLDivElement>(null);

  const device = DEVICE_PRESETS[selectedDevice];
  const currentWidth = orientation === 'portrait' ? device.width : device.height;
  const currentHeight = orientation === 'portrait' ? device.height : device.width;

  // Handle device rotation
  const handleRotation = useCallback(() => {
    setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait');
  }, []);

  // Handle touch events
  const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!simulatorRef.current) return;
    
    const rect = simulatorRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = (clientX - rect.left) / scale;
    const y = (clientY - rect.top) / scale;
    
    const touchEvent: TouchEvent = {
      id: Date.now().toString(),
      x,
      y,
      type: 'start',
      timestamp: Date.now(),
    };
    
    setTouchEvents(prev => [...prev.slice(-9), touchEvent]);
  }, [scale]);

  // Simulate network throttling
  const applyNetworkThrottling = useCallback(() => {
    const network = NETWORK_PRESETS[networkThrottling];
    if (iframeRef.current && iframeRef.current.contentWindow) {
      // This would typically be implemented with service workers or browser dev tools
      console.log(`Applying network throttling: ${network.name}`, network);
    }
  }, [networkThrottling]);

  // Take screenshot
  const takeScreenshot = useCallback(() => {
    if (!iframeRef.current) return;
    
    // Create canvas and capture iframe content
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = currentWidth;
    canvas.height = currentHeight;
    
    // This is a simplified implementation - in reality, you'd need to use
    // html2canvas or similar library to capture iframe content
    if (ctx) {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#333';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Screenshot captured', canvas.width / 2, canvas.height / 2);
      
      // Download screenshot
      const link = document.createElement('a');
      link.download = `mobile-simulator-${selectedDevice}-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  }, [currentWidth, currentHeight, selectedDevice]);

  // Advanced recording functionality
  const startRecording = useCallback(async () => {
    if (!simulatorRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: currentWidth,
          height: currentHeight,
          frameRate: recordingOptions.fps,
        },
        audio: recordingOptions.includeAudio,
      });

      const recorder = new MediaRecorder(stream, {
        mimeType: `video/${recordingOptions.format}`,
        videoBitsPerSecond: recordingOptions.quality === 'high' ? 8000000 : 
                           recordingOptions.quality === 'medium' ? 4000000 : 2000000,
      });

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: `video/${recordingOptions.format}` });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `mobile-simulator-recording-${Date.now()}.${recordingOptions.format}`;
        link.click();
        URL.revokeObjectURL(url);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [currentWidth, currentHeight, recordingOptions]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setMediaRecorder(null);
    }
    setIsRecording(false);
  }, [mediaRecorder]);

  // Start/stop recording
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      setShowRecordingDialog(true);
    }
  }, [isRecording, stopRecording]);

  // Refresh simulator
  const refreshSimulator = useCallback(() => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  }, []);

  // Real-time sync with mobile app
  const [syncSocket, setSyncSocket] = useState<WebSocket | null>(null);
  const [appState, setAppState] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  // Connect to mobile app
  const connectToApp = useCallback(() => {
    if (isConnected) {
      // Disconnect
      if (syncSocket) {
        syncSocket.close();
        setSyncSocket(null);
      }
      setIsConnected(false);
      setSyncStatus('disconnected');
      setAppState(null);
    } else {
      // Connect
      setSyncStatus('connecting');
      try {
        const ws = new WebSocket('ws://localhost:3001/mobile-sync');
        
        ws.onopen = () => {
          console.log('Connected to mobile app');
          setIsConnected(true);
          setSyncStatus('connected');
          setSyncSocket(ws);
          
          // Request initial state
          ws.send(JSON.stringify({ type: 'REQUEST_STATE' }));
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Received app state:', data);
            
            switch (data.type) {
              case 'STATE_UPDATE':
                setAppState(data.payload);
                break;
              case 'NAVIGATION_CHANGE':
                // Update simulator URL to match app navigation
                if (data.payload.route && iframeRef.current) {
                  const newUrl = `${customUrl}${data.payload.route}`;
                  iframeRef.current.src = newUrl;
                }
                break;
              case 'TOUCH_EVENT':
                // Simulate touch event from real device
                const touchEvent: TouchEvent = {
                  id: Date.now().toString(),
                  x: data.payload.x,
                  y: data.payload.y,
                  type: data.payload.type,
                  timestamp: Date.now(),
                };
                setTouchEvents(prev => [...prev.slice(-9), touchEvent]);
                break;
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setSyncStatus('error');
        };
        
        ws.onclose = () => {
          console.log('Disconnected from mobile app');
          setIsConnected(false);
          setSyncStatus('disconnected');
          setSyncSocket(null);
          setAppState(null);
        };
        
      } catch (error) {
        console.error('Failed to connect to mobile app:', error);
        setSyncStatus('error');
      }
    }
  }, [isConnected, syncSocket, customUrl]);

  // Apply device features
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      // Mock device APIs based on enabled features
      const mockAPIs = {
        geolocation: deviceFeatures.gps,
        camera: deviceFeatures.camera,
        deviceMotion: deviceFeatures.accelerometer,
        deviceOrientation: deviceFeatures.gyroscope,
      };
      
      console.log('Applying device features:', mockAPIs);
    }
  }, [deviceFeatures]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Mobile UI Simulator
      </Typography>
      
      {/* Controls */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Device Settings
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Device Preset</InputLabel>
                <Select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value as keyof typeof DEVICE_PRESETS)}
                  label="Device Preset"
                >
                  {Object.entries(DEVICE_PRESETS).map(([key, device]) => (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <device.icon fontSize="small" />
                        {device.name}
                        <Chip size="small" label={device.platform} />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>Scale: {Math.round(scale * 100)}%</Typography>
                <Slider
                  value={scale}
                  onChange={(_, value) => setScale(value as number)}
                  min={0.25}
                  max={1}
                  step={0.05}
                  marks={[
                    { value: 0.25, label: '25%' },
                    { value: 0.5, label: '50%' },
                    { value: 0.75, label: '75%' },
                    { value: 1, label: '100%' },
                  ]}
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Tooltip title="Rotate Device">
                  <IconButton onClick={handleRotation} color="primary">
                    <ScreenRotation />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Take Screenshot">
                  <IconButton onClick={takeScreenshot} color="primary">
                    <Screenshot />
                  </IconButton>
                </Tooltip>
                <Tooltip title={isRecording ? "Stop Recording" : "Start Recording"}>
                  <IconButton 
                    onClick={toggleRecording} 
                    color={isRecording ? "error" : "primary"}
                  >
                    <VideoCall />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Refresh">
                  <IconButton onClick={refreshSimulator} color="primary">
                    <Refresh />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Gesture Testing">
                  <IconButton onClick={() => setShowGesturePanel(true)} color="primary">
                    <TouchApp />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Debug Tools">
                  <IconButton onClick={() => setDebugMode(!debugMode)} color="primary">
                    <BugReport />
                  </IconButton>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Network & Features
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Network Throttling</InputLabel>
                <Select
                  value={networkThrottling}
                  onChange={(e) => setNetworkThrottling(e.target.value as keyof typeof NETWORK_PRESETS)}
                  label="Network Throttling"
                >
                  {Object.entries(NETWORK_PRESETS).map(([key, network]) => (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <NetworkWifi fontSize="small" />
                        {network.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Custom URL"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isConnected}
                      onChange={connectToApp}
                    />
                  }
                  label="Sync with App"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={debugMode}
                      onChange={(e) => setDebugMode(e.target.checked)}
                    />
                  }
                  label="Debug Mode"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Device Features */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Device Features
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(deviceFeatures).map(([feature, enabled]) => (
              <Grid item xs={6} sm={4} md={2} key={feature}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={enabled}
                      onChange={(e) => setDeviceFeatures(prev => ({
                        ...prev,
                        [feature]: e.target.checked
                      }))}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {feature === 'camera' && <CameraAlt fontSize="small" />}
                      {feature === 'gps' && <LocationOn fontSize="small" />}
                      {(feature === 'accelerometer' || feature === 'gyroscope' || feature === 'magnetometer') && <Sensors fontSize="small" />}
                      {(feature === 'fingerprint' || feature === 'faceId') && <Settings fontSize="small" />}
                      {(feature === 'nfc' || feature === 'bluetooth') && <NetworkWifi fontSize="small" />}
                      {feature === 'proximity' && <Sensors fontSize="small" />}
                      {feature.charAt(0).toUpperCase() + feature.slice(1).replace(/([A-Z])/g, ' $1')}
                    </Box>
                  }
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
      
      {/* Simulator Display */}
      <Box sx={{ display: 'flex', gap: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Paper 
            sx={{ 
              p: 2, 
              display: 'inline-block',
              background: 'linear-gradient(145deg, #2c2c2c, #1a1a1a)',
              borderRadius: 4,
            }}
          >
            <motion.div
              animate={{ 
                width: currentWidth * scale,
                height: currentHeight * scale,
              }}
              transition={{ duration: 0.3 }}
              style={{
                border: '8px solid #333',
                borderRadius: '24px',
                overflow: 'hidden',
                position: 'relative',
                background: '#000',
              }}
              ref={simulatorRef}
              onMouseDown={handleTouchStart}
              onTouchStart={handleTouchStart}
            >
              {/* Device Frame */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -4,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 60,
                  height: 4,
                  backgroundColor: '#666',
                  borderRadius: 2,
                  zIndex: 10,
                }}
              />
              
              {/* Screen */}
              <iframe
                ref={iframeRef}
                src={customUrl}
                style={{
                  width: currentWidth,
                  height: currentHeight,
                  border: 'none',
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  display: 'block',
                }}
                title="Mobile Simulator"
              />
              
              {/* Touch Indicators */}
              <AnimatePresence>
                {touchEvents.map((touch) => (
                  <motion.div
                    key={touch.id}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 1, opacity: 0.7 }}
                    exit={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      position: 'absolute',
                      left: touch.x * scale - 10,
                      top: touch.y * scale - 10,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                      border: '2px solid rgba(255, 255, 255, 0.8)',
                      pointerEvents: 'none',
                      zIndex: 20,
                    }}
                  />
                ))}
              </AnimatePresence>
              
              {/* Recording Indicator */}
              {isRecording && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    backgroundColor: 'rgba(255, 0, 0, 0.8)',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    zIndex: 10,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      animation: 'blink 1s infinite',
                    }}
                  />
                  REC
                </Box>
              )}
            </motion.div>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {device.name} • {currentWidth}×{currentHeight} • {orientation}
              </Typography>
            </Box>
          </Paper>
        </Box>
        
        {/* Debug Panel */}
        {debugMode && (
          <Card sx={{ width: 300 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Debug Information
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Device Info
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Platform: {device.platform}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Pixel Ratio: {device.pixelRatio}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                User Agent: {device.userAgent.substring(0, 50)}...
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Network Status
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Connection: {NETWORK_PRESETS[networkThrottling].name}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Latency: {NETWORK_PRESETS[networkThrottling].latency}ms
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Download: {NETWORK_PRESETS[networkThrottling].downloadThroughput}kb/s
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Touch Events ({touchEvents.length})
              </Typography>
              {touchEvents.slice(-3).map((touch) => (
                <Typography key={touch.id} variant="body2" sx={{ mb: 0.5 }}>
                  {touch.type}: ({Math.round(touch.x)}, {Math.round(touch.y)})
                </Typography>
              ))}
              
              {isConnected && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Alert severity="success" size="small">
                    Connected to mobile app
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
      
      {/* Recording Options Dialog */}
      <Dialog
        open={showRecordingDialog}
        onClose={() => setShowRecordingDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Recording Options</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Format</InputLabel>
                <Select
                  value={recordingOptions.format}
                  onChange={(e) => setRecordingOptions(prev => ({
                    ...prev,
                    format: e.target.value as 'webm' | 'mp4'
                  }))}
                  label="Format"
                >
                  <MenuItem value="webm">WebM</MenuItem>
                  <MenuItem value="mp4">MP4</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Quality</InputLabel>
                <Select
                  value={recordingOptions.quality}
                  onChange={(e) => setRecordingOptions(prev => ({
                    ...prev,
                    quality: e.target.value as 'low' | 'medium' | 'high'
                  }))}
                  label="Quality"
                >
                  <MenuItem value="low">Low (2 Mbps)</MenuItem>
                  <MenuItem value="medium">Medium (4 Mbps)</MenuItem>
                  <MenuItem value="high">High (8 Mbps)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Frame Rate (FPS)"
                type="number"
                value={recordingOptions.fps}
                onChange={(e) => setRecordingOptions(prev => ({
                  ...prev,
                  fps: parseInt(e.target.value) || 30
                }))}
                inputProps={{ min: 15, max: 60 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={recordingOptions.includeAudio}
                    onChange={(e) => setRecordingOptions(prev => ({
                      ...prev,
                      includeAudio: e.target.checked
                    }))}
                  />
                }
                label="Include Audio"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRecordingDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowRecordingDialog(false);
              startRecording();
            }}
          >
            Start Recording
          </Button>
        </DialogActions>
      </Dialog>

      {/* Gesture Testing Panel */}
      <Dialog
        open={showGesturePanel}
        onClose={() => setShowGesturePanel(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Gesture Testing</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Test various touch gestures and interactions on the mobile simulator
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Basic Gestures
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        // Simulate tap gesture
                        const gesture: GestureEvent = {
                          id: Date.now().toString(),
                          type: 'tap',
                          startX: currentWidth / 2,
                          startY: currentHeight / 2,
                          duration: 100,
                          timestamp: Date.now(),
                        };
                        setGestureEvents(prev => [...prev.slice(-9), gesture]);
                      }}
                    >
                      Simulate Tap
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        // Simulate double tap
                        const gesture: GestureEvent = {
                          id: Date.now().toString(),
                          type: 'double-tap',
                          startX: currentWidth / 2,
                          startY: currentHeight / 2,
                          duration: 200,
                          timestamp: Date.now(),
                        };
                        setGestureEvents(prev => [...prev.slice(-9), gesture]);
                      }}
                    >
                      Simulate Double Tap
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        // Simulate long press
                        const gesture: GestureEvent = {
                          id: Date.now().toString(),
                          type: 'long-press',
                          startX: currentWidth / 2,
                          startY: currentHeight / 2,
                          duration: 1000,
                          timestamp: Date.now(),
                        };
                        setGestureEvents(prev => [...prev.slice(-9), gesture]);
                      }}
                    >
                      Simulate Long Press
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Complex Gestures
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        // Simulate swipe
                        const gesture: GestureEvent = {
                          id: Date.now().toString(),
                          type: 'swipe',
                          startX: currentWidth * 0.2,
                          startY: currentHeight / 2,
                          endX: currentWidth * 0.8,
                          endY: currentHeight / 2,
                          duration: 300,
                          velocity: 500,
                          timestamp: Date.now(),
                        };
                        setGestureEvents(prev => [...prev.slice(-9), gesture]);
                      }}
                    >
                      Simulate Swipe
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        // Simulate pinch
                        const gesture: GestureEvent = {
                          id: Date.now().toString(),
                          type: 'pinch',
                          startX: currentWidth / 2,
                          startY: currentHeight / 2,
                          duration: 500,
                          scale: 0.5,
                          timestamp: Date.now(),
                        };
                        setGestureEvents(prev => [...prev.slice(-9), gesture]);
                      }}
                    >
                      Simulate Pinch
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        // Simulate rotate
                        const gesture: GestureEvent = {
                          id: Date.now().toString(),
                          type: 'rotate',
                          startX: currentWidth / 2,
                          startY: currentHeight / 2,
                          duration: 800,
                          rotation: 45,
                          timestamp: Date.now(),
                        };
                        setGestureEvents(prev => [...prev.slice(-9), gesture]);
                      }}
                    >
                      Simulate Rotate
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Gestures ({gestureEvents.length})
                  </Typography>
                  <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {gestureEvents.slice(-5).map((gesture) => (
                      <Box
                        key={gesture.id}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 1,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Box>
                          <Typography variant="body2">
                            {gesture.type.toUpperCase()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({Math.round(gesture.startX)}, {Math.round(gesture.startY)})
                            {gesture.endX && ` → (${Math.round(gesture.endX)}, ${Math.round(gesture.endY)})`}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption">
                            {gesture.duration}ms
                          </Typography>
                          {gesture.velocity && (
                            <Typography variant="caption" display="block">
                              {Math.round(gesture.velocity)}px/s
                            </Typography>
                          )}
                          {gesture.scale && (
                            <Typography variant="caption" display="block">
                              Scale: {gesture.scale}x
                            </Typography>
                          )}
                          {gesture.rotation && (
                            <Typography variant="caption" display="block">
                              Rotate: {gesture.rotation}°
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                    {gestureEvents.length === 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        No gestures recorded yet
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGestureEvents([])}>
            Clear History
          </Button>
          <Button onClick={() => setShowGesturePanel(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <style>
        {`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}
      </style>

      {/* Recording Options Dialog */}
      <Dialog
        open={showRecordingDialog}
        onClose={() => setShowRecordingDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Recording Options</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Format</InputLabel>
                <Select
                  value={recordingOptions.format}
                  onChange={(e) => setRecordingOptions(prev => ({
                    ...prev,
                    format: e.target.value as 'webm' | 'mp4'
                  }))}
                  label="Format"
                >
                  <MenuItem value="webm">WebM</MenuItem>
                  <MenuItem value="mp4">MP4</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Quality</InputLabel>
                <Select
                  value={recordingOptions.quality}
                  onChange={(e) => setRecordingOptions(prev => ({
                    ...prev,
                    quality: e.target.value as 'low' | 'medium' | 'high'
                  }))}
                  label="Quality"
                >
                  <MenuItem value="low">Low (2 Mbps)</MenuItem>
                  <MenuItem value="medium">Medium (4 Mbps)</MenuItem>
                  <MenuItem value="high">High (8 Mbps)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Frame Rate (FPS)"
                type="number"
                value={recordingOptions.fps}
                onChange={(e) => setRecordingOptions(prev => ({
                  ...prev,
                  fps: parseInt(e.target.value) || 30
                }))}
                inputProps={{ min: 15, max: 60 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={recordingOptions.includeAudio}
                    onChange={(e) => setRecordingOptions(prev => ({
                      ...prev,
                      includeAudio: e.target.checked
                    }))}
                  />
                }
                label="Include Audio"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRecordingDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowRecordingDialog(false);
              startRecording();
            }}
          >
            Start Recording
          </Button>
        </DialogActions>
      </Dialog>

      {/* Gesture Testing Panel */}
      <Dialog
        open={showGesturePanel}
        onClose={() => setShowGesturePanel(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Gesture Testing</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Test various touch gestures and interactions on the mobile simulator
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Basic Gestures
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        // Simulate tap gesture
                        const gesture: GestureEvent = {
                          id: Date.now().toString(),
                          type: 'tap',
                          startX: currentWidth / 2,
                          startY: currentHeight / 2,
                          duration: 100,
                          timestamp: Date.now(),
                        };
                        setGestureEvents(prev => [...prev.slice(-9), gesture]);
                      }}
                    >
                      Simulate Tap
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        // Simulate double tap
                        const gesture: GestureEvent = {
                          id: Date.now().toString(),
                          type: 'double-tap',
                          startX: currentWidth / 2,
                          startY: currentHeight / 2,
                          duration: 200,
                          timestamp: Date.now(),
                        };
                        setGestureEvents(prev => [...prev.slice(-9), gesture]);
                      }}
                    >
                      Simulate Double Tap
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        // Simulate long press
                        const gesture: GestureEvent = {
                          id: Date.now().toString(),
                          type: 'long-press',
                          startX: currentWidth / 2,
                          startY: currentHeight / 2,
                          duration: 1000,
                          timestamp: Date.now(),
                        };
                        setGestureEvents(prev => [...prev.slice(-9), gesture]);
                      }}
                    >
                      Simulate Long Press
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Complex Gestures
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        // Simulate swipe
                        const gesture: GestureEvent = {
                          id: Date.now().toString(),
                          type: 'swipe',
                          startX: currentWidth * 0.2,
                          startY: currentHeight / 2,
                          endX: currentWidth * 0.8,
                          endY: currentHeight / 2,
                          duration: 300,
                          velocity: 500,
                          timestamp: Date.now(),
                        };
                        setGestureEvents(prev => [...prev.slice(-9), gesture]);
                      }}
                    >
                      Simulate Swipe
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        // Simulate pinch
                        const gesture: GestureEvent = {
                          id: Date.now().toString(),
                          type: 'pinch',
                          startX: currentWidth / 2,
                          startY: currentHeight / 2,
                          duration: 500,
                          scale: 0.5,
                          timestamp: Date.now(),
                        };
                        setGestureEvents(prev => [...prev.slice(-9), gesture]);
                      }}
                    >
                      Simulate Pinch
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        // Simulate rotate
                        const gesture: GestureEvent = {
                          id: Date.now().toString(),
                          type: 'rotate',
                          startX: currentWidth / 2,
                          startY: currentHeight / 2,
                          duration: 800,
                          rotation: 45,
                          timestamp: Date.now(),
                        };
                        setGestureEvents(prev => [...prev.slice(-9), gesture]);
                      }}
                    >
                      Simulate Rotate
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Gestures ({gestureEvents.length})
                  </Typography>
                  <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {gestureEvents.slice(-5).map((gesture) => (
                      <Box
                        key={gesture.id}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 1,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Box>
                          <Typography variant="body2">
                            {gesture.type.toUpperCase()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({Math.round(gesture.startX)}, {Math.round(gesture.startY)})
                            {gesture.endX && ` → (${Math.round(gesture.endX)}, ${Math.round(gesture.endY)})`}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption">
                            {gesture.duration}ms
                          </Typography>
                          {gesture.velocity && (
                            <Typography variant="caption" display="block">
                              {Math.round(gesture.velocity)}px/s
                            </Typography>
                          )}
                          {gesture.scale && (
                            <Typography variant="caption" display="block">
                              Scale: {gesture.scale}x
                            </Typography>
                          )}
                          {gesture.rotation && (
                            <Typography variant="caption" display="block">
                              Rotate: {gesture.rotation}°
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                    {gestureEvents.length === 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        No gestures recorded yet
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGestureEvents([])}>
            Clear History
          </Button>
          <Button onClick={() => setShowGesturePanel(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <style>
        {`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}
      </style>
    </Box>
  );
}