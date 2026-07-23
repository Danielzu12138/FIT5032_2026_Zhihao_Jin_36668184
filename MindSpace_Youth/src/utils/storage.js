import { db, collection, doc, getDocs, addDoc, deleteDoc, query, where } from '../firebase'

export const COLLECTIONS = {
  users: 'users',
  bookings: 'bookings',
  ratings: 'ratings',
  savedResources: 'saved_resources',
}

// ---- Bookings ---- //

export async function fetchAllBookings() {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.bookings))
    const bookings = []
    snapshot.forEach((docSnap) => bookings.push({ id: docSnap.id, ...docSnap.data() }))
    return { success: true, bookings }
  } catch {
    return { success: true, bookings: [] }
  }
}

export async function fetchUserBookings(email) {
  try {
    const q = query(collection(db, COLLECTIONS.bookings), where('email', '==', email))
    const snapshot = await getDocs(q)
    const bookings = []
    snapshot.forEach((docSnap) => bookings.push({ id: docSnap.id, ...docSnap.data() }))
    return { success: true, bookings }
  } catch {
    return { success: true, bookings: [] }
  }
}

export async function addBooking(booking) {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.bookings), {
      ...booking,
      createdAt: new Date().toISOString(),
    })
    return { success: true, id: docRef.id }
  } catch {
    return { success: false, error: 'Failed to create booking.' }
  }
}

// ---- Ratings ---- //

export async function fetchAllRatings() {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.ratings))
    const ratings = []
    snapshot.forEach((docSnap) => ratings.push({ id: docSnap.id, ...docSnap.data() }))
    return { success: true, ratings }
  } catch {
    return { success: true, ratings: [] }
  }
}

export async function addRating(rating) {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.ratings), {
      ...rating,
      createdAt: new Date().toISOString(),
    })
    return { success: true, id: docRef.id }
  } catch {
    return { success: false, error: 'Failed to submit rating.' }
  }
}

// ---- Saved Resources ---- //

export async function fetchSavedResourceIds(uid) {
  try {
    const q = query(collection(db, COLLECTIONS.savedResources), where('uid', '==', uid))
    const snapshot = await getDocs(q)
    const ids = []
    snapshot.forEach((docSnap) => ids.push(docSnap.data().resourceId))
    return { success: true, ids }
  } catch {
    return { success: true, ids: [] }
  }
}

export async function toggleSavedResource(uid, resourceId) {
  try {
    // Check if already saved
    const q = query(
      collection(db, COLLECTIONS.savedResources),
      where('uid', '==', uid),
      where('resourceId', '==', resourceId),
    )
    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      // Remove saved resource
      const docToDelete = snapshot.docs[0]
      await deleteDoc(doc(db, COLLECTIONS.savedResources, docToDelete.id))
      return { success: true, saved: false }
    } else {
      // Add saved resource
      await addDoc(collection(db, COLLECTIONS.savedResources), {
        uid,
        resourceId,
        createdAt: new Date().toISOString(),
      })
      return { success: true, saved: true }
    }
  } catch {
    return { success: false, error: 'Failed to update saved resources.' }
  }
}

// ---- Seed data (Firestore) ---- //

export async function seedFirestore() {
  try {
    // Check if seed data already exists
    const ratingsSnapshot = await getDocs(collection(db, COLLECTIONS.ratings))
    if (ratingsSnapshot.empty) {
      await addDoc(collection(db, COLLECTIONS.ratings), {
        service: 'Online wellbeing check-in',
        score: 5,
        comment: 'The booking process felt private and simple.',
        user: 'Demo Young User',
        createdAt: new Date().toISOString(),
      })
      await addDoc(collection(db, COLLECTIONS.ratings), {
        service: 'Study stress support',
        score: 4,
        comment: 'Clear advice and easy language.',
        user: 'Anonymous user',
        createdAt: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.warn('Seeding skipped:', error.message)
  }
}
