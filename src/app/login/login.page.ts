import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonInput, IonButton, IonCheckbox, AlertController, ToastController } from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';
import { AVISO_PRIVACIDAD } from '../privacidad';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, IonContent, IonInput, IonButton, IonCheckbox],
  template: `
    <ion-content class="ion-padding">
      <div style="max-width:420px;margin:12vh auto 0;">
        <h1 style="text-align:center;color:var(--ion-color-success)">🏙️ CleanCity</h1>
        <p style="text-align:center">Reporta problemas de tu comunidad y dales seguimiento.</p>

        <ion-input label="Correo" labelPlacement="floating" fill="outline" type="email"
                   autocomplete="email" [(ngModel)]="email" class="ion-margin-bottom"></ion-input>
        <ion-input label="Contraseña (mín. 8 caracteres)" labelPlacement="floating" fill="outline"
                   type="password" autocomplete="current-password" [(ngModel)]="pass"
                   class="ion-margin-bottom"></ion-input>

        @if (registro) {
          <ion-checkbox [(ngModel)]="acepto" labelPlacement="end" style="margin-bottom:8px">
            He leído el aviso de privacidad
          </ion-checkbox>
          <ion-button fill="clear" size="small" (click)="verAviso()">Ver aviso de privacidad</ion-button>
        }

        <ion-button expand="block" color="success" [disabled]="cargando" (click)="enviar()">
          {{ registro ? 'Crear cuenta' : 'Iniciar sesión' }}
        </ion-button>
        <ion-button expand="block" fill="clear" (click)="registro = !registro">
          {{ registro ? 'Ya tengo cuenta' : 'No tengo cuenta, registrarme' }}
        </ion-button>
        @if (!registro) {
          <ion-button expand="block" fill="clear" size="small" (click)="recuperar()">Olvidé mi contraseña</ion-button>
        }
      </div>
    </ion-content>
  `,
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastController);
  private alert = inject(AlertController);

  email = '';
  pass = '';
  registro = false;
  acepto = false;
  cargando = false;

  async ngOnInit() {
    await this.auth.waitReady();
    if (this.auth.user()) this.router.navigateByUrl('/home');
  }

  async enviar() {
    const email = this.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return this.aviso('Escribe un correo válido.');
    if (this.pass.length < 8 || !/\d/.test(this.pass)) return this.aviso('La contraseña debe tener 8+ caracteres y al menos un número.');
    if (this.registro && !this.acepto) return this.aviso('Debes aceptar el aviso de privacidad.');

    this.cargando = true;
    try {
      if (this.registro) await this.auth.register(email, this.pass);
      else await this.auth.login(email, this.pass);
      this.pass = '';
      await this.router.navigateByUrl('/home');
    } catch (e: any) {
      await this.aviso(this.mensaje(e?.code));
    } finally {
      this.cargando = false;
    }
  }

  async recuperar() {
    const email = this.email.trim();
    if (!email) return this.aviso('Escribe tu correo primero.');
    try { await this.auth.resetPassword(email); } catch {}
    // Mensaje genérico: no revela si el correo existe
    await this.aviso('Si el correo existe, recibirás instrucciones para restablecer tu contraseña.');
  }

  async verAviso() {
    const a = await this.alert.create({ header: 'Aviso de privacidad', message: AVISO_PRIVACIDAD, buttons: ['Cerrar'] });
    await a.present();
  }

  private mensaje(code?: string) {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found': return 'Correo o contraseña incorrectos.';
      case 'auth/email-already-in-use': return 'Ese correo ya está registrado.';
      case 'auth/weak-password': return 'La contraseña es muy débil.';
      case 'auth/too-many-requests': return 'Demasiados intentos. Espera unos minutos.';
      default: return 'Ocurrió un error. Inténtalo de nuevo.';
    }
  }

  private async aviso(message: string) {
    const t = await this.toast.create({ message, duration: 2500, position: 'top' });
    await t.present();
  }
}
