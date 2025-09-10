import { Routes } from '@angular/router';
import { NotFoundPageComponent } from './view/not-found-page/not-found-page.component';
import { AdminAuthGuard } from './guards/admin.auth.guard';
import { HomePageComponent } from './view/home-page/home-page.component';
import { LoginpageComponent } from './view/loginpage/loginpage.component';
import { RegisterpageComponent } from './view/registerpage/registerpage.component';
import { ForgotpasswordpageComponent } from './view/forgotpasswordpage/forgotpasswordpage.component';
import { CompletedPageComponent } from './view/completed-page/completed-page.component';
import { HomeAdminPageComponent } from './view/dashboard/home-admin-page/home-admin-page.component';
import { ProfilePageComponent } from './view/profile-page/profile-page.component';
import { ResetPasswordComponent } from './view/reset-password/reset-password.component';
import { AuthGuard } from './guards/auth.guard';
import { TermsComponent } from './view/terms/terms.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/home-admin',
        pathMatch: 'full',
    },
    {
        path: 'home',
        component: HomePageComponent,
    },
    {
        path: 'home-admin',
        component: HomeAdminPageComponent,
        canActivate: [AdminAuthGuard],
    },
    {
        path: 'profile',
        component: ProfilePageComponent,
        canActivate: [AuthGuard],
    },
    {
        path: 'afspraak-beheren',
        component: ProfilePageComponent,
        canActivate: [AuthGuard],
    },
    { 
        path: 'home/completed', 
        component: CompletedPageComponent 
    },
    {
        path: 'login',
        component: LoginpageComponent,
    },
    {
        path: 'register',
        component: RegisterpageComponent,
    },
    {
        path: 'forgotpassword',
        component: ForgotpasswordpageComponent,
    },
    {
        path: 'reset-password',
        component: ResetPasswordComponent,
    },
    {
        path: 'services',
        redirectTo: 'home#services',
    },
    {
        path: 'juridisch',
        component: TermsComponent,
    },
    {
        path: '**',
        component: NotFoundPageComponent,
    }
];
