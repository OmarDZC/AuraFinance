import { Component, computed, inject, output, signal } from '@angular/core';

import { ApiError } from '../../../../core/models/api-error.model';
import { Category } from '../../../../core/models/category.model';
import { CategoryService } from '../../../../core/services/category.service';

/**
 * Modal ligero para crear/listar/eliminar categorías, accesible desde el
 * propio formulario de gasto/ingreso (junto al selector de categoría) en
 * vez de vivir en una pantalla de "Configuración" aparte. Es el mismo CRUD
 * que antes vivía en features/settings, solo reubicado: mismas reglas
 * (nombre obligatorio, máx. 50 caracteres, 409 si la categoría está en uso).
 *
 * Se cierra emitiendo `close`; el padre (ExpenseForm) recarga su propia
 * lista de categorías al recibirlo, así el selector queda actualizado sin
 * necesidad de compartir estado entre ambos componentes.
 */
@Component({
  selector: 'aura-category-manager',
  imports: [],
  templateUrl: './category-manager.html',
  styleUrl: './category-manager.css',
})
export class CategoryManager {
  private readonly categoryService = inject(CategoryService);

  close = output<void>();

  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(false);
  protected readonly loadError = signal<ApiError | null>(null);

  protected readonly newCategoryName = signal('');
  protected readonly nameTouched = signal(false);
  protected readonly creating = signal(false);
  protected readonly createError = signal<ApiError | null>(null);

  protected readonly deleteError = signal<{ category: Category; message: string } | null>(null);

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

  protected onClose(): void {
    this.close.emit();
  }
}
