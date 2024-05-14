import * as dotenv from 'dotenv'
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

import express from "express";
import pkg from "@prisma/client";
import morgan from "morgan";
import cors from "cors";
import { auth, requiredScopes } from 'express-oauth2-jwt-bearer';


// middleware that will validate the access token sent by the client
const requireAuth = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER,
  tokenSigningAlg: 'RS256'
});

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientPath = path.join(__dirname, '..', 'client');



app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("dev"));


const { PrismaClient } = pkg;
const prisma = new PrismaClient();
// Middleware for checking create, update, and delete permissions
const checkCreatePermission = requiredScopes('create:comments');
const checkUpdatePermission = requiredScopes('update:comments');
const checkDeletePermission = requiredScopes('delete:comments');


//public endpoint because it doesn't have the requireAuth middleware
app.get("/ping", (req, res) => {
  res.send("pong");
});

// Route to serve Albums.html at the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Route to serve Albums.html at "/home"
app.get('/home', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Serve static files
app.use(express.static(clientPath));


// Get all comments
app.get('/api/comments', requireAuth,async (req, res) => {
  const comments = await prisma.comment.findMany();
  res.json(comments);
});


// Get a recent comment by userID
app.get('/api/comments/user/:userId', requireAuth,async (req, res) => {
  try {
    const { userId } = req.params;
    const comments = await prisma.comment.findMany({
        where: {
            userId: parseInt(userId)  // Convert userId from string to integer
        },
        include: {
            user: true,  // Include user details in the response
            book: true   // Include book details in the response
        }
    });
    res.json(comments);
} catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving user's comments" });
}
});



//get comments for a specific book
app.get('/api/comments/book/:bookId',async (req, res) => {
  try {
      const { bookId } = req.params;
      const comments = await prisma.comment.findMany({
          where: {
              bookId: parseInt(bookId)  
          },
          include: {
              user: true,  // Include user details in the response
              book: true   // Include book details in the response
          }
      });
      res.json(comments);
  } catch (error) {
      console.error("Error details:", error);
      res.status(500).json({ message: "Error retrieving comments for the book" });
  }
});


// Endpoint to save or update user data
app.post('/api/users',requireAuth, checkUpdatePermission, async (req, res) => {
  try {
      const { email, name } = req.body;
      console.log("Creating a new comment with data:", req.body);
      // Check if the user already exists in the database
      let user = await prisma.user.findUnique({
          where: { email }
      });

      if (user) {
          // User exists, update their data
          user = await prisma.user.update({
              where: { email },
              data: { name }
          });
      } else {
          // User does not exist, create a new user
          user = await prisma.user.create({
              data: { email, name }
          });
      }

      // Return the user data
      res.json(user);
  } catch (error) {
      console.error('Error in /api/users:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new comment
app.post('/api/comments',  requireAuth, checkCreatePermission, async (req, res) => {
  try {
    // Extract comment data from the request body
    const { text, userId, bookId } = req.body;

    // Validate the input data (you can expand on this validation as needed)
    if (!text || !userId || !bookId) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    // Save the comment to the database
    const newComment = await prisma.comment.create({
        data: {
            text: text,
            user: { connect: { id: userId } }, // Assumes the user already exists
            book: { connect: { id: bookId } }  // Assumes the book already exists
        }
    });
      console.log("New comment created:", newComment);
    // Send the saved comment data back as the response
    res.status(201).json(newComment);
} catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating comment" });
}
});


// Update an existing comment
app.put('/api/comments/:id',  requireAuth, checkUpdatePermission, async (req, res) => {
  const { id } = req.params;
  const parsedId = parseInt(id);
  if (isNaN(parsedId)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  const { text } = req.body;
  const updatedComment = await prisma.comment.update({
    where: { id: parsedId },
    data: { text },
  });
  res.json(updatedComment);
});


// Delete a comment
app.delete('/api/comments/:id',  requireAuth, checkDeletePermission, async (req, res) => {
  const { id } = req.params;
  const parsedId = parseInt(id);
  if (isNaN(parsedId)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  await prisma.comment.delete({
    where: { id: parsedId },
  });
  res.status(204).send();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
