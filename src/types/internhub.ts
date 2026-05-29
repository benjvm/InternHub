export type UserRole = 1 | 2 | 3

export interface InternHubUser {
  id: string
  uid: string
  email?: string
  rol: UserRole
  photoURL?: string
  savedOfferIds?: string[]
}

export interface Offer {
  id: string
  title: string
  category: string
  description: string
  responsibilities: string[]
  location: string
  companyId: string
  companyName: string
  status: string
}

export interface Application {
  id: string
  offerId: string
  studentId: string
  status: string
  createdAt?: unknown
}

export interface Internship {
  id: string
  applicationId?: string
  studentId: string
  companyId: string
  offerId: string
  professorId?: string | null
  status: string
  completedHours: number
}
