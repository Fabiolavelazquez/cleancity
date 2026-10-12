import { Injectable, signal } from '@angular/core';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  onAuthStateChanged, sendPasswordResetEmail, deleteUser, User,
} from 'firebase/auth';
import { auth } from '../firebase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  user = signal<User | null>(null);
  private ready: Promise<void>;

  constructor() {
    // Firebase mantiene la sesión (token JWT) y la renueva automáticamente
    this.ready = new Promise((resolve) => {
      onAuthStateChanged(auth, (u) => { this.user.set(u); resolve(); });
    });
  }

  waitReady() { return this.ready; }
  register(email: string, pass: string) { return createUserWithEmailAndPassword(auth, email, pass); }
  login(email: string, pass: string) { return signInWithEmailAndPassword(auth, email, pass); }
  logout() { return signOut(auth); }
  resetPassword(email: string) { return sendPasswordResetEmail(auth, email); }
  async deleteAccount() { if (auth.currentUser) await deleteUser(auth.currentUser); }
}
