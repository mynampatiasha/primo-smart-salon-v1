/* =========================================================
   PRIMO SERVICE CATALOG — single source of truth for the
   Face Analyser. Used by face-analyser.html (browser) AND
   api/worker.js (the AI proxy), so the AI can only ever
   recommend services that exist here.

   Prices are copied from the Menu section of index.html.
   - Facial tier prices come from the package breakdowns
     (the Skin menu card shows no price for them).
   - price: null  → shown as "Price at salon".
   Update this file whenever the menu changes.
   ========================================================= */
(function (root) {
  const CATALOG = {
    version: "2026-11-11",
    currency: "₹",
    services: [
      // ---------- SKIN ----------
      { id: "hydra_facial", name: "Hydra Facial", category: "skin", price: 1299,
        goals: ["skincare", "makeup", "full"],
        addresses: "Deep cleanse, hydration and glow. Suits a dull, tired or dehydrated-looking complexion, visible congestion, or prep before an event." },
      { id: "facial_elite", name: "Elite Facial", category: "skin", price: 499,
        goals: ["skincare", "full"],
        addresses: "Premium facial for overall radiance and a more even-looking tone." },
      { id: "facial_pro", name: "Pro Facial", category: "skin", price: 399,
        goals: ["skincare", "full"],
        addresses: "Mid-tier facial for brightness and refreshed-looking skin." },
      { id: "facial_essential", name: "Essential Facial", category: "skin", price: 299,
        goals: ["skincare", "full"],
        addresses: "Entry facial for routine upkeep and a fresh look." },
      { id: "clean_up", name: "Clean Up", category: "skin", price: 149,
        goals: ["skincare", "grooming", "full"],
        addresses: "Quick cleanse and exfoliation for visible oiliness, shine or surface congestion." },
      { id: "d_tan", name: "D-Tan", category: "skin", price: 99,
        goals: ["skincare", "full"],
        addresses: "Reduces the look of sun tan and uneven tone between face and neck." },
      { id: "o2_facial", name: "O2 Treatment", category: "skin", price: 129,
        goals: ["skincare", "full"],
        addresses: "Oxygen treatment for a quick freshness boost on tired-looking skin." },
      { id: "bleach", name: "Bleach", category: "skin", price: 99,
        goals: ["skincare", "grooming"],
        addresses: "Lightens the look of fine facial hair and evens tone. Only suggest if the customer asked about grooming or tone." },

      // ---------- BROWS / GROOMING ----------
      { id: "brow_threading", name: "Eyebrow Filling & Threading", category: "grooming", price: null,
        goals: ["grooming", "makeup", "full"],
        addresses: "Shapes and defines brows to suit facial features." },
      { id: "waxing", name: "Waxing", category: "grooming", price: null,
        goals: ["grooming"],
        addresses: "Hair removal. Only suggest if the customer selected grooming." },
      { id: "trim_shave", name: "Trimming / Shaving", category: "grooming", price: 45,
        goals: ["grooming", "hair", "full"],
        addresses: "Beard trim, shave or neat-up of facial hair." },

      // ---------- HAIR ----------
      { id: "hair_cut", name: "Hair Cut", category: "hair", price: 95,
        goals: ["hair", "full"],
        addresses: "Cut and style chosen to complement face shape." },
      { id: "hair_spa_essential", name: "Hair Spa — Essential", category: "hair", price: 399,
        goals: ["hair", "full"],
        addresses: "Nourishing spa for hair that looks dry or frizzy." },
      { id: "hair_spa_pro", name: "Hair Spa — Pro", category: "hair", price: 499,
        goals: ["hair", "full"],
        addresses: "Deeper conditioning spa for dull or rough-looking hair." },
      { id: "hair_spa_elite", name: "Hair Spa — Elite", category: "hair", price: 599,
        goals: ["hair", "full"],
        addresses: "Most intensive spa for visibly damaged or very dry-looking hair." },
      { id: "scalp_treatment", name: "Hair & Scalp Treatment", category: "hair", price: null,
        goals: ["hair"],
        addresses: "Repair treatment for hair that looks damaged or dry." },
      { id: "straightening", name: "Hair Straightening", category: "hair", price: 999,
        goals: ["hair", "full"],
        addresses: "Smooth, sleek finish for frizzy or wavy hair, if the customer wants a straighter look." },
      { id: "loreal_colour", name: "L'Oréal Colour", category: "hair", price: 599,
        goals: ["hair", "full"],
        addresses: "Global colour matched to skin tone." },
      { id: "highlights", name: "Highlights", category: "hair", price: 499,
        goals: ["hair", "full"],
        addresses: "Adds dimension and brightness around the face." },
      { id: "streak_colour", name: "Streak Colour", category: "hair", price: 499,
        goals: ["hair", "full"],
        addresses: "Bold accent streaks for a statement look." },
      { id: "head_massage", name: "Head Massage", category: "hair", price: 99,
        goals: ["hair", "full"],
        addresses: "Relaxing add-on to any visit." },

      // ---------- MAKEUP / OCCASION ----------
      { id: "party_makeover", name: "Party Makeover", category: "makeup", price: 1499,
        goals: ["makeup", "full"],
        addresses: "Event-ready makeup and styling for parties and functions." },
      { id: "bridal_styling", name: "Bridal & Occasion Styling", category: "makeup", price: null,
        goals: ["makeup", "full"],
        addresses: "Full glam for weddings, shoots and celebrations. Suggest when the customer mentions a wedding or big event." },
      { id: "groom_package", name: "Groom Package", category: "makeup", price: 4999,
        goals: ["makeup", "grooming", "full"],
        addresses: "Complete grooming and styling for a groom. Suggest only if the customer mentions being a groom or a wedding." },

      // ---------- HANDS & FEET (not visible in a selfie) ----------
      { id: "mani_pedi_pro", name: "Manicure & Pedicure — Pro", category: "hands", price: null, priceLabel: "₹499 & ₹599",
        goals: ["full"],
        addresses: "Finishing touch for a full makeover. Never base this on the photo." },

      // ---------- PACKAGES ----------
      { id: "package_3", name: "Package 3 — Cut, Trim, Massage + Essential Facial", category: "package", price: 509,
        goals: ["full"],
        addresses: "Value bundle: hair cut, trim/shave, head massage and Essential Facial." },
      { id: "package_4", name: "Package 4 — + Pro Facial & Hair Colour", category: "package", price: 1099,
        goals: ["full"],
        addresses: "Bundle with Pro Facial and hair colour." },
      { id: "package_5", name: "Package 5 — + Elite Facial & Streaks/Highlights", category: "package", price: 1149,
        goals: ["full"],
        addresses: "Bundle with Elite Facial and streaks or highlights." },
      { id: "package_6", name: "Package 6 — + Hydra Facial & L'Oréal Colour", category: "package", price: 2029,
        goals: ["full"],
        addresses: "Top bundle: hair cut, trim, head massage, Hydra Facial and L'Oréal colour." }
    ]
  };

  CATALOG.byId = function (id) {
    return CATALOG.services.find(s => s.id === id) || null;
  };
  CATALOG.priceText = function (s) {
    if (s.priceLabel) return s.priceLabel;
    return s.price != null ? CATALOG.currency + s.price : "Price at salon";
  };

  root.PRIMO_CATALOG = CATALOG;
  if (typeof module !== "undefined" && module.exports) module.exports = CATALOG;
})(typeof globalThis !== "undefined" ? globalThis : this);
