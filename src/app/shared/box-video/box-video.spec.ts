import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoxVideo } from './box-video';

describe('BoxVideo', () => {
  let component: BoxVideo;
  let fixture: ComponentFixture<BoxVideo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoxVideo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoxVideo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
