import { Component, effect, inject } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonSegment,
  IonSegmentButton, IonLabel, IonList, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
  IonCardContent, IonFab, IonFabButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, personCircle } from 'ionicons/icons';
import * as L from 'leaflet';
import { ReportService, Reporte } from '../services/report.service';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const ICONO = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    DatePipe, UpperCasePipe, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent,
    IonSegment, IonSegmentButton, IonLabel, IonList, IonCard, IonCardHeader, IonCardTitle,
    IonCardSubtitle, IonCardContent, IonFab, IonFabButton,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="success">
        <ion-title>CleanCity</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="ir('/perfil')"><ion-icon slot="icon-only" name="person-circle"></ion-icon></ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [value]="vista" (ionChange)="cambiar($event)">
          <ion-segment-button value="lista"><ion-label>Lista</ion-label></ion-segment-button>
          <ion-segment-button value="mapa"><ion-label>Mapa</ion-label></ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list [hidden]="vista !== 'lista'" lines="none">
        @for (r of reportes(); track r.id) {
          <ion-card>
            @if (r.foto) { <img [src]="r.foto" alt="Foto del reporte" /> }
            <ion-card-header>
              <ion-card-subtitle>{{ r.categoria | uppercase }} · {{ r.estado }}</ion-card-subtitle>
              <ion-card-title>{{ r.titulo }}</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              {{ r.descripcion }}<br />
              <small>{{ r.createdAt?.toDate() | date: 'short' }}</small>
            </ion-card-content>
          </ion-card>
        } @empty {
          <p class="ion-padding">Aún no hay reportes. ¡Crea el primero!</p>
        }
      </ion-list>

      <div id="mapa" [hidden]="vista !== 'mapa'" style="width:100%;height:100%"></div>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button color="success" (click)="ir('/nuevo')"><ion-icon name="add"></ion-icon></ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
})
export class HomePage {
  private report = inject(ReportService);
  private router = inject(Router);
  reportes = this.report.reportes;
  vista: 'lista' | 'mapa' = 'lista';
  private map?: L.Map;
  private capa = L.layerGroup();

  constructor() {
    addIcons({ add, personCircle });
    effect(() => this.pintar(this.reportes()));
  }

  ionViewWillEnter() { this.report.escuchar(); }
  ionViewDidEnter() { this.initMap(); }

  ir(url: string) { this.router.navigateByUrl(url); }

  cambiar(ev: CustomEvent) {
    this.vista = ev.detail.value;
    if (this.vista === 'mapa') setTimeout(() => this.map?.invalidateSize(), 100);
  }

  private initMap() {
    if (!this.map) {
      // Cambia estas coordenadas a tu ciudad
      this.map = L.map('mapa').setView([20.3933, -101.1928], 13);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '&copy; OpenStreetMap',
      }).addTo(this.map);
      this.capa.addTo(this.map);
      this.pintar(this.reportes());
    }
    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  private pintar(data: Reporte[]) {
    if (!this.map) return;
    this.capa.clearLayers();
    data.forEach((r) =>
      L.marker([r.lat, r.lng], { icon: ICONO })
        .bindPopup(`<b>${esc(r.titulo)}</b><br>${esc(r.categoria)}`) // escapado: evita XSS
        .addTo(this.capa),
    );
  }
}
