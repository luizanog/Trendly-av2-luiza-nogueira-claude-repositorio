/* data.jsx — categories, cover gradients, seed trends, persistence + image helpers */

const CATEGORIES = [
  "UI/UX", "Branding", "Tipografia", "Cor", "Motion", "IA & Design", "3D", "Ilustração",
];

// On-brand gradient covers used when a trend has no uploaded image.
const COVERS = [
  "linear-gradient(135deg, oklch(72% 0.15 252), oklch(80% 0.11 300))",
  "linear-gradient(135deg, oklch(78% 0.12 300), oklch(82% 0.13 332))",
  "linear-gradient(135deg, oklch(84% 0.09 205), oklch(74% 0.14 262))",
  "linear-gradient(140deg, oklch(85% 0.10 62), oklch(74% 0.16 32))",
  "linear-gradient(135deg, oklch(58% 0.20 295), oklch(74% 0.13 262))",
  "linear-gradient(140deg, oklch(88% 0.12 92), oklch(82% 0.12 132))",
  "linear-gradient(135deg, oklch(80% 0.13 332), oklch(74% 0.14 262))",
  "linear-gradient(135deg, oklch(76% 0.13 222), oklch(86% 0.09 200))",
];
const coverFor = (i) => COVERS[((i % COVERS.length) + COVERS.length) % COVERS.length];

const SEED = [
  {
    id: "s1", title: "Glassmorphism calmo", category: "UI/UX", cover: 0, example: true,
    desc: "Camadas translúcidas com desfoque suave e luz difusa. Profundidade sem ruído visual — ideal para painéis e onboarding.",
    briefing: "Use em telas de boas-vindas e dashboards. Mantenha contraste do texto ≥ 4.5:1 sobre o vidro; limite o blur a 1–2 camadas para não pesar o render.",
    author: "Marina C.", saves: 248, created: Date.now() - 1000 * 60 * 60 * 26,
  },
  {
    id: "s2", title: "Gradientes aurora", category: "Cor", cover: 2, example: true,
    desc: "Transições amplas de azul a lavanda e pêssego, como uma aurora. Fundo expressivo que ainda respira.",
    briefing: "Aplique como pano de fundo de hero e seções de destaque. Fixe a saturação e varie só o matiz para manter harmonia entre telas.",
    author: "Equipe Trendly", saves: 511, created: Date.now() - 1000 * 60 * 60 * 50,
  },
  {
    id: "s3", title: "Tipografia variável expressiva", category: "Tipografia", cover: 3, example: true,
    desc: "Pesos que respondem ao contexto: títulos encorpados, leitura leve. Hierarquia construída pelo eixo da fonte.",
    briefing: "Defina 3 pesos máximos por tela. Use o eixo óptico para tamanhos grandes e ganhe ritmo sem trocar de família tipográfica.",
    author: "Diego R.", saves: 187, created: Date.now() - 1000 * 60 * 60 * 73,
  },
  {
    id: "s4", title: "IA como copiloto de layout", category: "IA & Design", cover: 4, example: true,
    desc: "Sugestões assistidas que organizam grids e variações enquanto o designer mantém o controle final.",
    briefing: "Posicione a IA como assistência, nunca substituição. Mostre sempre a origem da sugestão e permita desfazer em um clique.",
    author: "Equipe Trendly", saves: 423, created: Date.now() - 1000 * 60 * 60 * 8,
  },
  {
    id: "s5", title: "Micro-motion com propósito", category: "Motion", cover: 7, example: true,
    desc: "Animações curtas que explicam o estado da interface. Movimento a serviço da compreensão, não da decoração.",
    briefing: "Use 150–250ms com easing suave. Anime entrada de conteúdo e confirmações; evite loops infinitos em conteúdo de leitura.",
    author: "Sofia L.", saves: 96, created: Date.now() - 1000 * 60 * 60 * 120,
  },
];

const STORE_KEY = "trendly.trends.v1";
const SAVED_KEY = "trendly.saved.v1";

function loadTrends() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return SEED.slice();
}
function persistTrends(list) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch (e) {}
}
function loadSaved() {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY)) || []; } catch (e) { return []; }
}
function persistSaved(ids) {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(ids)); } catch (e) {}
}

// Downscale an uploaded image to a data URL (max edge ~1100px) so it fits localStorage.
function fileToDataURL(file, maxEdge = 1100) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        const scale = Math.min(1, maxEdge / Math.max(w, h));
        w = Math.round(w * scale); h = Math.round(h * scale);
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        try { resolve(c.toDataURL("image/jpeg", 0.85)); }
        catch (e) { resolve(reader.result); }
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "agora";
  const m = Math.floor(s / 60); if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60); if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24); if (d < 7) return `${d} d`;
  const w = Math.floor(d / 7); if (w < 5) return `${w} sem`;
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

Object.assign(window, {
  CATEGORIES, COVERS, coverFor, SEED,
  loadTrends, persistTrends, loadSaved, persistSaved, fileToDataURL, timeAgo,
});
