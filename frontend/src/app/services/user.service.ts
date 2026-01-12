import { Inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BASE_URL } from "src/main";
import { Observable, of, map, tap } from "rxjs";
import { plainToInstance } from "class-transformer";
import { User } from "../models/user";

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(
    private http: HttpClient,
    @Inject(BASE_URL) private baseUrl: string
  ) {}

  // cache locale en mémoire
  private _users: User[] = [];

  // getter public pour accéder à la cache
  get users(): User[] {
    return this._users;
  }

  loadUsers(force: boolean = false): Observable<boolean> {
    if (force || this._users.length === 0) {
      return this.http.get<any[]>(`${this.baseUrl}rpc/get_all_users`).pipe(
        map(res => plainToInstance(User, res)),
        tap(users => {
          this._users = users;
        }),
        map(() => true)
      );
    }
    return of(false);
  }

  clearCache() {
    this._users = [];
  }
}
