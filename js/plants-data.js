// Built-in care table.
//
// Each entry:
//   name     – scientific name (species "Genus species", or just "Genus", or a Family)
//   rank     – "species" | "genus" | "family"  (how specific the entry is)
//   common   – common names, used for matching typed names and for display
//   days     – base watering interval in days (medium light, medium pot, spring/summer)
//   tox      – pet toxicity: "toxic" | "mild" | "safe"  (cats & dogs; see ASPCA for details)
//   tip      – soil check advice
//   synonyms – older/alternate scientific names Pl@ntNet might return
//
// Intervals are starting points, not rules — the soil check always wins.

const TOP_INCH = "Water when the top inch (2–3 cm) of soil is dry.";
const HALF_DRY = "Water when the top half of the pot is dry.";
const BONE_DRY = "Let the soil dry out completely, then water deeply.";
const EVEN_MOIST = "Keep soil lightly moist — water as soon as the surface feels dry.";
const HERB = "Herbs in pots dry fast. Water when the surface is dry; never let it fully dry out.";

export const DEFAULT_CARE = {
  name: "Unknown plant",
  rank: "default",
  common: [],
  days: 7,
  tox: null,
  tip: TOP_INCH,
};

export const PLANTS = [
  // ── Aroids (Araceae) ───────────────────────────────────────────────
  { name: "Epipremnum aureum", rank: "species", common: ["pothos", "golden pothos", "devil's ivy", "money plant"], days: 7, tox: "toxic", tip: TOP_INCH + " Droopy leaves = thirsty." },
  { name: "Epipremnum", rank: "genus", common: ["pothos"], days: 7, tox: "toxic", tip: TOP_INCH },
  { name: "Scindapsus pictus", rank: "species", common: ["satin pothos", "silver pothos"], days: 9, tox: "toxic", tip: HALF_DRY + " Leaves curl when thirsty." },
  { name: "Monstera deliciosa", rank: "species", common: ["monstera", "swiss cheese plant"], days: 7, tox: "toxic", tip: "Water when the top 2 inches (5 cm) are dry." },
  { name: "Monstera", rank: "genus", common: ["monstera"], days: 7, tox: "toxic", tip: "Water when the top 2 inches (5 cm) are dry." },
  { name: "Rhaphidophora tetrasperma", rank: "species", common: ["mini monstera"], days: 7, tox: "toxic", tip: TOP_INCH },
  { name: "Philodendron hederaceum", rank: "species", common: ["heartleaf philodendron", "philodendron"], days: 7, tox: "toxic", tip: TOP_INCH },
  { name: "Philodendron", rank: "genus", common: ["philodendron"], days: 7, tox: "toxic", tip: TOP_INCH },
  { name: "Zamioculcas zamiifolia", rank: "species", common: ["zz plant", "zz", "zanzibar gem"], days: 14, tox: "toxic", tip: BONE_DRY + " Rhizomes store water — overwatering is the main risk." },
  { name: "Spathiphyllum wallisii", rank: "species", common: ["peace lily"], days: 6, tox: "toxic", tip: "Water when the top inch is dry or leaves just start to droop." },
  { name: "Spathiphyllum", rank: "genus", common: ["peace lily"], days: 6, tox: "toxic", tip: "Water when the top inch is dry or leaves just start to droop." },
  { name: "Syngonium podophyllum", rank: "species", common: ["arrowhead plant", "syngonium"], days: 6, tox: "toxic", tip: TOP_INCH },
  { name: "Aglaonema", rank: "genus", common: ["chinese evergreen", "aglaonema"], days: 9, tox: "toxic", tip: HALF_DRY },
  { name: "Dieffenbachia", rank: "genus", common: ["dumb cane", "dieffenbachia"], days: 7, tox: "toxic", tip: TOP_INCH },
  { name: "Anthurium", rank: "genus", common: ["anthurium", "flamingo flower"], days: 7, tox: "toxic", tip: TOP_INCH },
  { name: "Alocasia", rank: "genus", common: ["alocasia", "elephant ear"], days: 7, tox: "toxic", tip: TOP_INCH + " Sulks (drops leaves) if soggy." },
  { name: "Araceae", rank: "family", common: [], days: 7, tox: "toxic", tip: TOP_INCH },

  // ── Snake plants, dracaenas, palms ─────────────────────────────────
  { name: "Dracaena trifasciata", rank: "species", common: ["snake plant", "mother-in-law's tongue", "sansevieria"], days: 14, tox: "toxic", tip: BONE_DRY, synonyms: ["Sansevieria trifasciata"] },
  { name: "Sansevieria", rank: "genus", common: ["snake plant", "sansevieria"], days: 14, tox: "toxic", tip: BONE_DRY },
  { name: "Dracaena marginata", rank: "species", common: ["dragon tree", "madagascar dragon tree"], days: 10, tox: "toxic", tip: HALF_DRY },
  { name: "Dracaena", rank: "genus", common: ["dracaena", "corn plant"], days: 10, tox: "toxic", tip: HALF_DRY },
  { name: "Chamaedorea elegans", rank: "species", common: ["parlor palm", "parlour palm"], days: 7, tox: "safe", tip: TOP_INCH },
  { name: "Dypsis lutescens", rank: "species", common: ["areca palm", "butterfly palm"], days: 6, tox: "safe", tip: TOP_INCH },
  { name: "Howea forsteriana", rank: "species", common: ["kentia palm"], days: 9, tox: "safe", tip: HALF_DRY },
  { name: "Beaucarnea recurvata", rank: "species", common: ["ponytail palm"], days: 14, tox: "safe", tip: BONE_DRY },
  { name: "Yucca", rank: "genus", common: ["yucca"], days: 14, tox: "toxic", tip: BONE_DRY },
  { name: "Aspidistra elatior", rank: "species", common: ["cast iron plant"], days: 12, tox: "safe", tip: HALF_DRY },
  { name: "Chlorophytum comosum", rank: "species", common: ["spider plant"], days: 7, tox: "safe", tip: TOP_INCH + " Brown tips often mean tap-water minerals, not thirst." },

  // ── Figs & trees ───────────────────────────────────────────────────
  { name: "Ficus lyrata", rank: "species", common: ["fiddle leaf fig", "fiddle-leaf fig"], days: 7, tox: "toxic", tip: "Water when the top 2 inches (5 cm) are dry. Hates being moved and soggy roots." },
  { name: "Ficus elastica", rank: "species", common: ["rubber plant", "rubber tree"], days: 8, tox: "toxic", tip: HALF_DRY },
  { name: "Ficus benjamina", rank: "species", common: ["weeping fig"], days: 7, tox: "toxic", tip: TOP_INCH },
  { name: "Ficus", rank: "genus", common: ["ficus", "fig"], days: 7, tox: "toxic", tip: TOP_INCH },
  { name: "Schefflera arboricola", rank: "species", common: ["umbrella plant", "dwarf umbrella tree", "schefflera"], days: 9, tox: "toxic", tip: HALF_DRY },
  { name: "Pachira aquatica", rank: "species", common: ["money tree", "pachira"], days: 9, tox: "safe", tip: HALF_DRY },
  { name: "Strelitzia", rank: "genus", common: ["bird of paradise"], days: 8, tox: "toxic", tip: TOP_INCH },

  // ── Calatheas & friends (Marantaceae) ──────────────────────────────
  { name: "Goeppertia", rank: "genus", common: ["calathea", "rattlesnake plant"], days: 5, tox: "safe", tip: EVEN_MOIST + " Use filtered or rain water if leaf edges crisp." },
  { name: "Calathea", rank: "genus", common: ["calathea"], days: 5, tox: "safe", tip: EVEN_MOIST + " Use filtered or rain water if leaf edges crisp." },
  { name: "Maranta leuconeura", rank: "species", common: ["prayer plant"], days: 5, tox: "safe", tip: EVEN_MOIST },
  { name: "Marantaceae", rank: "family", common: [], days: 5, tox: "safe", tip: EVEN_MOIST },

  // ── Ferns ──────────────────────────────────────────────────────────
  { name: "Nephrolepis exaltata", rank: "species", common: ["boston fern", "fern"], days: 3, tox: "safe", tip: EVEN_MOIST + " Never let it dry out fully." },
  { name: "Nephrolepis", rank: "genus", common: ["sword fern"], days: 3, tox: "safe", tip: EVEN_MOIST },
  { name: "Adiantum", rank: "genus", common: ["maidenhair fern"], days: 3, tox: "safe", tip: EVEN_MOIST + " Very unforgiving of drying out." },
  { name: "Asplenium nidus", rank: "species", common: ["bird's nest fern"], days: 5, tox: "safe", tip: TOP_INCH + " Water around the rosette, not into the center." },
  { name: "Platycerium", rank: "genus", common: ["staghorn fern"], days: 7, tox: "safe", tip: "Soak the mount/root ball when it feels light and dry." },

  // ── Trailing & small foliage ───────────────────────────────────────
  { name: "Pilea peperomioides", rank: "species", common: ["chinese money plant", "pilea", "ufo plant"], days: 7, tox: "safe", tip: HALF_DRY },
  { name: "Peperomia", rank: "genus", common: ["peperomia", "radiator plant", "baby rubber plant"], days: 10, tox: "safe", tip: HALF_DRY + " Semi-succulent — err on the dry side." },
  { name: "Hoya", rank: "genus", common: ["hoya", "wax plant"], days: 10, tox: "safe", tip: "Let soil dry almost completely. Thick leaves soften when thirsty." },
  { name: "Hedera helix", rank: "species", common: ["english ivy", "ivy"], days: 6, tox: "toxic", tip: TOP_INCH },
  { name: "Tradescantia", rank: "genus", common: ["wandering dude", "inch plant", "tradescantia"], days: 6, tox: "mild", tip: TOP_INCH },
  { name: "Ceropegia woodii", rank: "species", common: ["string of hearts"], days: 12, tox: "safe", tip: BONE_DRY },
  { name: "Curio rowleyanus", rank: "species", common: ["string of pearls"], days: 14, tox: "toxic", tip: "Water when pearls look slightly wrinkled. Soil should be fully dry.", synonyms: ["Senecio rowleyanus"] },
  { name: "Fittonia albivenis", rank: "species", common: ["nerve plant", "fittonia"], days: 4, tox: "safe", tip: EVEN_MOIST + " Faints dramatically when dry, recovers after a drink." },
  { name: "Begonia", rank: "genus", common: ["begonia"], days: 6, tox: "toxic", tip: TOP_INCH + " Water the soil, not the leaves." },

  // ── Flowering ──────────────────────────────────────────────────────
  { name: "Phalaenopsis", rank: "genus", common: ["moth orchid", "orchid", "phalaenopsis"], days: 7, tox: "safe", tip: "Water when roots in the pot turn silvery and the bark is dry. Soak, then drain fully." },
  { name: "Orchidaceae", rank: "family", common: ["orchid"], days: 7, tox: "safe", tip: "Water when the potting bark is dry. Soak, then drain fully." },
  { name: "Saintpaulia", rank: "genus", common: ["african violet"], days: 6, tox: "safe", tip: TOP_INCH + " Water from below; keep water off the leaves.", synonyms: ["Streptocarpus ionanthus"] },
  { name: "Schlumbergera", rank: "genus", common: ["christmas cactus", "thanksgiving cactus", "holiday cactus"], days: 10, tox: "safe", tip: TOP_INCH + " A forest cactus — likes more water than desert cacti." },
  { name: "Kalanchoe", rank: "genus", common: ["kalanchoe", "flaming katy"], days: 14, tox: "toxic", tip: BONE_DRY },
  { name: "Euphorbia milii", rank: "species", common: ["crown of thorns"], days: 12, tox: "toxic", tip: BONE_DRY },
  { name: "Tillandsia", rank: "genus", common: ["air plant"], days: 7, tox: "safe", tip: "No soil! Soak 20–30 minutes weekly, then dry upside-down." },
  { name: "Bromeliaceae", rank: "family", common: ["bromeliad"], days: 10, tox: "safe", tip: "Keep a little water in the central cup; water soil when dry." },

  // ── Succulents & cacti ─────────────────────────────────────────────
  { name: "Aloe vera", rank: "species", common: ["aloe", "aloe vera"], days: 14, tox: "toxic", tip: BONE_DRY },
  { name: "Aloe", rank: "genus", common: ["aloe"], days: 14, tox: "toxic", tip: BONE_DRY },
  { name: "Crassula ovata", rank: "species", common: ["jade plant", "jade"], days: 14, tox: "toxic", tip: BONE_DRY + " Wrinkly leaves = thirsty." },
  { name: "Echeveria", rank: "genus", common: ["echeveria", "hens and chicks"], days: 14, tox: "safe", tip: BONE_DRY },
  { name: "Haworthiopsis", rank: "genus", common: ["zebra haworthia", "haworthia"], days: 14, tox: "safe", tip: BONE_DRY, synonyms: ["Haworthia"] },
  { name: "Sedum morganianum", rank: "species", common: ["burro's tail", "donkey's tail"], days: 14, tox: "safe", tip: BONE_DRY },
  { name: "Crassulaceae", rank: "family", common: ["succulent", "succulents"], days: 14, tox: null, tip: BONE_DRY },
  { name: "Opuntia", rank: "genus", common: ["prickly pear", "bunny ears cactus"], days: 21, tox: "safe", tip: BONE_DRY + " Spines can injure pets." },
  { name: "Mammillaria", rank: "genus", common: ["pincushion cactus"], days: 21, tox: "safe", tip: BONE_DRY },
  { name: "Cactaceae", rank: "family", common: ["cactus", "cacti"], days: 21, tox: "safe", tip: BONE_DRY + " In winter, barely water at all." },

  // ── Herbs ──────────────────────────────────────────────────────────
  { name: "Ocimum basilicum", rank: "species", common: ["basil", "sweet basil"], days: 2, tox: "safe", tip: HERB },
  { name: "Mentha", rank: "genus", common: ["mint", "spearmint", "peppermint"], days: 3, tox: "toxic", tip: HERB },
  { name: "Salvia rosmarinus", rank: "species", common: ["rosemary"], days: 10, tox: "safe", tip: "Let the top half dry out — rosemary hates wet feet.", synonyms: ["Rosmarinus officinalis"] },
  { name: "Thymus vulgaris", rank: "species", common: ["thyme"], days: 8, tox: "safe", tip: "Let the top inch dry out; prefers lean, dry-ish soil." },
  { name: "Petroselinum crispum", rank: "species", common: ["parsley"], days: 3, tox: "toxic", tip: HERB },
  { name: "Coriandrum sativum", rank: "species", common: ["cilantro", "coriander"], days: 3, tox: "safe", tip: HERB },
  { name: "Allium schoenoprasum", rank: "species", common: ["chives"], days: 3, tox: "toxic", tip: HERB },
  { name: "Lavandula", rank: "genus", common: ["lavender"], days: 10, tox: "mild", tip: "Let soil dry well between waterings." },
];
