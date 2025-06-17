import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-box-video',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './box-video.html',
  styleUrls: ['./box-video.css']
})
export class BoxVideoComponent {
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() tags: string[] = [];

  truncateDescriptionWithEm(html: string, maxChars: number = 120): string {
    if (!html) return '';
  
    let charCount = 0;
    const tagStack: string[] = [];
    let truncated = '';
    const tagPattern = /<\/?[^>]+>/g;
    let lastIndex = 0;
  
    let match: RegExpExecArray | null;
    while ((match = tagPattern.exec(html)) !== null && charCount < maxChars) {
      const [tag] = match;
      const tagStart = match.index;
      
      const textChunk = html.slice(lastIndex, tagStart);
      const remaining = maxChars - charCount;
  
      if (textChunk.length > 0) {
        const chunkToAdd = textChunk.slice(0, remaining);
        truncated += chunkToAdd;
        charCount += chunkToAdd.length;
        if (charCount >= maxChars) break;
      }
  
      truncated += tag;
  
      if (tag.startsWith('</')) {
        tagStack.pop();
      } else if (!tag.endsWith('/>')) {
        const tagName = tag.match(/^<(\w+)/)?.[1];
        if (tagName) tagStack.push(tagName);
      }
  
      lastIndex = tagPattern.lastIndex;
    }
  
    if (charCount < maxChars && lastIndex < html.length) {
      truncated += html.slice(lastIndex, lastIndex + (maxChars - charCount));
    }
  
    // Close any unclosed tags (important for <em>)
    while (tagStack.length) {
      truncated += `</${tagStack.pop()}>`;
    }
  
    if (html.replace(/<[^>]*>/g, '').length > maxChars) {
      truncated += '...';
    }
  
    return truncated;
  }
  
}
