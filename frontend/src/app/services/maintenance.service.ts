import { Inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BASE_URL } from "src/main";
import { Observable } from "rxjs";

@Injectable({ providedIn: "root" })
export class MaintenanceService {
    constructor(
        private http: HttpClient, 
        @Inject(BASE_URL) private baseUrl: string
    ) {}

    resetDatabase(): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}rpc/reset_database`, {});
    }
}
