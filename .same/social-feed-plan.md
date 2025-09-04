# Family Tree Platform - Social Feed Implementation 🚀

## 📱 New Feature: Social Media-Like Family Feed

### 🎯 Overview
Implementing a complete social media experience for family members:
- Create posts with text, images, and videos
- Comment system with nested replies
- Like system for posts and comments
- Real-time notifications
- Privacy controls (public, family-only, sub-family-only)
- Feed filtering and sorting

### 📊 Database Schema Extensions

#### New Entities:
- **Post**: Main content with privacy controls
- **Comment**: Nested commenting system
- **Like**: Reactions for posts and comments
- **Notification**: Real-time alerts system

#### Privacy Levels:
- `PUBLIC`: Visible to all app users
- `FAMILY`: Visible to family members only
- `SUBFAMILY`: Visible to sub-family members only

### 🛠 Implementation Tasks

#### Backend (NestJS + Prisma)
- [ ] Update Prisma schema with new entities
- [ ] Create Post, Comment, Like, Notification modules
- [ ] Implement privacy filtering logic
- [ ] Add file upload for images/videos
- [ ] Create notification system
- [ ] Add feed pagination and filtering

#### Frontend (Next.js + React)
- [ ] Create SocialFeed component
- [ ] Build PostCreator with media upload
- [ ] Implement CommentSection with nesting
- [ ] Add NotificationPanel
- [ ] Create privacy control selectors
- [ ] Build feed filtering UI

#### API Endpoints to Implement:
- `POST /posts` - Create post
- `GET /posts` - Get family feed (paginated)
- `GET /posts/:id` - Get specific post with comments
- `PUT /posts/:id` - Update post
- `DELETE /posts/:id` - Delete post
- `POST /posts/:id/comments` - Add comment
- `PUT /comments/:id` - Edit comment
- `DELETE /comments/:id` - Delete comment
- `POST /posts/:id/like` - Like/unlike post
- `POST /comments/:id/like` - Like/unlike comment
- `GET /notifications` - Get user notifications
- `DELETE /notifications/:id` - Clear notification

### 🔐 Security & Privacy Features:
- Privacy-aware feed filtering
- Author-only edit/delete permissions
- Input validation and sanitization
- Family-based visibility controls

## 🚀 Ready to Start Implementation!
