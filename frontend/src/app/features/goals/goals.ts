import { Component } from '@angular/core';

import { EmptyState } from '../../shared/ui/empty-state/empty-state';

@Component({
  imports: [EmptyState],
  selector: 'aura-goals',
  styleUrl: './goals.css',
  templateUrl: './goals.html',
})
export class Goals {}
