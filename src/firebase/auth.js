import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { auth } from './config';

export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const logout = () => signOut(auth);

export const createAuthUser = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

export const changePassword = async (currentPassword, newPassword) => {
  const user = auth.currentUser;
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  return updatePassword(user, newPassword);
};

export const getCurrentUser = () => auth.currentUser;
