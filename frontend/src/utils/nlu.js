import * as fuzzball from 'fuzzball';

// Handle CJS/ESM interop differences
const fb = fuzzball.default || fuzzball;
// Debug log to confirm loading
console.log('NLU Engine Loaded. Fuzzball:', !!fb);

/**
 * NLU Engine for ShopSense
 * Handles intent classification and entity extraction for voice commands.
 */

export const NLU = {
  /**
   * Parse a voice input string and return intent and entities.
   * @param {string} text - The spoken text
   * @param {Array} products - List of available products to match against
   * @returns {Object} { intent, data }
   */
  parse: (text, products) => {
    if (!text) return { intent: 'unknown' };

    const lowerText = text.toLowerCase().trim();

    // 1. Detect Core Intents (Checkout, Generate Bill)
    if (
      lowerText.includes('checkout') ||
      lowerText.includes('complete') ||
      lowerText.includes('save order')
    ) {
      return { intent: 'checkout' };
    }

    if (
      lowerText.includes('generate bill') ||
      lowerText.includes('preview') ||
      lowerText.includes('download') ||
      lowerText.includes('print')
    ) {
      return { intent: 'generate_bill', directDownload: true }; // Defaulting to direct for now based on user pref
    }

    // 2. Clear Cart Intent
    if (lowerText.includes('clear cart') || lowerText.includes('empty cart')) {
      return { intent: 'clear_cart' };
    }

    // 3. Update Quantity Intent
    // "Change Rice quantity to 5", "Set Sugar to 10"
    if (
      lowerText.includes('quantity') ||
      lowerText.startsWith('set') ||
      lowerText.startsWith('change')
    ) {
      // Try to extract number (new quantity)
      const qtyMatch = lowerText.match(/(\d+)/);
      if (qtyMatch) {
        const newQty = parseInt(qtyMatch[1]);
        // Remove keywords and number to parse product name
        const cleanText = lowerText
          .replace(/quantity|set|change|to|of/g, '')
          .replace(/\d+/, '')
          .trim();

        if (products && products.length > 0) {
          const productNames = products.map((p) => p.name);
          const results = fb.extract(cleanText, productNames, {
            scorer: fb.token_set_ratio,
            limit: 1,
          });
          if (results.length > 0) {
            const [matchStr, score, index] = results[0];
            if (score > 60) {
              return {
                intent: 'update_quantity',
                product: products[index],
                quantity: newQty,
                originalTerm: cleanText,
              };
            }
          }
        }
      }
    }

    // 4. Remove Item Intent
    // "Remove Rice", "Delete 2kg Sugar"
    if (lowerText.startsWith('remove') || lowerText.startsWith('delete')) {
      const cleanText = lowerText.replace(/^(remove|delete)\s+/, '').trim();
      if (!products || products.length === 0) return { intent: 'unknown' };

      const productNames = products.map((p) => p.name);
      // Using partial_ratio for better matching on "remove rice" vs "Rice (1kg)"
      const results = fb.extract(cleanText, productNames, { scorer: fb.token_set_ratio, limit: 1 });

      if (results.length > 0) {
        const [matchStr, score, index] = results[0];
        if (score > 60) {
          return {
            intent: 'remove_from_cart',
            product: products[index],
            originalTerm: cleanText,
          };
        }
      }
    }

    // 4. Product Search / Add Intent

    // Extract potential quantity (number)
    const qtyMatch = lowerText.match(/^(\d+)\s*/); // Number at start? "2 rice"
    const addQtyMatch = lowerText.match(/add\s+(\d+)\s*/); // "Add 2 rice"

    let quantity = 1;
    let cleanText = lowerText;

    if (addQtyMatch) {
      quantity = parseInt(addQtyMatch[1]);
      cleanText = lowerText.replace(addQtyMatch[0], '');
    } else if (qtyMatch) {
      quantity = parseInt(qtyMatch[1]);
      cleanText = lowerText.replace(qtyMatch[0], '');
    } else {
      // Remove "add" keyword if present to clean up search
      cleanText = lowerText.replace(/^add\s+/, '');
    }

    if (!products || products.length === 0) {
      return { intent: 'search', term: cleanText };
    }

    const productNames = products.map((p) => p.name);

    // using fuzzball.extract to find best match
    // fuzzball.extract(query, choices, options)
    const results = fb.extract(cleanText, productNames, { scorer: fb.ratio, limit: 1 });
    // results: [[matchStr, score, index]]

    if (results.length > 0) {
      const [matchStr, score, index] = results[0];

      console.log(`NLU Match: "${cleanText}" -> "${matchStr}" (Score: ${score})`);

      // Threshold check (e.g., 60%)
      if (score > 60) {
        return {
          intent: 'add_to_cart',
          product: products[index],
          quantity: quantity,
          originalTerm: cleanText,
        };
      }
    }

    // If no good match, fallback to search intent
    return { intent: 'search', term: cleanText };
  },
};
