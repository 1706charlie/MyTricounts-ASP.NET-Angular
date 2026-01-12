import { Component, OnInit } from "@angular/core";
import { NavBarComponent } from "../nav-bar/nav-bar.component";
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { TricountService } from "src/app/services/tricount.service";
import { CommonModule } from "@angular/common";
import { SharedModule } from "src/app/modules/shared.module";
import { AuthenticationService } from "src/app/services/authentication.service";
import { SetFocusDirective } from 'src/app/directives/setfocus.directive';
import { User } from "src/app/models/user";
import { UserService } from "src/app/services/user.service";


@Component({
  templateUrl: './add-tricount.component.html',
  styleUrls: ['./add-tricount.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    NavBarComponent,
    SetFocusDirective
  ]
})

export class AddTricountComponent implements OnInit {
    constructor (
        private formBuilder: FormBuilder,
        private tricountService: TricountService,
        private userService: UserService,  
        private authService: AuthenticationService,
        private router: Router
    ) {}

    form!: FormGroup;    
    ctlTitle!: FormControl;
    ctlDescription!: FormControl;
    ctlNewParticipant!: FormControl<number | null>;

    isUsersLoading = true;

    // getter pour accéder directement à la cache du service
    private get allUsers(): User[] {
        return this.userService.users;
    }

    // getter pour accéder directement à la cache du service
    get currentUser(): User {
        return this.authService.currentUser!;
    }

    // état local légitime : participants en cours de création
    private _participants: User[] = [];
    get participants(): User[] { return this._participants; }    

    ngOnInit() {
        this.initForm();

        // Participants : le créateur est toujours dedans
        this._participants = [this.currentUser];

        this.isUsersLoading = true;
        this.userService.loadUsers().subscribe({
            next: () => { this.isUsersLoading = false; }
        });
    }

    private initForm() {
        this.ctlTitle = this.formBuilder.control(
            '',
            [
                Validators.required, 
                Validators.minLength(3)
            ],
            [this.titleUsed()]
        );

        this.ctlDescription = this.formBuilder.control(
            '',
            [Validators.minLength(3)]
        );

        this.ctlNewParticipant = this.formBuilder.control<number | null>(null);

        this.form = this.formBuilder.group({
            title: this.ctlTitle,
            description: this.ctlDescription,
            newParticipant: this.ctlNewParticipant
        });

        this.ctlTitle.markAsTouched(); // forcer l'input à afficher l'erreur dés qu'on ouvre la page

        this.ctlTitle.valueChanges.subscribe(() => {
            if (!this.ctlTitle.touched) 
                this.ctlTitle.markAsTouched();
        });

        this.ctlDescription.valueChanges.subscribe(() => {
            if(!this.ctlDescription.touched) 
                this.ctlDescription.markAsTouched();
        });
    }

    private titleUsed(): AsyncValidatorFn {
        let timeout: NodeJS.Timeout;
        return (ctl: AbstractControl) => {
            clearTimeout(timeout);
            const title = ctl.value.trim();
            return new Promise(resolve => {
                timeout = setTimeout(() => {
                    this.tricountService.isTitleAvailable(title, 0).subscribe(res => {
                        resolve(res ? null : { titleUsed: true });
                    });
                }, 300);
            });
        };
    }

    get availableUsers(): User[] {
        const ids = this._participants.map(p => p.id);
        return this.allUsers.filter(u => !ids.includes(u.id));
    }

    addParticipant() {
        const id = this.ctlNewParticipant.value;
        const userToAdd = this.allUsers.find(u => u.id == id);
        this._participants = this.sortParticipants([...this._participants, userToAdd!]);
        this.ctlNewParticipant.setValue(null);
    }

    removeParticipant(user: User) {
        this._participants = this.sortParticipants(
            this._participants.filter(p => p.id != user.id)
        );
    }

    private sortParticipants(participants: User[]): User[] {
        return [...participants].sort((a, b) =>
            (a.fullName!).localeCompare(b.fullName!)
        );
    }

    saveTricount() {
        const title = this.ctlTitle.value;
        const description = this.ctlDescription.value ?? null;
        
        this.tricountService.saveTricount(
            0, 
            title, 
            description, 
            this.participants, 
            this.currentUser.id!
        ).subscribe();

        // navigation immédiate
        this.goBack();
    }

    private goBack() {
        this.router.navigate(['/']);  
    }

    get backUrl(): string {
        return '/';
    }
}
