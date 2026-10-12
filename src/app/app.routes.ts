import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./login/login.page').then((m) => m.LoginPage) },
  { path: 'home', canActivate: [authGuard], loadComponent: () => import('./home/home.page').then((m) => m.HomePage) },
  { path: 'nuevo', canActivate: [authGuard], loadComponent: () => import('./nuevo/nuevo.page').then((m) => m.NuevoPage) },
  { path: 'perfil', canActivate: [authGuard], loadComponent: () => import('./perfil/perfil.page').then((m) => m.PerfilPage) },
];
