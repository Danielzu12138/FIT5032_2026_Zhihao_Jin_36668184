import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
} from '../firebase'

function actionCodeSettings() {
  return {
    url: window.location.origin,
    handleCodeInApp: false,
  }
}

function authErrorMessage(error, fallback) {
  if (error.code === 'auth/invalid-email') return 'Please enter a valid email address.'
  if (error.code === 'auth/too-many-requests') return 'Too many attempts. Please try again later.'
  if (error.code === 'auth/user-disabled') return 'This account has been disabled.'
  return fallback
}

const profileCreationPromises = new Map()

/**
 * Create only the Firebase Auth account and send Firebase's verification link.
 * The Firestore profile is created later by ensureUserProfile after verified sign-in.
 */
export async function registerUser(email, password, name) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user
    await updateProfile(firebaseUser, { displayName: name })
    await sendEmailVerification(firebaseUser, actionCodeSettings())
    await signOut(auth)
    return { success: true, user: firebaseUser, verificationSent: true }
  } catch (error) {
    await signOut(auth).catch(() => {})
    let message = 'Registration failed.'
    if (error.code === 'auth/email-already-in-use') {
      message = 'An account with this email already exists. Log in to resend verification.'
    } else if (error.code === 'auth/weak-password') {
      message = 'Password does not meet Firebase security requirements.'
    } else if (error.code === 'auth/invalid-email') {
      message = 'Please enter a valid email address.'
    } else if (error.code === 'auth/operation-not-allowed') {
      message = 'Email and password registration is not enabled in Firebase.'
    } else if (error.code === 'auth/too-many-requests') {
      message = 'Too many registration attempts. Please try again later.'
    }
    return { success: false, error: message }
  }
}

/**
 * Create a standard Firestore profile on the first verified sign-in.
 * Existing profiles, including administrator profiles, are never overwritten.
 */
export async function ensureUserProfile(firebaseUser) {
  if (!firebaseUser?.emailVerified) {
    return { success: false, error: 'A verified email address is required.' }
  }

  if (profileCreationPromises.has(firebaseUser.uid)) {
    return profileCreationPromises.get(firebaseUser.uid)
  }

  const creationPromise = (async () => {
    try {
      const profileRef = doc(db, 'users', firebaseUser.uid)
      const existingProfile = await getDoc(profileRef)
      if (existingProfile.exists()) {
        return { success: true, profile: existingProfile.data(), created: false }
      }

      const fallbackName = String(firebaseUser.email || '').split('@')[0]
      const name = String(firebaseUser.displayName || fallbackName || 'MindSpace user')
        .replace(/[<>]/g, '')
        .trim()
        .slice(0, 60)
      const profile = {
        name,
        email: String(firebaseUser.email || '').toLowerCase(),
        role: 'young_user',
        uid: firebaseUser.uid,
        createdAt: new Date().toISOString(),
      }

      await setDoc(profileRef, profile)
      return { success: true, profile, created: true }
    } catch {
      return { success: false, error: 'Your verified account profile could not be activated.' }
    }
  })()

  profileCreationPromises.set(firebaseUser.uid, creationPromise)
  try {
    return await creationPromise
  } finally {
    profileCreationPromises.delete(firebaseUser.uid)
  }
}

/**
 * Sign in with email and password.
 * Returns { success, error, user }
 */
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    if (!userCredential.user.emailVerified) {
      await signOut(auth)
      return {
        success: false,
        code: 'auth/email-not-verified',
        error: 'Please verify your email address before signing in.',
      }
    }
    const profileResult = await ensureUserProfile(userCredential.user)
    if (!profileResult.success) {
      await signOut(auth)
      return profileResult
    }
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
 * Send another verification email without keeping the unverified user signed in.
 */
export async function resendVerificationEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    if (userCredential.user.emailVerified) {
      await signOut(auth)
      return { success: false, error: 'This email address is already verified.' }
    }
    await sendEmailVerification(userCredential.user, actionCodeSettings())
    await signOut(auth)
    return { success: true }
  } catch (error) {
    await signOut(auth).catch(() => {})
    return {
      success: false,
      error: authErrorMessage(error, 'Could not send the verification email. Check your credentials.'),
    }
  }
}

/**
 * Send a Firebase password reset email to a real email address.
 */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email, actionCodeSettings())
    return { success: true }
  } catch (error) {
    let message = 'Could not send a password reset email.'
    if (error.code === 'auth/user-not-found') {
      message = 'No account was found with this email address.'
    } else {
      message = authErrorMessage(error, message)
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
