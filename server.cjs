var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3031;
  app.use(import_express.default.json({ limit: "50mb" }));
  const ai = new import_genai.GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
  app.post("/api/scan-products", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "No image provided" });
      }
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: "image/jpeg"
            }
          },
          "Extract the product list from this image. Only return raw JSON array data of products. Each product should have 'name' (string) and 'category' (string). Extract categories logically based on the product. Do not add markdown blocks like ```json."
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.ARRAY,
            items: {
              type: import_genai.Type.OBJECT,
              properties: {
                name: {
                  type: import_genai.Type.STRING,
                  description: "Name of the product"
                },
                category: {
                  type: import_genai.Type.STRING,
                  description: "Logical category of the product, such as INDOSAT, TELKOMSEL, SMARTFREN, or PULSA."
                },
                hargaModal: {
                  type: import_genai.Type.NUMBER,
                  description: "Capital price (if visible), else 0"
                },
                hargaJual: {
                  type: import_genai.Type.NUMBER,
                  description: "Selling price (if visible), else 0"
                },
                stok: {
                  type: import_genai.Type.NUMBER,
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
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
