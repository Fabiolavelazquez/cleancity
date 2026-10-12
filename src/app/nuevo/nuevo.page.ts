import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonInput, IonTextarea,
  IonSelect, IonSelectOption, IonButton, ToastController,
} from '@ionic/angular/standalone';
import { Geolocation } from '@capacitor/geolocation';
import { AuthService } from '../services/auth.service';
import { ReportService, Categoria } from '../services/report.service';

@Component({
  selector: 'app-nuevo',
  standalone: true,
  imports: [
    FormsModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent,
    IonInput, IonTextarea, IonSelect, IonSelectOption, IonButton,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="success">
        <ion-buttons slot="start"><ion-back-button defaultHref="/home"></ion-back-button></ion-buttons>
        <ion-title>Nuevo reporte</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-input label="Título" labelPlacement="floating" fill="outline" maxlength="80"
                 [(ngModel)]="titulo" class="ion-margin-bottom"></ion-input>

      <ion-select label="Categoría" labelPlacement="floating" fill="outline"
                  [(ngModel)]="categoria" class="ion-margin-bottom">
        <ion-select-option value="bache">Bache</ion-select-option>
        <ion-select-option value="luminaria">Luminaria fundida</ion-select-option>
        <ion-select-option value="basura">Acumulación de basura</ion-select-option>
        <ion-select-option value="otro">Otro</ion-select-option>
      </ion-select>

      <ion-textarea label="Descripción" labelPlacement="floating" fill="outline" maxlength="500"
                    [counter]="true" [autoGrow]="true" [(ngModel)]="descripcion"
                    class="ion-margin-bottom"></ion-textarea>

      <p><b>Foto (opcional)</b></p>
      <input type="file" accept="image/*" capture="environment" (change)="onFile($event)" />
      @if (foto()) { <img [src]="foto()" alt="Vista previa" style="max-width:100%;margin-top:8px;border-radius:8px" /> }

      <p style="margin-top:16px">
        <b>Ubicación:</b>
        @if (lat() !== null) { {{ lat()!.toFixed(5) }}, {{ lng()!.toFixed(5) }} } @else { sin obtener }
      </p>
      <ion-button fill="outline" size="small" [disabled]="ubicando()" (click)="ubicar()">Actualizar ubicación</ion-button>

      <p><small>Tu reporte será visible para otros usuarios. No se muestra tu nombre ni tu correo.</small></p>

      <ion-button expand="block" color="success" [disabled]="guardando()" (click)="enviar()">Enviar reporte</ion-button>
    </ion-content>
  `,
})
export class NuevoPage {
  private auth = inject(AuthService);
  private report = inject(ReportService);
  private router = inject(Router);
  private toast = inject(ToastController);

  titulo = '';
  descripcion = '';
  categoria: Categoria = 'bache';
  foto = signal<string | null>(null);
  lat = signal<number | null>(null);
  lng = signal<number | null>(null);
  ubicando = signal(false);
  guardando = signal(false);

  ngOnInit() { this.ubicar(); }

  async ubicar() {
    this.ubicando.set(true);
    try {
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
      this.lat.set(pos.coords.latitude);
      this.lng.set(pos.coords.longitude);
    } catch {
      await this.aviso('No se pudo obtener la ubicación. Revisa los permisos.');
    } finally {
      this.ubicando.set(false);
    }
  }

  async onFile(ev: Event) {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return this.aviso('El archivo debe ser una imagen.');
    if (f.size > 15 * 1024 * 1024) return this.aviso('La imagen es demasiado grande.');
    try { this.foto.set(await this.comprimir(f, 800, 0.6)); }
    catch { await this.aviso('No se pudo procesar la imagen.'); }
  }

  // Redimensiona y recodifica: reduce el peso y elimina metadatos EXIF (incluida la ubicación)
  private comprimir(file: File, max: number, calidad: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * s);
        c.height = Math.round(img.height * s);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', calidad));
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  async enviar() {
    const u = this.auth.user();
    if (!u) return;
    const titulo = this.titulo.trim();
    const descripcion = this.descripcion.trim();
    if (titulo.length < 3 || titulo.length > 80) return this.aviso('El título debe tener de 3 a 80 caracteres.');
    if (descripcion.length > 500) return this.aviso('La descripción es muy larga.');
    if (this.lat() === null || this.lng() === null) return this.aviso('Necesitamos la ubicación del problema.');

    this.guardando.set(true);
    try {
      const data: any = { titulo, descripcion, categoria: this.categoria, lat: this.lat()!, lng: this.lng()!, uid: u.uid };
      if (this.foto()) data.foto = this.foto();
      await this.report.crear(data);
      await this.aviso('Reporte enviado ✔');
      await this.router.navigateByUrl('/home');
    } catch {
      await this.aviso('No se pudo enviar el reporte.');
    } finally {
      this.guardando.set(false);
    }
  }

  private async aviso(message: string) {
    const t = await this.toast.create({ message, duration: 2500, position: 'top' });
    await t.present();
  }
}
