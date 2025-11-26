# Task - Advanced Express.js API with Caching & Rate Limiting

A highly efficient Express.js API featuring advanced in-memory caching (LRU), sophisticated rate limiting, and asynchronous request processing to handle high-traffic scenarios.

## 🚀 Features

### 1. **Advanced LRU Cache**
- **Least Recently Used (LRU) eviction policy** for optimal memory management
- **60-second TTL** (Time To Live) for automatic cache expiration
- **Cache statistics tracking**: hits, misses, hit rate, evictions, and current size
- **Background cleanup task** that runs every 10 seconds to remove stale entries
- **Thread-safe operations** for concurrent request handling

### 2. **Sophisticated Rate Limiting**
- **Token Bucket algorithm** with burst traffic handling
- **Base limit**: 10 requests per minute per IP
- **Burst capacity**: 5 requests within a 10-second window
- **Per-IP tracking** with automatic cleanup of inactive clients
- **Graceful degradation** with meaningful error messages

### 3. **Asynchronous Queue Processing**
- **Request deduplication**: Multiple concurrent requests for the same resource are handled efficiently
- **Queue-based processing** with configurable concurrency limits
- **First request fetches, subsequent requests wait** and receive the same cached result
- **Non-blocking operations** for optimal throughput

### 4. **Performance Monitoring**
- **Response time tracking**: min, max, and average
- **Request counting** and cache performance metrics
- **Queue statistics**: active tasks, processing count, and queue size

## 📋 Prerequisites

- Node.js (v22 or higher)
- Yarn package manager
- TypeScript

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd assessment_task
```

2. **Install dependencies**
```bash
yarn install
```

3. **Start the development server**
```bash
yarn start:dev
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## 📚 API Endpoints

### Base URL
All endpoints are prefixed with `/v1`

### 1. Get User by ID
```http
GET /v1/users/:id
```

**Description**: Retrieve user data by ID. Data is cached for 60 seconds.

**Parameters**:
- `id` (path parameter): User ID (integer)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "timestamp": "2025-11-26T10:30:00.000Z"
}
```

**Response** (404 Not Found):
```json
{
  "success": false,
  "message": "User not found",
  "error": {
    "code": "USER_NOT_FOUND",
    "userId": 999
  },
  "timestamp": "2025-11-26T10:30:00.000Z"
}
```

**Example**:
```bash
curl http://localhost:3000/v1/users/1
```

### 2. Create User
```http
POST /v1/users
```

**Description**: Create a new user. The user is automatically added to the cache.

**Request Body**:
```json
{
  "name": "Bob Wilson",
  "email": "bob@example.com"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 4,
    "name": "Bob Wilson",
    "email": "bob@example.com",
    "createdAt": "2025-11-26T10:30:00.000Z"
  },
  "timestamp": "2025-11-26T10:30:00.000Z"
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob Wilson","email":"bob@example.com"}'
```

### 3. Clear Cache
```http
DELETE /v1/cache
```

**Description**: Manually clear the entire cache.

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Cache cleared successfully",
  "data": null,
  "timestamp": "2025-11-26T10:30:00.000Z"
}
```

**Example**:
```bash
curl -X DELETE http://localhost:3000/v1/cache
```

### 4. Get Cache Status
```http
GET /v1/cache-status
```

**Description**: Retrieve current cache statistics and performance metrics.

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Cache status retrieved successfully",
  "data": {
    "cacheSize": 3,
    "cacheHits": 45,
    "cacheMisses": 8,
    "totalRequests": 53,
    "hitRate": 84.91,
    "evictions": 0,
    "averageResponseTime": 12.34,
    "queueStats": {
      "queueSize": 0,
      "processingCount": 0,
      "activeCount": 0
    }
  },
  "timestamp": "2025-11-26T10:30:00.000Z"
}
```

**Example**:
```bash
curl http://localhost:3000/v1/cache-status
```

### Rate Limiting
All endpoints (except `/health`) are rate-limited:
- **10 requests per minute** per IP
- **5 requests burst** within 10 seconds

**Rate Limit Exceeded Response** (429):
```json
{
  "success": false,
  "message": "Rate limit exceeded. You have exceeded the maximum number of requests. Please try again later.",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "limit": "10 requests per minute with burst capacity of 5 requests per 10 seconds"
  }
}
```

## 🧪 Testing the API

### Using cURL

1. **Test cache effectiveness** (first request - cache miss):
```bash
time curl http://localhost:3000/v1/users/1
# Should take ~200ms (database simulation delay)
```

2. **Test cache hit** (subsequent request):
```bash
time curl http://localhost:3000/v1/users/1
# Should take <10ms (cached response)
```

3. **Test concurrent requests** (open multiple terminals):
```bash
# Terminal 1, 2, 3 - run simultaneously
curl http://localhost:3000/v1/users/2
```
Only one database call will be made; all requests receive the same cached result.

4. **Test rate limiting** (burst test):
```bash
for i in {1..12}; do curl http://localhost:3000/v1/users/1; done
# Last 2 requests should be rate-limited (429 status)
```

5. **Create a new user**:
```bash
curl -X POST http://localhost:3000/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com"}'
```

6. **Check cache statistics**:
```bash
curl http://localhost:3000/v1/cache-status
```

7. **Clear cache**:
```bash
curl -X DELETE http://localhost:3000/v1/cache
```

### Using Postman

1. **Import the collection** (create one with the above endpoints)
2. **Create a test suite** with the following tests:
   - Single user fetch (cache miss)
   - Single user fetch (cache hit)
   - Create user
   - Cache status check
   - Rate limiting test (use Postman Runner with 12 iterations)
   - Clear cache

3. **Measure response times** using Postman's test tab:
```javascript
pm.test("Response time is less than 200ms for cached data", function () {
    pm.expect(pm.response.responseTime).to.be.below(200);
});
```

### Load Testing

Use tools like **Apache Bench** or **Artillery** to simulate high traffic:

```bash
# Apache Bench - 1000 requests, 100 concurrent
ab -n 1000 -c 100 http://localhost:3000/v1/users/1

# Artillery
artillery quick --count 100 --num 10 http://localhost:3000/v1/users/1
```

## 🏗️ Architecture & Implementation Details

### Caching Strategy

**LRU (Least Recently Used) Cache Implementation**:
- Uses a `Map` data structure for O(1) lookups
- Maintains insertion order (recent items at the end)
- Evicts least recently used items when capacity is reached
- Each entry includes:
  - `value`: The cached data
  - `timestamp`: Creation time for TTL validation
  - `lastAccessed`: Last access time for LRU ordering

**Cache Flow**:
1. Request arrives → Check cache
2. **Cache Hit**: Return immediately (fast path)
3. **Cache Miss**: 
   - Check if request is already being processed (deduplication)
   - If yes, wait for existing request to complete
   - If no, fetch from "database", cache result, and return

**Background Cleanup**:
- Runs every 10 seconds
- Removes entries older than TTL (60 seconds)
- Prevents memory leaks from expired entries

### Rate Limiting Strategy

**Token Bucket Algorithm**:
- Each IP gets a "bucket" with tokens
- Tokens refill continuously (10 tokens per 60 seconds)
- Burst tokens allow short traffic spikes (5 tokens per 10 seconds)

**Implementation Details**:
- **Per-IP tracking**: Uses IP address from headers or socket
- **Token refill**: Calculated based on elapsed time
- **Burst handling**: Separate burst token counter with independent window
- **Cleanup**: Removes inactive client buckets after 5 minutes

**Why Token Bucket?**
- Allows burst traffic handling (better UX)
- Smooth rate limiting (no hard resets)
- Fair distribution across time windows

### Asynchronous Processing

**Queue-Based Request Handling**:
- **Deduplication**: Same resource ID = same task
- **Concurrency control**: Configurable concurrent task limit (default: 10)
- **Waiting mechanism**: Subsequent requests wait for first request to complete

**Flow**:
```
Request 1 (user:1) → Enqueue → Process → Cache → Resolve
Request 2 (user:1) → Check processing → Wait → Get cached result
Request 3 (user:1) → Check processing → Wait → Get cached result
```

**Benefits**:
- Prevents thundering herd problem
- Reduces database/API load
- Maintains low response times for duplicate requests

## 📊 Performance Metrics

Expected performance characteristics:

| Scenario | Response Time | Notes |
|----------|--------------|-------|
| First request (cache miss) | ~200ms | Includes database simulation delay |
| Cached request (cache hit) | <10ms | Direct memory access |
| Rate limited request | <5ms | Fast rejection with 429 status |
| Concurrent duplicate requests | ~200ms (first), <50ms (others) | Queue-based deduplication |

**Cache Efficiency**:
- After warm-up period, hit rate should be >90% for repeated requests
- Cache size adapts based on traffic patterns (LRU eviction)

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
```

### Customizing Cache Settings

Edit `/src/modules/users/users.service.ts`:

```typescript
this.cache = new LRUCache<User>(100, 60); 
// Parameters: capacity (100 entries), TTL (60 seconds)
```

### Customizing Rate Limits

Edit `/src/middlewares/rate-limiter.middleware.ts`:

```typescript
this.maxTokens = 10;         // 10 requests per minute
this.burstCapacity = 5;      // 5 burst requests
this.burstWindow = 10 * 1000; // 10 seconds
```

## 📁 Project Structure

```
src/
├── app.ts                     # Express app configuration
├── main.ts                    # Application entry point
├── configs/                   # Configuration files
│   ├── config.ts
│   ├── logger.ts
│   └── swagger.ts
├── middlewares/               # Custom middleware
│   ├── rate-limiter.middleware.ts  # Token bucket rate limiter
│   └── zod-validate.middleware.ts  # Request validation
├── modules/
│   ├── index.routes.ts        # Main router
│   ├── app/                   # Health check module
│   └── users/                 # Users module
│       ├── users.controller.ts    # Route handlers
│       ├── users.service.ts       # Business logic
│       ├── users.types.ts         # TypeScript interfaces
│       └── users.validation.ts    # Zod schemas
├── types/                     # Global TypeScript types
└── utils/                     # Utility functions
    ├── async-queue.utils.ts   # Async queue processor
    ├── lru-cache.utils.ts     # LRU cache implementation
    └── api-response.utils.ts  # Response formatting
```

## 🐛 Debugging

**Enable verbose logging**:

The application logs important events:
- Cache hits/misses
- Database fetches
- Rate limit violations
- Queue processing

Check the console output for debugging information.

**Common Issues**:

1. **High cache miss rate**: Increase cache capacity or TTL
2. **Rate limit too restrictive**: Adjust `maxTokens` or `burstCapacity`
3. **Slow response times**: Check database simulation delay, increase queue concurrency

## 🚀 Production Considerations

### Scaling
- **Horizontal scaling**: Use Redis for distributed caching
- **Load balancing**: Ensure rate limiting is IP-based, not server-based
- **Database**: Replace mock data with real database (PostgreSQL, MongoDB, etc.)

### Monitoring
- Integrate Prometheus for metrics collection
- Set up alerts for:
  - Cache hit rate drops below 70%
  - High rate limiting rejections
  - Response time exceeds thresholds

### Security
- Implement authentication (JWT, OAuth)
- Add request signing for API security
- Use helmet.js for security headers
- Implement CSRF protection

## 📝 API Documentation

Interactive API documentation is available via Swagger UI:

```
http://localhost:3000/api-docs
```

## 🧪 Additional Testing Scenarios

### 1. Cache TTL Test
```bash
# Fetch user (cache miss)
curl http://localhost:3000/v1/users/1

# Wait 30 seconds
sleep 30

# Fetch again (cache hit)
curl http://localhost:3000/v1/users/1

# Wait 35 more seconds (total 65s, exceeds 60s TTL)
sleep 35

# Fetch again (cache miss - expired)
curl http://localhost:3000/v1/users/1
```

### 2. Concurrent Request Deduplication Test
```bash
# Open 5 terminals and run simultaneously:
time curl http://localhost:3000/v1/users/3
# All should complete in ~200ms, but only 1 database call is made
```

### 3. Rate Limit Recovery Test
```bash
# Exhaust rate limit
for i in {1..12}; do curl http://localhost:3000/v1/users/1; done

# Wait 10 seconds (burst window resets)
sleep 10

# Should work again (5 requests)
for i in {1..5}; do curl http://localhost:3000/v1/users/1; done
```