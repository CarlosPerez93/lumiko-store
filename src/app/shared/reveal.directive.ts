import { Directive, ElementRef, Inject, Input, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Añade animación de entrada al hacer scroll (IntersectionObserver).
 * Uso: <div class="reveal reveal-left" appReveal [appRevealDelay]="120">
 */
@Directive({ selector: '[appReveal]' })
export class RevealDirective implements OnInit, OnDestroy {
  @Input() appRevealDelay: number | string = 0;
  @Input() appRevealThreshold: number | string = 0.15;

  private observer?: IntersectionObserver;

  constructor(private el: ElementRef<HTMLElement>, @Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit(): void {
    const node = this.el.nativeElement;
    const delay = Number(this.appRevealDelay) || 0;
    const threshold = Number(this.appRevealThreshold) || 0.15;

    node.style.setProperty('--reveal-delay', `${delay}ms`);

    if (!isPlatformBrowser(this.platformId) || typeof IntersectionObserver === 'undefined') {
      node.classList.add('is-visible');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            node.classList.add('is-visible');
            this.observer?.unobserve(node);
          }
        });
      },
      { threshold, rootMargin: '0px 0px -8% 0px' }
    );

    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
