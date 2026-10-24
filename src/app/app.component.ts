import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CartService } from './core/cart.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  private subs: Subscription[] = [];

  constructor(
    private cart: CartService,
    private router: Router,
    private route: ActivatedRoute,
    private title: Title
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.cart.drawer$.subscribe((drawerOpen) => {
        if (typeof document !== 'undefined') {
          document.body.style.overflow = drawerOpen ? 'hidden' : '';
          document.documentElement.style.overflow = drawerOpen ? 'hidden' : '';
        }
      })
    );

    this.subs.push(
      this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
        let current = this.route.firstChild;
        while (current && current.firstChild) {
          current = current.firstChild;
        }
        const data = current && current.snapshot ? current.snapshot.data : null;
        this.title.setTitle((data && data.title) || 'LUMIKO · Luz anime para casa');
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((sub) => sub.unsubscribe());
  }
}
