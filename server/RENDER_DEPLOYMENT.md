# Express Backend Deployment Guide (Render)

## Environment Variables Setup

Set the following environment variables in Render dashboard:

### Required

- **MONGODB_URI**: Your MongoDB Atlas connection string
  - Format: `mongodb+srv://username:password@cluster.mongodb.net/stdout?retryWrites=true&w=majority`
  - Get this from MongoDB Atlas → Connect → Connection String

### Important Security

- **JWT_SECRET**: Generate a strong random secret
  - Example: Use `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Optional

- **OPENAI_API_KEY**: Your OpenAI API key (if needed for features)
- **FRONTEND_URL**: Your Vercel frontend URL (for CORS)
  - Example: `https://your-app.vercel.app`
- **NODE_ENV**: Set to `production`

## Configuration Details

### CORS

- **Local Dev**: Accepts all origins (`*`)
- **Production**: Uses whitelist including your FRONTEND_URL
- Requests from frontend will work automatically

### Database Connection

- Mongoose connects using `MONGODB_URI` environment variable
- Includes 5-second timeout for connection attempts
- Server continues even if DB is temporarily unavailable (but auth will fail)

### Health Check

- **GET** `/` returns `{"status":"ok","message":"Server is running"}`
- Use this to verify deployment

## Render Deployment Steps

### 1. Create New Web Service

- Connect GitHub repo
- Select `server` directory as root directory (or leave root for monorepo)

### 2. Build Command

```bash
npm install && npm install --prefix server
```

Or just (if running from server directory):

```bash
npm install
```

### 3. Start Command

```bash
npm start
```

Or if in root:

```bash
cd server && npm start
```

### 4. Add Environment Variables

Go to Render dashboard → Environment → paste variables above

### 5. Deploy

Render will auto-deploy on Git push

## Verification

After deployment, test these endpoints:

```bash
# Health check
curl https://your-render-backend.onrender.com/

# Should return:
# {"status":"ok","message":"Server is running"}
```

## Common Issues

| Issue                        | Solution                                         |
| ---------------------------- | ------------------------------------------------ |
| "MongoDB connection error"   | Check MONGODB_URI in environment variables       |
| "Cannot GET /api/auth/login" | Backend deployed but check route paths           |
| CORS errors                  | Set FRONTEND_URL to your Vercel URL              |
| 502 Bad Gateway              | Check logs - server might be crashing on startup |

## Local Testing

```bash
cd server
npm install
# Create .env file with local values
npm start
```

The server will run on `http://localhost:3001`
