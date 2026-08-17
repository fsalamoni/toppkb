/**
 * Cliente Gemini — usado por todos os agentes.
 * Usa o SDK @google/generative-ai.
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

let client: GoogleGenerativeAI | null = null;
let flashModel: GenerativeModel | null = null;
let proModel: GenerativeModel | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não configurada');
    }
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

export function getFlashModel(): GenerativeModel {
  if (!flashModel) {
    flashModel = getGeminiClient().getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        maxOutputTokens: 1500,
      },
    });
  }
  return flashModel;
}

export function getProModel(): GenerativeModel {
  if (!proModel) {
    proModel = getGeminiClient().getGenerativeModel({
      model: 'gemini-2.5-pro',
      generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        maxOutputTokens: 4000,
      },
    });
  }
  return proModel;
}

export interface GeminiResult {
  text: string;
  tokensUsados: number;
  latenciaMs: number;
}

export async function gerarResposta(
  systemPrompt: string,
  userMessage: string,
  historico: { role: 'user' | 'model'; content: string }[] = [],
  usePro = false,
): Promise<GeminiResult> {
  const start = Date.now();
  const model = usePro ? getProModel() : getFlashModel();

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Entendido. Vou seguir essas diretrizes.' }] },
      ...historico.map((h) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }],
      })),
    ],
  });

  const result = await chat.sendMessage(userMessage);
  const text = result.response.text();
  const latenciaMs = Date.now() - start;
  const tokensUsados = result.response.usageMetadata?.totalTokenCount || 0;

  return { text, tokensUsados, latenciaMs };
}
