export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  registerStudent: '/register/student',
  registerCompany: '/register/company',
  registerTeacher: '/register/teacher',
  internships: '/internships',
  internshipDetail: (offerId = ':offerId') => `/internships/${offerId}`,
  postOffer: '/offers/new',
  studentProfile: '/profile/student',
}

export function getDefaultRouteForRole(role) {
  switch (Number(role)) {
    case 1:
      return ROUTES.studentProfile
    case 2:
      return ROUTES.postOffer
    default:
      return ROUTES.home
  }
}
