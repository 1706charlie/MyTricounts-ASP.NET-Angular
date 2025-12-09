import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { BASE_URL } from 'src/main';
import { plainToInstance } from 'class-transformer';
import { Tricount } from '../models/tricount';

@Injectable({ providedIn: 'root' })
export class TricountService {

    private _tricounts: Tricount[] = [];
    get tricounts(): Tricount[] {
        return this._tricounts;
    }

    constructor(private http: HttpClient, @Inject(BASE_URL) private baseUrl: string) {}

    resetDatabase(): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}rpc/reset_database`, {});
    }

    getMyTricounts(): Observable<Tricount[]> {
        return this.http.get<any[]>(`${this.baseUrl}rpc/get_my_tricounts`).pipe(
            // mettre a jour la chache local des tricounts
            tap(tricounts => {
                this._tricounts = tricounts;
            })
        );
    }
}
