/**
 * The clinic's catalog: categories, solutions, the models fitted under each,
 * and the clinic record.
 *
 * This lives in its own package because two runtimes serve it - the Express
 * server and the Cloudflare Worker. One copy means a device added here shows up
 * in both without anyone remembering to edit twice.
 */
const buildCategories = () => [
  {
    slug: "prosthetics",
    title: "Prosthetic solutions",
    titleArabic: "الأطراف الاصطناعية",
    description:
      "Confident movement, engineered around each person. From advanced knee joints to responsive carbon feet and bionic upper limbs.",
    descriptionArabic:
      "حركة واثقة، مصمّمة حول كل شخص. من مفاصل الركبة المتقدمة إلى أقدام الكربون المتجاوبة والأطراف العلوية الإلكترونية.",
    solutionCount: prostheticSolutions.length,
    accent: "cobalt",
  },
  {
    slug: "orthotics",
    title: "Orthotic solutions",
    titleArabic: "الجبائر والأجهزة التقويمية",
    description:
      "Thoughtful support for alignment, healing, and everyday independence — from spinal bracing to custom foot orthotics.",
    descriptionArabic:
      "دعم مدروس للمحاذاة والتعافي والاستقلالية اليومية — من أجهزة العمود الفقري إلى الضبانات الطبية المخصصة.",
    solutionCount: orthoticSolutions.length,
    accent: "teal",
  },
];

const prostheticSolutions = [
  {
    id: "above-knee-prosthesis",
    title: "Above knee prosthesis (transfemoral)",
    titleArabic: "الطرف الاصطناعي فوق الركبة",
    category: "Lower limb",
    description:
      "A complete above-knee limb: a custom carbon socket, a knee joint, a pylon and a foot, built and aligned as one.",
    descriptionArabic:
      "طرف كامل فوق الركبة: حاضنة كربونية حسب القياس، ومفصل ركبة، وأنبوب، وقدم، تُبنى وتُحاذى كوحدة واحدة.",
    tags: ["Above knee", "Transfemoral", "Custom"],
    imageKey: "above-knee",
    featured: false,
  },
  {
    id: "below-knee-prosthesis",
    title: "Below knee prosthesis (transtibial)",
    titleArabic: "الطرف الاصطناعي تحت الركبة",
    category: "Lower limb",
    description:
      "A below-knee limb: a custom socket, suspension, an adapter and a foot, built and aligned as one and finished to match the sound side.",
    descriptionArabic:
      "طرف تحت الركبة: حاضنة حسب القياس، وتعليق، ووصلة، وقدم، تُبنى وتُحاذى كوحدة واحدة وتُنهى لتطابق الطرف السليم.",
    tags: ["Below knee", "Transtibial", "Custom"],
    imageKey: "below-knee",
    featured: false,
  },
  {
    id: "hip-disarticulation",
    title: "Hip disarticulation prosthesis",
    titleArabic: "الطرف الاصطناعي لفصل الورك",
    category: "Lower limb",
    description:
      "A complete limb for amputation at the hip: a moulded pelvic socket, a hip joint, a knee joint and a foot, built and aligned as one.",
    descriptionArabic:
      "طرف كامل للبتر عند الورك: حاضنة حوضية مصبوبة، ومفصل ورك، ومفصل ركبة، وقدم، تُبنى وتُحاذى كوحدة واحدة.",
    tags: ["Hip disarticulation", "Custom", "Alignment"],
    imageKey: "hip-disarticulation",
    featured: false,
  },
  {
    id: "partial-foot",
    title: "Partial foot amputation",
    titleArabic: "بتر جزئي للقدم",
    category: "Lower limb",
    description:
      "Prostheses for amputation through the foot. No two are alike: how much of the foot remains, and where it ends, decides the shape of the device, so each one is built to that foot rather than chosen from a range.",
    descriptionArabic:
      "أطراف للبتر على مستوى القدم. لا تتشابه حالتان: مقدار ما تبقّى من القدم وموضع نهايته يحدّدان شكل الجهاز، لذا يُبنى كل جهاز على تلك القدم بعينها لا يُختار من مقاسات جاهزة.",
    tags: ["Partial foot", "Custom", "Case by case"],
    imageKey: "partial-foot",
    featured: false,
  },
  {
    id: "smart-knees",
    title: "Microprocessor & smart knee joints",
    titleArabic: "مفاصل الركبة الذكية",
    category: "Lower limb",
    description:
      "Adaptive stance and swing control that responds to changing pace, terrain, and confidence.",
    descriptionArabic:
      "تحكّم متكيّف في مرحلتي الوقوف والأرجحة، يستجيب لتغيّر السرعة والتضاريس والثقة.",
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
    descriptionArabic:
      "ارتداد طاقة خفيف الوزن، لانتقال أكثر سلاسة وإيقاع أقرب إلى الطبيعي.",
    tags: ["Energy return", "Carbon", "Below knee"],
    imageKey: "carbon-foot",
    featured: true,
  },
  {
    id: "revofit-sockets",
    title: "RevoFit & RevoLock sockets",
    titleArabic: "تقنيات الحاضنة القابلة للضبط",
    category: "Socket technology",
    description:
      "Micro-adjustable fit with BOA-style dials, suction, and suspension options.",
    descriptionArabic:
      "ملاءمة دقيقة قابلة للضبط بأقراص من نوع BOA، مع خيارات الشفط والتعليق.",
    tags: ["RevoFit", "RevoLock", "Suspension"],
    imageKey: "socket",
    featured: true,
  },
  {
    // One card, not two. The clinic supplies whichever material a patient
    // asks for, so the two were never separate offerings - the difference
    // belongs in a sentence, not in two pages a visitor has to choose
    // between. No brand and no models for the same reason.
    id: "liners",
    title: "Liners",
    titleArabic: "البطانات",
    category: "Socket technology",
    description:
      "The layer between limb and socket: it cushions the residual limb, spreads load across it, and holds the socket in place. Supplied in silicone and in gel, with the choice made at fitting.",
    descriptionArabic:
      "الطبقة بين الطرف والحاضنة: تبطّن الطرف المتبقي، وتوزّع الحمل عليه، وتثبّت الحاضنة في مكانها. تتوفّر من السيليكون ومن الجل، ويُحدَّد الخيار عند القياس.",
    // The two materials lead, because on a card that covers both they are what
    // a visitor is scanning for - and they double as catalog filters, so
    // someone searching for a gel liner now has a chip to click.
    tags: ["Gel liner", "Silicone liner", "Suspension", "Comfort", "Socket interface"],
    imageKey: "liner",
    featured: false,
  },
  {
    id: "bionic-hands",
    title: "Myoelectric & bionic hands",
    titleArabic: "الأيدي الكهربائية و BEBIONIC",
    category: "Upper limb",
    description:
      "Intuitive control and precise grip patterns for the moments that matter.",
    descriptionArabic:
      "تحكّم بديهي وأنماط قبضة دقيقة للحظات التي تهم.",
    tags: ["Myoelectric", "Bionic", "Upper limb"],
    imageKey: "bionic-hand",
    featured: false,
  },
  {
    id: "passive-upper-limb",
    title: "Mechanical & cosmetic limbs",
    titleArabic: "الأطراف الميكانيكية والتجميلية",
    category: "Upper limb",
    description:
      "Reliable mechanical function and natural-looking cosmetic options, shaped around lifestyle.",
    descriptionArabic:
      "أداء ميكانيكي موثوق وخيارات تجميلية طبيعية المظهر، مصمّمة حول نمط الحياة.",
    tags: ["Mechanical", "Cosmetic", "Custom"],
    imageKey: "passive-limb",
    featured: false,
  },
];

const orthoticSolutions = [
  {
    id: "scoliosis-bracing",
    title: "Spinal & trunk bracing",
    titleArabic: "أجهزة العمود الفقري",
    category: "Spinal & trunk",
    description:
      "Custom support for scoliosis management, post-surgical recovery, and trunk stability.",
    descriptionArabic:
      "دعم مخصّص لإدارة الجنف، والتعافي بعد الجراحة، وثبات الجذع.",
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
    descriptionArabic:
      "دعم خفيف للمشية يخزّن الطاقة ويعيدها خلال الخطوة.",
    tags: ["AFO", "Carbon", "Gait"],
    imageKey: "carbon-afo",
    featured: true,
  },
  {
    id: "thermoplastic-afo",
    title: "Thermoplastic AFOs",
    titleArabic: "أجهزة AFO البلاستيكية الحرارية",
    category: "Lower limb",
    description:
      "Custom-moulded ankle-foot support with a cushioned lining and adjustable straps, made in a range of finishes.",
    descriptionArabic:
      "دعم للكاحل والقدم مصبوب حسب القياس، ببطانة مبطّنة وأحزمة قابلة للضبط، ويُصنع بمجموعة من التشطيبات.",
    tags: ["AFO", "Thermoplastic", "Custom"],
    imageKey: "thermoplastic-afo",
    featured: false,
  },
  {
    id: "dafo",
    title: "Dynamic ankle foot orthosis (DAFO)",
    titleArabic: "جهاز القدم والكاحل الديناميكي (DAFO)",
    category: "Lower limb",
    description:
      "Ankle-foot orthosis with an articulated ankle joint, a moulded footplate and adjustable padded straps, made in a range of printed finishes.",
    descriptionArabic:
      "جهاز للكاحل والقدم بمفصل كاحل متحرّك، ولوح قدم مصبوب، وأحزمة مبطّنة قابلة للضبط، ويُصنع بمجموعة من التشطيبات المطبوعة.",
    tags: ["DAFO", "Articulated", "Custom"],
    imageKey: "dafo",
    featured: false,
  },
  {
    id: "custom-kafo",
    title: "Custom KAFOs",
    titleArabic: "أجهزة KAFO المخصصة",
    category: "Lower limb",
    description:
      "Purpose-built alignment and stability for complex lower-limb needs.",
    descriptionArabic:
      "محاذاة وثبات مصمّمان خصيصاً للاحتياجات المعقّدة في الطرف السفلي.",
    tags: ["KAFO", "Alignment", "Stability"],
    imageKey: "kafo",
    featured: false,
  },
  {
    id: "long-leg-brace",
    title: "Long leg brace (KAFO)",
    titleArabic: "جهاز الساق الطويل (KAFO)",
    category: "Lower limb",
    description:
      "Thigh-to-foot bracing on metal uprights with knee joints, moulded shells and a perforated lining, closed with leather straps.",
    descriptionArabic:
      "تجبير من الفخذ إلى القدم على دعامات معدنية بمفاصل ركبة، مع أصداف مصبوبة وبطانة مثقّبة، يُغلق بأحزمة جلدية.",
    tags: ["KAFO", "Knee joints", "Custom"],
    imageKey: "long-leg-brace",
    featured: false,
  },
  {
    id: "hkafo",
    title: "Hip knee ankle foot orthosis (HKAFO)",
    titleArabic: "جهاز الورك والركبة والكاحل والقدم (HKAFO)",
    category: "Lower limb",
    description:
      "Full lower-limb bracing that joins a padded pelvic section to leg uprights through hip and knee joints, lined throughout and closed with wide straps.",
    descriptionArabic:
      "تجبير كامل للطرف السفلي يصل جزءاً حوضياً مبطّناً بدعامات الساق عبر مفصلي الورك والركبة، مبطّن بالكامل ويُغلق بأحزمة عريضة.",
    tags: ["HKAFO", "Pelvic section", "Custom"],
    imageKey: "hkafo",
    featured: false,
  },
  {
    id: "arch-support",
    title: "Arch supports",
    titleArabic: "دعامات القوس",
    category: "Foot orthotics",
    description:
      "Moulded foot orthoses with a contoured arch and a perforated surface, shaped to the foot and worn inside an ordinary shoe.",
    descriptionArabic:
      "دعامات قدم مصبوبة بقوس محدّد وسطح مثقّب، تُشكَّل على القدم وتُلبس داخل حذاء عادي.",
    tags: ["Arch support", "Custom", "Comfort"],
    imageKey: "arch-support",
    featured: false,
  },
  {
    id: "custom-insoles",
    title: "Custom insoles",
    titleArabic: "الضبانات الطبية المخصصة",
    category: "Foot orthotics",
    description:
      "Digitally designed insoles with pressure-aware offloading and daily comfort.",
    descriptionArabic:
      "ضبانات مصمّمة رقمياً، تراعي توزيع الضغط وتخفيفه مع راحة يومية.",
    tags: ["Pressure care", "Comfort"],
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
    descriptionArabic:
      "حلول تركّز على الحماية، مصمّمة لتقليل الضغط ودعم حركة أكثر أماناً.",
    tags: ["Diabetic care", "Offloading", "Protection"],
    imageKey: "diabetic-care",
    featured: false,
    comingSoon: true,
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
    addressArabic: "شارع الرازي، عمّان، الأردن",
    phone: "+962795185080",
    whatsapp: "962795185080",
    email: "info@mafazmedical.com",
    timezone: "Asia/Amman",
    openDays: [6, 0, 1, 2, 3, 4], // Saturday through Thursday
    opensAt: "08:00",
    closesAt: "16:00",
    hours: "Sat–Thu · 8:00–16:00",
    hoursArabic: "السبت–الخميس · ٠٨:٠٠–١٦:٠٠",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Alrazi+Street%2C+Amman%2C+Jordan",
    isPrimary: true,
  },
];

type Product = {
  id: string;
  name: string;
  nameArabic?: string;
  brand?: string;
  description?: string;
  descriptionArabic?: string;
  /**
   * A photograph, when there is one. A variant such as "HKAFO with joints" is
   * a meaningful thing to list even where no separate picture of it exists,
   * and a placeholder box for every one of those would look worse than none.
   */
  imageKey?: string;
  tags?: string[];
};

/**
 * The individual models fitted under each solution, keyed by solution id.
 *
 * A solution such as "Microprocessor & smart knee joints" is a family; this is
 * where the specific knees, feet, hands and braces Mafaz fits are listed. A
 * solution with no entry here simply shows no model list, so the catalog reads
 * exactly as before until models are added.
 *
 * Each model's `imageKey` maps to a file in attached_assets/solutions/ by the
 * same filename convention the solutions use, e.g. imageKey "genium-x3" is
 * served from genium-x3.jpg.
 *
 * Only list models the clinic actually fits, and keep descriptions to what the
 * clinical team has approved - product claims are theirs to make, not ours.
 */
const productsBySolution: Record<string, Product[]> = {
  // Named from the products themselves. Deliberately no descriptions: what
  // each Ottobock liner is indicated for is the clinic's to state, not
  // something to write from the side of a liner.
  // Neither liner card lists models. The clinic supplies whatever a patient
  // asks for, so a "models we fit" list reads as a limit on what it will
  // supply rather than as a catalog. The photographs stay; the naming goes.
  // Solutions with no entry here get an empty list and the section does not
  // render at all.
  // The clinic's own list of what it fits under each family. These are
  // variants rather than separate products, which is why they live here and
  // not as cards of their own: one HKAFO card listing both joint options reads
  // better than two cards a visitor has to tell apart.
  hkafo: [
    {
      id: "hkafo-no-joints",
      name: "HKAFO without joints",
      nameArabic: "جهاز HKAFO بدون مفاصل",
    },
    {
      id: "hkafo-joints",
      name: "HKAFO with joints",
      nameArabic: "جهاز HKAFO بمفاصل",
    },
  ],

  // Upper limb, by level. The same three levels repeat under each technology,
  // so the card is the technology and the levels are listed beneath it.
  "passive-upper-limb": [
    { id: "cosmetic-tr", name: "Cosmetic — below elbow (transradial)", nameArabic: "تجميلي — تحت المرفق" },
    { id: "cosmetic-th", name: "Cosmetic — above elbow (transhumeral)", nameArabic: "تجميلي — فوق المرفق" },
    { id: "cosmetic-sd", name: "Cosmetic — shoulder disarticulation", nameArabic: "تجميلي — فصل الكتف" },
    { id: "mech-tr", name: "Mechanical — below elbow (transradial)", nameArabic: "ميكانيكي — تحت المرفق" },
    { id: "mech-th", name: "Mechanical — above elbow (transhumeral)", nameArabic: "ميكانيكي — فوق المرفق" },
    { id: "mech-sd", name: "Mechanical — shoulder disarticulation", nameArabic: "ميكانيكي — فصل الكتف" },
  ],

  "bionic-hands": [
    { id: "myo-tr", name: "Myoelectric — below elbow (transradial)", nameArabic: "كهربائي عضلي — تحت المرفق" },
    { id: "myo-th", name: "Myoelectric — above elbow (transhumeral)", nameArabic: "كهربائي عضلي — فوق المرفق" },
    { id: "myo-sd", name: "Myoelectric — shoulder disarticulation", nameArabic: "كهربائي عضلي — فصل الكتف" },
    { id: "bebionic-tr", name: "BEBIONIC — below elbow (transradial)", nameArabic: "BEBIONIC — تحت المرفق", brand: "Ottobock" },
    { id: "bebionic-th", name: "BEBIONIC — above elbow (transhumeral)", nameArabic: "BEBIONIC — فوق المرفق", brand: "Ottobock" },
    { id: "bebionic-sd", name: "BEBIONIC — shoulder disarticulation", nameArabic: "BEBIONIC — فصل الكتف", brand: "Ottobock" },
  ],

  // "smart-knees": [
  //   { id: "example", name: "Model name", brand: "Ottobock", imageKey: "example", description: "One line the clinical team approves." },
  // ],
};

const withCategorySlug = <T extends { id: string }>(
  solutions: T[],
  categorySlug: string,
) =>
  solutions.map((solution) => ({
    ...solution,
    categorySlug,
    products: productsBySolution[solution.id] ?? [],
  }));

const prosthetics = withCategorySlug(prostheticSolutions, "prosthetics");
const orthotics = withCategorySlug(orthoticSolutions, "orthotics");
const categories = buildCategories();

/**
 * The catalog payloads, built once here and served unchanged by whichever
 * runtime is in front of them. Each returns plain data; validation against the
 * OpenAPI schemas stays with the caller, so neither runtime can answer with a
 * shape the other would reject.
 */
export function catalogOverview() {
  return {
    categories,
    featuredSolutions: [...prosthetics, ...orthotics].filter(
      (solution) => solution.featured,
    ),
    metrics,
  };
}

export function catalogCategory(slug: string) {
  if (slug === "prosthetics") {
    return {
      slug,
      title: "Prosthetic solutions",
      titleArabic: "الأطراف الاصطناعية",
      description: categories[0].description,
      descriptionArabic: categories[0].descriptionArabic,
      solutions: prosthetics,
      workflow: [
        "Understand your goals",
        "Scan, assess, and measure",
        "Design and fit",
        "Train, refine, and follow up",
      ],
      workflowArabic: [
        "نفهم أهدافك",
        "المسح والتقييم والقياس",
        "التصميم والتركيب",
        "التدريب والضبط والمتابعة",
      ],
    };
  }
  if (slug === "orthotics") {
    return {
      slug,
      title: "Orthotic solutions",
      titleArabic: "الجبائر والأجهزة التقويمية",
      description: categories[1].description,
      descriptionArabic: categories[1].descriptionArabic,
      solutions: orthotics,
      workflow: [
        "Clinical assessment",
        "Digital capture and alignment",
        "Fabrication and fitting",
        "Progress review",
      ],
      workflowArabic: [
        "التقييم السريري",
        "المسح الرقمي والمحاذاة",
        "التصنيع والتركيب",
        "مراجعة التقدّم",
      ],
    };
  }
  return null;
}

export function allSolutions() {
  return [...prosthetics, ...orthotics];
}

export function clinicLocations() {
  return locations;
}
