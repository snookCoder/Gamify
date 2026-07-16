import { Router } from 'express';

const router = Router();

router.get('/search', async (req, res) => {
  try {
    const { term, country } = req.query;
    if (!term) {
      return res.status(400).json({ error: 'Search term is required' });
    }
    const countryParam = country ? `&country=${country}` : '';
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term as string)}${countryParam}&media=music&entity=song&limit=100`;
    
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Error proxying iTunes search:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch music search results' });
  }
});

export default router;
