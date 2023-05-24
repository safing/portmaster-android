
import { Pipe, PipeTransform } from '@angular/core';
import { Application } from './application';

@Pipe({
  name: 'systemAppsFilter',
  standalone: true,
})
export class SystemAppList implements PipeTransform {
  transform(apps: Application[], filterSystemApps: boolean): any {
    if(!apps) {
      return null;
    }
    
    if (filterSystemApps) {
        return apps.filter(app => !app.system);
    } else {
        return apps;
    }
  }
}