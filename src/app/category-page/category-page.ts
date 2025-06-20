import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTreeModule, MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CategoryService, CategoryNode } from '../services/category';
import { Header } from '../shared/header/header';
import { MatRadioModule } from '@angular/material/radio';

interface FlatCategoryNode {
  id: number;
  name: string;
  level: number;
  expandable: boolean;
}

@Component({
  selector: 'app-category',
  standalone: true,
  templateUrl: './category-page.html',
  styleUrls: ['./category-page.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTreeModule,
    Header,
    MatRadioModule
  ]
})
export class CategoryPage implements OnInit {
  form: FormGroup;
  selectedParentId: number | null = null;

  treeControl = new FlatTreeControl<FlatCategoryNode>(
    node => node.level,
    node => node.expandable
  );
  treeFlattener = new MatTreeFlattener<CategoryNode, FlatCategoryNode>(
    (node, level) => ({
      id: node.id,
      name: node.name,
      level,
      expandable: !!node.children?.length
    }),
    node => node.level,
    node => node.expandable,
    node => node.children
  );
  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  constructor(private fb: FormBuilder, private categoryService: CategoryService) {
    this.form = this.fb.group({
      name: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.categoryService.getTree().subscribe(tree => {
      this.dataSource.data = tree;
    });
  }

  hasChild = (_: number, node: FlatCategoryNode) => node.expandable;

  selectParent(node: FlatCategoryNode) {
    this.selectedParentId = node.id;
  }

  onSubmit() {
    if (this.form.invalid || this.selectedParentId === null) return;

    const name = this.form.value.name;
    this.categoryService.createCategory({ name, parentId: this.selectedParentId }).subscribe({
      next: () => {
        alert('Category created!');
        this.form.reset();
        this.selectedParentId = null;
        this.categoryService.getTree().subscribe(tree => {
          this.dataSource.data = tree;
        });
      },
      error: err => alert('Error: ' + err.message)
    });
  }
}
