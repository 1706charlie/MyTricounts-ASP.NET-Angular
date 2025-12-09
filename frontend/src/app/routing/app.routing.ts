import { Routes } from '@angular/router';

import { HomeComponent } from '../components/home/home.component';
import { LoginComponent } from '../components/login/login.component';
import { SignUpComponent } from '../components/signup/signup.component';
import { AuthGuard } from '../services/auth.guard';

export const appRoutes: Routes = [
    { path: '', component: HomeComponent, pathMatch: 'full', canActivate: [AuthGuard]},
    { path: 'login', component: LoginComponent},
    { path: 'signup', component: SignUpComponent},
    { path: '**', redirectTo: '' }
];
