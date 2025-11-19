# Offline Mode Documentation

## Overview

The School Management System now includes offline support through Service Workers, allowing users to access cached data and continue working even without an internet connection.

## Features

### 1. **Automatic Caching**
- Static assets (CSS, JS, images) are cached automatically
- API responses from Supabase are cached for offline access
- Pages are cached as users navigate

### 2. **Offline Indicator**
- Visual indicator appears when connection is lost
- Shows when user is back online
- Auto-hides after 3 seconds when connection is restored

### 3. **Background Sync**
- Pending changes are stored locally when offline
- Automatically syncs when connection is restored
- Notifications show sync progress

### 4. **Caching Strategies**

#### Network First (API Calls)
- Tries to fetch fresh data from network
- Falls back to cache if offline
- Best for dynamic data like learner records, fees, grades

#### Cache First (Static Assets)
- Serves from cache immediately
- Updates cache in background
- Best for images, fonts, stylesheets

### 5. **Offline Page**
- Custom offline page shown when navigating while offline
- Lists available features
- Auto-redirects when connection returns

## How It Works

### Service Worker Registration
The service worker is registered in `src/main.tsx`:

```typescript
import { register as registerServiceWorker } from './utils/serviceWorkerRegistration';
registerServiceWorker();
```

### Cache Management
The service worker (`public/service-worker.js`) implements:
- Installation: Precaches essential assets
- Activation: Cleans up old caches
- Fetch: Intercepts requests and serves cached content when offline

### Storage
- Uses Cache API for HTTP responses
- Uses localStorage for pending requests
- Implements persistent storage when available

## User Experience

### When Going Offline
1. User sees "You're offline" notification
2. Can still view cached data
3. Changes are queued for sync
4. Warning shows when trying to submit data

### When Coming Back Online
1. "You're back online!" notification appears
2. Pending changes automatically sync
3. Cache is updated with fresh data
4. Full functionality restored

## Storage Limits

The browser allocates storage based on available disk space:
- Typically 50% of available disk space
- Minimum of a few hundred MBs
- Can request persistent storage to prevent eviction

## Development

### Testing Offline Mode

1. **Chrome DevTools**
   - Open DevTools (F12)
   - Go to Application > Service Workers
   - Check "Offline" checkbox

2. **Network Panel**
   - Open DevTools > Network
   - Select "Offline" from throttling dropdown

3. **Real Testing**
   - Disconnect from WiFi/network
   - Test actual offline behavior

### Clearing Cache

```javascript
// In browser console
caches.keys().then(names => {
  names.forEach(name => caches.delete(name))
})
```

### Unregistering Service Worker

```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister())
})
```

## Best Practices

1. **Always show offline status** to users
2. **Cache strategically** - not all data needs caching
3. **Limit cache size** - remove old entries periodically
4. **Provide feedback** when syncing pending changes
5. **Handle conflicts** when syncing after offline period

## Troubleshooting

### Service Worker Not Updating
- Hard refresh (Ctrl + Shift + R)
- Clear cache and service worker
- Check browser console for errors

### Cache Growing Too Large
- Implement cache expiration
- Limit number of cached responses
- Clear old caches during activation

### Data Not Syncing
- Check localStorage for pending requests
- Verify network connection
- Check browser console for sync errors

## Browser Support

- Chrome: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Edge: ✅ Full support
- Mobile browsers: ✅ Full support

## Security Considerations

1. **HTTPS Required** - Service workers only work on HTTPS
2. **Sensitive Data** - Don't cache sensitive user data unnecessarily
3. **Token Expiration** - Handle expired auth tokens gracefully
4. **Cache Poisoning** - Validate cached data before use

## Future Enhancements

- [ ] IndexedDB for larger datasets
- [ ] Advanced conflict resolution
- [ ] Selective caching preferences
- [ ] Offline analytics
- [ ] Push notifications
- [ ] Background fetch for large files
