import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'menu/bug-report',
    loadComponent: () => import('./menu/bug-report/bug-report.component').then((m) => m.BugReportComponent),
  },
  {
    path: 'menu/enabled-apps',
    loadComponent: () => import('./menu/enabled-apps/enabled-apps.component').then((m) => m.EnabledAppsComponent),
  },
  {
    path: 'menu/logs',
    loadComponent: () => import('./menu/logs/logs.component').then((m) => m.LogsComponent),
  },
  {
    path: 'menu/user-info',
    loadComponent: () => import('./menu/user-info/user-info.component').then((m) => m.UserInfoComponent),
  },
  {
    path: 'menu/vpn-settings',
    loadComponent: () => import('./menu/vpn-settings/vpn-settings.component').then((m) => m.VpnSettingsComponent),
  },
];
