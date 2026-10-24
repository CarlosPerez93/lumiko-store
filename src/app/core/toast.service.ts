import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  tone: 'success' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  private subject = new BehaviorSubject<Toast[]>([]);
  readonly toasts$: Observable<Toast[]> = this.subject.asObservable();

  show(message: string, tone: 'success' | 'info' = 'success'): void {
    const id = ++this.counter;
    const next = [...this.subject.value, { id, message, tone }].slice(-3);
    this.subject.next(next);
    setTimeout(() => this.dismiss(id), 3400);
  }

  dismiss(id: number): void {
    this.subject.next(this.subject.value.filter((t) => t.id !== id));
  }
}
