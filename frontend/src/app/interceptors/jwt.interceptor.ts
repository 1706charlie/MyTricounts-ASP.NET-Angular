import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { EMPTY, Observable, of, throwError } from 'rxjs';
import { catchError, map, flatMap } from 'rxjs/operators';

import { AuthenticationService } from '../services/authentication.service';
import { Router } from '@angular/router';

/*
    Pour que l'accès aux URL protégées de l'API du back-end soit autorisé, 
    il faut que le frontend ajoute le jeton dans le header Authorization des requêtes correspondantes.

    On réalise cela grâce à un intercepteur HTTP qui, comme son nom l'indique, va intercepter toutes les requêtes HTTP 
    et appeler la méthode intercept() pour chacune d'entre elle. 
    Dans cette méthode, on a alors le loisir de modifier la requête avant qu'elle ne soit envoyée au back-end.
*/


@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    constructor(private authenticationService: AuthenticationService, private router: Router) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // add authorization header with jwt token if available
        let currentUser = this.authenticationService.currentUser;
        if (currentUser && currentUser.token) // Si un utilisateur est connecté et s'il possède un jeton
            request = this.addToken(request, currentUser.token); // on fait appel à addToken()

        // return next.handle(request) signifie : “Continue le flux normal de la requête HTTP”
        //  handle() renvoie un Observable
        // .pipe(...) permet de transformer ou d’intercepter les valeurs avant qu’elles ne sortent de l’observable. Ici, on s’en sert pour intercepter les erreurs éventuelles avec catchError
        return next.handle(request).pipe(
            catchError(err => {
                // On vérifie ici deux choses :
                if (err.status === 401 && err.headers.get("token-expired")) // statut 401 et jeton a expiré
                    return this.handle401Error(request, next);
                else // Si l’erreur n’est pas une expiration de token
                    return throwError(err); // “Je n’ai pas géré cette erreur, je la renvoie à celui qui a fait la requête.” 
                    // Le composant Angular qui a fait la requête pourra alors : afficher un message d’erreur, ou réagir d’une autre manière.
                    /*
                    throwError(err) renvoie un Observable d’erreur,
                    c’est-à-dire un flux RxJS qui n’émet pas de valeur, mais déclenche immédiatement une erreur
                    que le composant appelant peut intercepter dans son subscribe({ error: ... }).
                    ex : login.component.ts

                    Résumé du chemin complet : 

                        [Backend]
                        ↓
                        HTTP 400 + JSON : { "errors": [{ "errorMessage": "Incorrect password." }] }

                        [Angular Interceptor]
                        ↓
                        catchError → return throwError(err)

                        [LoginComponent]
                        ↓
                        .subscribe({ error: error => this.error = error.error.errors[0].errorMessage })
                        ↓
                        HTML
                        ↓
                        Affichage du message : "Incorrect password."
                    */
            })
        );
    }

    private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        this.authenticationService.logout(); // déconnecte l’utilisateur
        this.router.navigateByUrl("/login");  // redirige vers la page de login
        return EMPTY;   // retourne EMPTY, c’est-à-dire un Observable vide qui met fin au flux
    }

    // clone la requête puis y ajoute le fameux header
    private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
        return request.clone({
            setHeaders: {
                'Authorization': `Bearer ${token}`
            }
        });
    }

    /*
        Le jeton JWT que le backend délivre est valide 10 minutes.
        Après ce délai, il expire : le backend le refuse, Angular reçoit une erreur 401 et redirige l’utilisateur vers /login.
        Plus tard, on ajoutera un système pour prolonger la session sans que l’utilisateur ait à se reconnecter manuellement.
    */
}
