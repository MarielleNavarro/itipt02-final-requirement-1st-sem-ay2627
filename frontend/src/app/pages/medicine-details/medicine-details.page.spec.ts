import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MedicineDetailsPage } from './medicine-details.page';

describe('MedicineDetailsPage', () => {
  let component: MedicineDetailsPage;
  let fixture: ComponentFixture<MedicineDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MedicineDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
