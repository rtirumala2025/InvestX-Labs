import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

router.post("/chat", async (req, res) => {
  try {
    const { message, portfolioData } = req.body;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "InvestX Labs"
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.1-70B-Instruct",
        messages: [
          {
            role: "system",
            content: `You are an AI investment mentor for high school students. 
            Explain concepts in simple, easy-to-understand language. 
            Be encouraging and patient. 
            ${portfolioData ? `The user's portfolio data: ${JSON.stringify(portfolioData)}` : ''}`
          },
          { role: "user", content: message },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`AI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || 
                 "Sorry, I couldn't generate a response at the moment. Please try again later.";

    res.json({ reply });
  } catch (error) {
    console.error("AI Route Error:", error);
    res.status(500).json({ 
      error: "Failed to process your request. Please try again later.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
