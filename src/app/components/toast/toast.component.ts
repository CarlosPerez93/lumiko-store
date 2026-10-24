import { Component } from '@angular/core';
import { ToastService } from '../../core/toast.service';
import { popAnimation } from '../../shared/animations';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  animations: [popAnimation]
})
export class ToastComponent {
  constructor(public toast: ToastService) {}
}
