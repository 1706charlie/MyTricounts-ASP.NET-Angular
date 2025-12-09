import { Component, Input, Output } from '@angular/core';
import { Router } from "@angular/router";
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DrawerService } from '../../services/drawer.service';

@Component({
    selector: 'app-nav-bar',
    templateUrl: './nav-bar.component.html',
    styleUrls: ['./nav-bar.component.css'],
    standalone: true,
    imports: [
        MatToolbarModule,
        MatIconModule,
        MatButtonModule,
        RouterModule,
        CommonModule
    ]
})
export class NavBarComponent {
    /** Titre affiché dans la barre de navigation */
    @Input() title: string = '';
    
    /** URL optionnelle pour la navigation retour. Si définie, affiche un bouton retour au lieu du menu */
    @Input() backUrl?: string;
    
    /** Si true, masque le bouton menu/retour et affiche uniquement l'icône par défaut (history_edu) */
    @Input() hideMenu: boolean = false;

    constructor(
        private drawerService: DrawerService,
        private router: Router
    ) {}

    goBack() {
        if (this.backUrl) {
            this.router.navigateByUrl(this.backUrl);
        }
    }

    openDrawerClick() {
        this.drawerService.open();
    }
}

