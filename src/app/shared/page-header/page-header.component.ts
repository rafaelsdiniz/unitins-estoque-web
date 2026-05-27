import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div class="titulo">
        @if (icon()) {
          <div class="icon-wrap">
            <mat-icon>{{ icon() }}</mat-icon>
          </div>
        }
        <div>
          <h1>{{ title() }}</h1>
          @if (subtitle()) {
            <div class="subtitulo">{{ subtitle() }}</div>
          }
        </div>
      </div>
      <div class="actions">
        <ng-content />
      </div>
    </header>
  `,
  styles: `
    .icon-wrap {
      width: 40px;
      height: 40px;
      border-radius: var(--r-md);
      background: var(--c-primary-soft);
      display: grid;
      place-items: center;
      color: var(--c-primary);
      flex-shrink: 0;
    }
    .icon-wrap mat-icon {
      font-size: 21px;
      width: 21px;
      height: 21px;
    }
    .actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | undefined>();
  readonly icon = input<string | undefined>();
}
