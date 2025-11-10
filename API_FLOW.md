# 🔄 API Flow Documentation

## Video Learning Progress Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER ACTIONS                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  1. User Opens Chapter                                       │
│     GET /api/learn/[chapterId]                              │
│     ↓                                                        │
│     Returns: course, chapter, videos, userProgress          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  2. User Watches Video                                       │
│     (Video plays in embedded player)                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  3. User Clicks "Mark Video Complete"                        │
│     POST /api/learn/[chapterId]                             │
│     Body: {                                                  │
│       videoId: "abc123",                                     │
│       completionPercentage: 100,                             │
│       timestamp: 0                                           │
│     }                                                        │
│     ↓                                                        │
│     Updates: UserProgress.completedVideos[]                 │
│     Updates: UserProgress.videoProgress = 100               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Check: All Videos Complete?                              │
│     if (allVideosCompleted) {                                │
│       → Go to Step 5                                         │
│     } else {                                                 │
│       → User continues watching                              │
│     }                                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Mark Chapter Complete                                    │
│     POST /api/learn/[chapterId]/complete                    │
│     ↓                                                        │
│     Updates: Chapter.isCompleted = true                     │
│     Updates: Course progress percentage                      │
│     Navigates: To next chapter                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Load Next Chapter                                        │
│     GET /api/learn/[nextChapterId]                          │
│     ↓                                                        │
│     Repeat from Step 1                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Note-Taking Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User Adds Note                                              │
│     POST /api/progress/chapter/[chapterId]/notes            │
│     Body: {                                                  │
│       id: "timestamp",                                       │
│       timestamp: 120,                                        │
│       content: "Important concept here"                      │
│     }                                                        │
│     ↓                                                        │
│     Saves to: UserProgress.notes[]                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Progress Retrieval Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Load User Progress                                          │
│     GET /api/progress/chapter/[chapterId]                   │
│     ↓                                                        │
│     Returns: {                                               │
│       videoProgress: 75,                                     │
│       completedVideos: ["video1", "video2"],                │
│       notes: [...],                                          │
│       isCompleted: false                                     │
│     }                                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Roadmap Generation Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. User Completes Assessment                                │
│     POST /api/assessment/submit                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  2. User Navigates to Roadmap                                │
│     GET /api/roadmap                                         │
│     ↓                                                        │
│     If no roadmap exists:                                    │
│       → Calls POST /api/roadmap/generate                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Generate Roadmap                                         │
│     POST /api/roadmap/generate                              │
│     ↓                                                        │
│     - Fetches user's languages                               │
│     - Searches YouTube for videos                            │
│     - Creates Course with Modules & Chapters                 │
│     - Saves to database                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Display Roadmap                                          │
│     Shows: Modules → Chapters → Videos                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Complete API Endpoint Reference

### Learning Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/learn/[chapterId]` | Get chapter data with videos |
| POST | `/api/learn/[chapterId]` | Update video progress |
| POST | `/api/learn/[chapterId]/complete` | Mark chapter complete |

### Progress Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/progress/chapter/[chapterId]` | Get user progress |
| POST | `/api/progress/chapter/[chapterId]/notes` | Add note |
| GET | `/api/progress/chapter/[chapterId]/notes` | Get notes |

### Roadmap Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/roadmap` | Get user's roadmap |
| POST | `/api/roadmap/generate` | Generate new roadmap |

### Assessment Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/assessment/generate` | Generate assessment |
| POST | `/api/assessment/submit` | Submit answers |
| GET | `/api/assessment/results` | Get results |
| POST | `/api/assessment/reset` | Reset assessment |

### User Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/user/check-profile` | Check if profile complete |
| POST | `/api/user/complete-profile` | Complete user profile |
| GET | `/api/user/progress` | Get overall progress |

---

## Data Models

### UserProgress
```typescript
{
  userId: string,
  chapterId: string,
  videoProgress: number,           // 0-100
  currentVideoId: string,
  currentTimestamp: number,
  completedVideos: [{
    videoId: string,
    completedAt: Date
  }],
  isCompleted: boolean,
  notes: [{
    id: string,
    timestamp: number,
    content: string,
    createdAt: string
  }],
  lastAccessedAt: Date,
  timeSpent: number
}
```

### Course
```typescript
{
  userId: string,
  modules: [{
    title: string,
    chapters: [{
      title: string,
      videos: [{
        videoId: string,
        title: string,
        duration: string,
        thumbnail: string
      }],
      isCompleted: boolean,
      difficulty: string
    }]
  }]
}
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 404 | Wrong endpoint | Check API_FLOW.md |
| 401 | Not authenticated | Sign in required |
| 400 | Missing data | Check request body |
| 500 | Server error | Check logs |

---

## Best Practices

### Frontend
1. ✅ Always check if user is authenticated
2. ✅ Handle loading states
3. ✅ Show error messages to users
4. ✅ Validate data before sending
5. ✅ Use correct HTTP methods

### Backend
1. ✅ Validate all inputs
2. ✅ Check authentication
3. ✅ Handle errors gracefully
4. ✅ Return consistent response format
5. ✅ Log errors for debugging

---

**Last Updated**: Today
**Status**: Current and Accurate ✅
