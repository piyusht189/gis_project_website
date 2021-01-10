import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, last } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { notifyService } from 'src/app/services/snotify';
import { NgxSmartModalService } from 'ngx-smart-modal';
import * as RootReducer from "../../../app.reducers"
import { NguiMapComponent } from '@ngui/map';
import { AgmCoreModule, MapsAPILoader } from "@agm/core";
import { Store } from '@ngrx/store';
declare let google: any;

@Component({
  selector: 'app-manage-captains',
  templateUrl: './manage-captains.component.html',
  styleUrls: ['./manage-captains.component.css']
})
export class ManageCaptainsComponent implements OnInit {
  captains = []
  captain_id
  captain_name
  captain_email
  captain_phone
  captain_password
  captain_edit_holder = {}
  hid
  @ViewChild(NguiMapComponent, { static: true }) nguiMapComponent: NguiMapComponent;
  constructor(public ngxSmartModalService: NgxSmartModalService, public http: HttpClient, public spinner: NgxSpinnerService,public notify: notifyService,public rootstore: Store<RootReducer.State>) { 
    this.rootstore
    .select(state => state.common.user)
    .subscribe(userObj => {
        if(userObj){
            this.hid = userObj['hid'];
            this.getData();
        }
    });
  }

  ngOnInit(): void {
  }
  getData(){
    this.spinner.show();
    this.http.post('https://drivecraftlab.com/backend/api/user/user_get.php',{hid: this.hid}).pipe(map(data => {
          if (data['status_code'] === 200) {
            this.spinner.hide();
              this.captains = data['captains'];
          }else{
            this.spinner.hide();
            this.notify.onError("Error", data['message']);
          }
        })).subscribe(result => {
        });
  }
 
  edit_captain_request(){
    if(this.captain_name){

      let req_obj = {
        uid: this.captain_id,
        uname: this.captain_name,
        uphone: this.captain_phone,
        upassword: this.captain_password
      }

      this.spinner.show();
      this.http.post('https://drivecraftlab.com/backend/api/user/user_update.php', req_obj).pipe(map(data => {
        this.spinner.hide();
          if (data['status_code'] === 200) {
              this.getData();
              this.notify.onSuccess('Updated','Captain Updated Successfully');
              this.ngxSmartModalService.getModal('edit_captain').close();
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
  delete_captain(){
    this.spinner.show();
    this.http.post('https://drivecraftlab.com/backend/api/user/user_delete.php', {uid: this.captain_id}).pipe(map(data => {
      this.spinner.hide();
        if (data['status_code'] === 200) {
            this.getData();
            this.notify.onSuccess('Deleted','Captain Deleted Successfully');
            this.ngxSmartModalService.getModal('confirm_delete').close();
        }else{
          this.spinner.hide();
          this.notify.onError("Error", data['message']);
        }
      })).subscribe(result => {
      });
  }
  add_captain_request(){
    if(this.captain_name && this.captain_email && this.captain_password && this.captain_phone){

      let req_obj = {
        hid: this.hid,
        captain_name: this.captain_name,
        captain_email: this.captain_email,
        captain_password: this.captain_password,
        captain_phone: this.captain_phone
      }

      this.spinner.show();
      this.http.post('https://drivecraftlab.com/backend/api/user/user_add.php', req_obj).pipe(map(data => {
        this.spinner.hide();
          if (data['status_code'] === 200) {
              this.getData();
              this.notify.onSuccess('Added','Captain Added Successfully');
              this.ngxSmartModalService.getModal('add_captain').close();
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
    this.captain_name = '';
    this.captain_id = '';
  }
  editCaptain(captain){
    this.captain_edit_holder =  JSON.parse(JSON.stringify(captain));
    this.captain_id = this.captain_edit_holder['uid'];
    this.captain_name = this.captain_edit_holder['uname'];
    this.captain_email = this.captain_edit_holder['uemail'];
    this.captain_phone = this.captain_edit_holder['uphone'];
    this.captain_password = '';
    this.ngxSmartModalService.getModal('edit_captain').open();
  }
}
