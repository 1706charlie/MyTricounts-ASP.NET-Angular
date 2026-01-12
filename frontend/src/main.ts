import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { APP_ID, enableProdMode, InjectionToken } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/components/app/app.component';
import { environment } from './environments/environment';
import { appRoutes } from './app/routing/app.routing';
import { JwtInterceptor } from './app/interceptors/jwt.interceptor';

export const BASE_URL = new InjectionToken<string>('BASE_URL');

export function getBaseUrl() {
    return document.getElementsByTagName('base')[0].href;
}

const providers = [
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(appRoutes),
    provideAnimationsAsync(),
    { provide: APP_ID, useValue: 'tricount' },
    { provide: BASE_URL, useFactory: getBaseUrl, deps: [] },
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
];

if (environment.production) {
    enableProdMode();
}

bootstrapApplication(AppComponent, { providers })
    .catch(err => console.error(err));

