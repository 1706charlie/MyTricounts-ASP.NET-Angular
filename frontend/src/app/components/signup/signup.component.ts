import { Component, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl, AbstractControl, ReactiveFormsModule, AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { SharedModule } from 'src/app/modules/shared.module';
import { SetFocusDirective } from 'src/app/directives/setfocus.directive';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { LoadingOverlayComponent } from '../loading-overlay/loading-overlay.component';

@Component({
    templateUrl:'./signup.component.html',
    styleUrls: ['./signup.component.css'],
    standalone: true,
    imports: [
        ReactiveFormsModule, 
        SetFocusDirective, 
        SharedModule, 
        NavBarComponent, 
        LoadingOverlayComponent
    ]
})

export class SignUpComponent implements OnInit {
    constructor(
        private authenticationService: AuthenticationService,
        private router: Router,
        private formBuilder: FormBuilder
    ){
        // redirect to home if already logged in
        if (this.authenticationService.currentUser) {
            this.router.navigate(['/']);
        }
    }

    signupForm!: FormGroup;
    ctlEmail!: FormControl;
    ctlFullName!: FormControl;
    ctlIban!: FormControl;
    ctlPassword!: FormControl;
    ctlPasswordConfirm!: FormControl;

    isLoading = false;

    ngOnInit() {
        this.ctlEmail = this.formBuilder.control(
            '', 
            [
                Validators.required,
                Validators.pattern(/^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/),
            ], // validateurs synchrones 
            [this.emailUsed()] // validateur asynchrone
        );

        this.ctlFullName = this.formBuilder.control(
            '', 
            [
                Validators.required,
                Validators.minLength(3),
            ],
            [this.fullNameUsed()]
        );
        
        this.ctlIban = this.formBuilder.control(
            '', 
            Validators.pattern(/^[A-Z]{2}\d{2}(?: \d{4}){3}$/)
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
        
        this.ctlPasswordConfirm = this.formBuilder.control(
            '', 
            [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(/[A-Z]/),
                Validators.pattern(/[0-9]/),
                Validators.pattern(/[@#$!%*?&,.]/),
                this.passwordsMismatch()
            ]
        );  

        this.signupForm = this.formBuilder.group({
            email: this.ctlEmail,
            fullName: this.ctlFullName,
            iban: this.ctlIban,
            password: this.ctlPassword,
            passwordConfirm: this.ctlPasswordConfirm,
        });

        this.ctlEmail.valueChanges.subscribe(() => {
            if (!this.ctlEmail.touched) {
                this.ctlEmail.markAsTouched();
            }
        });

        this.ctlFullName.valueChanges.subscribe(() => {
            if (!this.ctlFullName.touched) {
                this.ctlFullName.markAsTouched();
            }
        });

        this.ctlIban.valueChanges.subscribe(() => {
            if (!this.ctlIban.touched) {
                this.ctlIban.markAsTouched();
            }
        });

        this.ctlPassword.valueChanges.subscribe(() => {
            if (!this.ctlPassword.touched) {
                this.ctlPassword.markAsTouched();
            }
            //  Revalide le champ "passwordConfirm" lorsqu'on modifie le champ "password".
            this.ctlPasswordConfirm.updateValueAndValidity({ onlySelf: true });
        });

        this.ctlPasswordConfirm.valueChanges.subscribe(() => {
            if (!this.ctlPasswordConfirm.touched) {
                this.ctlPasswordConfirm.markAsTouched();
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
    
    private get pwdConf(): string {
        return this.ctlPasswordConfirm?.value ?? '';
    }
    get pwdConfTooShort(): boolean {
        return this.pwdConf.length < 8;
    }
    get pwdConfMissingUpper(): boolean {
        return !/[A-Z]/.test(this.pwdConf);
    }
    get pwdConfMissingDigit(): boolean {
        return !/[0-9]/.test(this.pwdConf);
    }
    get pwdConfMissingSpecial(): boolean {
        return !/[@#$!%*?&,.]/.test(this.pwdConf);
    }

    // Validateur asynchrone qui vérifie si l'email n'est pas déjà utilisé par un autre user.
    // Grâce au setTimeout et clearTimeout, on ne déclenche le service que s'il n'y a pas eu de frappe depuis 300 ms.
    private emailUsed(): AsyncValidatorFn {
        let timeout: NodeJS.Timeout;
        return (ctl: AbstractControl) => {
            clearTimeout(timeout);
            const email = ctl.value;
            return new Promise(resolve => {
                timeout = setTimeout(() => {
                    this.authenticationService.isEmailAvailable(email).subscribe(res => {
                        resolve(res ? null : { emailUsed: true });
                    });
                }, 300);
            });
        };
    }

    private fullNameUsed(): AsyncValidatorFn {
        let timeout: NodeJS.Timeout;
        return (ctl: AbstractControl) => {
            clearTimeout(timeout);
            const fullName = ctl.value;
            return new Promise(resolve => {
                timeout = setTimeout(() => {
                    this.authenticationService.isFullNameAvailable(fullName).subscribe(res => {
                        resolve(res ? null : { fullNameUsed: true });
                    });
                }, 300);
            });
        };
    }

    private passwordsMismatch(): ValidatorFn {
        return (ctl: AbstractControl) => {
            const pwd = this.ctlPassword?.value ?? '';
            const conf = ctl.value ?? '';
            if (!pwd || !conf) return null;
            return pwd === conf ? null : { passwordsMismatch: true };
        };
    }

    signup() {
        if (this.signupForm.invalid) return;

        this.isLoading = true;

        this.authenticationService.signup(
            this.ctlEmail.value,
            this.ctlFullName.value,
            this.ctlIban.value,
            this.ctlPassword.value
        ).subscribe({
            next: () => {
                this.isLoading = false;
                this.router.navigate(['/']);
            },
        });
    }

}
