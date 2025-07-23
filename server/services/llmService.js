const axios = require('axios');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const dotenv = require('dotenv');

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function sendRequestToOpenAI(model, message) {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      console.log(`[OpenAI] Sending message using model: ${model}`);
      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: message }],
        max_tokens: 1024,
      });
      const content = response.choices?.[0]?.message?.content;
      if (!content) throw new Error('No content in OpenAI response');
      return content;
    } catch (error) {
      console.error(`[OpenAI] Error (attempt ${i + 1}): ${error.message}`);
      if (i === MAX_RETRIES - 1) throw new Error(`OpenAI failed after ${MAX_RETRIES} attempts: ${error.message}`);
      await sleep(RETRY_DELAY);
    }
  }
}

async function sendRequestToAnthropic(model, message) {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      console.log(`[Anthropic] Sending message using model: ${model}`);
      const response = await anthropic.messages.create({
        model,
        messages: [{ role: 'user', content: message }],
        max_tokens: 1024,
      });

      const content = response?.content?.[0]?.text;
      if (!content) throw new Error('No content in Anthropic response');
      return content;
    } catch (error) {
      console.error(`[Anthropic] Error (attempt ${i + 1}): ${error.message}`);
      if (i === MAX_RETRIES - 1) throw new Error(`Anthropic failed after ${MAX_RETRIES} attempts: ${error.message}`);
      await sleep(RETRY_DELAY);
    }
  }
}

async function sendLLMRequest(provider, model, message) {
  if (!provider || !model || !message) {
    throw new Error('Provider, model, and message must all be specified.');
  }

  switch (provider.toLowerCase()) {
    case 'openai':
      return await sendRequestToOpenAI(model, message);
    case 'anthropic':
      return await sendRequestToAnthropic(model, message);
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

module.exports = {
  sendLLMRequest
};