import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router'; // CLI imports router
import { HomeComponent } from './components/home.component';
import { ManageEndpointsComponent, ManageTokensComponent } from './components/manage.component';
import { QueryComponent } from './components/query.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'query', component: QueryComponent },
  { path: 'configuration/endpoints', component: ManageEndpointsComponent },
  { path: 'configuration/endpoints/:id', component: ManageEndpointsComponent },
  { path: 'configuration/tokens', component: ManageTokensComponent },
  { path: 'configuration/tokens/:id', component: ManageTokensComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }