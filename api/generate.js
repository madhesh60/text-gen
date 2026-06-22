// api/generate.js
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt, model, params } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Default to 'gpt2' if model is not provided
    const targetModel = model || 'gpt2';
    const url = `https://api-inference.huggingface.co/models/${targetModel}`;

    // Get the HF token from environment variables (or headers if passed)
    let token = process.env.HF_TOKEN;
    
    // If the client passed an explicit token (e.g. from the UI overrides), respect it
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const clientToken = authHeader.substring(7).trim();
      if (clientToken) {
        token = clientToken;
      }
    }

    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = {
      inputs: prompt,
      parameters: {
        max_new_tokens: parseInt(params?.max_new_tokens || 100),
        temperature: parseFloat(params?.temperature || 0.7),
        top_p: parseFloat(params?.top_p || 0.9),
        repetition_penalty: parseFloat(params?.repetition_penalty || 1.1),
        do_sample: true
      },
      options: {
        use_cache: false,
        wait_for_model: true
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    // Handle 503 model loading state
    if (response.status === 503) {
      const errData = await response.json().catch(() => ({}));
      return res.status(503).json(errData);
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: errBody.error || `HTTP error! Status: ${response.status}` });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy generation error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
