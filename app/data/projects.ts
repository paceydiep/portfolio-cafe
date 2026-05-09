export interface Project {
  slug: string;
  name: string;
  tag: string;
  year: string;
  description: string;
  role: string;
  tools: string[];
  overview: string;
  challenge: string;
  solution: string;
}

export const projects: Project[] = [
  {
    slug: "brand-identity-co",
    name: "Brand Identity Co.",
    tag: "Branding / Identity",
    year: "2024",
    description: "A complete visual identity system for a modern wellness brand.",
    role: "Lead Designer",
    tools: ["Figma", "Illustrator", "After Effects"],
    overview:
      "Developed a full brand identity system from logo to brand guidelines, encompassing typography, color systems, and motion principles.",
    challenge:
      "The client needed a brand that felt both premium and approachable — a balance that required careful typographic and color decisions.",
    solution:
      "Anchored the identity in a bespoke wordmark with geometric underpinnings, paired with a warm earth palette that conveyed trust without formality.",
  },
  {
    slug: "ritual-app",
    name: "Ritual — App Design",
    tag: "Product / UX",
    year: "2024",
    description: "Habit tracking reimagined around intentional daily rituals.",
    role: "Product Designer",
    tools: ["Figma", "Protopie", "React Native"],
    overview:
      "End-to-end product design for a habit-tracking application that frames routines as personal rituals rather than productivity tasks.",
    challenge:
      "Most habit apps feel clinical. The challenge was creating a product that felt warm, personal, and motivating rather than transactional.",
    solution:
      "Built a interaction model around journaling and reflection, with ambient visual cues that reward consistency over streaks.",
  },
  {
    slug: "atlas-editorial",
    name: "Atlas — Editorial",
    tag: "Editorial / Print",
    year: "2023",
    description: "A biannual print publication on culture and craft.",
    role: "Art Director",
    tools: ["InDesign", "Photoshop", "Figma"],
    overview:
      "Art direction and layout design for a 128-page biannual print magazine covering design, food, and music culture.",
    challenge:
      "Creating a consistent visual language across diverse editorial content — long-form essays, interviews, and visual essays — without becoming formulaic.",
    solution:
      "Established a flexible grid system with three distinct layout modes that could be mixed throughout the publication, providing variety within a coherent whole.",
  },
  {
    slug: "folio-web",
    name: "Folio — Web Experience",
    tag: "Web / Interaction",
    year: "2023",
    description: "An immersive digital portfolio for a photographer.",
    role: "Designer & Developer",
    tools: ["Next.js", "GSAP", "Three.js"],
    overview:
      "Designed and built a full-screen, scroll-driven portfolio site for a fine art photographer, treating each image as an environment rather than a thumbnail.",
    challenge:
      "Photography portfolios often fail to convey the atmosphere of the work — they display images but not the experience of being with them.",
    solution:
      "Used full-viewport imagery with parallax depth, ambient sound cues, and deliberate pacing through GSAP scroll triggers to create a contemplative viewing experience.",
  },
  {
    slug: "vessel-packaging",
    name: "Vessel — Packaging",
    tag: "Packaging / 3D",
    year: "2023",
    description: "Ceramic-inspired packaging system for a specialty coffee roaster.",
    role: "Designer",
    tools: ["Illustrator", "Blender", "Figma"],
    overview:
      "Packaging design system for a specialty coffee roaster — 6 SKUs across whole bean and ground formats — with a tactile, craft-forward aesthetic.",
    challenge:
      "Coffee packaging is crowded. The brief required standing out at shelf while maintaining the quiet confidence of a premium product.",
    solution:
      "Drew from ceramic and natural dye aesthetics — matte stock, deboss texture, and a restrained color palette tied to each origin's terroir.",
  },
];
