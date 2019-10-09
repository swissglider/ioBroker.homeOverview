import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomepageComponent } from './homepage/homepage.component';
import { CounterComponent } from './counter/counter.component';
import { MainSiteComponent } from './main-site/main-site.component';
import { TestComponent } from './test/test.component';
import { ShowRoomsComponent } from './show-rooms/show-rooms.component';

const routes: Routes = [
  { path:  '', redirectTo:  'mainsite', pathMatch:  'full' },
  { path: 'hompage', component: HomepageComponent},
  { path: 'counter', component: CounterComponent},
  { path: 'mainsite', component: MainSiteComponent},
  { path: 'test', component: TestComponent},
  { path: 'showrooms', component: ShowRoomsComponent},
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { } 
