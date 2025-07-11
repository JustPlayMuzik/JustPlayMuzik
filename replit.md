# JustPlay - Nigerian Music Discovery Platform

## Overview

JustPlay is a modern, mobile-friendly Nigerian music website that allows users to stream, browse, and download songs. The application is built as a fully client-side static website with no backend requirements, focusing on Nigerian music discovery and streaming.

## User Preferences

Preferred communication style: Simple, everyday language.
- Removed Playlists feature (not wanted)
- Removed Followers feature (not wanted)
- Focus on core music streaming functionality
- User-friendly error messages (no technical details for end users)

## System Architecture

### Frontend Architecture
- **Pure HTML/CSS/JavaScript**: No frameworks used, keeping the application lightweight and fast
- **Modular JavaScript**: Code is organized into separate modules for maintainability
- **Responsive Design**: Mobile-first approach with modern CSS Grid and Flexbox
- **Progressive Web App Ready**: Structured to support PWA features

### Core Technologies
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Custom properties, animations, and modern layouts
- **Vanilla JavaScript**: ES6+ modules with modern browser APIs
- **Web Audio API**: For audio playback and potential visualizations

## Key Components

### 1. Application Core (`js/app.js`)
- Main application orchestrator
- Handles navigation between sections
- Manages global state and user interactions
- Integrates all other modules

### 2. Audio Player (`js/audio-player.js`)
- Manages audio playback using HTML5 Audio API
- Handles playlist management and track progression
- Supports play, pause, volume control, and repeat modes
- Integrates with Supabase for secure audio streaming

### 3. Search System (`js/search.js`)
- Real-time search functionality
- Cached search results for performance
- Search suggestions and autocomplete
- Filters by title, artist, album, and genre

### 4. Local Storage (`js/storage.js`)
- Manages user preferences and favorites
- Playlist creation and management
- Play history tracking
- Download management

### 5. Music Data (`js/data.js`)
- Contains sample Nigerian music data
- Includes metadata like genres, moods, and artist information
- Provides utility functions for data manipulation

## Data Flow

### Music Streaming Process
1. User selects a song to play
2. Application requests signed URL from Supabase for the audio file
3. Signed URL is assigned to HTML5 Audio element
4. Audio streams securely without exposing direct file links
5. Play statistics are tracked locally

### Search and Discovery
1. User enters search query
2. Search module processes query against local data
3. Results are cached for performance
4. UI updates with filtered results
5. Search history is stored locally

### Favorites and Playlists
1. User actions (like, playlist creation) are captured
2. Data is stored in localStorage
3. UI reflects user's personal collections
4. Data persists across browser sessions

## External Dependencies

### Supabase Integration
- **Storage Service**: Hosts audio files in private buckets
- **Signed URLs**: Provides temporary, secure access to audio files
- **Image Storage**: Public bucket for album artwork and artist images
- **Configuration**: Uses public Supabase client for frontend-only access

### CDN Resources
- **Font Awesome**: Icons for UI elements
- **Supabase JavaScript Client**: Official client library
- **Google Fonts**: Typography (Inter font family)

### Media Storage Strategy
- **Audio Files**: Stored in private Supabase bucket 'songs'
- **Images**: Stored in public Supabase bucket 'images'
- **Placeholder Images**: Unsplash URLs for development/demo purposes

## Deployment Strategy

### Static Site Deployment
- **GitHub Pages**: Primary deployment target
- **No Build Process**: Pure static files, no compilation needed
- **Mobile-Optimized**: Responsive design works across all devices
- **Fast Loading**: Optimized assets and minimal dependencies

### Performance Considerations
- **Lazy Loading**: Images and audio loaded on demand
- **Caching**: Search results and user data cached locally
- **Signed URL Management**: Audio URLs cached temporarily to reduce API calls
- **Modular Loading**: JavaScript modules loaded as needed

### Security Features
- **Content Security Policy**: Implemented via meta tags
- **XSS Protection**: Browser-level security headers
- **Secure Audio Streaming**: No direct file URLs exposed
- **Local Data Only**: No sensitive data transmission

## Technical Decisions

### Why Pure JavaScript?
- **Simplicity**: No framework complexity or build tools
- **Performance**: Minimal bundle size and fast loading
- **Compatibility**: Works across all modern browsers
- **Maintainability**: Easy to understand and modify

### Why Supabase?
- **Media Storage**: Reliable cloud storage for audio files
- **Security**: Signed URLs prevent unauthorized access
- **Scalability**: Can handle growing media library
- **No Backend**: Frontend-only integration possible

### Why LocalStorage?
- **Offline Capability**: User data available without internet
- **Privacy**: No user data sent to servers
- **Performance**: Instant access to user preferences
- **Simplicity**: No database or user management needed

The application prioritizes user experience with fast loading times, responsive design, and secure media streaming while maintaining a simple, maintainable codebase.