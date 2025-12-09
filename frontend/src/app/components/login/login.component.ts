import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthenticationService } from 'src/app/services/authentication.service';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/modules/shared.module';
import { SetFocusDirective } from 'src/app/directives/setfocus.directive';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { TricountService } from 'src/app/services/tricount.service';
import { DialogService } from 'src/app/services/dialog.service';
import { MatDialog } from '@angular/material/dialog';


@Component({
    templateUrl: 'login.component.html',
    styleUrls: ['login.component.css'],
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedModule, SetFocusDirective, NavBarComponent, RouterModule]
})

export class LoginComponent implements OnInit {
    public loginForm!: FormGroup;    
    public ctlEmail!: FormControl;
    public ctlPassword!: FormControl;

    quickAccounts = [
        { email: 'bepenelle@epfc.eu', password: 'Password1,' },
        { email: 'boverhaegen@epfc.eu', password: 'Password1,' },
        { email: 'gedielman@epfc.eu', password: 'Password1,' },
        { email: 'admin@epfc.eu', password: 'Password1,' },
    ];

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private authenticationService: AuthenticationService,
        private tricountService: TricountService,
        private dialogService: DialogService,
        public dialog: MatDialog
    ) {
        // redirect to home if already logged in
        if (this.authenticationService.currentUser) {
            this.router.navigate(['/']);
        }
    }

    // La méthode ngOnInit() est exécutée au moment où le composant est initialisé, juste avant son affichage
    ngOnInit() {
        this.ctlEmail = this.formBuilder.control('', [
            Validators.required, 
            Validators.pattern(/^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/)
        ]);

        this.ctlPassword = this.formBuilder.control('', [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/[A-Z]/),         // au moins une majuscule
            Validators.pattern(/[0-9]/),         // au moins un chiffre
            Validators.pattern(/[@#$!%*?&,.]/)   // au moins un caractère spécial
        ]);
        
        this.loginForm = this.formBuilder.group({  // FormBuilder est une classe utilitaire fournie par Angular pour créer plus facilement des FormGroup et FormControl
            email: this.ctlEmail,
            password: this.ctlPassword
        });

        // force le champ email à passer en état touched dés qu'on saisit qlq chose. Sans cela il faudrait attendre la soumission pour que le message "not a valid email" s'affiche
        this.ctlEmail.valueChanges.subscribe(() => {
            if (!this.ctlEmail.touched) {
                this.ctlEmail.markAsTouched();
            }
        });

        // force le champ password à passer en état touched dés qu'on saisit qlq chose.
        this.ctlPassword.valueChanges.subscribe(() => {
            if (!this.ctlPassword.touched) {
                this.ctlPassword.markAsTouched();
            }
        });
    }

    // On définit ici un getter qui permet de simplifier les accès aux champs du formulaire dans le HTML
    get f() { return this.loginForm.controls; }

    get pwd(): string {
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
    
    // Cette méthode est bindée sur l'événement onsubmit du formulaire
    onSubmit() {
        if (this.loginForm.invalid) return;

        this.authenticationService.login(this.f.email.value, this.f.password.value)
            .subscribe({
                next: () => {
                    this.router.navigate(['/']);
                },
                error: () => {
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
        this.authenticationService.login(account.email, account.password).subscribe({
            next: () => {
                this.router.navigate(['/']);
            }
        });
    }

    resetDatabase() {
        this.dialogService.openDialog({
            title: 'Confirmation',
            message: 'Are you sure you want to reset the database?',
            positiveText: 'Yes',
            negativeText: 'No'
        }).subscribe(confirmed => {
            if (!confirmed) return;
            this.tricountService.resetDatabase().subscribe(); 
        });
    }
}
