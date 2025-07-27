# Mobile Mafia Game - Admin Portal

A modern React TypeScript admin portal for managing the Mobile Mafia Game backend system.

## Features

- **Modern Tech Stack**: Built with React 19, TypeScript, Vite, and Material-UI
- **Authentication**: JWT-based authentication with refresh token support
- **Real-time Data**: React Query for efficient data fetching and caching
- **Responsive Design**: Mobile-first responsive design with Material-UI
- **Animations**: Smooth animations with Framer Motion
- **Form Management**: React Hook Form with Yup validation
- **Code Quality**: ESLint, Prettier, and TypeScript for code quality

## Tech Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **UI Framework**: Material-UI (MUI)
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Yup validation
- **Routing**: React Router v7
- **HTTP Client**: Axios with interceptors
- **Animations**: Framer Motion
- **Code Quality**: ESLint, Prettier

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update the `.env` file with your backend API URL:
```env
VITE_API_BASE_URL=http://localhost:4000/api
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building

Build for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Common components
│   ├── forms/          # Form components
│   ├── layout/         # Layout components
│   └── charts/         # Chart components
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── router/             # Routing configuration
├── services/           # API services and utilities
├── theme/              # Material-UI theme configuration
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Features Overview

### Authentication
- JWT-based authentication
- Automatic token refresh
- Protected routes
- Role-based access control

### Database Management
- View and manage database collections
- CRUD operations on documents
- Real-time data updates
- Advanced filtering and search

### Analytics Dashboard
- Real-time metrics and KPIs
- Interactive charts and graphs
- User engagement analytics
- System performance monitoring

### System Monitoring
- Server health monitoring
- Real-time logs viewing
- Performance metrics
- Alert management

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Implement proper error boundaries
- Write meaningful component and function names

### State Management
- Use React Query for server state
- Use React state for local component state
- Implement proper loading and error states
- Cache data appropriately

### Styling
- Use Material-UI components and theme
- Follow responsive design principles
- Implement consistent spacing and typography
- Use proper color contrast for accessibility

## Contributing

1. Follow the existing code style and patterns
2. Write TypeScript types for all new code
3. Add proper error handling
4. Test your changes thoroughly
5. Run linting and type checking before committing

## License

This project is part of the Mobile Mafia Game system.