import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BirthdayModalComponent } from './birthday-modal.component';

describe('BirthdayModalComponent', () => {
  let component: BirthdayModalComponent;
  let fixture: ComponentFixture<BirthdayModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BirthdayModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BirthdayModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
