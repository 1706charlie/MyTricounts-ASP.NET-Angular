import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { SharedModule } from "src/app/modules/shared.module";
import { NavBarComponent } from "../nav-bar/nav-bar.component";
import { Tricount } from "src/app/models/tricount";
import { Balance } from "src/app/models/balance";
import { ActivatedRoute } from "@angular/router";
import { TricountService } from "src/app/services/tricount.service";
import { switchMap, EMPTY } from "rxjs";
import { AuthenticationService } from "src/app/services/authentication.service";
import { TricountNotFoundComponent } from "../tricount-not-found/tricount-not-found.component";
import { LoadingOverlayComponent } from "../loading-overlay/loading-overlay.component";

@Component({
  templateUrl: './balance.component.html',
  styleUrls: ['./balance.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    NavBarComponent,
    TricountNotFoundComponent,
    LoadingOverlayComponent
  ]
})

export class BalanceComponent implements OnInit {
    constructor(
        private route : ActivatedRoute,
        private tricountService : TricountService,
        private authService: AuthenticationService
    ) {}

    isRefreshing = false;
    tricountNotFound = false;

    private _tricountId!: number;

    // getter pour accéder directement à la cache du service
    get tricount(): Tricount | undefined {
        return this.tricountService.tricounts.find(t => t.id === this._tricountId);
    }

    // getter pour accéder directement à la cache du service
    private get balances(): Balance[] {
        return this.tricountService.getBalance(this._tricountId);
    }

    ngOnInit(): void {
        this._tricountId = Number(this.route.snapshot.paramMap.get("tricountId"));
        this.loadPage();
    }

    refresh(): void {
        this.isRefreshing = true;
        this.loadPage(true);
    }

    private loadPage(force: boolean = false): void {
        this.tricountNotFound = false;
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
            },
        });
    }

    get currentUserId(): number {
        return this.authService.currentUser!.id!;
    }

    get sortedBalances(): Balance[] {
        return [...this.balances].sort((a, b) => {
            const nameA = this.getUserName(a.userId!).toLowerCase();
            const nameB = this.getUserName(b.userId!).toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }

    getUserName(userId: number): string {
        const user = this.tricount!.participants.find(u => u.id === userId);
        return user!.fullName!;
    }

    barWidth(balance: number): string {
        const max = this.maxAbsBalance;
        const pct = (Math.abs(balance) / max) * 100;
        return `${pct}%`;
    }

    private get maxAbsBalance() : number {
        const abs = this.balances.map(b => Math.abs(b.balance!));
        return Math.max(...abs);
    }

    get backUrl(): string {
        if (this.tricount) return `/tricount/${this.tricount.id}`;
        else return '/';
    }
}
