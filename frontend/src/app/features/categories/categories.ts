import { Component } from '@angular/core';

import { EmptyState } from '../../shared/ui/empty-state/empty-state';

@Component({
  imports: [EmptyState],
  selector: 'aura-categories',
  styleUrl: './categories.css',
  templateUrl: './categories.html',
})
export class Categories {}
