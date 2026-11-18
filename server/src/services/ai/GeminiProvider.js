const { GoogleGenAI } = require('@google/genai');

class GeminiProvider {
  constructor(apiKey = process.env.GEMINI_API_KEY, modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash') {
    this.apiKey = apiKey;
    this.modelName = modelName;
    this.apiVersion = process.env.GEMINI_API_VERSION || 'v1beta';
    if (this.apiKey) {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey, apiVersion: this.apiVersion });
    }
  }

  ensureClient() {
    if (!this.ai) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        throw new Error('GEMINI_API_KEY is not configured in .env. Please add your Gemini API key or switch AI_PROVIDER=mock.');
      }
      this.apiKey = key;
      this.apiVersion = process.env.GEMINI_API_VERSION || 'v1beta';
      this.ai = new GoogleGenAI({ apiKey: key, apiVersion: this.apiVersion });
    }
    return this.ai;
  }

  getModel() {
    return process.env.GEMINI_MODEL || this.modelName || 'gemini-2.5-flash';
  }

  /**
   * Generates raw text response.
   */
  async generateText({ prompt, systemInstruction, temperature = 0.7, maxTokens = 2048 }) {
    const ai = this.ensureClient();
    const config = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    if (temperature !== undefined) {
      config.temperature = temperature;
    }
    if (maxTokens) {
      config.maxOutputTokens = maxTokens;
    }

    const response = await ai.models.generateContent({
      model: this.getModel(),
      contents: prompt,
      config,
    });

    const text = response.text || (response.candidates?.[0]?.content?.parts?.[0]?.text) || '';
    const usage = response.usageMetadata || {};

    return {
      text,
      tokens: {
        promptTokens: usage.promptTokenCount || 0,
        candidatesTokens: usage.candidatesTokenCount || 0,
        totalTokens: usage.totalTokenCount || 0,
      },
      raw: response,
    };
  }

  /**
   * Multi-turn chat conversation.
   * messages: Array of { role: 'user' | 'model' | 'assistant', content: string }
   */
  async chat({ messages, systemInstruction, temperature = 0.7 }) {
    const ai = this.ensureClient();
    const config = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    if (temperature !== undefined) {
      config.temperature = temperature;
    }

    // Convert message array to Gemini contents format
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content || m.text || '' }],
    }));

    const response = await ai.models.generateContent({
      model: this.getModel(),
      contents,
      config,
    });

    const text = response.text || (response.candidates?.[0]?.content?.parts?.[0]?.text) || '';
    const usage = response.usageMetadata || {};

    return {
      text,
      tokens: {
        promptTokens: usage.promptTokenCount || 0,
        candidatesTokens: usage.candidatesTokenCount || 0,
        totalTokens: usage.totalTokenCount || 0,
      },
    };
  }

  /**
   * Streaming chat via Server-Sent Events / onChunk callback.
   */
  async streamChat({ messages, systemInstruction, temperature = 0.7, onChunk, signal }) {
    const ai = this.ensureClient();
    const config = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    if (temperature !== undefined) {
      config.temperature = temperature;
    }

    const contents = messages.map((m) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content || m.text || '' }],
    }));

    const stream = await ai.models.generateContentStream({
      model: this.getModel(),
      contents,
      config,
    });

    let fullText = '';
    let usage = null;

    for await (const chunk of stream) {
      if (signal?.aborted) {
        break;
      }
      const chunkText = chunk.text || '';
      if (chunkText) {
        fullText += chunkText;
        if (typeof onChunk === 'function') {
          onChunk(chunkText);
        }
      }
      if (chunk.usageMetadata) {
        usage = chunk.usageMetadata;
      }
    }

    return {
      text: fullText,
      tokens: {
        promptTokens: usage?.promptTokenCount || 0,
        candidatesTokens: usage?.candidatesTokenCount || 0,
        totalTokens: usage?.totalTokenCount || 0,
      },
    };
  }

  /**
   * Generates structured JSON output adhering to a schema.
   */
  async generateJSON({ prompt, systemInstruction, schema, responseSchema, temperature = 0.2 }) {
    const ai = this.ensureClient();
    const config = {
      responseMimeType: 'application/json',
      temperature,
    };
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    const finalSchema = responseSchema || schema;
    if (finalSchema) {
      config.responseSchema = finalSchema;
    }

    const response = await ai.models.generateContent({
      model: this.getModel(),
      contents: prompt,
      config,
    });

    const text = response.text || (response.candidates?.[0]?.content?.parts?.[0]?.text) || '{}';
    const usage = response.usageMetadata || {};

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      // Attempt markdown cleanup if surrounded with ```json ... ```
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    return {
      data: parsed,
      text,
      tokens: {
        promptTokens: usage.promptTokenCount || 0,
        candidatesTokens: usage.candidatesTokenCount || 0,
        totalTokens: usage.totalTokenCount || 0,
      },
    };
  }
}

module.exports = GeminiProvider;
