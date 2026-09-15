import { Component } from '@angular/core';

import { EmptyState } from '../../shared/ui/empty-state/empty-state';

@Component({
  imports: [EmptyState],
  selector: 'aura-statistics',
  styleUrl: './statistics.css',
  templateUrl: './statistics.html',
})
export class Statistics {}
