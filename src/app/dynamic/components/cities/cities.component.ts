import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, last } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { notifyService } from 'src/app/services/snotify';
import { NgxSmartModalService } from 'ngx-smart-modal';
import { NguiMapComponent } from '@ngui/map';
import { AgmCoreModule, MapsAPILoader } from "@agm/core";
declare let google: any;

@Component({
  selector: 'app-cities',
  templateUrl: './cities.component.html',
  styleUrls: ['./cities.component.css']
})
export class CitiesComponent implements OnInit {
  cities = []
  city_id
  city_name
  city_edit_holder = {}
  @ViewChild(NguiMapComponent, { static: true }) nguiMapComponent: NguiMapComponent;
  constructor(public ngxSmartModalService: NgxSmartModalService, public http: HttpClient, public spinner: NgxSpinnerService,public notify: notifyService) { }

  ngOnInit(): void {
    this.getData();
  }
  getData(){
    this.spinner.show();
    this.http.post('https://drivecraftlab.com/backend/api/city/city_get.php',{}).pipe(map(data => {
          if (data['status_code'] === 200) {
            this.spinner.hide();
              this.cities = data['cities'];
          }else{
            this.spinner.hide();
            this.notify.onError("Error", data['message']);
          }
        })).subscribe(result => {
        });
  }
 
  edit_city_request(){
    if(this.city_name){

      let req_obj = {
        cid: this.city_id,
        cname: this.city_name,
       }

      this.spinner.show();
      this.http.post('https://drivecraftlab.com/backend/api/city/city_update.php', req_obj).pipe(map(data => {
        this.spinner.hide();
          if (data['status_code'] === 200) {
              this.getData();
              this.notify.onSuccess('Updated','City Updated Successfully');
              this.ngxSmartModalService.getModal('edit_city').close();
              this.resetAddData();
          }else{
            this.spinner.hide();
            this.notify.onError("Error", data['message']);
          }
        })).subscribe(result => {
        });

    }else{
      this.notify.onError('Incomplete','Please fill name field!');
    }
  } 
  delete_city(){
    this.spinner.show();
    this.http.post('https://drivecraftlab.com/backend/api/city/city_delete.php', {cid: this.city_id}).pipe(map(data => {
      this.spinner.hide();
        if (data['status_code'] === 200) {
            this.getData();
            this.notify.onSuccess('Deleted','City Deleted Successfully');
            this.ngxSmartModalService.getModal('confirm_delete').close();
        }else{
          this.spinner.hide();
          this.notify.onError("Error", data['message']);
        }
      })).subscribe(result => {
      });
  }
  add_city_request(){
    if(this.city_name){

      let req_obj = {
        cname: this.city_name,
        }

      this.spinner.show();
      this.http.post('https://drivecraftlab.com/backend/api/city/city_add.php', req_obj).pipe(map(data => {
        this.spinner.hide();
          if (data['status_code'] === 200) {
              this.getData();
              this.notify.onSuccess('Added','City Added Successfully');
              this.ngxSmartModalService.getModal('add_city').close();
              this.resetAddData();
          }else{
            this.spinner.hide();
            this.notify.onError("Error", data['message']);
          }
        })).subscribe(result => {
        });

    }else{
      this.notify.onError('Incomplete','Please fill name field!');
    }
  }
  resetAddData(){
    this.city_name = '';
    this.city_id = '';
  }
  editCity(city){
    this.city_edit_holder =  JSON.parse(JSON.stringify(city));
    this.city_id = this.city_edit_holder['cid'];
    this.city_name = this.city_edit_holder['cname'];
    this.ngxSmartModalService.getModal('edit_city').open();
  }
}
