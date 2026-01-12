import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { AuthenticationService } from './authentication.service';

/*
Cette classe permet d'indiquer au routeur que certains URL sont accessibles ou non en fonction du fait qu'on est identifié ou pas.
On définit un service qui implémente l'interface CanActivate. 
Ce service sera utilisé pour modifier les règles de routage en y introduisant des "conditions de garde" (voir app.routing.ts)
On peut y voir qu'il contient une méthode canActivate() qui sera appelée par le routeur et qui retourne un booléen. Dans notre cas, cette méthode vérifie :
qu'un membre est bien connecté (currentUser doit être non nul).
si c'est le cas, que le rôle de ce membre fait partie des rôles autorisés pour la route demandée, pour autant que des rôles aient été spécifiés pour cette route dans route.data.roles.
Si la route n'est pas autorisée, on demande au routeur de faire une redirection vers l'URL /restricted qui affichera un message adapté.
*/

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
    constructor(
        private router: Router,
        private authenticationService: AuthenticationService 
    ) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        const currentUser = this.authenticationService.currentUser;
        if (currentUser) {
            // check if route is restricted by role
            if (route.data.roles && route.data.roles.indexOf(currentUser.role) === -1) {
                // role not authorised so redirect to home page
                this.router.navigate(['/restricted']);
                return false;
            }

            // authorised so return true
            return true;
        }

        // not logged in so redirect to login page with the return url
        this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
    }
}
