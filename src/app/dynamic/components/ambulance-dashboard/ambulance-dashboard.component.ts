import { Component, OnInit, ViewChild, NgZone, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, last } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { notifyService } from 'src/app/services/snotify';
import { NgxSmartModalService } from 'ngx-smart-modal';
import { NguiMapComponent } from '@ngui/map';
import { AgmCoreModule, MapsAPILoader } from "@agm/core";
import { Store } from '@ngrx/store';
import * as RootReducer from "../../../app.reducers"
import { DomSanitizer } from '@angular/platform-browser';
import * as moment from 'moment';
import 'moment-timezone';
import { day_style } from './day-map-style';
declare let google: any;
var timer;
var ftime = 1;
@Component({
  selector: 'app-ambulance-dashboard',
  templateUrl: './ambulance-dashboard.component.html',
  styleUrls: ['./ambulance-dashboard.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AmbulanceDashboardComponent implements OnInit {
  @ViewChild(NguiMapComponent, { static: true }) nguiMapComponent: NguiMapComponent;
  mapOptions = {
    gestureHandling: "greedy",
    streetViewControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    mapTypeControl: false,
    center: new google.maps.LatLng(0, 0),
    tilt: 60
   };
   map
   public positions = [];
   hid
   drivers = []
   customMarkers = {}
   bounds
   bounds_drive
   allselected = false;
   driver_locations_holder = {};
   points = [{location: '',message: '', phone: ''}];
   selectedIndex = 0;
   mapOptions_drive = {
    gestureHandling: "greedy",
    streetViewControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    mapTypeControl: false,
    zoom: 4,
    center: new google.maps.LatLng(26.5,50.3),
    tilt: 60
  };
  mapOptions_driveview = {
    gestureHandling: "greedy",
    streetViewControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    mapTypeControl: false,
    zoom: 4,
    center: new google.maps.LatLng(26.5,50.3),
    tilt: 60
  };
  map_drive
  map_driveview
  selectLocation = false;
  indexHolder
  dname_holder
  did_holder 
  drives = []

  drivePoints = []
  trip_polyline
  tid_holder

  title
  body
  enroute = false;
  enroute_id;
  dropdownSettings = {};
  dropdownSettings_dates = {};
  delete_type  = 'regular'
  vname = ''
  vcolor = ''
  vnumber = ''
  vreg_no = ''
  vjoining_date = ''
  vtankcapacity = ''
  track_driver = 0
  constructor(private ngZone: NgZone,private mapsAPILoader: MapsAPILoader, public cd:ChangeDetectorRef, private sanitized: DomSanitizer, public rootstore: Store<RootReducer.State>,public ngxSmartModalService: NgxSmartModalService, public http: HttpClient, public spinner: NgxSpinnerService,public notify: notifyService) { 
    this.rootstore
    .select(state => state.common.user)
    .subscribe(userObj => {
        if(userObj){
            this.hid = userObj['hid'];
        }
    });
  }

  ngOnInit(): void {
    this.mapOptions["styles"] = day_style;
    this.dropdownSettings = {
      singleSelection: false,
      idField: 'item_key',
      textField: 'item_value',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 4,
      allowSearchFilter: true
    };
    this.dropdownSettings_dates = {
      singleSelection: false,
      idField: 'item_key',
      textField: 'item_key',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 5,
      allowSearchFilter: true
    };
    setTimeout(() => {
      this.getDrivers(1);
    },500)
  }
  addPoint(index){
    if(!this.selectLocation){
     this.points.splice(index + 1, 0, {location: '',message: '', phone: ''});
     this.cd.markForCheck();
    }
  }
  locationSelected(){
    this.points.forEach((e,i) => {
      if(i == this.indexHolder){
          e['location'] = '[ ' + this.map_drive.getCenter().lat() + ' , ' + this.map_drive.getCenter().lng() + ' ]';
          this.selectLocation = false;
      }
    })
  }
  removePoint(index){
    if(index && !this.selectLocation){
     this.points.splice(index, 1);
     this.cd.markForCheck();
    }else{
      //Clear
      
    }
  }
  deSelectAll(){
    this.track_driver  = 0;
    this.drivers = this.drivers.map(e => {
      e['selected'] = false;
      return e;
    })
  }
  check_all(val){
    this.drivers = this.drivers.map(e => {
      e['selected'] = val;
      return e;
    });
    this.track_driver  = 0;
    this.positions = [];
    this.startTracking(this.drivers);
  }
  onCustomMarkerInit(customMarker, tail) {
    this.customMarkers[tail] = customMarker;
  }
  openDrive(name, id){
    this.dname_holder = name;
    this.did_holder = id;
    this.resetDrive();
    this.getDrives(id);
    this.clearDrive();
    this.ngxSmartModalService.getModal('adddrive').open();
    this.selectedIndex = 1;
    setTimeout(() => {
      this.selectedIndex = 0;
    },100)
  }
  open_send_notification(name, id){
    this.dname_holder = name;
    this.did_holder = id;
    this.title = '';
    this.body = '';
    this.ngxSmartModalService.getModal('send_notification').open();
  }
  resetDrive(){
    this.points = [{location: '',message: '', phone: ''}];
    this.selectLocation = false;
  }
  onMapReadyDrive(map){
    this.map_drive = map;
    this.showSearch();
  }
  onMapReadyDriveView(map){
    this.map_driveview = map;
  }
  initAutocomplete_drive() {

    this.mapsAPILoader.load().then(() => {
        // if(this.initial_search_focus){
        // this.initial_search_focus = false
        let autocomplete = new google.maps.places.Autocomplete(document.getElementById("search_address"));
        autocomplete.setComponentRestrictions(
          {'country': ['de']});
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
                    this.map_drive,
                    0,
                    this.map_drive.getCenter(),
                    new google.maps.LatLng(
                        place.geometry.location.lat(),
                        place.geometry.location.lng()
                    )
                );
                this.map_drive.setZoom(16);
            });
        });
        //  }
    });
  }
  showSearch(){
    setTimeout(()=>{
       this.initAutocomplete_drive();
    },2000)
  }
  inputSelected(index){
    this.selectLocation = true;
    this.indexHolder = index;
  }
  getDrivers(flag?){
    this.spinner.show();
    this.http.post('https://drivecraftlab.com/backend_gis/api/user/get_drivers.php', {hid: this.hid}).pipe(map(data => {
          this.spinner.hide();
          if (data['status_code'] === 200) {
            let drivers = data['drivers'];
            if(drivers.length){
              this.drivers = drivers.map(e => {
                e['selected'] = true;
                return e;
              })
              this.allselected = true;
              this.startTracking(JSON.parse(JSON.stringify(this.drivers)));
            }
            
          }else{
            this.spinner.hide();
            this.notify.onError("Error", data['message']);
          }
        })).subscribe(result => {
        });
  }
  startTracking(drivers,flag?){
    let boundaries = []
    let drivers_arr = drivers.map(e => e['aadid']);
    let drivers_joined = drivers_arr.join(',');
    this.http.post('https://drivecraftlab.com/backend_gis/api/user/get_driver_locations.php', {did: drivers_joined}).pipe(map(data => {
          this.spinner.hide();
          if (data['status_code'] === 200) {
            let positions_arr = [];
            this.bounds = new google.maps.LatLngBounds();
            drivers.forEach(element => {
              if(element.selected){
                this.driver_locations_holder = data['driver_locations'];
                if(data['driver_locations'][element['aadid']]){
                  if(data['driver_locations'][element['aadid']].length){
                    let newrow = {};
                    let oldrow = {};
                    let work_log = {};
                    //herehere
                    data['driver_locations'][element['aadid']].forEach(rw=> {
                        if(rw['row']=='new'){
                          newrow = rw;
                          if(rw['enroute'] && newrow['current_status'] == 'online' && this.enroute_id == element['aadid'] && this.enroute){
                             work_log = rw['enroute_data']['work_log'] ? JSON.parse(rw['enroute_data']['work_log']) : {};
                             let insert_index = 0;
                             let work_log_temp = JSON.parse(JSON.stringify(work_log));
                             Object.keys(work_log_temp).forEach((key,i) => {
                                if(work_log_temp[key]['reached']){
                                  insert_index = i + 1;
                                }
                                work_log[''+(parseInt(key)+1)] = work_log_temp[key]; 
                             });
                             work_log[insert_index] = {lat: newrow["latitude"], lng: newrow["longitude"], message: '', phone: '', vehicle: true};
                             this.viewDrive(work_log,1);
                          }
                        }else{
                          oldrow = rw;
                        }
                    });

                    if(flag == 2 && this.track_driver == newrow['did']){
                      boundaries.push(new google.maps.LatLng(newrow["latitude"], newrow["longitude"]));
                     
                    }
                    if(!flag){
                      boundaries.push(new google.maps.LatLng(newrow["latitude"], newrow["longitude"]));
                     
                    }

                    
                    if(!this.positions.length){
                      //First Time
                      let rotation;
                      if(data['driver_locations'][element['aadid']].length > 1){
                        rotation = google.maps.geometry.spherical.computeHeading(
                          new google.maps.LatLng(oldrow["latitude"], oldrow["longitude"]),
                          new google.maps.LatLng(newrow["latitude"],newrow["longitude"]
                          )
                        );
                        rotation = parseFloat(rotation).toFixed(2);
                      }else{
                        rotation = 0;
                      }
                      
                      positions_arr.push({
                        position: [
                            newrow["latitude"],
                            newrow["longitude"]
                        ],
                        motion: newrow['current_status'] == 'online' ? true : false,
                        did: newrow["did"],
                        rotation: rotation,
                      });
                      
                    }else{
                      //Second Time
                      let indx = 0;
                      this.positions.forEach((pre,i) => {
                        if(pre['did'] == element['aadid']){
                          indx = i;
                        }
                      })

                      if((newrow['latitude'] != oldrow['latitude']) || (newrow['longitude'] != oldrow['longitude'])){
                        this.rotateMarker(
                          this.positions[indx],
                          this.customMarkers[newrow["did"]].position,
                          new google.maps.LatLng(newrow['latitude'], newrow['longitude']),
                          this.positions[indx]["rotation"]
                        );
                        this.animatedMove(
                          this.customMarkers[newrow["did"]],
                          2,
                          this.customMarkers[newrow["did"]].position,
                          new google.maps.LatLng(newrow['latitude'], newrow['longitude'])
                      );
                      }
                      
                      this.positions[indx]['motion'] = newrow['current_status'] == 'online' ? true : false

                    }
                   
                  }
                }
              }
            });
            if(!this.enroute && boundaries.length){
              boundaries.forEach(e => {
                this.bounds.extend(e);
              })
              this.map.fitBounds(this.bounds);
              if(flag == 2){
                this.map.setZoom(15);
              }
              if(positions_arr.length){
                this.positions = positions_arr;
                if(this.positions.length == 1){
                  this.map.setZoom(15);
                }
              }
            }
            if(!ftime){
              clearTimeout(timer);
            }else{
              ftime = 0;
            }
            timer = setTimeout(() => {
              this.startTracking(this.drivers,2)
            },10000);
            
          }else{
          }
        })).subscribe(result => {
        });
  }
  getLastTime(did){
    let last_time;
    if(this.driver_locations_holder[did]){
      this.driver_locations_holder[did].forEach(element => {
        if(element.row == 'new'){
          if(element.current_status == 'online'){
            last_time = this.sanitized.bypassSecurityTrustHtml('<i class="material-icons" style="font-size: 1.4em;top: 1px;color: #02b30f;">online_prediction</i> Online');

          }else{
            last_time =this.sanitized.bypassSecurityTrustHtml('<i class="material-icons" style="font-size: 1.4em;top: 1px;">schedule</i> Last online ' + element.last_online + ' ago');
          }
         
        }
     });
    }
    return last_time ? last_time : 'Not Available';
  }
  trackNormal(name,did){
    this.dname_holder = name;
    if(this.driver_locations_holder[did]){
      this.driver_locations_holder[did].forEach(element => {
        if(element.row == 'new'){
              if(!ftime){
                clearTimeout(timer);
              }else{
                ftime = 0;
              }
              this.enroute = false;
              this.track_driver  = did;
              this.startTracking(this.drivers,2);
              setTimeout(()  => {
                this.map.setZoom(15);
              },1000)
            }
     });
    }
  }
  trackLive(name, did){
    this.dname_holder = name;
    if(this.driver_locations_holder[did]){
      this.driver_locations_holder[did].forEach(element => {
        if(element.row == 'new'){
          if(element.current_status == 'online'){
            if(element.enroute){
              this.enroute = true;
              this.enroute_id = did;
              if(!ftime){
                clearTimeout(timer);
              }else{
                ftime = 0;
              }
              this.startTracking(this.drivers);
            }
          }
         
        }
     });
    }
  }
  isEnroute(did){
    let enroute = false;;
    if(this.driver_locations_holder[did]){
      this.driver_locations_holder[did].forEach(element => {
        if(element.row == 'new'){
          if(element.current_status == 'online'){
            if(element.enroute){
              enroute = true;
            }
          }
         
        }
     });
    }
    return enroute;
  }
  getName(did){
    let name = 'NA';
    this.drivers.forEach(e => {
      if(e.aadid == did){
        name = e.dname;
      }
    });
    return name;
  }
  clicked(did, index) {      
  }
  viewVehicle(data){
    if(JSON.parse(data)){
      let data_main = JSON.parse(data);
      this.vname = data_main['dvname'];
      this.vcolor = data_main['dvcolor'] ? data_main['dvcolor'] : 'NA';
      this.vnumber = data_main['dvnumber'];
      this.vreg_no = data_main['dvreg_no'];
      this.vjoining_date = data_main['djoining_date'] ? moment(data_main['djoining_date'], 'YYYY-MM-DD').format('DD/MM/YYYY') : 'NA';
      this.vtankcapacity = data_main['dvtankcapacity'] ? data_main['dvtankcapacity'] + ' Ltrs' : 'NA';
      this.ngxSmartModalService.getModal('show_vehicle').open();
    }else{
      this.notify.onError('Not Available','No Vehicle found!');
    }
  }
  viewDrive(data, flag){
    this.clearDrive();
    this.bounds_drive = new google.maps.LatLngBounds();
     Object.keys(data).forEach((key,i) => {
      this.bounds_drive.extend(
        new google.maps.LatLng(data[key]['lat'], data[key]['lng'])
      );
        if(i == 0){

          if(data[key]['vehicle']){

            this.drivePoints.push({
              position: [ data[key]['lat'], data[key]['lng'] ],
              message: data[key]['message'],
              phone: data[key]['phone']
            });

          }else{
          
            this.drivePoints.push({
              position: [ data[key]['lat'], data[key]['lng'] ],
              message: data[key]['message'],
              phone: data[key]['phone'],
              icon: 'dotstart.png'
            });

          }
          var lineSymbol = {
            path: 'M 0,-1 0,1',
            strokeOpacity: 1,
            scale: 4
          };
          this.trip_polyline = new google.maps.Polyline({
            strokeColor: "#008E7C",
            strokeOpacity: 0,
            icons: [{
              icon: lineSymbol,
              offset: '0',
              repeat: '15px'
            }],
        });
        var path = this.trip_polyline.getPath();
        path.push(new google.maps.LatLng(data[key]['lat'],data[key]['lng']));


        }else if(Object.keys(data).length-1 == i){


          if(data[key]['vehicle']){

            this.drivePoints.push({
              position: [ data[key]['lat'], data[key]['lng'] ],
              message: data[key]['message'],
              phone: data[key]['phone']
            });

          }else{
              this.drivePoints.push({
                position: [ data[key]['lat'], data[key]['lng'] ],
                message: data[key]['message'],
                phone: data[key]['phone'],
                icon: 'dotend.png'
              });
          }
          var path = this.trip_polyline.getPath();
          path.push(new google.maps.LatLng(data[key]['lat'],data[key]['lng']));


        }else{
          if(data[key]['vehicle']){

            this.drivePoints.push({
              position: [ data[key]['lat'], data[key]['lng'] ],
              message: data[key]['message'],
              phone: data[key]['phone']
            });

          }else{
            this.drivePoints.push({
              position: [ data[key]['lat'], data[key]['lng'] ],
              message: data[key]['message'],
              phone: data[key]['phone'],
              icon: 'dotmid.png'
            });
          }
          var path = this.trip_polyline.getPath();
          path.push(new google.maps.LatLng(data[key]['lat'],data[key]['lng']));

        }      
     })

     if(flag){
      this.trip_polyline.setMap(this.map);
      this.map.fitBounds(this.bounds_drive);
     }else{
      this.trip_polyline.setMap(this.map_driveview);
      this.map_driveview.fitBounds(this.bounds_drive);
     }
  }
  trackAll(flag){
    if(flag){
      this.enroute = false;
      this.clearDrive();
    }
    this.track_driver  = 0;
    this.bounds = new google.maps.LatLngBounds();
    this.positions.forEach(e => {
      this.bounds.extend(
        new google.maps.LatLng(e["position"][0], e["position"][1])
      );
    })
    this.map.fitBounds(this.bounds);
    this.map.setZoom(15);
  }
  delete_drive(){
    this.spinner.show();
    if(this.delete_type == 'planned'){
      //Planned Delete
      this.http.post('https://drivecraftlab.com/backend_gis/api/task/delete_planned_task.php', {patid: this.tid_holder}).pipe(map(data => {
        this.spinner.hide();
        if (data['status_code'] === 200) {
          this.notify.onSuccess("Deleted", data['message']);
          this.ngxSmartModalService.getModal('confirm_delete').close();
          this.clearDrive();
        }else{
          this.notify.onError("Error", data['message']);
        }
      })).subscribe(result => {
      });
    }else{
      //Regular Delete
      this.http.post('https://drivecraftlab.com/backend_gis/api/task/delete_task.php', {tid: this.tid_holder,did: this.did_holder}).pipe(map(data => {
        this.spinner.hide();
        if (data['status_code'] === 200) {
          this.notify.onSuccess("Deleted", data['message']);
          this.ngxSmartModalService.getModal('confirm_delete').close();
          this.getDrives(this.did_holder);
          this.clearDrive();
        }else{
          this.notify.onError("Error", data['message']);
        }
      })).subscribe(result => {
      });
    }
     

  }
  clearDrive(){
    this.drivePoints = [];
    if (this.trip_polyline) {
      this.trip_polyline.setMap(null);
    }
  }
  getDrives(did){
    this.spinner.show();
      this.http.post('https://drivecraftlab.com/backend_gis/api/task/get_tasks.php', {did: did}).pipe(map(data => {
          this.spinner.hide();
          if (data['status_code'] === 200) {
            data['drives'] = data['drives'].map(e => {
              e.work_log = e.work_log ? JSON.parse(e.work_log) : {};
              return e;
            });
            this.drives = data['drives'].reverse();
          }else{
            this.notify.onError("Error", data['message']);
          }
        })).subscribe(result => {
        });
  } 
  getFormatted(time){
    return moment.utc(time, 'YYYY-MM-DD HH:mm:ss').tz('Asia/Kuwait').format('DD/MM/YYYY hh:mm A');
  }
  getFormatted1(time){
    return moment.utc(time, 'YYYY-MM-DD HH:mm:ss').tz('Asia/Kuwait').format('hh:mm A');
  }
  getFormatted2(time){
    return moment(time, 'HH:mm').format('hh:mm A');
  }
  createDrive(){
    let checker = 0;
    if(this.points.length > 1){
    this.points.forEach(e => {
      if(!(e['message'] && e['location'])){
        checker = 1;
      }
    })
    if(checker){
      this.notify.onError("Empty","Do not leave location & message fields empty!");
    }else{
      // Create Task Here
      let req_points = {}
      this.points.forEach((e,i) => {
        let loc = e.location.trim().slice(1,-1).split(',');
        req_points[i] = {
          message: e.message.trim(),
          lat: loc[0].trim(),
          lng: loc[1].trim(),
          phone: e.phone
        }
      });
      this.spinner.show();


        //Add Drive
        this.http.post('https://drivecraftlab.com/backend_gis/api/task/add_task.php', {did: this.did_holder, worklog: JSON.stringify(req_points)}).pipe(map(data => {
          this.spinner.hide();
          if (data['status_code'] === 200) {
            this.notify.onSuccess("Created", data['message']);
            this.selectedIndex = 1;
            this.getDrives(this.did_holder);
            this.resetDrive();
            //this.ngxSmartModalService.getModal('adddrive').close();
          }else{
            this.notify.onError("Error", data['message']);
          }
        })).subscribe(result => {
        });
    }
    }else{
      this.notify.onError("Empty","Add atleast 1 pickup and 1 drop point with message!");
    }
  }
  getFormatted3(period, start_time){
    if(period && start_time){
      return moment.utc(period + ' ' + start_time,'YYYY-MM-DD HHmm').tz('Asia/Kuwait').format('DD/MM/YYYY hh:mm A');
    }else{
      return moment.utc(period,'YYYY-MM-DD').format('DD/MM/YYYY');
    }
  }
  rotateMarker(markerIcon, fromPoint, toPoint, fromDegree) {
    console.log(fromPoint);
    if (fromPoint) {
        const toDegree = Math.round(
            google.maps.geometry.spherical.computeHeading(fromPoint, toPoint)
        );
        if (fromPoint.lat() === toPoint.lat() && fromPoint.lng() === toPoint.lng()) {
            return;
        }
        //console.log("ALL 4 PARAMETERS", fromPoint.lat(), fromPoint.lng(), toPoint.lat(), toPoint.lng());
        // console.log("from degree", fromDegree);
        // console.log("todegree", toDegree);

        let delay = 10;
        if (toDegree !== fromDegree) {
            if ((toDegree - fromDegree + 360) % 360 > 180) {
                console.log("turn in left");
                let j = 0;
                if (fromDegree > toDegree) {
                    for (let i = fromDegree; i >= toDegree; i-- , j++) {
                        ((ind, ind2) => {
                            setTimeout(() => {
                                markerIcon["rotation"] = ind2;
                            }, delay * ind);
                        })(j, i);
                    }
                } else {
                    if (fromDegree === -180) {
                        fromDegree = -179;
                    }
                    for (let i = fromDegree; i <= -180; i-- , j++) {
                        ((ind, ind2) => {
                            setTimeout(() => {
                                markerIcon["rotation"] = ind2;
                            }, delay * ind);
                        })(j, i);
                    }
                    for (let i = 180; i >= toDegree; i-- , j++) {
                        ((ind, ind2) => {
                            setTimeout(() => {
                                markerIcon["rotation"] = ind2;
                            }, delay * ind);
                        })(j, i);
                    }
                }
            } else {
                console.log("turn in right");
                let j = 0;
                if (fromDegree < toDegree) {
                    for (let i = fromDegree; i <= toDegree; i++ , j++) {
                        ((ind, ind2) => {
                            setTimeout(() => {
                                markerIcon["rotation"] = ind2;
                            }, delay * ind);
                        })(j, i);
                    }
                } else {
                    if (fromDegree === 180) {
                        fromDegree = 179;
                    }
                    for (let i = fromDegree; i <= 180; i++ , j++) {
                        ((ind, ind2) => {
                            setTimeout(() => {
                                markerIcon["rotation"] = ind2;
                            }, delay * ind);
                        })(j, i);
                    }
                    for (let i = -180; i <= toDegree; i++ , j++) {
                        ((ind, ind2) => {
                            setTimeout(() => {
                                markerIcon["rotation"] = ind2;
                            }, delay * ind);
                        })(j, i);
                    }
                }
            }
            this.positions.forEach((element, index) => {
                if (+element.did === +markerIcon.did) {
                    this.positions[index] = markerIcon;
                }
            });
        } else {
            markerIcon["rotation"] = fromDegree;
            this.positions.forEach((element, index) => {
                if (+element.did === +markerIcon.did) {
                    this.positions[index] = markerIcon;
                }
            });
        }
    }
}
animatedMove(marker, t, current, moveto) {
    //marker.setPosition(moveto);
    //return;
    let deltalat = (moveto.lat() - current.lat()) / 100;
    let deltalng = (moveto.lng() - current.lng()) / 100;

    let delay = 10 * t;
    for (let i = 0; i < 100; i++) {
        (function (ind) {
            setTimeout(() => {
                let lat = marker.position.lat();
                let lng = marker.position.lng();
                lat += deltalat;
                lng += deltalng;
                let latlng = new google.maps.LatLng(lat, lng);
                marker.setPosition(latlng);
            }, delay * ind);
        })(i);
    }
  }
  panTo(map, t, current, moveto) {
   let latlng = new google.maps.LatLng(moveto.lat(), moveto.lng());
   map.setCenter(latlng);
  }
  onMapReady(map) {
    this.map = map;
    this.map.setZoom(3);
  }
}
