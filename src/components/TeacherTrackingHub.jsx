import '../assets/styles/teacherDashboard.css'
import { useUser } from '../services/userService'
import useProfessorTracking from '../hooks/useProfessorTracking'
import TeacherTrackingView from './TeacherTrackingView'

export default function TeacherTrackingHub() {
  const { currentUser } = useUser()
  const trackingState = useProfessorTracking(currentUser)

  return <TeacherTrackingView currentUser={currentUser} {...trackingState} />
}
