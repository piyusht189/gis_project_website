import { Component, OnInit, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import * as RootReducer from "../../../app.reducers"


@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent implements OnInit {
  isSuperAdmin = false;
  isAdmin = false;
  isUser = false;
  @Input()
  current
  constructor(public rootstore: Store<RootReducer.State>) {
    this.rootstore
    .select(state => state.common.user)
    .subscribe(userObj => {
        if(userObj){
          this.isSuperAdmin = userObj['u_role'] == 'superadmin' ? true : false;
          this.isAdmin = userObj['u_role'] == 'admin' ? true : false;
          this.isUser = userObj['u_role'] == 'admin' ? false : true;
        }
    });
   }

  ngOnInit(): void {
  }

}
