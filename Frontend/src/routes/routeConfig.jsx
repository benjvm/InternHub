import Home from '../pages/home'
import LoginPage from '../pages/login'
import RegisterPage from '../pages/chooseRole'
import StudentRegister from '../pages/studentRegister'
import TeacherRegister from '../pages/TeacherRegister'
import CompanyRegister from '../pages/companyRegister'
import InternshipBoardPage from '../pages/internshipBoard'
import JobDetailPage from '../pages/jobDetail'
import PostOfferPage from '../pages/postOffer'
import StudentProfileSettingsPage from '../pages/studentProfileSettings'
import { ROUTES } from './paths'

export const appRoutes = [
  { path: ROUTES.home, component: Home },
  { path: ROUTES.login, component: LoginPage, publicOnly: true },
  { path: ROUTES.register, component: RegisterPage, publicOnly: true },
  { path: ROUTES.registerStudent, component: StudentRegister, publicOnly: true },
  { path: ROUTES.registerCompany, component: CompanyRegister, publicOnly: true },
  { path: ROUTES.registerTeacher, component: TeacherRegister, publicOnly: true },
  { path: ROUTES.internships, component: InternshipBoardPage },
  { path: ROUTES.internshipDetail(), component: JobDetailPage },
  { path: ROUTES.postOffer, component: PostOfferPage, protected: true, roles: [2] },
  {
    path: ROUTES.studentProfile,
    component: StudentProfileSettingsPage,
    protected: true,
    roles: [1],
  },
]
