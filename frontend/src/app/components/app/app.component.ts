import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { DrawerService } from '../../services/drawer.service';
import { AuthenticationService } from '../../services/authentication.service';
import { TricountService } from '../../services/tricount.service';
import { DialogService } from 'src/app/services/dialog.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: true,
    imports: [
        RouterOutlet,
        MatSidenavModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        CommonModule
    ]
})
export class AppComponent implements AfterViewInit {
    @ViewChild('drawer') drawer!: MatSidenav;

    constructor(
        private drawerService: DrawerService,
        private router: Router,
        public authenticationService: AuthenticationService,
        private tricountService: TricountService, 
        private dialogService: DialogService,
        public dialog: MatDialog
    ) { }

    /**
     * Hook du cycle de vie Angular appelé après l'initialisation de la vue.
     * Enregistre le drawer (MatSidenav) dans le DrawerService pour permettre
     * son ouverture/fermeture depuis d'autres composants (ex: nav-bar).
     * Doit être fait ici car @ViewChild('drawer') n'est disponible qu'après
     * l'initialisation complète de la vue.
     */
    ngAfterViewInit() {
        this.drawerService.register(this.drawer);
    }

    /**
     * Ferme le drawer et navigue vers la route spécifiée.
     * @param route Route vers laquelle naviguer (ex: '/', '/counter', '/fetch-data')
     */
    navigateTo(route: string) {
        this.drawer.close();
        this.router.navigate([route]);
    }

    /** Méthodes de navigation pour chaque entrée du menu */
    openHome() {
        this.navigateTo('/');
    }

    openCounter() {
        this.navigateTo('/counter');
    }

    openFetchData() {
        this.navigateTo('/fetch-data');
    }

    logout() {
        this.authenticationService.logout();
        this.navigateTo('/login');
    }

    resetDatabase() {
        this.dialogService.openDialog({
            title: 'Confirmation',
            message: 'Are you sure you want to reset the database?',
            positiveText: 'Yes',
            negativeText: 'No'
        }).subscribe(confirmed => {
            if (!confirmed) return;
            this.tricountService.resetDatabase().subscribe({
                next: () => {
                    this.drawer.close();
                    this.authenticationService.logout();
                    this.router.navigate(['/login']);
                }
            });
        });
    }
}
