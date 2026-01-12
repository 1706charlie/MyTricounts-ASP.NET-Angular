import { Routes } from '@angular/router';

import { MyTricountsComponent } from '../components/my-tricounts/my-tricounts.component';
import { LoginComponent } from '../components/login/login.component';
import { SignUpComponent } from '../components/signup/signup.component';
import { AuthGuard } from '../services/auth.guard';
import { AddTricountComponent } from '../components/add-tricount/add-tricount.component';
import { UnknownComponent } from 'src/app/components/unknown/unknown.component'
import { RestrictedComponent } from '../components/restricted/restricted.component';
import { ViewTricountComponent } from '../components/view-tricount/view-tricount.component';
import { EditTricountComponent } from '../components/edit-tricount/edit-tricount.component';
import { BalanceComponent } from '../components/balance/balance.component';
import { AddOperationComponent } from '../components/add-operation/add-operation.component';
import { EditOperationComponent } from '../components/edit-operation/edit-operation.component';

export const appRoutes: Routes = [
    { path: '', component: MyTricountsComponent, pathMatch: 'full', canActivate: [AuthGuard] },
    { path: 'tricount/add', component: AddTricountComponent, canActivate: [AuthGuard] },
    { path: 'tricount/:tricountId/edit', component: EditTricountComponent, canActivate: [AuthGuard] },
    { path: 'tricount/:tricountId/balance', component: BalanceComponent, canActivate: [AuthGuard] },
    { path: 'tricount/:tricountId/operation/add', component: AddOperationComponent, canActivate: [AuthGuard] },
    { path: 'tricount/:tricountId/operation/:operationId/edit', component: EditOperationComponent, canActivate: [AuthGuard] },
    { path: 'tricount/:tricountId', component: ViewTricountComponent, canActivate: [AuthGuard] },
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignUpComponent },
    { path: 'restricted', component: RestrictedComponent }, // route restricted vers laquelle le service AuthGuard fait une redirection quand l'accès à une route n'est pas autorisé (voir classe auth.guard.ts) 
    { path: '**', component: UnknownComponent }
];
