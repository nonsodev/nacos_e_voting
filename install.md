# Installation Guide

## Prerequisites

- Node.js 18+ 
- .NET 8 SDK
- PostgreSQL access (provided via Render)

## Quick Start

### 1. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 2. Backend Setup

```bash
cd backend
dotnet restore
dotnet run --project LasuEVoting.API
```

The API will be available at `http://localhost:5000`

## Environment Configuration

### Frontend (.env.local)
Already configured with the provided credentials.

### Backend (appsettings.json)
Already configured with:
- PostgreSQL connection string
- Google OAuth credentials
- Cloudinary settings
- SkyBiometry API settings

## Database

The database will be automatically created when the backend starts for the first time. It includes:
- User management tables
- Voting system tables
- Admin seed data

## Default Admin Account

A default admin account is seeded with:
- Email: finestdan1979@gmail.com
- Google ID: admin-google-id

## Features Implemented

### Student Features
- ✅ Google OAuth 2.0 authentication
- ✅ Matric number registration
- ✅ Course form upload and verification
- ✅ Face capture and verification with SkyBiometry
- ✅ Voting interface for activated accounts
- ✅ Real-time voting status

### Admin Features
- ✅ Position management
- ✅ Candidate management with photo upload
- ✅ Voting session control (start/end)
- ✅ Real-time results viewing
- ✅ User management

### Security Features
- ✅ JWT authentication
- ✅ Face liveness detection
- ✅ One face per account enforcement
- ✅ Document verification against student details
- ✅ Secure file upload to Cloudinary

## API Endpoints

### Authentication
- POST `/api/auth/google-signin` - Google OAuth sign in
- GET `/api/auth/me` - Get current user

### Student
- POST `/api/student/update-matric` - Update matric number
- POST `/api/student/upload-document` - Upload course form
- POST `/api/student/verify-face` - Face verification
- GET `/api/student/verification-status` - Check verification status

### Voting
- GET `/api/voting/positions` - Get positions and candidates
- POST `/api/voting/cast-vote` - Cast a vote
- GET `/api/voting/voting-status` - Check if voting is active

### Admin
- POST `/api/admin/positions` - Create position
- POST `/api/admin/candidates` - Create candidate
- POST `/api/admin/voting-sessions` - Create voting session
- POST `/api/admin/voting-sessions/{id}/start` - Start voting
- POST `/api/admin/voting-sessions/{id}/end` - End voting
- GET `/api/admin/results` - Get vote results

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure the PostgreSQL connection string is correct
2. **Google OAuth**: Verify client ID and secret are properly configured
3. **Cloudinary**: Check API credentials for file uploads
4. **SkyBiometry**: Ensure API key and secret are valid

### Logs

Check the backend console for detailed error logs and API responses.

## Production Deployment

1. Update environment variables for production URLs
2. Configure HTTPS for both frontend and backend
3. Set up proper CORS policies
4. Configure production database
5. Set up monitoring and logging