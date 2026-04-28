export const mockOffers = [
  {
    id: 'product-designer-intern',
    icon: 'palette',
    category: 'Design',
    title: 'Product Designer Intern',
    description:
      'Collaborate with the product team to design flows, interfaces, and prototypes for student-facing features.',
    location: 'Madrid, Spain',
    salary: 'EUR 800 - 1000 / month',
    modality: 'Hybrid',
    company: 'Innovate Tech',
    publishedAtLabel: 'Published 2 days ago',
    summary:
      'Great role for students who want to work on UX research, wireframes, and polished interface systems.',
    responsibilities: [
      'Apoyar la investigacion UX con entrevistas y benchmarks.',
      'Crear wireframes y prototipos para nuevas funcionalidades.',
      'Documentar decisiones de diseno junto al equipo de producto.',
    ],
  },
  {
    id: 'frontend-developer-intern',
    icon: 'code',
    category: 'Engineering',
    title: 'Frontend Developer Intern',
    description:
      'Build React interfaces, improve performance, and ship polished experiences for our internship platform.',
    location: 'Barcelona, Spain',
    salary: 'EUR 1200 / month',
    modality: 'Remote',
    company: 'FinanzGlobal',
    publishedAtLabel: 'Published 5 days ago',
    summary:
      'Perfect for candidates who enjoy modern frontend work and want real product ownership from day one.',
    responsibilities: [
      'Desarrollar interfaces React para nuevas vistas del producto.',
      'Corregir bugs y mejorar la calidad visual de la aplicacion.',
      'Colaborar con diseno y producto en iteraciones rapidas.',
    ],
  },
  {
    id: 'marketing-assistant-intern',
    icon: 'campaign',
    category: 'Marketing',
    title: 'Marketing Assistant Intern',
    description:
      'Support growth campaigns, social media planning, and employer branding initiatives across Spain.',
    location: 'Valencia, Spain',
    salary: 'EUR 600 / month',
    modality: 'On-site',
    company: 'Creative Minds Agency',
    publishedAtLabel: 'Published yesterday',
    summary:
      'A hands-on internship for students who want to learn campaign execution and content strategy.',
    responsibilities: [
      'Apoyar la planificacion de contenidos para redes sociales.',
      'Ejecutar tareas de seguimiento de campanas y reporting.',
      'Coordinar materiales de marca con el equipo creativo.',
    ],
  },
]

export function getMockOfferById(offerId) {
  return mockOffers.find((offer) => offer.id === offerId) ?? null
}
