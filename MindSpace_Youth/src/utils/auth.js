import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
} from '../firebase'

/**
 * Register a new user with Firebase Auth and store profile in Firestore.
 * Returns { success, error, user }
 */
export async function registerUser(email, password, name, role) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    // Save user profile in Firestore
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      name,
      email: email.toLowerCase(),
      role,
      uid: firebaseUser.uid,
      createdAt: new Date().toISOString(),
    })

    return { success: true, user: firebaseUser }
  } catch (error) {
    let message = 'Registration failed.'
    if (error.code === 'auth/email-already-in-use') {
      message = 'An account with this email already exists.'
    } else if (error.code === 'auth/weak-password') {
      message = 'Password must be at least 6 characters.'
    } else if (error.code === 'auth/invalid-email') {
      message = 'Please enter a valid email address.'
    }
    return { success: false, error: message }
  }
}

/**
 * Sign in with email and password.
 * Returns { success, error, user }
 */
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { success: true, user: userCredential.user }
  } catch (error) {
    let message = 'Login failed. Check your email and password.'
    if (error.code === 'auth/user-not-found') {
      message = 'No account found with this email.'
    } else if (error.code === 'auth/wrong-password') {
      message = 'Incorrect password.'
    } else if (error.code === 'auth/invalid-email') {
      message = 'Please enter a valid email address.'
    } else if (error.code === 'auth/invalid-credential') {
      message = 'Invalid credentials. Check your email and password.'
    }
    return { success: false, error: message }
  }
}

/**
 * Sign out current user.
 */
export async function logoutUser() {
  try {
    await signOut(auth)
    return { success: true }
  } catch {
    return { success: false, error: 'Logout failed.' }
  }
}

/**
 * Fetch a user's profile from Firestore by UID.
 */
export async function fetchUserProfile(uid) {
  try {
    const docSnap = await getDoc(doc(db, 'users', uid))
    if (docSnap.exists()) {
      return { success: true, profile: docSnap.data() }
    }
    return { success: false, error: 'User profile not found.' }
  } catch {
    return { success: false, error: 'Failed to load user profile.' }
  }
}

/**
 * Fetch all user profiles from Firestore (for admin dashboard).
 */
export async function fetchAllUsers() {
  try {
    const snapshot = await getDocs(collection(db, 'users'))
    const users = []
    snapshot.forEach((doc) => users.push(doc.data()))
    return { success: true, users }
  } catch {
    return { success: false, error: 'Failed to load users.' }
  }
}

/**
 * Listen for auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}
