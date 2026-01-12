import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';

/*
    Dans le module de routage, UnknownComponent : { path: '**', component: UnknownComponent }
    Ce composant se contente d'afficher un message d'erreur, puis de rediriger vers la home page.
*/

@Component({
    selector: 'app-unknown',
    templateUrl: './unknown.component.html',
    styleUrls: ['./unknown.component.css'],
    standalone: true,
    imports: [
        NavBarComponent, 
        EmptyStateComponent
    ]
})

export class UnknownComponent implements OnInit {
    constructor(private router: Router) { }

    ngOnInit() {
        setTimeout(() => {
            this.router.navigate(['/']);
        }, 2000);
    }
}
