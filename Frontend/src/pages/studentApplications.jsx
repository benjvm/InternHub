import Footer from '../components/Footer'
import Header from '../components/Header'
import StudentApplicationsHub from '../components/StudentApplicationsHub'

export default function StudentApplicationsPage() {
  return (
    <div className="homepage-shell">
      <Header />
      <StudentApplicationsHub />
      <Footer />
    </div>
  )
}
