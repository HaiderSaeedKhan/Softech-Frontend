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
    BoxVideoComponent
  ],
  templateUrl: './explore.html',
  styleUrls: ['./explore.css']
})
export class ExploreComponent implements OnInit {
  searchControl = new FormControl('');
  suggestions: string[] = [];

  results: any[] = [];
  highlights: Record<number, Record<'title' | 'description' | 'tags', string[]>> = {};

  constructor(private searchService: SearchService) {}

  ngOnInit(): void {
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
  }
  

  onSearch(): void {
    const query = this.searchControl.value?.trim();
    if (!query) return;
  
    this.searchService.fullTextSearch(query).subscribe(res => {
      this.results = res.hits;
      this.highlights = res.highlights;
    });
  }
  
  getFieldHighlight(id: number, field: 'title' | 'description' | 'tags'): string {
    return this.highlights?.[id]?.[field]?.join('...') ?? '';
  }
}
