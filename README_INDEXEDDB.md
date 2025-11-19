# IndexedDB Implementation Guide

## Overview

The School Management System now uses IndexedDB for storing large datasets locally, enabling robust offline functionality with comprehensive data access.

## Architecture

### Database Structure

**Database Name:** `SchoolManagementDB`  
**Version:** 1

#### Object Stores

1. **learners** - Student records
   - Primary Key: `id`
   - Indexes: `admission_number`, `current_grade_id`, `status`

2. **grades** - Grade information
   - Primary Key: `id`
   - Indexes: `grade_level`

3. **streams** - Stream data
   - Primary Key: `id`
   - Indexes: `grade_id`

4. **fee_payments** - Payment records
   - Primary Key: `id`
   - Indexes: `learner_id`, `payment_date`

5. **fee_balances** - Balance information
   - Primary Key: `id`
   - Indexes: `learner_id`, `academic_year`

6. **teachers** - Teacher records
   - Primary Key: `id`
   - Indexes: `email`

7. **performance_records** - Academic performance
   - Primary Key: `id`
   - Indexes: `learner_id`, `academic_year`

8. **alumni** - Alumni records
   - Primary Key: `id`
   - Indexes: `learner_id`, `graduation_year`

9. **sync_queue** - Pending sync operations
   - Primary Key: `id` (auto-increment)
   - Indexes: `timestamp`, `synced`

## Features

### 1. Automatic Syncing

Data automatically syncs from Supabase to IndexedDB when:
- User comes online after being offline
- Manual sync triggered from Offline Storage page
- App initializes with internet connection

```typescript
// Example: Trigger manual sync
import { useOfflineStorage } from "@/hooks/useOfflineStorage";

const { syncAllData } = useOfflineStorage();
await syncAllData();
```

### 2. Smart Caching Strategy

**What Gets Cached:**
- All active learners
- All grades and streams
- Fee payments from last 6 months
- Current fee balances
- All teachers
- Performance records from current academic year
- All alumni records

**What Doesn't Get Cached:**
- Very old payment records (>6 months)
- Historical performance data (>1 year)
- Archived/inactive records

### 3. Storage Management

**Monitor Storage Usage:**
```typescript
import { useOfflineStorage } from "@/hooks/useOfflineStorage";

const { syncStatus, updateStorageUsage } = useOfflineStorage();

console.log(syncStatus.storageUsage);
// { usage: 15728640, quota: 2147483648, percentage: 0.73 }
```

**Clear Cached Data:**
```typescript
const { clearAllData } = useOfflineStorage();
await clearAllData();
```

### 4. Offline Queue

Changes made while offline are queued and automatically synced:

```typescript
import { useOfflineQueue } from "@/hooks/useIndexedDB";

const { addToQueue, processQueue } = useOfflineQueue();

// Add operation to queue
await addToQueue({
  type: 'update',
  storeName: 'learners',
  data: { id: '123', first_name: 'John' }
});

// Process queue when online
await processQueue();
```

## Usage Examples

### Basic CRUD Operations

```typescript
import { useIndexedDB } from "@/hooks/useIndexedDB";
import { STORES } from "@/utils/indexedDB";

function MyComponent() {
  const {
    data: learners,
    loading,
    addItem,
    updateItem,
    deleteItem,
  } = useIndexedDB(STORES.LEARNERS);

  // Add new learner
  const handleAdd = async (learner) => {
    await addItem(learner);
  };

  // Update learner
  const handleUpdate = async (learner) => {
    await updateItem(learner);
  };

  // Delete learner
  const handleDelete = async (learnerId) => {
    await deleteItem(learnerId);
  };

  return <div>...</div>;
}
```

### Query by Index

```typescript
import { useIndexedDB } from "@/hooks/useIndexedDB";

const { getByIndex } = useIndexedDB(STORES.LEARNERS);

// Get all learners in a specific grade
const gradeLearners = await getByIndex('current_grade_id', gradeId);

// Get learners by status
const activeLearners = await getByIndex('status', 'active');
```

### Sync with Server

```typescript
import { useIndexedDB } from "@/hooks/useIndexedDB";
import { supabase } from "@/integrations/supabase/client";

const { syncWithServer } = useIndexedDB(STORES.LEARNERS);

// Define fetch function
const fetchLearners = async () => {
  const { data } = await supabase
    .from("learners")
    .select("*")
    .eq("status", "active");
  return data || [];
};

// Sync
await syncWithServer(fetchLearners);
```

## UI Components

### Offline Storage Manager

Full-featured UI for managing offline storage:

```typescript
import { OfflineStorageManager } from "@/components/OfflineStorageManager";

<OfflineStorageManager />
```

**Features:**
- Shows online/offline status
- Displays storage usage with progress bar
- Lists cached record counts
- Manual sync button
- Clear cache button
- Last sync timestamp

### Offline Indicator

Automatic connection status indicator:

```typescript
import { OfflineIndicator } from "@/components/OfflineIndicator";

<OfflineIndicator />
```

Shows:
- "You're offline" when disconnected
- "You're back online!" when reconnected (auto-hides after 3s)

## Performance Optimization

### Batch Operations

Use bulk operations for better performance:

```typescript
import { dbManager, STORES } from "@/utils/indexedDB";

// Bulk insert/update
await dbManager.bulkPut(STORES.LEARNERS, learnersArray);
```

### Indexed Queries

Always use indexes for filtering:

```typescript
// ✅ Good - uses index
const results = await getByIndex('learner_id', learnerId);

// ❌ Bad - scans all records
const all = await getAll();
const filtered = all.filter(r => r.learner_id === learnerId);
```

### Pagination

For large datasets, implement pagination:

```typescript
import { dbManager } from "@/utils/indexedDB";

async function getPaginatedRecords(storeName, page, pageSize) {
  const db = await dbManager.init();
  const transaction = db.transaction(storeName, 'readonly');
  const store = transaction.objectStore(storeName);
  
  const results = [];
  let cursor = await store.openCursor();
  let skip = page * pageSize;
  let count = 0;
  
  while (cursor && count < pageSize) {
    if (skip > 0) {
      cursor.advance(skip);
      skip = 0;
    } else {
      results.push(cursor.value);
      count++;
      cursor = await cursor.continue();
    }
  }
  
  return results;
}
```

## Best Practices

### 1. Error Handling

Always handle IndexedDB errors:

```typescript
try {
  await dbManager.add(STORES.LEARNERS, learner);
} catch (error) {
  console.error('Failed to save locally:', error);
  // Fallback to API call or show error
}
```

### 2. Data Validation

Validate data before storing:

```typescript
const isValidLearner = (learner) => {
  return learner.id && 
         learner.first_name && 
         learner.last_name &&
         learner.admission_number;
};

if (isValidLearner(learner)) {
  await dbManager.add(STORES.LEARNERS, learner);
}
```

### 3. Cache Invalidation

Clear stale data periodically:

```typescript
// Clear cache older than 7 days
const clearOldCache = async () => {
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const payments = await dbManager.getAll(STORES.FEE_PAYMENTS);
  
  for (const payment of payments) {
    if (new Date(payment.payment_date).getTime() < weekAgo) {
      await dbManager.delete(STORES.FEE_PAYMENTS, payment.id);
    }
  }
};
```

### 4. Sync Conflict Resolution

Handle conflicts when syncing:

```typescript
const syncWithConflictResolution = async (localData, serverData) => {
  // Server wins by default
  if (serverData.updated_at > localData.updated_at) {
    return serverData;
  }
  
  // Ask user or implement custom logic
  return localData;
};
```

## Limitations

1. **Storage Quota**
   - Varies by browser and device
   - Typically 50% of available disk space
   - Minimum ~100MB

2. **No Cross-Tab Sync**
   - Changes in one tab don't automatically reflect in others
   - Use BroadcastChannel API for cross-tab communication

3. **No Full-Text Search**
   - IndexedDB doesn't support full-text search
   - Implement search in application layer

4. **Single-Origin**
   - Data only accessible from same origin (protocol + domain + port)

## Troubleshooting

### Database Won't Open

```typescript
// Clear and recreate database
const clearDB = async () => {
  const dbs = await window.indexedDB.databases();
  dbs.forEach(db => window.indexedDB.deleteDatabase(db.name));
};
```

### Quota Exceeded

```typescript
// Check storage usage
const estimate = await navigator.storage.estimate();
console.log(`Using ${estimate.usage} of ${estimate.quota} bytes`);

// Request persistent storage
await navigator.storage.persist();
```

### Corrupted Data

```typescript
// Validate and repair
const validateStore = async (storeName) => {
  const records = await dbManager.getAll(storeName);
  const valid = records.filter(r => r.id && r.created_at);
  
  await dbManager.clear(storeName);
  await dbManager.bulkPut(storeName, valid);
};
```

## Browser Compatibility

- ✅ Chrome 24+
- ✅ Firefox 16+
- ✅ Safari 10+
- ✅ Edge 12+
- ✅ Mobile browsers (iOS Safari 10+, Chrome Android)

## Migration Guide

### From Service Worker Cache to IndexedDB

```typescript
// Old: Service Worker cache
cache.match(request);

// New: IndexedDB
dbManager.get(STORES.LEARNERS, learnerId);
```

### From localStorage to IndexedDB

```typescript
// Old: localStorage
const data = JSON.parse(localStorage.getItem('learners'));

// New: IndexedDB
const data = await dbManager.getAll(STORES.LEARNERS);
```

## Future Enhancements

- [ ] Automatic conflict resolution strategies
- [ ] Compression for large datasets
- [ ] Export/import functionality
- [ ] Advanced query builder
- [ ] Real-time sync with WebSocket
- [ ] Multi-device sync
