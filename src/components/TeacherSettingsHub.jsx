import '../assets/styles/teacherDashboard.css'
import { useUser } from '../services/userService'
import TeacherPanelSidebar from './TeacherPanelSidebar'
import TeacherProfileSettings from './TeacherProfileSettings'

export default function TeacherSettingsHub() {
  const { currentUser } = useUser()

  return (
    <main className="teacher-dashboard-page">
      <div className="container teacher-dashboard-shell">
        <TeacherPanelSidebar currentUser={currentUser} activeSection="settings" />

        <section className="teacher-dashboard-content">
          <TeacherProfileSettings variant="panel" />
        </section>
      </div>
    </main>
  )
}
