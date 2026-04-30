export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  registerStudent: '/register/student',
  registerCompany: '/register/company',
  registerTeacher: '/register/teacher',
  internships: '/internships',
  internshipDetail: (offerId = ':offerId') => `/internships/${offerId}`,
  studentApplications: '/student/candidaturas',
  postOffer: '/offers/new',
  studentProfile: '/profile/student',
  companyProfile: '/profile/company',
  teacherProfile: '/profile/teacher',
}

export function getDefaultRouteForRole(role) {
  switch (Number(role)) {
    case 1:
      return ROUTES.studentProfile
    case 2:
      return ROUTES.companyProfile
    case 3:
      return ROUTES.teacherProfile
    default:
      return ROUTES.home
  }
}
