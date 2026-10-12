import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonList, IonItem,
  IonLabel, IonButton, AlertController, ToastController,
} from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';
import { ReportService } from '../services/report.service';
import { AVISO_PRIVACIDAD } from '../privacidad';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonList, IonItem, IonLabel, IonButton],
  template: `
    <ion-header>
      <ion-toolbar color="success">
        <ion-buttons slot="start"><ion-back-button defaultHref="/home"></ion-back-button></ion-buttons>
        <ion-title>Perfil</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list>
        <ion-item>
          <ion-label><p>Correo</p><h2>{{ auth.user()?.email }}</h2></ion-label>
        </ion-item>
      </ion-list>
      <ion-button expand="block" class="ion-margin-top" (click)="verAviso()" fill="outline">Aviso de privacidad</ion-button>
      <ion-button expand="block" (click)="salir()">Cerrar sesión</ion-button>
      <ion-button expand="block" color="danger" fill="outline" (click)="confirmarBorrado()">Eliminar mis datos y mi cuenta</ion-button>
    </ion-content>
  `,
})
export class PerfilPage {
  auth = inject(AuthService);
  private report = inject(ReportService);
  private router = inject(Router);
  private alert = inject(AlertController);
  private toast = inject(ToastController);

  async salir() {
    this.report.detener();
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }

  async verAviso() {
    const a = await this.alert.create({ header: 'Aviso de privacidad', message: AVISO_PRIVACIDAD, buttons: ['Cerrar'] });
    await a.present();
  }

  async confirmarBorrado() {
    const a = await this.alert.create({
      header: 'Eliminar mis datos',
      message: 'Se borrarán tus reportes y tu cuenta. Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => { this.borrar(); } },
      ],
    });
    await a.present();
  }

  private async borrar() {
    const u = this.auth.user();
    if (!u) return;
    try {
      await this.report.eliminarMisReportes(u.uid);   // Derecho de cancelación (ARCO)
      await this.auth.deleteAccount();
      this.report.detener();
      await this.router.navigateByUrl('/login');
    } catch (e: any) {
      const message = e?.code === 'auth/requires-recent-login'
        ? 'Por seguridad, cierra sesión, vuelve a entrar e inténtalo de nuevo.'
        : 'No se pudo completar la operación.';
      const t = await this.toast.create({ message, duration: 3500, position: 'top' });
      await t.present();
    }
  }
}
