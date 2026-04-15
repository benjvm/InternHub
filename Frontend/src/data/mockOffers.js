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
  },
]

export function getMockOfferById(offerId) {
  return mockOffers.find((offer) => offer.id === offerId) ?? null
}
