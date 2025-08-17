// API route to handle individual deployment operations by ID
import type { NextApiRequest, NextApiResponse } from 'next';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;
  const { id } = query;

  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Deployment ID is required' });
    return;
  }

  try {
    let response;
    
    switch (method) {
      case 'DELETE':
        response = await fetch(`${API_BASE_URL}/deploy/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        break;
        
      default:
        res.setHeader('Allow', ['DELETE']);
        res.status(405).json({ error: `Method ${method} Not Allowed` });
        return;
    }

    const data = response.status === 204 ? {} : await response.json();
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Deploy Management API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}