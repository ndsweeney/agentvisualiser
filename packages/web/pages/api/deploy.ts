// API route to handle deployment operations
import type { NextApiRequest, NextApiResponse } from 'next';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    let response;
    
    switch (method) {
      case 'GET':
        response = await fetch(`${API_BASE_URL}/deploy`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        break;
        
      case 'POST':
        response = await fetch(`${API_BASE_URL}/deploy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(req.body),
        });
        break;
        
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ error: `Method ${req.method} Not Allowed` });
        return;
    }

    const data = await response.json();
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Deploy API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}