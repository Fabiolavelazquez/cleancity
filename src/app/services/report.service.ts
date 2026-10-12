import { Injectable, signal } from '@angular/core';
import {
  collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp,
  deleteDoc, doc, where, getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';

export type Categoria = 'bache' | 'luminaria' | 'basura' | 'otro';

export interface Reporte {
  id?: string;
  titulo: string;
  descripcion: string;
  categoria: Categoria;
  lat: number;
  lng: number;
  foto?: string;      // data URL JPEG comprimida
  estado?: string;
  uid: string;        // solo identificador interno (minimización de datos)
  createdAt?: any;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  reportes = signal<Reporte[]>([]);
  private unsub?: () => void;

  // Patrón Observer: Firestore notifica cambios en tiempo real
  escuchar() {
    if (this.unsub) return;
    const q = query(collection(db, 'reportes'), orderBy('createdAt', 'desc'), limit(100));
    this.unsub = onSnapshot(q, (snap) => {
      this.reportes.set(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Reporte) })));
    }, (err) => console.error('Firestore:', err.code));
  }

  detener() {
    this.unsub?.();
    this.unsub = undefined;
    this.reportes.set([]);
  }

  crear(r: Omit<Reporte, 'id' | 'createdAt' | 'estado'>) {
    return addDoc(collection(db, 'reportes'), { ...r, estado: 'pendiente', createdAt: serverTimestamp() });
  }

  eliminar(id: string) { return deleteDoc(doc(db, 'reportes', id)); }

  async eliminarMisReportes(uid: string) {
    const s = await getDocs(query(collection(db, 'reportes'), where('uid', '==', uid)));
    await Promise.all(s.docs.map((d) => deleteDoc(d.ref)));
  }
}
