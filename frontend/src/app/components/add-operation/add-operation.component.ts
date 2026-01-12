import { NavBarComponent } from "../nav-bar/nav-bar.component";
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { TricountService } from "src/app/services/tricount.service";
import { CommonModule } from "@angular/common";
import { SharedModule } from "src/app/modules/shared.module";
import { AuthenticationService } from "src/app/services/authentication.service";
import { SetFocusDirective } from 'src/app/directives/setfocus.directive';
import { User } from "src/app/models/user";
import { Tricount } from "src/app/models/tricount";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { Component, OnInit } from "@angular/core";
import { TricountNotFoundComponent } from "../tricount-not-found/tricount-not-found.component";
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';

const FR_DATE_FORMATS = {
    parse: {
        dateInput: 'DD/MM/YYYY',
    },
    display: {
        dateInput: 'DD/MM/YYYY',
        monthYearLabel: 'MMM YYYY',
        dateA11yLabel: 'DD/MM/YYYY',
        monthYearA11yLabel: 'MMMM YYYY',
    },
};

@Component({
  templateUrl: './add-operation.component.html',
  styleUrls: ['./add-operation.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    NavBarComponent,
    SetFocusDirective,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    TricountNotFoundComponent
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
    { provide: MAT_DATE_FORMATS, useValue: FR_DATE_FORMATS },
    provideMomentDateAdapter(FR_DATE_FORMATS),
  ],
})

export class AddOperationComponent implements OnInit {
    constructor (
        private formBuilder: FormBuilder,
        private tricountService: TricountService,
        private authService: AuthenticationService,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    form!: FormGroup;    
    ctlTitle!: FormControl;
    ctlAmount!: FormControl;
    ctlOperationDate!: FormControl;
    ctlPaidBy!: FormControl;

    minOperationDate!: Date;
    maxOperationDate!: Date;

    tricountNotFound = false;

    private _tricountId!: number;
    isAmountFocused = false;

    // getter pour accéder directement à la cache du service
    get tricount(): Tricount | undefined {
        return this.tricountService.tricounts.find(t => t.id === this._tricountId);
    }

    private get currentUserId(): number {
        return this.authService.currentUser!.id!;
    }

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
            }
        });
    }

    private initForm() {
        // title
        this.ctlTitle = this.formBuilder.control(
            '',
            [
                Validators.required, 
                Validators.minLength(3)
            ]
        );

        // amount
        this.ctlAmount = this.formBuilder.control(
            '',
            [
                Validators.required, 
                Validators.min(0.01)
            ]
        );

        // operationDate
        this.minOperationDate = new Date(this.tricount!.createdAt!);
        this.maxOperationDate = new Date(); // today

        this.ctlOperationDate = this.formBuilder.control(
            this.maxOperationDate,
            [
                Validators.required, 
                this.minDateValidator(),
                this.maxDateValidator()
            ]
        );

        // paid by
        this.ctlPaidBy = this.formBuilder.control(                                      // FormControl
            this.currentUserId // initialisation avec l'utilisateur connecté
        );

        // repartitions
        const repartitionGroups = this.sortedParticipants.map(p =>                      // repartitionGroups -> un tableau de FormGroups
            this.formBuilder.group({                                                    // FormGroup  // Un seul FormGroup représente une ligne “From whom”
                userId: p.id,                                                           //   userId: p.id   équivalent à    userId: new FormControl(p.id)
                checked: true,
                weight: 1,
            })
        ); 

        const repartitionsArray = this.formBuilder.array(                               // FormArray 
            repartitionGroups,                                                          // collection de FormGroup
            [
                this.atLeastOneParticipantValidator()                                   // validateur
            ]
        );


        this.form = this.formBuilder.group({                                            // FormGroup 
            title: this.ctlTitle,                                                       // FormControl
            amount: this.ctlAmount,
            operationDate: this.ctlOperationDate,
            paidBy: this.ctlPaidBy,
            repartitions: repartitionsArray
        });

        this.ctlTitle.markAsTouched(); // forcer l'input à afficher l'erreur dés qu'on ouvre la page
        this.ctlAmount.markAsTouched();

        this.ctlTitle.valueChanges.subscribe(() => {
            if (!this.ctlTitle.touched) this.ctlTitle.markAsTouched();
        });

        this.ctlAmount.valueChanges.subscribe(() => {
            if (!this.ctlAmount.touched) this.ctlAmount.markAsTouched();
        });

        this.ctlOperationDate.valueChanges.subscribe(() => {
            if (!this.ctlOperationDate.touched) this.ctlOperationDate.markAsTouched();
        });

        this.repartitions.valueChanges.subscribe(() => {
            if (!this.repartitions.touched) this.repartitions.markAsTouched();
        });

    }

    get repartitions(): FormArray {
        return this.form.get('repartitions') as FormArray;
    }

    private minDateValidator(): ValidatorFn {
        return (ctl: AbstractControl) => {
            const inputDate = ctl.value;
            if (!inputDate) return null;

            const selectedDateMs = this.dateOnlyMs(new Date(inputDate));
            const minDateMs = this.dateOnlyMs(this.minOperationDate);

            return selectedDateMs < minDateMs ? { beforeTricountCreation: true } : null;
        };
    }

    private maxDateValidator(): ValidatorFn {
        return (ctl: AbstractControl) => {
            const inputDate = ctl.value;
            if (!inputDate) return null;

            const selectedDateMs = this.dateOnlyMs(new Date(inputDate));
            const maxDateMs = this.dateOnlyMs(this.maxOperationDate);

            return selectedDateMs > maxDateMs ? { dateInFuture: true } : null;
        };
    }

    private dateOnlyMs(date: Date): number {
        return new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        ).getTime();
    }

    get sortedParticipants(): User[] {
        const participants = this.tricount!.participants;
        return [...participants].sort((a, b) => (a.fullName!).localeCompare(b.fullName!));
    }

    private atLeastOneParticipantValidator(): ValidatorFn {
        return (ctl: AbstractControl) => {
            const repartitions = ctl.value as Array<{ checked: boolean }>;
            return repartitions.some(r => r.checked) ? null : { noParticipant: true };
        };
    }

    get showAmountPrefix(): boolean {
        const value = this.ctlAmount?.value;
        return this.isAmountFocused || (value !== null && value !== '');
    }

    toggleChecked(i: number) {
        const repartition = this.repartitions.at(i) as FormGroup;
        const checked = repartition.value.checked;

        if(!checked) {
            repartition.patchValue({ weight: 0});
        } else {
            repartition.patchValue({ weight: 1 });
        }
    }

    incWeight(i: number) {
        const repartition = this.repartitions.at(i) as FormGroup;

        if (!repartition.value.checked) repartition.patchValue({ checked: true });
        repartition.patchValue({ weight: repartition.value.weight + 1 });
    }

    decWeight(i: number) {
        const repartition = this.repartitions.at(i) as FormGroup;

        if (!repartition.value.checked) return;

        const weight = repartition.value.weight;

        if (weight > 1) {
            repartition.patchValue({ weight: weight - 1 });
        } else {
            repartition.patchValue({ checked: false, weight: 0 });
        }
    }

    shareFor(i: number): number {
        const amount = Number(this.ctlAmount.value ?? 0);
        if (!amount || amount <= 0) return 0;

        const total = this.totalWeight();
        if (total === 0) return 0;

        const repartition = this.repartitions.at(i);

        const checked = repartition.value.checked;
        if (!checked) return 0;

        const weight = repartition.value.weight;
        const share = amount * (weight / total);
        return Math.round(share * 100) / 100;
    }

    private totalWeight(): number {
        return this.repartitions.controls.filter(r => r.value.checked)
            .reduce((sum, r) => sum + r.value.weight, 0);
    }

    saveOperation() {
        const title = this.ctlTitle.value;
        const amount = Number(this.ctlAmount.value);
        const operationDate = this.formatDate(this.ctlOperationDate.value);
        const initiatorId = this.ctlPaidBy.value;

        const repartitions = this.repartitions.controls
            .map(c => c.value)
            .filter(v => v.checked)
            .map(v => ({ userId: v.userId, weight: v.weight }));

        this.tricountService.saveOperation(
            0,
            this._tricountId,
            title,
            amount,
            operationDate,
            initiatorId,
            repartitions
        ).subscribe();

        // navigation immédiate
        this.goBack();
    }

    private formatDate(value: any): string {
        const date = value instanceof Date ? value : new Date(value as string);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth retourne un nombre entre 0 et 11
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private goBack() {
        this.router.navigate(['tricount', this._tricountId]);
    }

    get backUrl(): string {
        if (this.tricount) return this._tricountId ? `/tricount/${this._tricountId}` : '/';
        else return '/';
    }

    
    
    // ----------------------------
    // Partie concernant le respect strict du format "XX/XX/XXXX" du champ OperationDate
    // ----------------------------
    
    onOperationDateKeydown(event: KeyboardEvent) {
        const isShortcut = (event.ctrlKey || event.metaKey) && !event.altKey;
        if (isShortcut) return;
        if (event.key.length !== 1) return;

        const input = event.target as HTMLInputElement;
        const nextValue = this.buildOperationDateValue(input, event.key);
        if (!this.isOperationDateValueAllowed(nextValue)) {
            event.preventDefault();
        }
    }

    onOperationDateBeforeInput(event: InputEvent) {
        if (event.inputType && !event.inputType.startsWith('insert')) return;
        if (!event.data) return;

        const input = event.target as HTMLInputElement;
        const nextValue = this.buildOperationDateValue(input, event.data);
        if (!this.isOperationDateValueAllowed(nextValue)) {
            event.preventDefault();
        }
    }

    onOperationDatePaste(event: ClipboardEvent) {
        const pasted = event.clipboardData?.getData('text') ?? '';
        const input = event.target as HTMLInputElement;
        const nextValue = this.buildOperationDateValue(input, pasted);
        if (!this.isOperationDateValueAllowed(nextValue)) {
            event.preventDefault();
        }
    }

    onOperationDateDrop(event: DragEvent) {
        const dropped = event.dataTransfer?.getData('text') ?? '';
        const input = event.target as HTMLInputElement;
        const nextValue = this.buildOperationDateValue(input, dropped);
        if (!this.isOperationDateValueAllowed(nextValue)) {
            event.preventDefault();
        }
    }

    private buildOperationDateValue(input: HTMLInputElement, inserted: string): string {
        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? input.value.length;
        return input.value.slice(0, start) + inserted + input.value.slice(end);
    }

    private isOperationDateValueAllowed(value: string): boolean {
        if (value.length > 10) return false;
        if (!/^[0-9/]*$/.test(value)) return false;

        const parts = value.split('/');
        if (parts.length > 3) return false;
        if (value.replace(/\//g, '').length > 8) return false;

        if (parts.length === 3) {
            if (parts[0].length > 2) return false;
            if (parts[1].length > 2) return false;
            if (parts[2].length > 4) return false;
        }

        return true;
    }
}
