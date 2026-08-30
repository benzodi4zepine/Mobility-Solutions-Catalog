import { Router, type IRouter } from "express";
import {
  GetCatalogCategoryResponse,
  GetCatalogOverviewResponse,
  GetLocationsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const buildCategories = () => [
  {
    slug: "prosthetics",
    title: "Prosthetic solutions",
    titleArabic: "الأطراف الاصطناعية",
    description:
      "Confident movement, engineered around each person. From advanced knee joints to responsive carbon feet and bionic upper limbs.",
    solutionCount: prostheticSolutions.length,
    accent: "cobalt",
  },
  {
    slug: "orthotics",
    title: "Orthotic solutions",
    titleArabic: "الأجهزة التعويضية والتعديلية",
    description:
      "Thoughtful support for alignment, healing, and everyday independence — from spinal bracing to custom foot orthotics.",
    solutionCount: orthoticSolutions.length,
    accent: "teal",
  },
];

const prostheticSolutions = [
  {
    id: "smart-knees",
    title: "Microprocessor & smart knee joints",
    titleArabic: "مفاصل الركبة الذكية",
    category: "Lower limb",
    description:
      "Adaptive stance and swing control that responds to changing pace, terrain, and confidence.",
    tags: ["Microprocessor", "Above knee", "Adaptive"],
    imageKey: "smart-knee",
    featured: true,
  },
  {
    id: "carbon-feet",
    title: "Active carbon feet",
    titleArabic: "أقدام الكربون النشطة",
    category: "Lower limb",
    description:
      "Lightweight energy return for a smoother roll-over and a more natural rhythm.",
    tags: ["Energy return", "Carbon", "Below knee"],
    imageKey: "carbon-foot",
    featured: true,
  },
  {
    id: "revofit-sockets",
    title: "RevoFit & RevoLock sockets",
    titleArabic: "تقنيات التجاويف القابلة للضبط",
    category: "Socket technology",
    description:
      "Micro-adjustable fit with BOA-style dials, suction, and suspension options.",
    tags: ["RevoFit", "RevoLock", "Suspension"],
    imageKey: "socket",
    featured: true,
  },
  {
    id: "bionic-hands",
    title: "Myoelectric & bionic hands",
    titleArabic: "الأيدي الكهربائية والبيونية",
    category: "Upper limb",
    description:
      "Intuitive control and precise grip patterns for the moments that matter.",
    tags: ["Myoelectric", "Bionic", "Upper limb"],
    imageKey: "bionic-hand",
    featured: false,
  },
  {
    id: "digital-fitting",
    title: "Digital scanning & CAD/CAM",
    titleArabic: "المسح الرقمي والتصميم CAD/CAM",
    category: "Digital workflow",
    description:
      "A precise digital pathway from 3D scan to custom design, fitting, and refinement.",
    tags: ["3D scan", "CAD/CAM", "Precision"],
    imageKey: "digital-scan",
    featured: false,
  },
  {
    id: "passive-upper-limb",
    title: "Mechanical & cosmetic limbs",
    titleArabic: "الأطراف الميكانيكية والتجميلية",
    category: "Upper limb",
    description:
      "Reliable mechanical function and natural-looking cosmetic options, shaped around lifestyle.",
    tags: ["Mechanical", "Cosmetic", "Custom"],
    imageKey: "passive-limb",
    featured: false,
  },
];

const orthoticSolutions = [
  {
    id: "scoliosis-bracing",
    title: "Spinal & trunk bracing",
    titleArabic: "مشادات العمود الفقري",
    category: "Spinal & trunk",
    description:
      "Custom support for scoliosis management, post-surgical recovery, and trunk stability.",
    tags: ["Scoliosis", "Post-surgical", "Custom"],
    imageKey: "spinal-brace",
    featured: true,
  },
  {
    id: "dynamic-carbon-afo",
    title: "Dynamic carbon AFOs",
    titleArabic: "أجهزة AFO الكربونية الديناميكية",
    category: "Lower limb",
    description:
      "Lightweight gait support that stores and returns energy through the stride.",
    tags: ["AFO", "Carbon", "Gait"],
    imageKey: "carbon-afo",
    featured: true,
  },
  {
    id: "custom-kafo",
    title: "Custom KAFOs",
    titleArabic: "أجهزة KAFO المخصصة",
    category: "Lower limb",
    description:
      "Purpose-built alignment and stability for complex lower-limb needs.",
    tags: ["KAFO", "Alignment", "Stability"],
    imageKey: "kafo",
    featured: false,
  },
  {
    id: "3d-insoles",
    title: "Custom 3D insoles",
    titleArabic: "الضبانات الطبية ثلاثية الأبعاد",
    category: "Foot orthotics",
    description:
      "Digitally designed insoles with pressure-aware offloading and daily comfort.",
    tags: ["3D", "Pressure care", "Comfort"],
    imageKey: "insole",
    featured: true,
  },
  {
    id: "diabetic-foot-care",
    title: "Diabetic foot care",
    titleArabic: "العناية بالقدم السكري",
    category: "Foot orthotics",
    description:
      "Protection-focused solutions designed to reduce pressure and support safer mobility.",
    tags: ["Diabetic care", "Offloading", "Protection"],
    imageKey: "diabetic-care",
    featured: false,
  },
];

const metrics = [
  { value: "25+", label: "Years of clinical craft", labelArabic: "أكثر من ٢٥ عاماً من الخبرة" },
  { value: "4.9/5", label: "Patient experience", labelArabic: "تقييم تجربة المرضى" },
  { value: "48h", label: "Referral response", labelArabic: "الرد على التحويل خلال ٤٨ ساعة" },
];

const locations = [
  {
    id: "amman",
    name: "Mafaz Mobility Center",
    nameArabic: "مركز مفاز للأطراف الاصطناعية والأجهزة المساندة",
    address: "Alrazi Street, Amman, Jordan",
    phone: "+962795185080",
    whatsapp: "962795185080",
    hours: "Sat–Thu · 8:00–16:00",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Alrazi+Street%2C+Amman%2C+Jordan",
    isPrimary: true,
  },
];

const withCategorySlug = <T,>(solutions: T[], categorySlug: string) =>
  solutions.map((solution) => ({ ...solution, categorySlug }));

const prosthetics = withCategorySlug(prostheticSolutions, "prosthetics");
const orthotics = withCategorySlug(orthoticSolutions, "orthotics");
const categories = buildCategories();

router.get("/catalog/overview", (_req, res) => {
  const data = GetCatalogOverviewResponse.parse({
    categories,
    featuredSolutions: [...prosthetics, ...orthotics].filter(
      (solution) => solution.featured,
    ),
    metrics,
  });

  res.json(data);
});

router.get("/catalog/categories/:slug", (req, res) => {
  const slug = req.params.slug;
  const category =
    slug === "prosthetics"
      ? {
          slug,
          title: "Prosthetic solutions",
          titleArabic: "الأطراف الاصطناعية",
          description: categories[0].description,
          solutions: prosthetics,
          workflow: [
            "Understand your goals",
            "Scan, assess, and measure",
            "Design and fit",
            "Train, refine, and follow up",
          ],
        }
      : slug === "orthotics"
        ? {
            slug,
            title: "Orthotic solutions",
            titleArabic: "الأجهزة التعويضية والتعديلية",
            description: categories[1].description,
            solutions: orthotics,
            workflow: [
              "Clinical assessment",
              "Digital capture and alignment",
              "Fabrication and fitting",
              "Progress review",
            ],
          }
        : null;

  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.json(GetCatalogCategoryResponse.parse(category));
});

router.get("/locations", (_req, res) => {
  res.json(GetLocationsResponse.parse(locations));
});

export default router;