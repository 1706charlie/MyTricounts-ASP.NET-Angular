import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Role, User } from '../models/user';
import { plainToInstance } from 'class-transformer';
import { BASE_URL } from 'src/main';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { TricountService } from './tricount.service';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })

export class AuthenticationService {
    constructor(
        private http: HttpClient,
        @Inject(BASE_URL) private baseUrl: string,
        private tricountService: TricountService,
        private userService: UserService
    ) {
        let data = localStorage.getItem('currentUser');
        if (data)
            data = JSON.parse(data);
        this._currentUser = plainToInstance(User, data);
    }

    // cache locale en mémoire
    private _currentUser?: User;

    // getter public pour accéder à la cache
    get currentUser(): User | undefined {
        return this._currentUser;
    }    

    login(email: string, password: string, signup = false): Observable<User> {
        return this.http.post<any>(`${this.baseUrl}rpc/login`, { email, password }).pipe(
            switchMap(res => {
                const token = res.token;
                if (!token) return throwError(() => new Error('Missing token'));

                const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
                return this.http.get<any>(`${this.baseUrl}rpc/get_user_data`, { headers }).pipe(
                    map(res => {
                        const user = plainToInstance(User, res);
                        
                        user.token = token;
                        user.role = res.role === 'admin' ? Role.Admin : Role.BasicUser;
                        
                        localStorage.setItem('currentUser', JSON.stringify({
                            id: user.id,
                            email: user.email,
                            full_name: user.fullName,  // clé DTO
                            iban: user.iban,
                            role: user.role,
                            token: user.token
                        }));
                        
                        this._currentUser = user;
                        return user;
                    }),
                    // précharge la cache avant de "terminer" le login (sauf si signup)
                    switchMap(user => {
                        if (signup) return of(user); // permet d'éviter une double requêtre "get_my_tricounts" lorsqu'on signup

                        return this.tricountService.loadUserTricounts().pipe(
                            map(() => user) // loadUserTricounts() renvoie un Observable<boolean>. Peu importe le boolean, on retourne user
                        );
                    })
                );
            }),
        );
    }

    logout() {
        this.clearCache();
        localStorage.removeItem('currentUser');
        this.tricountService.clearTricountsCache();
        this.tricountService.clearBalancesCache();
        this.userService.clearCache();
    }

    clearCache() {
        this._currentUser = undefined;
    }

    signup(email: string, fullName: string, iban: string, password: string): Observable<User> {
        return this.http.post<void>(`${this.baseUrl}rpc/signup`, {
            email,
            full_name: fullName,
            iban,
            password
        }).pipe(
            switchMap(res => this.login(email, password, true)),
        );
    }

    isEmailAvailable(email: string): Observable<boolean> {
        return this.http.post<boolean>(`${this.baseUrl}rpc/check_email_available`, {
            email: email,
            user_id: this.currentUser?.id ?? 0,
        });
    }

    isFullNameAvailable(fullName: string): Observable<boolean> {
        return this.http.post<boolean>(`${this.baseUrl}rpc/check_full_name_available`, {
            full_name: fullName,
            user_id: this.currentUser?.id ?? 0,
        });
    }

}
