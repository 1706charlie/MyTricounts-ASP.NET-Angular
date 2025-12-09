import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl, ValidationErrors, AbstractControl, ReactiveFormsModule, AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { SharedModule } from 'src/app/modules/shared.module';
import { SetFocusDirective } from 'src/app/directives/setfocus.directive';
import { NavBarComponent } from '../nav-bar/nav-bar.component';

@Component({
    templateUrl:'./signup.component.html',
    styleUrls: ['./signup.component.css'],
    standalone: true,
    imports: [ReactiveFormsModule, SetFocusDirective, SharedModule, NavBarComponent]
})

export class SignUpComponent {
    public signupForm!: FormGroup;
    public ctlEmail!: FormControl;
    public ctlFullName!: FormControl;
    public ctlIban!: FormControl;
    public ctlPassword!: FormControl;
    public ctlPasswordConfirm!: FormControl;

    constructor(
        public authenticationService: AuthenticationService,
        public router: Router,
        private formBuilder: FormBuilder
    ){
        this.ctlEmail = this.formBuilder.control('', 
            [
                Validators.required,
                Validators.pattern(/^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/),
            ], // validateurs synchrones 
            [this.emailUsed()] // validateur asynchrone
        );

        this.ctlFullName = this.formBuilder.control('', 
            [
                Validators.required,
                Validators.minLength(3),
            ], // validateurs synchrones 
            [this.fullNameUsed()] // validateur asynchrone
        );
        
        this.ctlIban = this.formBuilder.control('', 
            Validators.pattern(/^[A-Z]{2}\d{2}(?: \d{4}){3}$/) // validateur synchrone
        );

        this.ctlPassword = this.formBuilder.control('', [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/[A-Z]/),         // au moins une majuscule
            Validators.pattern(/[0-9]/),         // au moins un chiffre
            Validators.pattern(/[@#$!%*?&,.]/)   // au moins un caractère spécial
        ]);
        
        this.ctlPasswordConfirm = this.formBuilder.control('', 
            [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(/[A-Z]/),
                Validators.pattern(/[0-9]/),
                Validators.pattern(/[@#$!%*?&,.]/),
                this.passwordsMismatch()
            ] // validateurs synchrones 
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

    
    get pwdConf(): string {
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
    emailUsed(): AsyncValidatorFn {
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

    fullNameUsed(): AsyncValidatorFn {
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

    // https://angular.dev/guide/forms/form-validation#adding-cross-validation-to-reactive-forms
    passwordsMismatch(): ValidatorFn {
        return (ctl: AbstractControl) => {
            const pwd = this.ctlPassword?.value ?? '';
            const conf = ctl.value ?? '';
            if (!pwd || !conf) return null;
            return pwd === conf ? null : { passwordsMismatch: true };
        };
    }

    signup() {
        if (this.signupForm.invalid) return;

        this.authenticationService.signup(
            this.ctlEmail.value,
            this.ctlFullName.value,
            this.ctlIban.value,
            this.ctlPassword.value
        ).subscribe(() => {
            if (this.authenticationService.currentUser) {
                this.router.navigate(['/']);
            }
        });
    }

    

}
