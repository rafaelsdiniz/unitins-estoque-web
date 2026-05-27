import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state">
      <div class="icon-circle">
        <mat-icon class="icon">{{ icon() }}</mat-icon>
      </div>
      <div class="titulo">{{ title() }}</div>
      @if (description()) {
        <div class="descricao">{{ description() }}</div>
      }
      <div class="action">
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    .action { margin-top: 1rem; }
  `,
})
export class EmptyStateComponent {
  readonly icon = input<string>('inbox');
  readonly title = input.required<string>();
  readonly description = input<string | undefined>();
}
