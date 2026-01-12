import { Component, OnInit } from "@angular/core";
import { NavBarComponent } from "../nav-bar/nav-bar.component";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { OperationCardComponent } from "../operation-card/operation-card.component";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from '@angular/material/tooltip';
import { Tricount } from "src/app/models/tricount";
import { ActivatedRoute, Router } from "@angular/router";
import { TricountService } from "src/app/services/tricount.service";
import { Operation } from "src/app/models/operation";
import { AuthenticationService } from "src/app/services/authentication.service";
import { EMPTY, switchMap } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TricountNotFoundComponent } from "../tricount-not-found/tricount-not-found.component";
import { DialogService } from "src/app/services/dialog.service";
import { Role, User } from "src/app/models/user";
import { EmptyStateComponent } from "../empty-state/empty-state.component";
import { LoadingOverlayComponent } from "../loading-overlay/loading-overlay.component";

@Component({
    templateUrl:'./view-tricount.component.html',
    styleUrls: ['./view-tricount.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        NavBarComponent,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        OperationCardComponent,
        MatProgressSpinnerModule,
        TricountNotFoundComponent,
        EmptyStateComponent,
        LoadingOverlayComponent
    ]
})

export class ViewTricountComponent implements OnInit {
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private tricountService: TricountService,
        private authService: AuthenticationService,
        private dialogService: DialogService
    ) {}

    isRefreshing = false;
    isBalanceLoading = false;
    tricountNotFound = false;

    private _tricountId!: number;

    // getter pour accéder directement à la cache du service
    get tricount(): Tricount | undefined {
        return this.tricountService.tricounts.find(t => t.id === this._tricountId);
    }

    ngOnInit() {
        this._tricountId = Number(this.route.snapshot.paramMap.get('tricountId'));
        this.loadPage();
    }

    refresh() {
        this.isRefreshing = true;
        this.loadPage(true);
    }

    private loadPage(force: boolean = false) {
        this.tricountNotFound = false;
        this.isBalanceLoading = true;
        this.tricountService.loadUserTricounts(force).pipe(
            switchMap(() => {
                if (!this.tricount) {
                    this.tricountNotFound = true;
                    return EMPTY;
                }
                return this.tricountService.loadTricountBalance(this._tricountId, force);
            })
        ).subscribe({
            complete: () => {
                this.isRefreshing = false;
                this.isBalanceLoading = false;
            },
        });
    }

    private get currentUser(): User {
        return this.authService.currentUser!;
    }

    get operations(): Operation[] {
        return this.tricount!.operations;
    }

    get totalExpenses(): number {
        return this.operations.reduce((sum, op) => sum + (op.amount!), 0);
    }

    get myTotalDue(): number {
        const userId = this.currentUser.id;
        const balance = this.tricountService.getBalance(this._tricountId).find(b => b.userId === userId);
        return balance?.due ?? 0; // on renvoie 0 pour le cas spécifique où : on est admin ET non participant -> dans ce cas, find(...) renvoie undefined
    }

    private get participantsCount(): number {
        return this.tricount!.participants.length;
    }

    get isAlone(): boolean {
        return this.participantsCount === 1;
    }

    get hasOperations(): boolean {
        return this.operations.length > 0;
    }

    get isBalanceLoadingInService(): boolean {
        return this.tricountService.isBalanceLoading;
    }

    private goBack() {
        this.router.navigate(['/']);
    }

    openEditTricount() {
        this.router.navigate(['tricount', this._tricountId, 'edit']);
    }

    viewBalance() {
        this.router.navigate(['tricount', this._tricountId, 'balance']);
    }

    openAddOperation() {
        this.router.navigate(['tricount', this._tricountId, 'operation', 'add']);
    }

    openEditOperation(operationId?: number) {
        if (!operationId) return;
        this.router.navigate(['tricount', this._tricountId, 'operation', operationId, 'edit']);
    }

    get canDeleteTricount(): boolean {
        return this.currentUser.role === Role.Admin 
            || this.currentUser.id === this.tricount!.creatorId;
    }

    confirmDeleteTricount() {
        this.dialogService.openDialog({
            title: 'Confirm deletion',
            message: 'Do you really want to delete this tricount?',
            positiveText: 'Yes',
            negativeText: 'No'
        }).subscribe(confirmed => {
            if (!confirmed) return;
            this.tricountService.deleteTricount(this._tricountId).subscribe();

            // navigation immédiate
            this.goBack();
        });
    }
}
