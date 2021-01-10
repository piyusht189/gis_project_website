import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, last } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { notifyService } from 'src/app/services/snotify';
import { NgxSmartModalService } from 'ngx-smart-modal';
import { day_style } from "./day-map-style";
import { NguiMapComponent } from '@ngui/map';
import { AgmCoreModule, MapsAPILoader } from "@agm/core";
declare let google: any;
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  hospitals = []
  cities = []
  lat
  lng
  map
  map_add
  map_edit
  hospitalLocation = []
  customMarkers = {};
  mapOptions = {
    gestureHandling: "greedy",
    streetViewControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    mapTypeControl: false,
    zoom: 4,
    center: new google.maps.LatLng(26.5,50.3),
    tilt: 60
  };
  resetInfo = false;
  info_name
  info_address
  hospitalLocation_add = [26.5,50.3]

  hosp_id
  hosp_name
  hosp_city = ''
  hosp_phone
  hosp_email
  hosp_lat
  hosp_lng
  hosp_address
  admin_name
  admin_email
  admin_phone
  admin_password

  hospital_edit_holder = {}
  @ViewChild(NguiMapComponent, { static: true }) nguiMapComponent: NguiMapComponent;
  constructor(private ngZone: NgZone,private mapsAPILoader: MapsAPILoader,public ngxSmartModalService: NgxSmartModalService, public http: HttpClient, public spinner: NgxSpinnerService,public notify: notifyService) { }

  ngOnInit(): void {
    this.mapOptions["styles"] = day_style;
    this.getData();
  }
  getData(){
    this.spinner.show();
    this.http.post('https://drivecraftlab.com/backend/api/city/city_get.php', {}).pipe(map(data => {
          if (data['status_code'] === 200) {
              this.cities = data['cities'];
              if(this.cities.length){
                this.http.post('https://drivecraftlab.com/backend/api/hospital/hospital_get.php', {}).pipe(map(data => {
                  this.spinner.hide();
                      if (data['status_code'] === 200) {
                          this.hospitals = data['hospitals'];
                      }else{
                          this.notify.onError("Error", data['message']);
                      }
            
                    })).subscribe(result => {
                    });
              }else{
                this.spinner.hide();
              }
          }else{
            this.spinner.hide();
            this.notify.onError("Error", data['message']);
          }
        })).subscribe(result => {
        });
  }
  getCity(cid){
    let val = ''
    this.cities.forEach(e => {
      if(e.cid == cid){
        val = e.cname;
      }
    })
    return val;
  }
  onCustomMarkerInit(customMarker, tail) {
    this.customMarkers[tail] = customMarker;
  }
 
  clicked(name, address) {
 
      this.info_name = name;
      this.info_address = address;
      this.nguiMapComponent.openInfoWindow("iw", this.customMarkers[name]);
      this.resetInfo = false;
      setTimeout(() => {
          this.resetInfo = true;
      }, 50);  
  }
  edit_hospital_request(){
    this.hosp_lat = this.map_edit.getCenter().lat();
    this.hosp_lng = this.map_edit.getCenter().lng();
    if(this.hosp_name && this.hosp_city && this.hosp_phone && this.hosp_email && this.hosp_lat && this.hosp_lng && this.hosp_address && this.admin_email && this.admin_name && this.admin_phone){

      let req_obj = {
        hid: this.hosp_id,
        cid: this.hosp_city,
        hname: this.hosp_name,
        hlat: this.hosp_lat,
        hlng: this.hosp_lng,
        haddress: this.hosp_address,
        hphone: this.hosp_phone,
        hemail: this.hosp_email,
        admin_name: this.admin_name,
        admin_phone: this.admin_phone,
        admin_email: this.admin_email,
        admin_password: this.admin_password ? this.admin_password : ''
      }

      this.spinner.show();
      this.http.post('https://drivecraftlab.com/backend/api/hospital/hospital_update.php', req_obj).pipe(map(data => {
        this.spinner.hide();
          if (data['status_code'] === 200) {
              this.getData();
              this.notify.onSuccess('Updated','Hospital Updated Successfully');
              this.ngxSmartModalService.getModal('edit_hospital').close();
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
  delete_hospital(){
    this.spinner.show();
    this.http.post('https://drivecraftlab.com/backend/api/hospital/hospital_delete.php', {id: this.hosp_id}).pipe(map(data => {
      this.spinner.hide();
        if (data['status_code'] === 200) {
            this.getData();
            this.notify.onSuccess('Deleted','Hospital Deleted Successfully');
            this.ngxSmartModalService.getModal('confirm_delete').close();
        }else{
          this.spinner.hide();
          this.notify.onError("Error", data['message']);
        }
      })).subscribe(result => {
      });
  }
  add_hospital_request(){
    this.hosp_lat = this.map_add.getCenter().lat();
    this.hosp_lng = this.map_add.getCenter().lng();
    if(this.hosp_name && this.hosp_city && this.hosp_phone && this.hosp_email && this.hosp_lat && this.hosp_lng && this.hosp_address && this.admin_email && this.admin_name && this.admin_password && this.admin_phone){

      let req_obj = {
        cid: this.hosp_city,
        hname: this.hosp_name,
        hlat: this.hosp_lat,
        hlng: this.hosp_lng,
        haddress: this.hosp_address,
        hphone: this.hosp_phone,
        hemail: this.hosp_email,
        admin_name: this.admin_name,
        admin_phone: this.admin_phone,
        admin_email: this.admin_email,
        admin_password: this.admin_password
      }

      this.spinner.show();
      this.http.post('https://drivecraftlab.com/backend/api/hospital/hospital_add.php', req_obj).pipe(map(data => {
        this.spinner.hide();
          if (data['status_code'] === 200) {
              this.getData();
              this.notify.onSuccess('Added','Hospital Added Successfully');
              this.ngxSmartModalService.getModal('add_hospital').close();
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
    this.hosp_name = '';
    this.hosp_city = '';
    this.hosp_phone = '';
    this.hosp_email = '';
    this.hosp_lat = '';
    this.hosp_lng = '';
    this.hosp_address = '';
    this.admin_name = '';
    this.admin_email = '';
    this.admin_phone = '';
    this.admin_password = '';
    this.hosp_id = '';
  }
  showLocation(lat,lng,name, address){
    this.lat = lat;
    this.lng = lng;
    this.hospitalLocation = [{
      position: [ lat, lng ],
      name: name,
      address: address
    }]
   
    this.ngxSmartModalService.getModal('show_location').open();
   
    setTimeout(()=>{
     
      let latlng = new google.maps.LatLng(this.lat, this.lng);
      this.map.setCenter(latlng);
      this.map.setZoom(17.6);
    },1000)
  }
  onMapReady(map) {
    this.map = map;
    
  }
  onMapReadyAdd(map){
    this.map_add = map;
  }
  onMapReadyEdit(map){
    this.map_edit = map;
  }
  showSearch(flag?){
    setTimeout(()=>{
      if(!flag){
       this.hosp_city = '';
       this.initAutocomplete_add();
      }else{
        this.initAutocomplete_edit();
      }
      
    },3000)
  }
  editHospital(hosp){
    this.hospital_edit_holder =  JSON.parse(JSON.stringify(hosp));
    this.hosp_id = this.hospital_edit_holder['hid'];
    this.hosp_name = this.hospital_edit_holder['hname'];
    this.hosp_phone = this.hospital_edit_holder['hphone'];
    this.hosp_email = this.hospital_edit_holder['hemail'];
    this.hosp_city = this.hospital_edit_holder['cid'];
    this.hosp_lat = this.hospital_edit_holder['hlat'];
    this.hosp_lng = this.hospital_edit_holder['hlng'];
    this.hosp_address = this.hospital_edit_holder['haddress'];
    this.admin_name = this.hospital_edit_holder['uname'];
    this.admin_email = this.hospital_edit_holder['uemail'];
    this.admin_phone = this.hospital_edit_holder['uphone'];
    this.admin_password = '';
    this.ngxSmartModalService.getModal('edit_hospital').open();
    this.showSearch(1);
    setTimeout(()=>{
      let latlng = new google.maps.LatLng(this.hosp_lat, this.hosp_lng);
      this.map_edit.setCenter(latlng);
      this.map_edit.setZoom(17.6);
    },1000);
  }
  initAutocomplete_add() {

    this.mapsAPILoader.load().then(() => {
        // if(this.initial_search_focus){
        // this.initial_search_focus = false
        let autocomplete = new google.maps.places.Autocomplete(document.getElementById("search_address"));
        autocomplete.setComponentRestrictions(
          {'country': ['bh', 'in']});
        autocomplete.addListener("place_changed", () => {
            this.ngZone.run(() => {
                //get the place result
                let place: google.maps.places.PlaceResult = autocomplete.getPlace();

                //verify result
                if (place.geometry === undefined || place.geometry === null) {
                    return;
                }
                //set latitude, longitude and zoom
                this.panTo(
                    this.map_add,
                    0,
                    this.map_add.getCenter(),
                    new google.maps.LatLng(
                        place.geometry.location.lat(),
                        place.geometry.location.lng()
                    )
                );
                this.map_add.setZoom(16);
            });
        });
        //  }
    });
}
initAutocomplete_edit() {

  this.mapsAPILoader.load().then(() => {
      // if(this.initial_search_focus){
      // this.initial_search_focus = false
      let autocomplete = new google.maps.places.Autocomplete(document.getElementById("search_address"));
      autocomplete.setComponentRestrictions(
        {'country': ['bh', 'in']});
      autocomplete.addListener("place_changed", () => {
          this.ngZone.run(() => {
              //get the place result
              let place: google.maps.places.PlaceResult = autocomplete.getPlace();

              //verify result
              if (place.geometry === undefined || place.geometry === null) {
                  return;
              }
              //set latitude, longitude and zoom
              this.panTo(
                  this.map_edit,
                  0,
                  this.map_edit.getCenter(),
                  new google.maps.LatLng(
                      place.geometry.location.lat(),
                      place.geometry.location.lng()
                  )
              );
              this.map_edit.setZoom(16);
          });
      });
      //  }
  });
}
  panTo(map, t, current, moveto) {
    // let latlng = new google.maps.LatLng(moveto.lat(), moveto.lng());
    // map.setCenter(latlng);
    // return
    let deltalat = (moveto.lat() - current.lat()) / 100;
    let deltalng = (moveto.lng() - current.lng()) / 100;

    let delay = 10 * t;
    for (let i = 0; i < 100; i++) {
        (function (ind) {
            setTimeout(() => {
                let lat = map.getCenter().lat();
                let lng = map.getCenter().lng();
                lat += deltalat;
                lng += deltalng;
                let latlng = new google.maps.LatLng(lat, lng);
                map.setCenter(latlng);
            }, delay * ind);
        })(i);
    }
}

}
