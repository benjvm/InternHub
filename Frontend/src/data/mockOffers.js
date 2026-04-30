export const mockOffers = [
  {
    id: 'product-designer-intern',
    icon: 'palette',
    category: 'Diseño',
    title: 'Becario/a de Diseño de Producto',
    description:
      'Colabora con el equipo de producto para diseñar flujos, interfaces y prototipos orientados a estudiantes.',
    location: 'Madrid, España',
    salary: '800 - 1000 EUR / mes',
    modality: 'Híbrido',
    company: 'Innovate Tech',
    publishedAtLabel: 'Publicado hace 2 días',
    summary:
      'Una gran oportunidad para estudiantes que quieran trabajar en investigación UX, wireframes y sistemas de interfaz cuidados.',
    responsibilities: [
      'Apoyar la investigación UX con entrevistas y benchmarks.',
      'Crear wireframes y prototipos para nuevas funcionalidades.',
      'Documentar decisiones de diseño junto al equipo de producto.',
    ],
  },
  {
    id: 'frontend-developer-intern',
    icon: 'code',
    category: 'Ingeniería',
    title: 'Becario/a de Desarrollo Frontend',
    description:
      'Construye interfaces en React, mejora el rendimiento y lanza experiencias pulidas para nuestra plataforma de prácticas.',
    location: 'Barcelona, España',
    salary: '1200 EUR / mes',
    modality: 'Remoto',
    company: 'FinanzGlobal',
    publishedAtLabel: 'Publicado hace 5 días',
    summary:
      'Ideal para quienes disfrutan del frontend moderno y quieren asumir responsabilidad real sobre producto desde el primer día.',
    responsibilities: [
      'Desarrollar interfaces React para nuevas vistas del producto.',
      'Corregir errores y mejorar la calidad visual de la aplicación.',
      'Colaborar con diseño y producto en iteraciones rápidas.',
    ],
  },
  {
    id: 'marketing-assistant-intern',
    icon: 'campaign',
    category: 'Marketing',
    title: 'Becario/a de Marketing',
    description:
      'Apoya campañas de crecimiento, planificación de redes sociales e iniciativas de marca empleadora en toda España.',
    location: 'Valencia, España',
    salary: '600 EUR / mes',
    modality: 'Presencial',
    company: 'Creative Minds Agency',
    publishedAtLabel: 'Publicado ayer',
    summary:
      'Una práctica muy práctica para estudiantes que quieran aprender ejecución de campañas y estrategia de contenidos.',
    responsibilities: [
      'Apoyar la planificación de contenidos para redes sociales.',
      'Ejecutar tareas de seguimiento de campañas y reporting.',
      'Coordinar materiales de marca con el equipo creativo.',
    ],
  },
]

export function getMockOfferById(offerId) {
  return mockOffers.find((offer) => offer.id === offerId) ?? null
}
