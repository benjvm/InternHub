import Footer from '../components/Footer'
import Header from '../components/Header'
import PublicStudentProfile from '../components/PublicStudentProfile'

export default function PublicStudentProfilePage() {
  return (
    <div className="homepage-shell">
      <Header />
      <PublicStudentProfile />
      <Footer />
    </div>
  )
}
