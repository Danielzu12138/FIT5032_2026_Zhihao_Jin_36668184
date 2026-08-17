import {
  db,
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  runTransaction,
} from '../firebase'

export const COLLECTIONS = {
  users: 'users',
  bookings: 'bookings',
  bookingSlots: 'booking_slots',
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
    return { success: false, bookings: [], error: 'Failed to load bookings.' }
  }
}

export async function fetchUserBookings(uid) {
  try {
    const q = query(collection(db, COLLECTIONS.bookings), where('uid', '==', uid))
    const snapshot = await getDocs(q)
    const bookings = []
    snapshot.forEach((docSnap) => bookings.push({ id: docSnap.id, ...docSnap.data() }))
    return { success: true, bookings }
  } catch {
    return { success: false, bookings: [], error: 'Failed to load your bookings.' }
  }
}

export async function addBooking(booking) {
  try {
    const slotId = `${booking.date}_${booking.time}`
    const bookingRef = doc(collection(db, COLLECTIONS.bookings))
    const slotRef = doc(db, COLLECTIONS.bookingSlots, slotId)
    const createdAt = new Date().toISOString()

    await runTransaction(db, async (transaction) => {
      const occupiedSlot = await transaction.get(slotRef)
      if (occupiedSlot.exists()) {
        const conflictError = new Error('This time has already been booked.')
        conflictError.code = 'booking/slot-unavailable'
        throw conflictError
      }

      transaction.set(bookingRef, {
        ...booking,
        slotId,
        createdAt,
      })
      transaction.set(slotRef, {
        bookingId: bookingRef.id,
        service: booking.service,
        date: booking.date,
        time: booking.time,
        createdAt,
      })
    })

    return { success: true, id: bookingRef.id, slotId }
  } catch (error) {
    if (error?.code === 'booking/slot-unavailable') {
      return {
        success: false,
        conflict: true,
        error: 'That time was just booked by another user. Please choose another slot.',
      }
    }
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
    return { success: false, ratings: [], error: 'Failed to load ratings.' }
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
    return { success: false, ids: [], error: 'Failed to load saved resources.' }
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
