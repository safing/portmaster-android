import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'tab1',
        loadComponent: () =>
          import('../spn-view/spn-view.component').then((m) => m.SPNViewComponent),
      },
      {
        path: 'tab2',
        loadComponent: () =>
          import('../login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'tab3',
        loadComponent: () =>
          import('../menu/menu.component').then((m) => m.MenuComponent),
      },
      {
        path: '',
        redirectTo: '/tabs/tab1',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/tab1',
    pathMatch: 'full',
  },
];
