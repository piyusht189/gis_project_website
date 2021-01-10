import { Routes } from "@angular/router";
import { AppComponent } from './app.component';
import { RouteGuardService } from './services/route-guard.service';
import { LoginComponent } from './static/login/login.component';
import { DashboardComponent } from './dynamic/components/dashboard/dashboard.component';
import { CitiesComponent } from './dynamic/components/cities/cities.component';
import { AmbulanceDashboardComponent } from './dynamic/components/ambulance-dashboard/ambulance-dashboard.component';
import { ManageCaptainsComponent } from './dynamic/components/manage-captains/manage-captains.component';
import { ManageDriversComponent } from './dynamic/components/manage-drivers/manage-drivers.component';
import { ReportsComponent } from './dynamic/components/reports/reports.component';
import { ManageVehiclesComponent } from './dynamic/components/manage-vehicles/manage-vehicles.component';


export const ROUTES: Routes = [
    { path: "", component: LoginComponent },
    { path: "hospitals", component: DashboardComponent , canActivate: [RouteGuardService]},
    { path: "cities", component: CitiesComponent , canActivate: [RouteGuardService]},
    { path: "dashboard-hospital", component: AmbulanceDashboardComponent , canActivate: [RouteGuardService]},
    { path: "manage-captains", component: ManageCaptainsComponent , canActivate: [RouteGuardService]},
    { path: "manage-drivers", component: ManageDriversComponent , canActivate: [RouteGuardService]},
    { path: "manage-vehicles", component: ManageVehiclesComponent , canActivate: [RouteGuardService]},
    { path: "reports", component: ReportsComponent, canActivate: [RouteGuardService]},
    { path: "**", redirectTo: "" }
];
