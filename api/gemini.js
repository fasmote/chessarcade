/**
 * Vercel Serverless Function para llamadas seguras a Gemini API
 * La API key se mantiene en el servidor, nunca se expone al frontend
 */

export default async function handler(req, res) {
    // Solo permitir POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // CORS headers para permitir requests desde el frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { prompt, action } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Obtener API key desde variables de entorno
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error('GEMINI_API_KEY not configured in environment variables');
            return res.status(500).json({
                error: 'API key not configured',
                message: 'Por favor configura GEMINI_API_KEY en Vercel Environment Variables'
            });
        }

        // Construir el prompt según la acción
        let fullPrompt = '';

        if (action === 'generate_phrase') {
            fullPrompt = `Genera una frase corta y motivadora sobre ajedrez (máximo 40 caracteres).
Debe ser inspiradora, relacionada con estrategia, táctica o aprendizaje.
Ejemplos: "EL AJEDREZ ES ARTE", "LA ESTRATEGIA GANA", "PIENSA ANTES DE MOVER"
Solo devuelve la frase en mayúsculas, sin comillas ni explicaciones.`;
        } else if (action === 'generate_title') {
            fullPrompt = `Genera un título corto y atractivo para un puzzle de ajedrez (máximo 30 caracteres).
El puzzle tiene este mensaje: "${prompt}"
Debe ser creativo y relacionado con el tema del mensaje.
Solo devuelve el título, sin comillas ni explicaciones.`;
        } else {
            fullPrompt = prompt;
        }

        // Llamar a Gemini API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: fullPrompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.9,
                        maxOutputTokens: 100,
                    }
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Gemini API error:', errorData);
            return res.status(response.status).json({
                error: 'Gemini API error',
                details: errorData
            });
        }

        const data = await response.json();

        // Extraer el texto de la respuesta
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            return res.status(500).json({
                error: 'No text generated',
                response: data
            });
        }

        // Limpiar y formatear la respuesta
        let cleanedText = generatedText.trim()
            .replace(/^["']|["']$/g, '') // Remove quotes
            .replace(/\n/g, ' ') // Remove newlines
            .toUpperCase();

        return res.status(200).json({
            success: true,
            text: cleanedText,
            action: action || 'custom'
        });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
