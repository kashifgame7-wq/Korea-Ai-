import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import type { Request, Response } from 'express';

dotenv.config();

// Initialize server-side Gemini client as instructed in the gemini-api skill
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

const SYSTEM_INSTRUCTION = `You are "Korea AI", an advanced, fast, and helpful AI assistant created for the "Korea AI Studio".
You are friendly, smart, and versatile. You can communicate fluently in English, Urdu, Hindi, Roman Urdu/Hinglish (e.g. "Main Korea AI hoon, batayen aaj kya help karun?"), Korean, and other languages based on what language the user speaks.
When users ask questions, provide clear, concise, well-structured answers using clean Markdown (headings, bullet points, and code blocks with language names when showing code).
You also specialize in Korean culture, technology, language, travel, entertainment (K-pop, K-drama), as well as general knowledge, coding, writing, and creative prompt engineering.
If a user asks you to generate, draw, or create an image while in Chat mode, give them a great prompt suggestion and remind them they can switch to Image Generation mode for instant visuals!`;

export async function handleChat(req: Request, res: Response) {
  try {
    const { messages, prompt } = req.body;
    const userPrompt = prompt || (Array.isArray(messages) && messages.length > 0 ? messages[messages.length - 1].content : '');

    if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    if (!ai) {
      // Smart instant fallback matching user's requested logic
      const lower = userPrompt.toLowerCase();
      let replyText = '';
      if (lower.includes('channel') || lower.includes('name') || lower.includes('youtube')) {
        replyText = "Yahan aapke AI YouTube channel ke liye 10 behtareen names hain:\n\n1. Korea AI Hub\n2. NextGen AI Shorts\n3. AI Studio Vortex\n4. CyberCraft AI\n5. Visionary AI Shorts\n6. Neuralize Studio\n7. Alpha AI Realm\n8. Infinite AI Play\n9. Prompt Genius AI\n10. SyncAI Shorts";
      } else if (lower.includes('hello') || lower.includes('salam') || lower.includes('hi')) {
        replyText = "Walaikum Assalam! Main Korea AI hoon. Bataiye aaj kis topic par baat karni hai ya kya banana hai?";
      } else {
        replyText = `Korea AI Response:\nAapne pucha: "${userPrompt}"\n\nMai is par puri tarah kaam kar raha hoon. Aap chahein toh dropdown se 'Image' mode select karke iski picture bhi generate kar sakte hain!`;
      }
      return res.json({ text: replyText });
    }

    // Format chat history if provided
    const contents: any[] = [];
    if (Array.isArray(messages) && messages.length > 1) {
      // Take up to last 10 messages for context
      const history = messages.slice(-10);
      for (const m of history) {
        contents.push({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.content || '' }],
        });
      }
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: userPrompt }],
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const text = response.text || 'Koi jawab generate nahi ho saka. Barah-e-karam dobara koshish karein.';
    return res.json({ text });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({
      error: error?.message || 'Chat generation failed.',
      fallbackText: 'Maazrat, request process karne me masla pesh aya. Dobara try kijiye.',
    });
  }
}

export async function handleEnhancePrompt(req: Request, res: Response) {
  try {
    const { prompt, style } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!ai) {
      // Fast heuristic enhancer if key not set
      const enhanced = `${prompt.trim()}, ${style || 'cinematic'}, highly detailed, 8k resolution, dramatic lighting, masterpiece`;
      return res.json({ enhancedPrompt: enhanced });
    }

    const enhanceInstruction = `You are an expert AI image prompt engineer for Korea AI Studio.
Transform this simple user image description into a rich, detailed, visually stunning prompt suitable for cutting-edge text-to-image models.
Keep the style context: "${style || 'realistic, high aesthetic'}".
Do NOT include preamble, quotes, or explanations. Return ONLY the enhanced prompt in English.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: enhanceInstruction,
        temperature: 0.8,
      },
    });

    const enhancedPrompt = response.text?.trim() || `${prompt}, 8k resolution, highly detailed`;
    return res.json({ enhancedPrompt });
  } catch (err: any) {
    console.error('Enhance error:', err);
    return res.json({ enhancedPrompt: `${req.body?.prompt || ''}, ultra detailed, 8k, cinematic lighting` });
  }
}

export async function handleGenerateImage(req: Request, res: Response) {
  try {
    const { prompt, aspectRatio = '1:1', style = 'Default', width, height } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Construct enriched prompt with style
    let fullPrompt = prompt.trim();
    if (style && style !== 'Default') {
      fullPrompt = `${fullPrompt}, ${style} style, stunning quality, high resolution`;
    }

    // Attempt Gemini Image Generation first if key is available
    if (ai) {
      try {
        const validAspectRatios = ['1:1', '3:4', '4:3', '9:16', '16:9'];
        const targetAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : '1:1';

        const geminiRes = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [{ text: fullPrompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: targetAspectRatio as any,
            },
          },
        });

        // Search candidate parts for inlineData
        for (const candidate of geminiRes.candidates || []) {
          for (const part of candidate.content?.parts || []) {
            if (part.inlineData && part.inlineData.data) {
              const mime = part.inlineData.mimeType || 'image/png';
              return res.json({
                imageUrl: `data:${mime};base64,${part.inlineData.data}`,
                prompt: fullPrompt,
                source: 'gemini',
              });
            }
          }
        }
      } catch (geminiError: any) {
        // If user key does not have paid Imagen access or rate limits hit, seamlessly fall back to fast Pollinations engine
        console.warn('Gemini image generation unavailable or requires paid key, falling back to fast generator:', geminiError?.message || geminiError);
      }
    }

    // Ultra-fast instant generator (Pollinations.ai high quality)
    let w = 768;
    let h = 768;
    if (aspectRatio === '16:9') {
      w = 1024;
      h = 576;
    } else if (aspectRatio === '9:16') {
      w = 576;
      h = 1024;
    } else if (aspectRatio === '4:3') {
      w = 896;
      h = 672;
    } else if (aspectRatio === '3:4') {
      w = 672;
      h = 896;
    }

    if (width && height) {
      w = Number(width);
      h = Number(height);
    }

    const seed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(fullPrompt);
    const fastImageUrl = `https://pollinations.ai/prompt/${encodedPrompt}?width=${w}&height=${h}&seed=${seed}&nologo=true`;

    return res.json({
      imageUrl: fastImageUrl,
      prompt: fullPrompt,
      source: 'fast-engine',
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate image',
    });
  }
}
