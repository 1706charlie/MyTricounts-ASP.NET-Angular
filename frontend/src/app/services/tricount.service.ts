import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, switchMap, tap, throwError, catchError } from 'rxjs';
import { BASE_URL } from 'src/main';
import { plainToInstance } from 'class-transformer';
import { Tricount } from '../models/tricount';
import { User } from '../models/user';
import { Balance } from '../models/balance';
import { Operation } from "../models/operation";
import { Repartition } from "../models/repartition";

@Injectable({ providedIn: 'root' })
export class TricountService {
    constructor(
        private http: HttpClient, 
        @Inject(BASE_URL) private baseUrl: string
    ) {}

    private _isBalanceLoading = false;

    get isBalanceLoading() : boolean {
        return this._isBalanceLoading;
    }

// -----------------------------------------
// get my tricounts
// -----------------------------------------

    // cache locale en mémoire
    private _tricounts: Tricount[] = [];

    // getter public pour accéder à la cache
    get tricounts(): Tricount[] {
        return this._tricounts;
    }

    // force: permet d'indiquer si on veut forcer le rechargement des tricounts même si ils sont déjà en cache.
    // retourne un Observable<boolean> pour indiquer si un chargement a été effectué.
    loadUserTricounts(force: boolean = false): Observable<boolean> {
        // recharge depuis le serveur si forcé ou cache vide
        if (force || this._tricounts.length === 0) {
            // appelle le backend pour récupérer les tricounts
            return this.http.get<any[]>(`${this.baseUrl}rpc/get_my_tricounts`).pipe(
                // conversion des objets json en instances du modèle Tricount
                map(res => plainToInstance(Tricount, res)),
                // mise à jour de la cache
                tap(tricounts => {
                    tricounts.forEach(t => {
                        t.operations = this.sortOperations(t.operations);
                    });

                    this._tricounts = this.sortTricounts(tricounts);
                }),
                // retourne true ici, puisqu'on a rechargé les tricounts depuis le backend
                map(() => true)
            );
        }
        // retourne false ici, puisqu'on a utilisé les données de la cache
        return of(false);
    }

    // appelé lors du logout() dans auth.service
    clearTricountsCache() {
        this._tricounts = [];
    }

// -----------------------------------------
// get tricount balance
// -----------------------------------------

    // cache locale en mémoire (par tricountId)
    private _balances = new Map<number, Balance[]>();

    // getter public pour accéder à la cache
    getBalance(tricountId: number): Balance[] {
        return this._balances.get(tricountId) ?? [];
    }

    loadTricountBalance(tricountId: number, force: boolean = false): Observable<boolean> {
        // récupérer le tricount concerné depuis la cache locale
        const tricount = this._tricounts.find(t => t.id === tricountId);

        // si le tricount n'existe pas, retourner une erreur
        if (!tricount) {
            console.log('Tricount not found in cache.');
            return throwError(() =>
                new Error('Tricount not found in cache.')
            );
        }

        const cached = this._balances.get(tricountId); // “Est-ce que j’ai déjà la balance de ce tricount en mémoire ?”

        if (force || !cached || cached.length === 0) {

            return this.http.get<any[]>(`${this.baseUrl}rpc/get_tricount_balance?tricount_id=${tricountId}`).pipe(
                map(res => plainToInstance(Balance, res)),

                tap(balance => {
                    this._balances.set(tricountId, balance);
                }),

                map(() => true),

                catchError(err => {
                    console.error(err);
                    return of(false);
                })
            );
        }

        return of(false);
    }

    // appelé lors du logout() dans auth.service et lors du refresh de my-tricounts
    clearBalancesCache() {
        this._balances.clear();
    }

// -----------------------------------------
// save tricount
// -----------------------------------------

    saveTricount(
        id: number, // 0 = création, sinon update
        title: string,
        description: string,
        participants: User[],
        creatorId: number
    ): Observable<boolean> {

        this._isBalanceLoading = true;

        const isCreate = id === 0;

        // récupérer le tricount concerné depuis la cache locale (si update)
        const existingTricount = isCreate ? undefined : this._tricounts.find(t => t.id === id);

        // si c’est un update et que le tricount n’existe pas, retourner une erreur
        if (!isCreate && !existingTricount) {
            console.log('Tricount not found in cache.');
            return throwError(() =>
                new Error('Tricount not found in cache.')
            );
        }

    // ----------------------------
    // Mise à jour optimiste
    // ----------------------------
        // créer un tricount temporaire
        const tempId =  isCreate ? -Date.now() : id; // id temporaire negatif
        const tempTricount = new Tricount();
        tempTricount.id = tempId;
        tempTricount.title = title.trim();
        tempTricount.description = description.trim();

        // si update : on garde les infos existantes si dispo
        tempTricount.creatorId = isCreate ? creatorId : existingTricount!.creatorId;
        tempTricount.createdAt = isCreate ? new Date().toISOString() : existingTricount!.createdAt;
        tempTricount.operations = isCreate ? [] : existingTricount!.operations;
        tempTricount.participants = [...participants]; // copie

        // si le tricount existe déjà en cache, le remplacer, sinon l’ajouter
        const existsIdx = this._tricounts.findIndex(t => t.id === tempId);
        if (existsIdx >= 0) { // existe deja 
            this._tricounts = this._tricounts.map(t => t.id === tempId ? tempTricount : t); // on remplace
        } else { // n'existe pas encore
            this._tricounts = [...this._tricounts, tempTricount]; // on ajoute
        }

        // mettre à jour la cache en triant la liste des tricounts
        this._tricounts = this.sortTricounts(this._tricounts);

    // ----------------------------
    // Mise à jour dans le backend
    // ----------------------------
        // envoyer le tricount temporaire au backend
        const body = {
            id: id, // 0 si création, sinon update avec l'id réel
            title: tempTricount.title,
            description: tempTricount.description,
            participants: tempTricount.participants.map(p => p.id)
        };

        return this.http.post<any>(`${this.baseUrl}rpc/save_tricount`, body).pipe(
            map(res => plainToInstance(Tricount, res)),

            tap(realTricount => {
                // remplacer le tricount temporaire par le tricount réel
                this._tricounts = this._tricounts.map(t => t.id === tempId ? realTricount : t);

                const tricountId = realTricount.id;

                // mettre à jour la cache en rechargeant les tricounts + balance depuis le backend
                this.loadUserTricounts(true).pipe(
                    switchMap(() => this.loadTricountBalance(tricountId!, true))
                ).subscribe({
                    complete: () => {
                        this._isBalanceLoading = false;
                    }
                });
            }),

            map(() => true),

            catchError(err => {
                console.error(err);
                this._isBalanceLoading = false;
                return of(false);
            })
        );
    }

// -----------------------------------------
// save operation
// -----------------------------------------

    saveOperation(
        id: number,               // 0 = création, sinon update
        tricountId: number,
        title: string,
        amount: number,
        operationDate: string,
        initiatorId: number,
        repartitions: Repartition[]
    ): Observable<boolean> {

        this._isBalanceLoading = true;

        const isCreate = id === 0;

        // récupérer le tricount concerné par l'opération depuis la cache locale
        const tricount = this._tricounts.find(t => t.id === tricountId);

        // si le tricount n'existe pas, retourner une erreur
        if (!tricount) {
            console.log('Tricount not found in cache.');
            return throwError(() =>
                new Error('Tricount not found in cache.')
            );
        }

        // si update, on récupère l'operation existante
        const existingOperation = isCreate ? undefined : tricount.operations.find(o => o.id === id);

    // ----------------------------
    // Mise à jour optimiste
    // ----------------------------
        const tempId = isCreate ? -Date.now() : id; // id temporaire negatif
        const tempOperation = new Operation();
        tempOperation.id = tempId;
        tempOperation.tricountId = tricountId;
        tempOperation.title = title.trim();
        tempOperation.amount = amount;
        tempOperation.operationDate = operationDate;
        tempOperation.initiatorId = initiatorId;
        tempOperation.createdAt = isCreate ? new Date().toISOString() : existingOperation!.createdAt;
        tempOperation.repartitions = [...repartitions]; // copie

        // si l'opération existe déjà en cache, la remplacer, sinon l'ajouter
        let operations = tricount.operations;
        const existsIdx = operations.findIndex(o => o.id === tempId);
        if (existsIdx >= 0) { // existe déja
            operations = operations.map(o => o.id === tempId ? tempOperation : o) // on remplace
        } else { // n'existe pas encore
            operations = [...operations, tempOperation]; // on ajoute
        }

        // mettre à jour la cache en triant la liste des opérations
        tricount.operations = this.sortOperations(operations);

        // mettre à jour la cache en triant la liste des tricounts (car dépend des dates des opérations)
        this._tricounts = this.sortTricounts(this._tricounts);

    // ----------------------------
    // Mise à jour dans le backend
    // ----------------------------
        // envoyer l'opération temporaire au backend
        const body = {
            id: id, // 0 si création, sinon update avec l'id réel
            title: tempOperation.title,
            amount: tempOperation.amount,
            operation_date: tempOperation.operationDate,
            tricount_id: tempOperation.tricountId,
            initiator: tempOperation.initiatorId,
            repartitions: tempOperation.repartitions.map(r => ({ user: r.userId, weight: r.weight }))
        };

        return this.http.post<any>(`${this.baseUrl}rpc/save_operation`, body).pipe(
            map(res => plainToInstance(Operation, res)),

            tap(realOperation => {
                // remplacer l'opération temporaire par l'opération réelle
                tricount.operations = tricount.operations.map(o => o.id === tempId ? realOperation : o);

                this.loadUserTricounts(true).pipe(
                    switchMap(() => this.loadTricountBalance(tricountId, true))
                ).subscribe({
                    complete: () => {
                        this._isBalanceLoading = false;
                    }
                });
            }),

            map(() => true),

            catchError(err => {
                console.error(err);
                this._isBalanceLoading = false;
                return of(false);
            })
        );
    }  

// -----------------------------------------
// delete tricount
// -----------------------------------------

    deleteTricount(tricountId: number): Observable<boolean> {
        const tricount = this._tricounts.find(t => t.id === tricountId);
        if (!tricount) {
            console.log('Tricount not found in cache.');
            return throwError(() =>
                new Error('Tricount not found in cache.')
            );
        }

    // ----------------------------
    // Mise à jour optimiste
    // ----------------------------
        this._tricounts = this._tricounts.filter(t => t.id !== tricountId);
        this._balances.delete(tricountId);

    // ----------------------------
    // Mise à jour dans le backend 
    // ----------------------------
        return this.http.post<void>(`${this.baseUrl}rpc/delete_tricount`, { tricount_id: tricountId }).pipe(
            tap(() => this.loadUserTricounts(true).subscribe()),
            map(() => true),

            catchError(err => {
                console.error(err);
                return of(false);
            })
        );
    }

// -----------------------------------------
// delete operation
// -----------------------------------------

    deleteOperation(tricountId: number, operationId: number): Observable<boolean> {

        this._isBalanceLoading = true;

        const tricount = this._tricounts.find(t => t.id === tricountId);
        if (!tricount) {
            console.log('Tricount not found in cache.');
            return throwError(() =>
                new Error('Tricount not found in cache.')
            );
        }

        const operation = tricount.operations.find(o => o.id === operationId);
        if (!operation) {
            console.log('Operation not found in cache.');
            return throwError(() =>
                new Error('Operation not found in cache.')
            );
        }

    // ----------------------------
    // Mise à jour optimiste
    // ----------------------------
        const operations = tricount.operations;
        tricount.operations = this.sortOperations(
            operations.filter(o => o.id !== operationId)
        );

        this._tricounts = this.sortTricounts(this._tricounts);

    // ----------------------------
    // Mise à jour dans le backend 
    // ----------------------------
        return this.http.post<void>(`${this.baseUrl}rpc/delete_operation`, { id: operationId }).pipe(
            tap(() => {
                this.loadUserTricounts(true).pipe(
                    switchMap(() => this.loadTricountBalance(tricountId, true))
                ).subscribe({
                    complete: () => {
                        this._isBalanceLoading = false;
                    }
                });
            }),

            map(() => true),

            catchError(err => {
                console.error(err);
                this._isBalanceLoading = false;
                return of(false);
            })
        );
    }

// -----------------------------------------
// isTitleAvailable
// -----------------------------------------

    isTitleAvailable(title: string, tricount_id: number): Observable<boolean> {
        return this.http.post<boolean>(`${this.baseUrl}rpc/check_tricount_title_available`, {
            title: title ?? '',
            tricount_id: tricount_id
        });
    }

    
// -----------------------------------------
// tri
// -----------------------------------------

    // Tri décroissant par date de la dernière opération
    // Si plusieurs opérations ont la même date la plus récente -> tri décroissant par id d’opération
    // Si pas d’opération -> tri par createdAt du tricount
    private sortTricounts(tricounts: Tricount[]): Tricount[] {

        const opDateToEndOfDayMs = (operationDate: string): number => {
            const t = Date.parse(operationDate);                // operationDate : "2026-01-05" (date sans heure), t : 1767571200000 (2026-01-05 00:00:00)    
            return t + 86399999;                                // return : 1767657599999 (2026-01-05 23:59:59.999)
        };

        const activityMs = (tricount: Tricount): number => {
            const operations = tricount.operations;
            if (operations.length > 0) 
                return Math.max(...operations.map(op => opDateToEndOfDayMs(op.operationDate!)));
            return Date.parse(tricount.createdAt!);
        };

        const latestOpIdOnActivityDate = (tricount: Tricount): number => {
            const operations = tricount.operations;
            if (operations.length === 0) return 0;

            const maxDate = Math.max(...operations.map(op => opDateToEndOfDayMs(op.operationDate!)));
            return Math.max(
                ...operations
                    .filter(op => opDateToEndOfDayMs(op.operationDate!) === maxDate)
                    .map(op => op.id!)
            );
        };

        return [...tricounts].sort((a, b) => {
            const dA = activityMs(a);
            const dB = activityMs(b);

            // activité décroissante
            if (dB !== dA) return dB - dA;

            // si même activité : id d’opération décroissant (si ops)
            const idA = latestOpIdOnActivityDate(a);
            const idB = latestOpIdOnActivityDate(b);
            if (idB !== idA) return idB - idA;

            return 0;
        });
    }

    // Tri décroissant sur operationDate
    // En cas d’égalité -> id décroissant
    private sortOperations(operations: Operation[]): Operation[] {
        
        const opDateToEndOfDayMs = (operationDate: string): number => {
            const t = Date.parse(operationDate);
            return t + 86399999;
        };

        return [...operations].sort((a, b) => {
            const dA = opDateToEndOfDayMs(a.operationDate!);
            const dB = opDateToEndOfDayMs(b.operationDate!);

            // date d’opération décroissante
            if (dB !== dA) return dB - dA;

            // même date => id décroissant
            return b.id! - a.id!;
        });
    }

}
