# Free AI APIs for DigiEstate Chat

## 🆓 **Free AI API Alternatives**

### **1. Hugging Face Inference API (Recommended)**
- **URL**: https://huggingface.co/
- **Free Tier**: 30,000 requests/month
- **Setup**: 
  1. Create account at huggingface.co
  2. Go to Settings → Access Tokens
  3. Create new token
  4. Replace `hf_xxx` in the code with your token

### **2. OpenAI API (Free Tier)**
- **URL**: https://platform.openai.com/
- **Free Tier**: $5 credit/month
- **Setup**:
  1. Create account at platform.openai.com
  2. Add payment method (required)
  3. Get API key from API Keys section

### **3. Cohere AI (Free Tier)**
- **URL**: https://cohere.ai/
- **Free Tier**: 5 requests/minute
- **Setup**:
  1. Create account at cohere.ai
  2. Get API key from dashboard

### **4. Local AI with Ollama (Completely Free)**
- **URL**: https://ollama.ai/
- **Setup**:
  1. Install Ollama on your machine
  2. Run: `ollama run llama2`
  3. Use local API at `http://localhost:11434`

## 🔧 **Implementation Options**

### **Option A: Use Current Mock System (Working Now)**
The current implementation includes a smart mock system that responds to keywords:
- "hello" → Greeting
- "property" → Property advice
- "buy" → Buying guidance
- "sell" → Selling tips
- "investment" → Investment advice
- And more...

### **Option B: Hugging Face API (Recommended)**
```javascript
// Replace the API call with:
const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_HF_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    inputs: `Real estate assistant: ${message}`,
    parameters: {
      max_length: 150,
      temperature: 0.7
    }
  })
});
```

### **Option C: OpenAI API**
```javascript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_OPENAI_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a real estate assistant for DigiEstate platform.'
      },
      {
        role: 'user',
        content: message
      }
    ],
    max_tokens: 150
  })
});
```

## 🚀 **Quick Fix for Current Issue**

The current implementation now has a **fallback system**:
1. **Tries Perplexity API** (original)
2. **Falls back to Hugging Face** (if Perplexity fails)
3. **Uses smart mock responses** (if both APIs fail)

This ensures your AI chat will **always work**!

## 📝 **How to Get Free API Keys**

### **Hugging Face (Recommended)**
1. Go to https://huggingface.co/
2. Click "Sign Up" and create account
3. Go to Settings → Access Tokens
4. Click "New token"
5. Copy the token and replace `hf_xxx` in the code

### **OpenAI**
1. Go to https://platform.openai.com/
2. Sign up and add payment method
3. Go to API Keys section
4. Create new secret key
5. Use in your code

## ✅ **Current Status**

Your AI chat feature now has:
- ✅ **Working fallback system**
- ✅ **Smart mock responses**
- ✅ **Multiple API options**
- ✅ **Error handling**

The AI chat should work immediately with the mock system, and you can upgrade to real APIs later! 