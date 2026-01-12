import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { SharedModule } from "src/app/modules/shared.module";
import { NavBarComponent } from "../nav-bar/nav-bar.component";
import { User } from "src/app/models/user";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthenticationService } from "src/app/services/authentication.service";
import { TricountService } from "src/app/services/tricount.service";
import { UserService } from "src/app/services/user.service";
import { Tricount } from "src/app/models/tricount";
import { TricountNotFoundComponent } from "../tricount-not-found/tricount-not-found.component";
import { SetFocusDirective } from 'src/app/directives/setfocus.directive';


@Component({
  templateUrl: './edit-tricount.component.html',
  styleUrls: ['./edit-tricount.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    NavBarComponent,
    TricountNotFoundComponent,
    SetFocusDirective
  ]
})

export class EditTricountComponent implements OnInit {
    constructor (
        private route: ActivatedRoute,
        private formBuilder: FormBuilder,
        private tricountService: TricountService,
        private userService: UserService,  
        private router: Router,
        private authService: AuthenticationService,
    ) {}

    form!: FormGroup;    
    ctlTitle!: FormControl;
    ctlDescription!: FormControl;
    ctlNewParticipant!: FormControl<number | null>;

    tricountNotFound = false;
    isUsersLoading = true;

    private _tricountId!: number;

    // getter pour accéder directement à la cache du service
    private get allUsers(): User[] {
        return this.userService.users;
    }

    // getter pour accéder directement à la cache du service
    private get currentUser(): User {
        return this.authService.currentUser!;
    }

    // getter pour accéder directement à la cache du service
    get tricount(): Tricount | undefined {
        return this.tricountService.tricounts.find(t => t.id === this._tricountId);
    }

    // état local légitime : participants en cours d’édition
    private _participants: User[] = [];
    get participants(): User[] { return this._participants; }
    
    ngOnInit() {
        this._tricountId = Number(this.route.snapshot.paramMap.get("tricountId"));
        this.tricountNotFound = false;

        this.tricountService.loadUserTricounts().subscribe({
            next: () => {
                if (!this.tricount) {
                    this.tricountNotFound = true;
                    return;
                }

                this.initForm();

                this.isUsersLoading = true;
                this.userService.loadUsers().subscribe({
                    next: () => { this.isUsersLoading = false; }
                });
            }
        });
    }

    private initForm() {
        this.ctlTitle = this.formBuilder.control(
            this.tricount!.title,
            [
                Validators.required, 
                Validators.minLength(3)
            ],
            [this.titleUsed(this._tricountId)]
        );

        this.ctlDescription = this.formBuilder.control(
            this.tricount!.description ?? "",
            [Validators.minLength(3)]
        );

        this.ctlNewParticipant = this.formBuilder.control<number | null>(null);

        this.form = this.formBuilder.group({
            title: this.ctlTitle,
            description: this.ctlDescription,
            newParticipant: this.ctlNewParticipant
        });

        this.ctlTitle.valueChanges.subscribe(() => {
            if (!this.ctlTitle.touched) 
                this.ctlTitle.markAsTouched();
        });

        this.ctlDescription.valueChanges.subscribe(() => {
            if(!this.ctlDescription.touched) 
                this.ctlDescription.markAsTouched();
        });

        this._participants = this.sortParticipants([...(this.tricount!.participants)]);
    }

    private titleUsed(tricountId: number): AsyncValidatorFn {
        let timeout: NodeJS.Timeout;
        return (ctl: AbstractControl) => {
            clearTimeout(timeout);
            const title = ctl.value.trim();
            return new Promise(resolve => {
                timeout = setTimeout(() => {
                    this.tricountService.isTitleAvailable(title, tricountId).subscribe(res => {
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

    canRemoveParticipant(user: User) : boolean {
        // l'utilisateur connecté ne peut pas être supprimé
        if (user.id === this.currentUser.id) return false;

        // le créateur ne peut pas être supprimé
        if(user.id === this.tricount!.creatorId) return false;

        // Si il est initator ou impliqué dans au mois une répartition
        const isInitiatorOrInRepartition = this.tricount!.operations?.some( op => 
            op.initiatorId === user.id || op.repartitions.some(r => r.userId === user.id)
        ); 
        
        return !isInitiatorOrInRepartition;
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
            this._tricountId, 
            title, 
            description, 
            this._participants, 
            this.currentUser.id!
        ).subscribe();

        // navigation immédiate
        this.goBack();
    }

    private goBack() {
        this.router.navigate(['tricount', this._tricountId]);
    }

    get backUrl(): string {
        if (this.tricount) return `/tricount/${this.tricount.id}`;
        else return '/';
    }

}
