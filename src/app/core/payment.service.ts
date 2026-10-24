import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface CheckoutItemPayload {
  id: string;
  qty: number;
}

export interface CustomerPayload {
  name: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  notes?: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
}

export interface OrderLine {
  name: string;
  qty: number;
  amount: number;
}

export interface OrderSummary {
  id: string;
  status: string;
  paymentStatus: string;
  amountTotal: number;
  currency: string;
  email: string | null;
  customerName: string | null;
  items: OrderLine[];
  createdAt: string;
}

export interface PaymentError {
  code: string;
  message: string;
}

const FUNCTIONS_BASE = '/.netlify/functions';

/**
 * Cliente de la pasarela de pago. Nunca habla directamente con Stripe ni
 * contiene claves: solo llama a las Netlify Functions, que guardan los secretos
 * en variables de entorno del sitio.
 */
@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private http: HttpClient) {}

  createCheckoutSession(items: CheckoutItemPayload[], customer: CustomerPayload, coupon: string | null): Observable<CheckoutSession> {
    return this.http
      .post<CheckoutSession>(`${FUNCTIONS_BASE}/create-checkout-session`, {
        items,
        customer,
        coupon
      })
      .pipe(catchError((error) => this.fail(error)));
  }

  getOrder(sessionId: string): Observable<OrderSummary> {
    return this.http
      .get<OrderSummary>(`${FUNCTIONS_BASE}/get-order`, { params: { session_id: sessionId } })
      .pipe(catchError((error) => this.fail(error)));
  }

  private fail(error: HttpErrorResponse): Observable<never> {
    const body = error && error.error ? error.error : null;
    const payload: PaymentError = {
      code: body && body.code ? body.code : 'network_error',
      message:
        (body && body.message) ||
        'No hemos podido contactar con la pasarela de pago. Comprueba tu conexión e inténtalo de nuevo.'
    };
    return throwError(payload);
  }
}
