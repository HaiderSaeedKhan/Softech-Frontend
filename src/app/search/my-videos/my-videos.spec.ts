import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyVideos } from './my-videos';

describe('MyVideos', () => {
  let component: MyVideos;
  let fixture: ComponentFixture<MyVideos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyVideos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyVideos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
