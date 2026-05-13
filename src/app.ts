import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import { connectDB } from './config/db.js';

dotenv.config();

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Swagger Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

connectDB(); // Connect to MongoDB

// Sample Route with Swagger Documentation
/**
 * @openapi
 * /health:
 *   get:
 *     description: Check if API is running
 *     responses:
 *       200:
 *         description: Returns a success message.
 */
app.get('/health', (req:Request, res:Response) => {
  res.status(200).json({ status: 'UP', message: 'Server is healthy' });
});

const PORT = process.env['PORT'] || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`Docs available at http://localhost:${PORT}/api-docs`);
});