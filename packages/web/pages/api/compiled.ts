// API route to handle compiled projects operations
import type { NextApiRequest, NextApiResponse } from 'next';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    let response;
    
    switch (method) {
      case 'GET':
        // Get all compiled projects
        response = await fetch(`${API_BASE_URL}/compiled`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        break;
        
      case 'POST':
        // Store a compiled project
        response = await fetch(`${API_BASE_URL}/compiled`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(req.body),
        });
        break;
        
      case 'DELETE':
        // Delete a compiled project
        const { id } = req.query;
        if (!id) {
          res.status(400).json({ error: 'Compiled project ID is required' });
          return;
        }
        
        response = await fetch(`${API_BASE_URL}/compiled/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        break;
        
      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        res.status(405).json({ error: `Method ${method} Not Allowed` });
        return;
    }

    const data = response.status === 204 ? {} : await response.json();
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Compiled Projects API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}