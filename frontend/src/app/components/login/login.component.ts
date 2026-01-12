import { Component, OnInit} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/modules/shared.module';
import { SetFocusDirective } from 'src/app/directives/setfocus.directive';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { DialogService } from 'src/app/services/dialog.service';
import { MaintenanceService } from 'src/app/services/maintenance.service';
import { LoadingOverlayComponent } from '../loading-overlay/loading-overlay.component';

@Component({
    templateUrl: 'login.component.html',
    styleUrls: ['login.component.css'],
    standalone: true,
    imports: [
        CommonModule, 
        FormsModule, 
        ReactiveFormsModule, 
        SharedModule, 
        SetFocusDirective, 
        NavBarComponent, 
        RouterModule,
        LoadingOverlayComponent
    ]
})

export class LoginComponent implements OnInit {
    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private authenticationService: AuthenticationService,
        private maintenanceService: MaintenanceService,
        private dialogService: DialogService
    ){
        // redirect to home if already logged in
        if (this.authenticationService.currentUser) {
            this.router.navigate(['/']);
        }
    }

    loginForm!: FormGroup;    
    ctlEmail!: FormControl;
    ctlPassword!: FormControl;

    isLoading = false;

    quickAccounts = [
        { email: 'bepenelle@epfc.eu', password: 'Password1,' },
        { email: 'boverhaegen@epfc.eu', password: 'Password1,' },
        { email: 'gedielman@epfc.eu', password: 'Password1,' },
        { email: 'admin@epfc.eu', password: 'Password1,' },
    ];

    ngOnInit() {
        this.ctlEmail = this.formBuilder.control(
            '', 
            [
                Validators.required, 
                Validators.pattern(/^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/)
            ]
        );

        this.ctlPassword = this.formBuilder.control(
            '', 
            [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(/[A-Z]/),         // au moins une majuscule
                Validators.pattern(/[0-9]/),         // au moins un chiffre
                Validators.pattern(/[@#$!%*?&,.]/)   // au moins un caractère spécial
            ]
        );
        
        this.loginForm = this.formBuilder.group({
            email: this.ctlEmail,
            password: this.ctlPassword
        });

        // force le champ email à passer en état touched (et afficher error message) dés qu'on saisit qlq chose
        this.ctlEmail.valueChanges.subscribe(() => {
            if (!this.ctlEmail.touched) {
                this.ctlEmail.markAsTouched();
            }
        });

        this.ctlPassword.valueChanges.subscribe(() => {
            if (!this.ctlPassword.touched) {
                this.ctlPassword.markAsTouched();
            }
        });
    }

    private get pwd(): string {
        return this.ctlPassword?.value ?? '';
    }
    get pwdTooShort(): boolean {
        return this.pwd.length < 8;
    }
    get pwdMissingUpper(): boolean {
        return !/[A-Z]/.test(this.pwd);
    }
    get pwdMissingDigit(): boolean {
        return !/[0-9]/.test(this.pwd);
    }
    get pwdMissingSpecial(): boolean {
        return !/[@#$!%*?&,.]/.test(this.pwd);
    }
    
    login() {
        if (this.loginForm.invalid) return;

        this.isLoading = true;

        this.authenticationService.login(this.ctlEmail.value, this.ctlPassword.value)
            .subscribe({
                next: () => {
                    this.isLoading = false;
                    this.router.navigate(['/']);
                },
                error: () => {
                    this.isLoading = false;
                    this.dialogService.openDialog({
                        title: 'Error',
                        message: 'Bad credentials',
                        positiveText: 'OK',
                        negativeText: 'Cancel'
                    })
                }
            });
    }

    quickLogin(account: { email: string, password: string }) {
        // Remplir les champs
        this.ctlEmail.setValue(account.email);
        this.ctlPassword.setValue(account.password);

        this.login();
    }

    resetDatabase() {
        this.dialogService.openDialog({
            title: 'Confirmation',
            message: 'Are you sure you want to reset the database?',
            positiveText: 'Yes',
            negativeText: 'No'
        }).subscribe(confirmed => {
            if (!confirmed) return;
            
            this.maintenanceService.resetDatabase().subscribe();
        });
    }
}
