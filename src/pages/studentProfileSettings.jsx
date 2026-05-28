import Header from '../components/Header'
import Footer from '../components/Footer'
import StudentProfileSettings from '../components/StudentProfileSettings'

export default function StudentProfileSettingsPage() {
  return (
    <div className="homepage-shell">
      <Header />
      <StudentProfileSettings />
      <Footer />
    </div>
  )
}
