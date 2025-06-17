import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { SearchService } from '../../services/search';
import { BoxVideoComponent } from '../../shared/box-video/box-video';

import { MatTreeModule } from '@angular/material/tree';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CategoryService, CategoryNode } from '../../services/category';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlattener, MatTreeFlatDataSource } from '@angular/material/tree';
import { I } from '@angular/cdk/a11y-module.d-DBHGyKoh';

import { Auth } from '../../services/auth';
import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';

interface FlatCategoryNode {
  id: number;
  name: string;
  level: number;
  expandable: boolean;
  children?: CategoryNode[];
  parentId?: number;
}

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatAutocompleteModule,
    BoxVideoComponent,
    MatTreeModule,
    MatCheckboxModule,
    FormsModule
  ],
  templateUrl: './explore.html',
  styleUrls: ['./explore.css']
})
export class ExploreComponent implements OnInit {
  searchControl = new FormControl('');
  suggestions: string[] = [];

  results: any[] = [];
  highlights: Record<number, Record<'title' | 'description' | 'tags', string[]>> = {};

  selectedCategoryIds = new Set<number>();
  categoryTree: CategoryNode[] = [];

  onlyMyVideos = false;
  isAuthenticated = false;

  private transformer = (node: CategoryNode, level: number): FlatCategoryNode => ({
    id: node.id,
    name: node.name,
    level,
    expandable: !!node.children?.length,
    children: node.children
  });

  treeControl = new FlatTreeControl<FlatCategoryNode>(
    node => node.level,
    node => node.expandable
  );

  treeFlattener = new MatTreeFlattener<CategoryNode, FlatCategoryNode>(
    this.transformer,
    node => node.level,
    node => node.expandable,
    node => node.children
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  hasChild = (_: number, node: FlatCategoryNode) => node.expandable;

  constructor(private searchService: SearchService, private categoryService: CategoryService, private authService: Auth, private router: Router) {}

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        const trimmed = (value ?? '').trim();
        if (!trimmed) {
          this.suggestions = []; // clear suggestions if empty
          return []; // return empty observable
        }
        return this.searchService.getAutocomplete(trimmed);
      })
    ).subscribe(results => {
      this.suggestions = results;
    });

    this.onSearch();

    this.categoryService.getTree().subscribe(tree => {
      this.categoryTree = tree;
      this.dataSource.data = tree;
    });
  }

  onCategoryChecked(node: FlatCategoryNode, checked: boolean): void {
    const origNode = this.findNodeById(this.categoryTree, node.id);
    if (!origNode) return;

    const ids = this.collectCategoryIds(origNode);

    if (checked) {
      ids.forEach(id => this.selectedCategoryIds.add(id));
    } else {
      ids.forEach(id => this.selectedCategoryIds.delete(id));
      this.removeParentIfChildUnchecked(node);
    }
    this.onSearch();
    console.log('Selected Category IDs:', Array.from(this.selectedCategoryIds));
  }

  removeParentIfChildUnchecked(node: FlatCategoryNode): void {
    const parent = this.getParentNode(node);
    if (!parent) return;

    const siblings = this.getSiblings(parent.id);
    const allSiblingsChecked = siblings.every(sib =>
      this.selectedCategoryIds.has(sib.id)
    );

    if (!allSiblingsChecked) {
      this.selectedCategoryIds.delete(parent.id);
      this.removeParentIfChildUnchecked(parent);
    }
  }

  getParentNode(node: FlatCategoryNode): FlatCategoryNode | null {
    const nodeIndex = this.treeControl.dataNodes.indexOf(node);
    for (let i = nodeIndex - 1; i >= 0; i--) {
      const current = this.treeControl.dataNodes[i];
      if (current.level < node.level) return current;
    }
    return null;
  }

  getSiblings(parentId: number): FlatCategoryNode[] {
    return this.treeControl.dataNodes.filter(n =>
      this.getParentNode(n)?.id === parentId
    );
  }

  collectCategoryIds(node: CategoryNode): number[] {
    const ids: number[] = [node.id];
    if (node.children) {
      for (const child of node.children) {
        ids.push(...this.collectCategoryIds(child));
      }
    }
    return ids;
  }

  findNodeById(nodes: CategoryNode[], id: number): CategoryNode | null {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = this.findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  isChecked(id: number): boolean {
    return this.selectedCategoryIds.has(id);
  }
  

  onSearch(): void {
    // const query = this.searchControl.value?.trim();
    // if (!query) return;

    const query = this.searchControl.value?.trim() ?? '';
  
    const categoryIds = Array.from(this.selectedCategoryIds);
    this.searchService.fullTextSearch(query, categoryIds, this.onlyMyVideos).subscribe(res => {
      this.results = res.hits;
      this.highlights = res.highlights;
    });
  }
  
  getFieldHighlight(id: number, field: 'title' | 'description' | 'tags'): string {
    return this.highlights?.[id]?.[field]?.join('...') ?? '';
  }

  goToVideo(id: number): void {
    this.router.navigate(['/video', id]);
  }
}
