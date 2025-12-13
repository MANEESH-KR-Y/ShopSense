import { pipeline, env } from '@xenova/transformers';
import * as fuzzball from 'fuzzball';

// Skip local model checks to avoid 404s in some environments
env.allowLocalModels = false;
env.useBrowserCache = true;

// Handle CJS/ESM interop differences
const fb = fuzzball.default || fuzzball;

/**
 * NLU Engine for ShopSense
 * Handles intent classification and entity extraction for voice commands.
 */

const translationMap = {
    // Products - Expanded with Transliterations
    "rice": ["chawal", "biyyam", "biyam", "biyamu", "akki", "aki", "arisi", "aris", "risi", "బియ్యం", "రాస్", "రైస్", "rice"],
    "lentils": ["dal", "daal", "kandipappu", "pappu", "bele", "paruppu", "parupu", "కందిపప్పు", "పప్పు", "దాల్", "డాల్", "dhal"],
    "flour": ["ata", "aata", "godhuma", "gothuma", "godhi", "maavu", "mavu", "గోధుమ పిండి", "పిండి", "ఆటా", "pindi"],
    "sugar": ["chinni", "cheeni", "chini", "panchadara", "panchdara", "sakkare", "sakare", "sarkarai", "sharkara", "పంచదార", "చక్కెర", "షుగర్", "sugar"],
    "milk": ["dudh", "doodh", "dud", "paalu", "palu", "haalu", "halu", "paal", "pal", "పాలు", "మిల్క్", "milk"],
    "oil": ["tel", "oil", "noone", "nune", "enne", "ennai", "enn", "నూనె", "ఆయిల్", "sunflower", "groundnut"],
    "salt": ["namak", "uppu", "upu", "ఉప్పు", "సాల్ట్", "salt"],
    "soap": ["sabun", "sabbu", "sabu", "soppu", "soap", "సబ్బు", "సోప్", "santoor", "lux", "cinthol"],
    "colgate": ["toothpaste", "paste", "brush", "కోల్గేట్", "పేస్ట్", "colgate"],
    "maggi": ["noodles", "noodle", "మాగీ", "నూడుల్స్", "maggi", "maggie"],

    // Intents (Verbs)
    "add to cart": ["add", "kavali", "kaavali", "kawali", "ivvandi", "vei", "vesko", "jodinchu", "కావాలి", "కావాలి", "ivvu", "pettu", "petu", "jodinchu", "తీసుకో", "add chey", "ivandi", "iwandi"],
    "remove from cart": ["remove", "delete", "theesey", "thisey", "thisi", "vaddu", "oddu", "theesi", "teesey", "తీసివేయి", "వద్దు", "delete chey"],
    "checkout": ["checkout", "payment", "pay", "dabulu", "money", "check out", "చెల్లింపు", "కొనుగోలు", "bill pay", "amount"],
    "generate bill": ["bill", "invoice", "receipt", "rasidu", "బిల్", "రసీదు", "bill chey", "bill ivvu", "bill kottu"],
    "clear cart": ["clear", "mottam theesey", "empty", "khali", "cart clear", "ఖాళీ చేయి"]
};

// Expanded Tenglish Number Map
const numberMap = {
    // English
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    // Telugu Script
    "ఒకటి": 1, "రెండు": 2, "మూడు": 3, "నాలుగు": 4, "ఐదు": 5, "ఆరు": 6, "ఏడు": 7, "ఎనిమిది": 8, "తొమ్మిది": 9, "పది": 10,
    "ఒక": 1,
    // Tenglish / Phonetic
    "okati": 1, "oka": 1,
    "rendu": 2, "rend": 2, "dho": 2,
    "moodu": 3, "mudu": 3, "muudu": 3, "teen": 3,
    "naalugu": 4, "nalugu": 4, "nalgu": 4, "char": 4,
    "aidu": 5, "aidhu": 5, "five": 5, "panch": 5,
    "aaru": 6, "aru": 6, "che": 6,
    "yedu": 7, "edu": 7, "saat": 7,
    "enimidi": 8, "enimithi": 8, "aath": 8,
    "tommidi": 9, "thommidi": 9, "nau": 9,
    "padi": 10, "padhi": 10, "das": 10
};

// Helper: Translate text using fuzzy matching AND number conversion
const fuzzyTranslate = (text) => {
    if (!text) return "";
    const terms = text.toLowerCase().split(/\s+/); // Split by whitespace

    // 1. First pass: Handle Multi-word phrases if possible (simplified here)
    // For now, we process word-by-word but could expand to n-grams.

    const translatedTerms = terms.map(term => {
        // 1. Check Number Map first (Exact Match)
        if (numberMap[term]) return numberMap[term].toString();

        // 2. Direct match
        for (const [english, localTerms] of Object.entries(translationMap)) {
            if (localTerms.includes(term)) return english;
        }
        // 3. Fuzzy match (WRatio is better for partial/mixed string similarity)
        for (const [english, localTerms] of Object.entries(translationMap)) {
            const results = fb.extract(term, localTerms, { scorer: fb.WRatio, limit: 1 });
            if (results.length > 0 && results[0][1] > 70) { // Slight bump in threshold for WRatio safety
                return english;
            }
        }
        return term;
    });

    return translatedTerms.join(" ");
};

// --- HUGGING FACE INFERENCE ---
let classifier = null;
const MODEL_NAME = 'Xenova/mobilebert-uncased-mnli'; // Small, fast zero-shot model

const CANDIDATE_LABELS = [
    'add to cart',
    'remove from cart',
    'checkout',
    'clear cart',
    'update quantity',
    'generate bill',
    'navigation',
    'search'
];

const loadModel = async () => {
    if (!classifier) {
        console.log("Loading HF Model...");
        classifier = await pipeline('zero-shot-classification', MODEL_NAME);
        console.log("HF Model Loaded!");
    }
    return classifier;
};
// ------------------------------

export const NLU = {
    /**
     * Parse a voice input string and return intent and entities.
     * @param {string} text - The spoken text
     * @param {Array} products - List of available products to match against
     * @returns {Object} { intent, data }
     */
    parse: async (text, products) => {
        if (!text) return { intent: 'unknown' };

        const lowerText = text.toLowerCase().trim();

        // 0. High Priority: Navigation (Regex Override)
        // AI models sometimes struggle with simple "Go to X" commands vs "Search X"
        if (lowerText.startsWith("go to") || lowerText.startsWith("open") || lowerText.startsWith("show") || lowerText.includes("navigate") || lowerText.includes("take me to")) {
            const target = lowerText.replace(/go to|open|show|navigate|take me to/g, "").trim();

            // Map target to route
            let route = null;
            if (target.includes("dashboard") || target.includes("home")) route = "/dashboard";
            else if (target.includes("billing") || target.includes("bill")) route = "/billing";
            else if (target.includes("inventory") || target.includes("stock") || target.includes("product")) route = "/inventory/products";
            else if (target.includes("profile") || target.includes("account")) route = "/profile";
            else if (target.includes("analytics") || target.includes("report")) route = "/analytics";

            if (route) {
                return { intent: 'navigation', route };
            }
        }

        // 1. Detect Core Intents (Checkout, Generate Bill)
        // This helps the English model understand "Remove Rice" instead of "Remove Biyyam"
        const translatedText = fuzzyTranslate(lowerText);
        console.log(`NLU Input: "${text}" -> Translated: "${translatedText}"`);

        // 2. Intent Classification (Hugging Face)
        try {
            const model = await loadModel();
            const output = await model(translatedText, CANDIDATE_LABELS);

            // output: { sequence: '...', labels: [...], scores: [...] }
            const topLabel = output.labels[0];
            const topScore = output.scores[0];

            console.log(`HF Intent: ${topLabel} (${(topScore * 100).toFixed(1)}%)`);

            // Threshold
            if (topScore < 0.4) {
                return { intent: 'search', term: translatedText }; // Fallback
            }

            // Map HF detected label to internal intent ID
            let intentId = 'search';
            switch (topLabel) {
                case 'checkout': intentId = 'checkout'; break;
                case 'generate bill': intentId = 'generate_bill'; break;
                case 'clear cart': intentId = 'clear_cart'; break;
                case 'add to cart': intentId = 'add_to_cart'; break;
                case 'remove from cart': intentId = 'remove_from_cart'; break;
                case 'update quantity': intentId = 'update_quantity'; break;
                case 'navigation': intentId = 'navigation'; break;
                default: intentId = 'search';
            }

            // 3. Entity Extraction (Rule/Fuzzy based on Intent)
            // Even with AI intent, we need precise product mapping.

            // ... (Extract Quantity) ...
            const qtyMatch = translatedText.match(/(\d+)/);
            const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;

            // Remove intent-like words AND UNITS to isolate entity
            // Added English, Tenglish, and Script units
            let cleanText = translatedText
                .replace(/add|remove|delete|update|change|quantity|set|to|of|cart|bill|checkout|generate|go to|open|show|navigate/g, "")
                .replace(/kilo|kilos|kgs|kg|gram|grams|gramulu|gm|gms|packet|packets|pkt|pkts|liter|liters|litre|litres|ltr|ltrs|piece|pieces/g, "")
                .replace(/కేజీ|కేజీలు|గ్రాము|గ్రాములు|ఫ్యాకెట్|ఫ్యాకెట్లు|లీటర్|లీటర్లు/g, "") // Telugu Script plurals
                .replace(/\d+/, "") // Remove number
                .replace(/\s+/g, " ")
                .trim();


            // Product Matching
            if (products && products.length > 0) {
                const productNames = products.map(p => p.name);
                // Use token_set_ratio for better partial matching (e.g. "Rice" matches "Basmati Rice")
                const results = fb.extract(cleanText, productNames, { scorer: fb.token_set_ratio, limit: 1 });

                if (results.length > 0) {
                    const [matchStr, score, index] = results[0];
                    console.log(`Entity Match: "${cleanText}" -> "${matchStr}" (${score})`);

                    if (score > 75) { // Strict threshold still safe with token_set_ratio
                        const product = products[index];
                        if (intentId === 'generate_bill') return { intent: 'generate_bill', directDownload: true };

                        if (intentId === 'checkout') return { intent: 'checkout' };
                        if (intentId === 'remove_from_cart') return { intent: 'remove_from_cart', product, quantity, originalTerm: cleanText };

                        // IMPLICIT ADD: If intent is 'search' or weak, but we have a STRONG product match + quantity, infer Add to Cart.
                        // "1kg rice" -> Intent: Search (likely) -> Product: Rice -> Action: Add to Cart.
                        return {
                            intent: 'add_to_cart', // Force Add
                            product,
                            quantity,
                            originalTerm: cleanText
                        };
                    }
                }
            }

            // Fallbacks for specific intents if no product found but intent is clear
            if (intentId === 'checkout') return { intent: 'checkout' };
            if (intentId === 'generate_bill') return { intent: 'generate_bill', directDownload: true };
            if (intentId === 'clear_cart') return { intent: 'clear_cart' };

            return { intent: 'search', term: translatedText };

        } catch (err) {
            console.error("HF Inference Failed:", err);
            return { intent: 'search', term: translatedText }; // Fail safe
        }
    }
};
