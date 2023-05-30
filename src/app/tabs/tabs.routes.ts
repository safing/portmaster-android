import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'main',
        loadComponent: () =>
          import('../spn-view/spn-view.component').then((m) => m.SPNViewComponent),
      },
      {
        path: 'help',
        loadComponent: () => import('../help/help.component').then((m) => m.HelpComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('../settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: '',
        redirectTo: '/main',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/main',
    pathMatch: 'full',
  },
];
