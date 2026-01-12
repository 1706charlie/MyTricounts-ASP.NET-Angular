import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';

// petit composant qui est affiché quand on essaye d'accéder à une page sécurisée 
// sans être logué ou en n'ayant pas le bon rôle. 
// Il affiche un message d'erreur, puis redirige automatiquement vers la page de login après 2 secondes.
@Component({
    selector: 'app-restricted',
    templateUrl: './restricted.component.html',
    styleUrls: ['./restricted.component.css'],
    standalone: true,
    imports: [
        NavBarComponent, 
        EmptyStateComponent
    ],
})

export class RestrictedComponent implements OnInit {
    constructor(private router: Router) { }

    ngOnInit() {
        setTimeout(() => {
            this.router.navigate(['/login']);
        }, 2000);
    }
}
