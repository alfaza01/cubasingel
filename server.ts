import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for images
  app.use(express.json({ limit: "50mb" }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API constraints for Gemini
  app.post("/api/scan-products", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "No image provided" });
      }

      // remove "data:image/jpeg;base64," prefix if present
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: "image/jpeg",
            },
          },
          "Extract the product list from this image. Only return raw JSON array data of products. Each product should have 'name' (string) and 'category' (string). Extract categories logically based on the product. Do not add markdown blocks like ```json."
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: "Name of the product"
                },
                category: {
                  type: Type.STRING,
                  description: "Logical category of the product, such as INDOSAT, TELKOMSEL, SMARTFREN, or PULSA."
                },
                hargaModal: {
                  type: Type.NUMBER,
                  description: "Capital price (if visible), else 0"
                },
                hargaJual: {
                  type: Type.NUMBER,
                  description: "Selling price (if visible), else 0"
                },
                stok: {
                  type: Type.NUMBER,
                  description: "Stock quantity (if visible), else 0"
                }
              },
              required: ["name", "category"]
            }
          }
        }
      });

      const text = response.text || "[]";
      let parsed = [];
      try {
        parsed = JSON.parse(text.trim());
      } catch (err) {
        console.error("Failed to parse Gemini output:", text);
      }
      res.json({ products: parsed });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
