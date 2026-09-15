import { Component, computed, inject, signal } from '@angular/core';

import { ApiError } from '../../core/models/api-error.model';
import { Category } from '../../core/models/category.model';
import { CategoryService } from '../../core/services/category.service';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { GlassCard } from '../../shared/ui/glass-card/glass-card';

/**
 * Página de ajustes. Por ahora, solo gestión de categorías (crear/listar/
 * eliminar), que es lo único que expone el backend (no hay PUT ni campos
 * adicionales). Al ser un único campo y sin edición, se mantiene todo en
 * este componente en vez de extraer CategoryForm/CategoryList — separarlos
 * no aportaría nada para algo tan pequeño (a diferencia de Expenses, donde
 * el formulario se reutiliza en crear y editar y tiene 4 campos validados).
 */
@Component({
  selector: 'aura-settings',
  imports: [GlassCard, EmptyState],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  private readonly categoryService = inject(CategoryService);

  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(false);
  protected readonly loadError = signal<ApiError | null>(null);

  // --- Formulario de alta (un único campo: name) ---
  protected readonly newCategoryName = signal('');
  protected readonly nameTouched = signal(false);
  protected readonly creating = signal(false);
  protected readonly createError = signal<ApiError | null>(null);

  /** Espeja @NotBlank/@Size(max=50) de CategoryRequest (backend). */
  protected readonly nameError = computed(() => {
    if (!this.nameTouched()) {
      return null;
    }
    const value = this.newCategoryName().trim();
    if (!value) {
      return 'El nombre de la categoría es obligatorio';
    }
    if (value.length > 50) {
      return 'El nombre no puede superar los 50 caracteres';
    }
    return null;
  });

  // --- Borrado ---
  protected readonly deleteError = signal<{ category: Category; message: string } | null>(null);

  constructor() {
    this.loadCategories();
  }

  protected loadCategories(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.categoryService.getAll().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.loadError.set(err);
        this.loading.set(false);
      },
    });
  }

  protected onNameInput(value: string): void {
    this.newCategoryName.set(value);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.nameTouched.set(true);
    if (this.nameError()) {
      return;
    }

    this.creating.set(true);
    this.createError.set(null);
    this.categoryService.create({ name: this.newCategoryName().trim() }).subscribe({
      next: () => {
        this.newCategoryName.set('');
        this.nameTouched.set(false);
        this.creating.set(false);
        this.loadCategories();
      },
      error: (err: ApiError) => {
        this.creating.set(false);
        this.createError.set(err);
      },
    });
  }

  protected onDelete(category: Category): void {
    const confirmed = confirm(`¿Eliminar la categoría "${category.name}"?`);
    if (!confirmed) {
      return;
    }

    this.deleteError.set(null);
    this.categoryService.delete(category.id).subscribe({
      next: () => this.loadCategories(),
      error: (err: ApiError) => {
        // 409: la categoría tiene gastos asociados. No se retira de la UI
        // porque, efectivamente, sigue existiendo en el backend.
        this.deleteError.set({ category, message: err.error });
      },
    });
  }
}
