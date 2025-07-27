import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Switch,
  Slider,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  LinearProgress,
  CircularProgress,
  Fab,
  IconButton,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Person,
  Settings,
  Notifications,
  Favorite,
  Share,
  MoreVert,
  Add,
  Phone,
  Message,
  VideoCall,
  Mic,
  MicOff,
  VolumeUp,
  VolumeOff,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface ComponentPreview {
  name: string;
  category: string;
  component: React.ReactNode;
  code: string;
}

export function MobileComponentLibrary() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mobile UI Components Recreation
  const mobileComponents: ComponentPreview[] = [
    {
      name: 'Player Card',
      category: 'game',
      component: (
        <Card sx={{ maxWidth: 200, m: 1 }}>
          <CardContent sx={{ textAlign: 'center', pb: 1 }}>
            <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 1 }}>
              <Person />
            </Avatar>
            <Typography variant="h6" noWrap>
              Player Name
            </Typography>
            <Chip 
              label="Villager" 
              size="small" 
              color="primary" 
              sx={{ mt: 1 }}
            />
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 0.5 }}>
              <IconButton size="small" color="error">
                <Favorite fontSize="small" />
              </IconButton>
              <IconButton size="small">
                <Message fontSize="small" />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      ),
      code: `<Card sx={{ maxWidth: 200 }}>
  <CardContent sx={{ textAlign: 'center' }}>
    <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 1 }}>
      <Person />
    </Avatar>
    <Typography variant="h6">Player Name</Typography>
    <Chip label="Villager" size="small" color="primary" />
  </CardContent>
</Card>`
    },
    {
      name: 'Voting Interface',
      category: 'game',
      component: (
        <Paper sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="h6" gutterBottom>
            Vote to Eliminate
          </Typography>
          <List dense>
            {['Alice', 'Bob', 'Charlie'].map((name, index) => (
              <ListItem key={name} button>
                <ListItemAvatar>
                  <Avatar>
                    <Person />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={name} />
                <Button size="small" variant="outlined" color="error">
                  Vote
                </Button>
              </ListItem>
            ))}
          </List>
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button variant="contained" fullWidth>
              Confirm Vote
            </Button>
            <Button variant="outlined" fullWidth>
              Skip
            </Button>
          </Box>
        </Paper>
      ),
      code: `<Paper sx={{ p: 2 }}>
  <Typography variant="h6">Vote to Eliminate</Typography>
  <List>
    {players.map(player => (
      <ListItem key={player.id} button>
        <ListItemAvatar>
          <Avatar><Person /></Avatar>
        </ListItemAvatar>
        <ListItemText primary={player.name} />
        <Button size="small" variant="outlined" color="error">
          Vote
        </Button>
      </ListItem>
    ))}
  </List>
</Paper>`
    },
    {
      name: 'Game Phase Indicator',
      category: 'game',
      component: (
        <Paper sx={{ p: 2, textAlign: 'center', maxWidth: 250 }}>
          <Typography variant="h5" color="primary" gutterBottom>
            Day Phase
          </Typography>
          <CircularProgress 
            variant="determinate" 
            value={65} 
            size={80}
            sx={{ mb: 2 }}
          />
          <Typography variant="body1">
            Time Remaining: 2:15
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            Discuss and vote to eliminate a player
          </Alert>
        </Paper>
      ),
      code: `<Paper sx={{ p: 2, textAlign: 'center' }}>
  <Typography variant="h5" color="primary">
    Day Phase
  </Typography>
  <CircularProgress variant="determinate" value={65} size={80} />
  <Typography>Time Remaining: 2:15</Typography>
  <Alert severity="info">
    Discuss and vote to eliminate a player
  </Alert>
</Paper>`
    },
    {
      name: 'Voice Chat Controls',
      category: 'communication',
      component: (
        <Paper sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="h6" gutterBottom>
            Voice Chat
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'success.main' }}>
              <Person />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2">You</Typography>
              <LinearProgress 
                variant="determinate" 
                value={40} 
                sx={{ height: 4, borderRadius: 2 }}
              />
            </Box>
            <Badge badgeContent="🔊" color="primary">
              <IconButton color="primary">
                <Mic />
              </IconButton>
            </Badge>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
            <Fab size="small" color="primary">
              <Mic />
            </Fab>
            <Fab size="small" color="secondary">
              <VolumeUp />
            </Fab>
            <Fab size="small" color="error">
              <Phone />
            </Fab>
          </Box>
        </Paper>
      ),
      code: `<Paper sx={{ p: 2 }}>
  <Typography variant="h6">Voice Chat</Typography>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    <Avatar sx={{ bgcolor: 'success.main' }}>
      <Person />
    </Avatar>
    <Box sx={{ flex: 1 }}>
      <Typography variant="body2">You</Typography>
      <LinearProgress variant="determinate" value={40} />
    </Box>
  </Box>
  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
    <Fab size="small" color="primary"><Mic /></Fab>
    <Fab size="small" color="secondary"><VolumeUp /></Fab>
  </Box>
</Paper>`
    },
    {
      name: 'Chat Interface',
      category: 'communication',
      component: (
        <Paper sx={{ p: 2, maxWidth: 300, height: 200 }}>
          <Typography variant="h6" gutterBottom>
            Game Chat
          </Typography>
          <Box sx={{ height: 120, overflow: 'auto', mb: 1 }}>
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Alice: I think Bob is suspicious
              </Typography>
            </Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Bob: That's not true!
              </Typography>
            </Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="primary">
                System: Day phase has begun
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField 
              size="small" 
              placeholder="Type message..." 
              fullWidth
            />
            <Button variant="contained" size="small">
              Send
            </Button>
          </Box>
        </Paper>
      ),
      code: `<Paper sx={{ p: 2, height: 200 }}>
  <Typography variant="h6">Game Chat</Typography>
  <Box sx={{ height: 120, overflow: 'auto' }}>
    {messages.map(msg => (
      <Typography key={msg.id} variant="caption">
        {msg.author}: {msg.content}
      </Typography>
    ))}
  </Box>
  <Box sx={{ display: 'flex', gap: 1 }}>
    <TextField size="small" placeholder="Type message..." fullWidth />
    <Button variant="contained" size="small">Send</Button>
  </Box>
</Paper>`
    },
    {
      name: 'Room Lobby',
      category: 'navigation',
      component: (
        <Paper sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="h6" gutterBottom>
            Game Room: ABC123
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Waiting for players... (3/8)
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={37.5} 
            sx={{ mb: 2 }}
          />
          <List dense>
            {['Alice (Host)', 'Bob', 'Charlie'].map((name, index) => (
              <ListItem key={name}>
                <ListItemAvatar>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    <Person />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={name}
                  secondary={index === 0 ? "Ready" : "Not Ready"}
                />
                <Chip 
                  label={index === 0 ? "Ready" : "Waiting"} 
                  size="small"
                  color={index === 0 ? "success" : "default"}
                />
              </ListItem>
            ))}
          </List>
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button variant="contained" fullWidth disabled>
              Start Game
            </Button>
            <Button variant="outlined">
              Leave
            </Button>
          </Box>
        </Paper>
      ),
      code: `<Paper sx={{ p: 2 }}>
  <Typography variant="h6">Game Room: {roomCode}</Typography>
  <Typography variant="body2" color="text.secondary">
    Waiting for players... ({currentPlayers}/{maxPlayers})
  </Typography>
  <LinearProgress variant="determinate" value={progress} />
  <List>
    {players.map(player => (
      <ListItem key={player.id}>
        <ListItemAvatar>
          <Avatar><Person /></Avatar>
        </ListItemAvatar>
        <ListItemText primary={player.name} secondary={player.status} />
        <Chip label={player.ready ? "Ready" : "Waiting"} />
      </ListItem>
    ))}
  </List>
</Paper>`
    },
    {
      name: 'Main Menu',
      category: 'navigation',
      component: (
        <Paper sx={{ p: 3, maxWidth: 250, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Mafia Game
          </Typography>
          <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}>
            <Person />
          </Avatar>
          <Typography variant="h6" gutterBottom>
            Welcome, Player!
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 3 }}>
            <Button variant="contained" fullWidth>
              Quick Match
            </Button>
            <Button variant="outlined" fullWidth>
              Create Room
            </Button>
            <Button variant="outlined" fullWidth>
              Join Room
            </Button>
            <Button variant="text" fullWidth>
              Friends
            </Button>
          </Box>
        </Paper>
      ),
      code: `<Paper sx={{ p: 3, textAlign: 'center' }}>
  <Typography variant="h4">Mafia Game</Typography>
  <Avatar sx={{ width: 80, height: 80, mx: 'auto' }}>
    <Person />
  </Avatar>
  <Typography variant="h6">Welcome, {playerName}!</Typography>
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
    <Button variant="contained" fullWidth>Quick Match</Button>
    <Button variant="outlined" fullWidth>Create Room</Button>
    <Button variant="outlined" fullWidth>Join Room</Button>
    <Button variant="text" fullWidth>Friends</Button>
  </Box>
</Paper>`
    },
    {
      name: 'Settings Panel',
      category: 'navigation',
      component: (
        <Paper sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="h6" gutterBottom>
            Game Settings
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Sound Effects
            </Typography>
            <Switch defaultChecked />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Voice Chat
            </Typography>
            <Switch defaultChecked />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Volume: 75%
            </Typography>
            <Slider defaultValue={75} />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Notifications
            </Typography>
            <Switch defaultChecked />
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" fullWidth>
              Save
            </Button>
            <Button variant="outlined" fullWidth>
              Reset
            </Button>
          </Box>
        </Paper>
      ),
      code: `<Paper sx={{ p: 2 }}>
  <Typography variant="h6">Game Settings</Typography>
  <Box sx={{ mb: 2 }}>
    <Typography variant="body2">Sound Effects</Typography>
    <Switch checked={soundEnabled} onChange={handleSoundToggle} />
  </Box>
  <Box sx={{ mb: 2 }}>
    <Typography variant="body2">Volume: {volume}%</Typography>
    <Slider value={volume} onChange={handleVolumeChange} />
  </Box>
  <Box sx={{ display: 'flex', gap: 1 }}>
    <Button variant="contained" fullWidth>Save</Button>
    <Button variant="outlined" fullWidth>Reset</Button>
  </Box>
</Paper>`
    }
  ];

  const categories = ['all', 'game', 'communication', 'navigation'];

  const filteredComponents = mobileComponents.filter(component => {
    const matchesCategory = selectedCategory === 'all' || component.category === selectedCategory;
    const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Mobile UI Component Library
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Recreation of mobile app components for testing and development
      </Typography>

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search components..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          {categories.map((category) => (
            <Chip
              key={category}
              label={category.charAt(0).toUpperCase() + category.slice(1)}
              onClick={() => setSelectedCategory(category)}
              color={selectedCategory === category ? 'primary' : 'default'}
              variant={selectedCategory === category ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Box>

      {/* Component Grid */}
      <Grid container spacing={3}>
        {filteredComponents.map((component, index) => (
          <Grid item xs={12} md={6} lg={4} key={component.name}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      {component.name}
                    </Typography>
                    <Chip 
                      label={component.category} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </Box>
                  
                  {/* Component Preview */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    minHeight: 200,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    mb: 2,
                    p: 1
                  }}>
                    {component.component}
                  </Box>
                  
                  {/* Code Preview */}
                  <Box sx={{ 
                    bgcolor: 'grey.900', 
                    color: 'grey.100',
                    p: 1,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    overflow: 'auto',
                    maxHeight: 150
                  }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {component.code}
                    </pre>
                  </Box>
                  
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" fullWidth>
                      Copy Code
                    </Button>
                    <Button size="small" variant="contained" fullWidth>
                      Use in Simulator
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {filteredComponents.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No components found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search or category filter
          </Typography>
        </Box>
      )}
    </Box>
  );
}