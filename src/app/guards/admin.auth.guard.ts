import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';
import { NavigationService } from '../services/navigation.service';

@Injectable({
  providedIn: 'root',
})
export class AdminAuthGuard implements CanActivate {
  constructor(
    private authenticationService: AuthenticationService,
    private navigationService: NavigationService,
  ) {}

    async canActivate(): Promise<boolean> {
        if (await this.authenticationService.isAdministrator()) {
          return true;
        } else {
          this.navigationService.navigateTo('home');
          return false;
        }
    }
}
