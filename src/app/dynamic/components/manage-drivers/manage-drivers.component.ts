import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, last } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { notifyService } from 'src/app/services/snotify';
import { NgxSmartModalService } from 'ngx-smart-modal';
import { NguiMapComponent } from '@ngui/map';
import { AgmCoreModule, MapsAPILoader } from "@agm/core";
import * as RootReducer from "../../../app.reducers"
import { Store } from '@ngrx/store';
declare let google: any;
import * as moment from 'moment';

@Component({
  selector: 'app-manage-drivers',
  templateUrl: './manage-drivers.component.html',
  styleUrls: ['./manage-drivers.component.css']
})
export class ManageDriversComponent implements OnInit {
  dvs = []
  
  did 
  hid
  dv_name
  dv_dob  = moment().format('YYYY-MM-DD');
  dv_email
  dv_password
  dv_phone
  dv_licence
  dv_licence_exp = moment().format('YYYY-MM-DD');
  dv_edit_holder = {}
  independent = false;
  hospitals = []

  /*
  hid, name, email,dob, password, phone, vehicle_number, licence_number, emp_id, joining date
  */
  @ViewChild(NguiMapComponent, { static: true }) nguiMapComponent: NguiMapComponent;
  constructor(public rootstore: Store<RootReducer.State>,private ngZone: NgZone,private mapsAPILoader: MapsAPILoader,public ngxSmartModalService: NgxSmartModalService, public http: HttpClient, public spinner: NgxSpinnerService,public notify: notifyService) { 
    this.rootstore
    .select(state => state.common.user)
    .subscribe(userObj => {
        if(userObj){
            this.hid = userObj.hid;
           
        }
    });
  }

  ngOnInit(): void {
    this.spinner.show();
    this.http.post('https://drivecraftlab.com/backend/api/hospital/hospital_get.php',{}).pipe(map(data => {
                      if (data['status_code'] === 200) {
                          this.hospitals = data['hospitals'];
                          this.getData();
                      }else{
                          this.notify.onError("Error", data['message']);
                      }
            
                    })).subscribe(result => {
                    });
  }
  getData(){
    this.spinner.show();
    this.http.post('https://drivecraftlab.com/backend/api/ambulance_driver/ambulance_driver_get.php',{hid: this.hid}).pipe(map(data => {
      this.spinner.hide();
          if (data['status_code'] === 200) {
              this.dvs = data['dvs'];
          }else{
              this.notify.onError("Error", data['message']);
          }

        })).subscribe(result => {
        });
  }
  edit_dv_request(){

    
    if(this.hid, this.dv_name && this.dv_dob && this.dv_email && this.dv_phone && this.dv_licence && this.dv_licence_exp){

      let req_obj = {
        did: this.did,
        dv_name: this.dv_name,
        dv_dob: this.dv_dob,
        dv_email: this.dv_email,
        dv_phone: this.dv_phone,
        dv_licence: this.dv_licence,
        dv_licence_exp: this.dv_licence_exp,
        dv_password: this.dv_password ? this.dv_password : '',
        independent: this.independent ? 'yes' : 'no'
      }

      this.spinner.show();
      this.http.post('https://drivecraftlab.com/backend/api/ambulance_driver/ambulance_driver_update.php', req_obj).pipe(map(data => {
        this.spinner.hide();
          if (data['status_code'] === 200) {
              this.getData();
              this.notify.onSuccess('Updated','Driver Updated Successfully');
              this.ngxSmartModalService.getModal('edit_dv').close();
              this.resetAddData();
          }else{
            this.spinner.hide();
            this.notify.onError("Error", data['message']);
          }
        })).subscribe(result => {
        });

    }else{
      this.notify.onError('Incomplete','Please fill all fields!');
    }
  } 
  delete_dv(){
    this.spinner.show();
    this.http.post('https://drivecraftlab.com/backend/api/ambulance_driver/ambulance_driver_delete.php', {id: this.did}).pipe(map(data => {
      this.spinner.hide();
        if (data['status_code'] === 200) {
            this.getData();
            this.notify.onSuccess('Deleted','Driver Deleted Successfully');
            this.ngxSmartModalService.getModal('confirm_delete').close();
        }else{
          this.spinner.hide();
          this.notify.onError("Error", data['message']);
        }
      })).subscribe(result => {
      });
  }
  add_dv_request(){
    if(this.hid && this.dv_name && this.dv_dob && this.dv_email && this.dv_password && this.dv_phone && this.dv_licence && this.dv_licence_exp){

      let req_obj = {
        hid: this.hid,
        dv_name: this.dv_name,
        dv_dob: this.dv_dob,
        dv_email: this.dv_email,
        dv_password: this.dv_password,
        dv_phone: this.dv_phone,
        dv_licence: this.dv_licence,
        dv_licence_exp: this.dv_licence_exp,
        independent: this.independent ? 'yes' : 'no'
      }

      this.spinner.show();
      this.http.post('https://drivecraftlab.com/backend/api/ambulance_driver/ambulance_driver_add.php', req_obj).pipe(map(data => {
        this.spinner.hide();
          if (data['status_code'] === 200) {
              this.getData();
              this.notify.onSuccess('Added','Driver Added Successfully');
              this.ngxSmartModalService.getModal('add_dv').close();
              this.resetAddData();
          }else{
            this.spinner.hide();
            this.notify.onError("Error", data['message']);
          }
        })).subscribe(result => {
        });

    }else{
      this.notify.onError('Incomplete','Please fill all fields!');
    }
  }
  resetAddData(){
    this.did = '';
    this.dv_name = '';
    this.dv_dob  = moment().format('YYYY-MM-DD');
    this.dv_email = '';
    this.dv_password = '';
    this.dv_phone = '';
    this.dv_licence = '';
    this.dv_licence_exp = moment().format('YYYY-MM-DD');
    this.independent = false;
  }
  getFormatted(val){
    return val ? moment(val,'YYYY-MM-DD').format('DD/MM/YYYY') : 'NA';
  }
  editDv(dv){


    this.dv_edit_holder =  JSON.parse(JSON.stringify(dv));
    this.did = this.dv_edit_holder['aadid'];
    this.dv_name = this.dv_edit_holder['dname'];
    this.dv_dob = moment(this.dv_edit_holder['ddob']).format('YYYY-MM-DD');
    this.dv_email = this.dv_edit_holder['demail'];
    this.dv_password = this.dv_edit_holder['dpassword'];
    this.dv_phone = this.dv_edit_holder['dphone'];
    this.dv_licence = this.dv_edit_holder['dlicence'];
    this.dv_licence_exp = moment(this.dv_edit_holder['dlicence_exp']).format('YYYY-MM-DD');
    this.independent = this.dv_edit_holder['independent'] == 'yes' ? true : false
    
    this.ngxSmartModalService.getModal('edit_dv').open();
    
  }
 


}
