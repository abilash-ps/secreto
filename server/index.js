import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MongoClient, ObjectId } from 'mongodb';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB Atlas connection
let db;
const client = new MongoClient(process.env.MONGODB_ATLAS_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer configuration for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'diary-photos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }]
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://secretomkri.netlify.app'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Connect to MongoDB Atlas
async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db('secreto-diary');
    console.log('Connected to MongoDB Atlas');
    
    // Create indexes for better performance
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('diary_entries').createIndex({ userId: 1 });
    await db.collection('diary_entries').createIndex({ entryDate: -1 });
    await db.collection('diary_entries').createIndex({ userId: 1, entryDate: -1 });
    
    console.log('Database indexes created');
  } catch (error) {
    console.error('MongoDB Atlas connection error:', error);
    process.exit(1);
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Validation
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const result = await db.collection('users').insertOne({
      email: email.toLowerCase(),
      username,
      password: hashedPassword,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: result.insertedId.toString(), 
        email: email.toLowerCase(), 
        username 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: result.insertedId.toString(),
        email: email.toLowerCase(),
        username,
        avatarUrl: null
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await db.collection('users').findOne({ 
      email: email.toLowerCase() 
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user._id.toString(), 
        email: user.email, 
        username: user.username 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Profile routes
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(req.user.userId) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Diary entry routes
app.get('/api/entries', authenticateToken, async (req, res) => {
  try {
    const entries = await db.collection('diary_entries')
      .find({ userId: new ObjectId(req.user.userId) })
      .sort({ entryDate: -1, createdAt: -1 })
      .toArray();

    const formattedEntries = entries.map(entry => ({
      id: entry._id.toString(),
      title: entry.title,
      content: entry.content,
      entry_date: entry.entryDate.toISOString().split('T')[0],
      photos: entry.photos || [],
      voice_memo_url: entry.voiceMemoUrl,
      mood_emoji: entry.moodEmoji,
      created_at: entry.createdAt.toISOString(),
      updated_at: entry.updatedAt ? entry.updatedAt.toISOString() : entry.createdAt.toISOString()
    }));

    res.json(formattedEntries);
  } catch (error) {
    console.error('Entries fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/entries/:id', authenticateToken, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid entry ID' });
    }

    const entry = await db.collection('diary_entries').findOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(req.user.userId)
    });

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json({
      id: entry._id.toString(),
      title: entry.title,
      content: entry.content,
      entry_date: entry.entryDate.toISOString().split('T')[0],
      photos: entry.photos || [],
      voice_memo_url: entry.voiceMemoUrl,
      mood_emoji: entry.moodEmoji,
      created_at: entry.createdAt.toISOString(),
      updated_at: entry.updatedAt ? entry.updatedAt.toISOString() : entry.createdAt.toISOString(),
      user_id: entry.userId.toString()
    });
  } catch (error) {
    console.error('Entry fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/entries', authenticateToken, async (req, res) => {
  try {
    const { title, content, entry_date, photos, mood_emoji } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const entryDate = entry_date ? new Date(entry_date) : new Date();
    
    const result = await db.collection('diary_entries').insertOne({
      userId: new ObjectId(req.user.userId),
      title: title.trim(),
      content: content.trim(),
      entryDate,
      photos: photos || [],
      voiceMemoUrl: null,
      moodEmoji: mood_emoji || null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json({ 
      id: result.insertedId.toString(),
      message: 'Entry created successfully'
    });
  } catch (error) {
    console.error('Entry creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/entries/:id', authenticateToken, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid entry ID' });
    }

    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const result = await db.collection('diary_entries').updateOne(
      {
        _id: new ObjectId(req.params.id),
        userId: new ObjectId(req.user.userId)
      },
      {
        $set: {
          title: title.trim(),
          content: content.trim(),
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json({ 
      success: true,
      message: 'Entry updated successfully'
    });
  } catch (error) {
    console.error('Entry update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/entries/:id', authenticateToken, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid entry ID' });
    }

    // First get the entry to delete associated photos from Cloudinary
    const entry = await db.collection('diary_entries').findOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(req.user.userId)
    });

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Delete photos from Cloudinary if they exist
    if (entry.photos && entry.photos.length > 0) {
      try {
        for (const photoUrl of entry.photos) {
          const publicId = photoUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`diary-photos/${publicId}`);
        }
      } catch (cloudinaryError) {
        console.error('Error deleting photos from Cloudinary:', cloudinaryError);
        // Continue with entry deletion even if photo deletion fails
      }
    }

    // Delete the entry
    const result = await db.collection('diary_entries').deleteOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(req.user.userId)
    });

    res.json({ 
      success: true,
      message: 'Entry deleted successfully'
    });
  } catch (error) {
    console.error('Entry deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Photo upload route
app.post('/api/upload', authenticateToken, upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({ 
      url: req.file.path,
      message: 'Photo uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Photo upload failed' });
  }
});

// Keep-alive endpoint for preventing database hibernation
app.get('/api/keep-alive', authenticateToken, async (req, res) => {
  try {
    // Simple query to keep the database active
    const count = await db.collection('users').countDocuments();
    res.json({ 
      status: 'alive', 
      timestamp: new Date().toISOString(),
      userCount: count
    });
  } catch (error) {
    console.error('Keep-alive error:', error);
    res.status(500).json({ error: 'Keep-alive failed' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await client.close();
  process.exit(0);
});

// Start server
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});