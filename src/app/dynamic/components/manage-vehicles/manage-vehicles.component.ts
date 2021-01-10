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
  selector: 'app-manage-vehicles',
  templateUrl: './manage-vehicles.component.html',
  styleUrls: ['./manage-vehicles.component.css']
})
export class ManageVehiclesComponent implements OnInit {
  dvs = []
  hid
  did 
  dvname = ''
  dv_number = ''

  dvcolor = ''
  dvreg_no = ''
  dvreg_date = moment().format('YYYY-MM-DD');
  dvinsurance_no = ''
  dvlast_serviced = moment().format('YYYY-MM-DD')
  dvtankcapacity = 0
  dvtax_renewals = ''


  dv_edit_holder = {}
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
    this.http.post('https://drivecraftlab.com/backend/api/ambulance_driver/ambulance_vehicle_get.php',{hid: this.hid}).pipe(map(data => {
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

    
    if(this.hid && this.dv_number && this.dvname){

      let req_obj = {
        dvid: this.did,
        dv_number: this.dv_number,
        dvname:  this.dvname,
        dvcolor: this.dvcolor,
        dvreg_no: this.dvreg_no,
        dvreg_date: moment(this.dvreg_date).format('YYYY-MM-DD'),
        dvinsurance_no: this.dvinsurance_no,
        dvlast_serviced: moment(this.dvlast_serviced).format('YYYY-MM-DD'),
        dvtankcapacity: this.dvtankcapacity, 
        dvtax_renewals: this.dvtax_renewals
       }

      this.spinner.show();
      this.http.post('https://drivecraftlab.com/backend/api/ambulance_driver/ambulance_vehicle_update.php', req_obj).pipe(map(data => {
        this.spinner.hide();
          if (data['status_code'] === 200) {
              this.getData();
              this.notify.onSuccess('Updated','Vehicle Updated Successfully');
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
    this.http.post('https://drivecraftlab.com/backend/api/ambulance_driver/ambulance_vehicle_delete.php', {id: this.did}).pipe(map(data => {
      this.spinner.hide();
        if (data['status_code'] === 200) {
            this.getData();
            this.notify.onSuccess('Deleted','Vehicle Deleted Successfully');
            this.ngxSmartModalService.getModal('confirm_delete').close();
        }else{
          this.spinner.hide();
          this.notify.onError("Error", data['message']);
        }
      })).subscribe(result => {
      });
  }
  add_dv_request(){
    if(this.hid && this.dv_number){

      let req_obj = {
        hid: this.hid,
        dv_number: this.dv_number,
        dvname: this.dvname,
        dvcolor: this.dvcolor,
        dvreg_no: this.dvreg_no,
        dvreg_date: moment(this.dvreg_date).format('YYYY-MM-DD'),
        dvinsurance_no: this.dvinsurance_no,
        dvlast_serviced: moment(this.dvlast_serviced).format('YYYY-MM-DD'),
        dvtankcapacity: this.dvtankcapacity, 
        dvtax_renewals: this.dvtax_renewals
       }

      this.spinner.show();
      this.http.post('https://drivecraftlab.com/backend/api/ambulance_driver/ambulance_vehicle_add.php', req_obj).pipe(map(data => {
        this.spinner.hide();
          if (data['status_code'] === 200) {
              this.getData();
              this.notify.onSuccess('Added','Vehicle Added Successfully');
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
    this.dv_number = '';
    this.dvname = '';
    this.dvcolor = ''
    this.dvreg_no = ''
    this.dvreg_date =  moment().format('YYYY-MM-DD')
    this.dvinsurance_no = ''
    this.dvlast_serviced = moment().format('YYYY-MM-DD')
    this.dvtankcapacity = 0
    this.dvtax_renewals = ''


  }
  editDv(dv){


    this.dv_edit_holder =  JSON.parse(JSON.stringify(dv));
    this.did = this.dv_edit_holder['dvid'];
    this.dv_number = this.dv_edit_holder['dvnumber'];
    this.dvname = this.dv_edit_holder['dvname'];
    this.dvcolor = this.dv_edit_holder['dvcolor'];
    this.dvreg_no = this.dv_edit_holder['dvreg_no'];
    this.dvreg_date = moment(this.dv_edit_holder['dvreg_date']).format('YYYY-MM-DD')
    this.dvinsurance_no = this.dv_edit_holder['dvinsurance_no'];
    this.dvlast_serviced = moment(this.dv_edit_holder['dvlast_serviced']).format('YYYY-MM-DD')
    this.dvtankcapacity = this.dv_edit_holder['dvtankcapacity'];
    this.dvtax_renewals = this.dv_edit_holder['dvtax_renewals'];
    
    this.ngxSmartModalService.getModal('edit_dv').open();
    
  }
 


}
