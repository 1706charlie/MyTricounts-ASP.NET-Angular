import { Component, ViewChild, AfterViewInit, OnInit, Renderer2 } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { DrawerService } from '../../services/drawer.service';
import { AuthenticationService } from '../../services/authentication.service';
import { DialogService } from 'src/app/services/dialog.service';
import { MaintenanceService } from 'src/app/services/maintenance.service';
import { User } from 'src/app/models/user';

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

export class AppComponent implements AfterViewInit, OnInit {
    constructor(
        private drawerService: DrawerService,
        private router: Router,
        private authenticationService: AuthenticationService,
        private maintenanceService: MaintenanceService,
        private dialogService: DialogService, 
        private renderer: Renderer2
    ) { }

    @ViewChild('drawer') drawer!: MatSidenav;
    
    isDarkMode = false;

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

    ngOnInit() {
        this.isDarkMode = localStorage.getItem('theme') === 'dark';
        this.applyTheme();
    }

    get currentUser(): User | undefined  {
        return this.authenticationService.currentUser;
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
        this.applyTheme();
        this.drawer.close();
    }

    private applyTheme() {
        if (this.isDarkMode) {
            this.renderer.addClass(document.body, 'dark-mode');
        } else {
            this.renderer.removeClass(document.body, 'dark-mode');
        }
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
            this.maintenanceService.resetDatabase().subscribe({
                next: () => {
                    this.drawer.close();
                    this.authenticationService.logout();
                    this.router.navigate(['/login']);
                }
            });
        });
    }

    private navigateTo(route: string) {
        this.drawer.close();
        this.router.navigate([route]);
    }
}
