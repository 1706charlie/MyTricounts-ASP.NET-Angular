import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { User } from '../models/user';
import { plainToInstance } from 'class-transformer';
import { BASE_URL } from 'src/main';
import { Observable, of } from 'rxjs';
import { map, catchError, mergeAll, mergeMap, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })

export class AuthenticationService {

    public currentUser?: User;

    constructor(private http: HttpClient, @Inject(BASE_URL) private baseUrl: string) {
        let data = sessionStorage.getItem('currentUser');
        if (data)
            data = JSON.parse(data);
        this.currentUser = plainToInstance(User, data);
    }

    login(email: string, password: string): Observable<User> {
        return this.http.post<any>(`${this.baseUrl}rpc/login`, { email, password }).pipe(
            switchMap(res => {
                const token = res?.token;
                if (!token) return throwError(() => new Error('Missing token'));

                const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
                return this.http.get<any>(`${this.baseUrl}rpc/get_user_data`, { headers }).pipe(
                    map(dto => {
                        const user = plainToInstance(User, dto);
                        user.token = token;
                        user.role = dto.role?.toLowerCase() === 'admin' ? 1 : 0;
                        
                        sessionStorage.setItem('currentUser', JSON.stringify(user));
                        this.currentUser = user;
                        return user;
                    })
                );
            }),
        );
    }

    logout() {
        sessionStorage.removeItem('currentUser');
        this.currentUser = undefined;
    }

    signup(email: string, fullName: string, iban: string, password: string): Observable<User> {
        return this.http.post<void>(`${this.baseUrl}rpc/signup`, {
            email,
            full_name: fullName,
            iban,
            password
        }).pipe(
            switchMap(res => this.login(email, password)),
        );
    }

    public isEmailAvailable(email: string): Observable<boolean> {
        return this.http.post<boolean>(`${this.baseUrl}rpc/check_email_available`, {
            email: email ?? '',
            user_id: this.currentUser?.id ?? 0,
        });
    }

    public isFullNameAvailable(fullName: string): Observable<boolean> {
        return this.http.post<boolean>(`${this.baseUrl}rpc/check_full_name_available`, {
            full_name: fullName ?? '',
            user_id: this.currentUser?.id ?? 0,
        });
    }

}
